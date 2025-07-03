import React, { useEffect, useState } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { supabase } from '../../supabaseClient';

const monthNames = [
 'January', 'February', 'March', 'April', 'May', 'June',
 'July', 'August', 'September', 'October', 'November', 'December'
];

const PerformanceChart = ({ isDashboard = false, isAdmin = true }) => {
 const [data, setData] = useState([]);
 const [month, setMonth] = useState(new Date().getMonth() + 1);
 const [year, setYear] = useState(new Date().getFullYear());
 const [selectedCourse, setSelectedCourse] = useState('idip');
 const [selectedQuarter, setSelectedQuarter] = useState(1);

 const courseOptions = [
   { value: 'idip', label: 'IDIP Leads', table: 'idip_leads_status' },
   { value: 'igc', label: 'IGC Leads', table: 'igc_leads_status' },
   { value: 'other', label: 'Other Courses', table: 'other_lead_status' }
 ];

 const quarterOptions = [
   { value: 1, label: 'Q1 (Jan-Apr)', months: [1, 2, 3, 4] },
   { value: 2, label: 'Q2 (May-Aug)', months: [5, 6, 7, 8] },
   { value: 3, label: 'Q3 (Sep-Dec)', months: [9, 10, 11, 12] }
 ];

 const dashboardTheme = {
   axis: {
     ticks: {
       text: {
         fontSize: 10,
       }
     },
     legend: {
       text: {
         fontSize: 11,
       }
     }
   },
   legends: {
     text: {
       fontSize: 10,
     }
   },
   labels: {
     text: {
       fontSize: 10,
     }
   }
 };

 const fullTheme = {
   axis: {
     ticks: {
       text: {
         fontSize: 12,
       }
     },
     legend: {
       text: {
         fontSize: 14,
       }
     }
   },
   legends: {
     text: {
       fontSize: 12,
     }
   },
   labels: {
     text: {
       fontSize: 12,
     }
   }
 };

 // Function to calculate conversion percentage (Converted / Total)
 const getConversionPercentage = (converted, converting, idle) => {
   const total = converted + converting + idle;
   return total === 0 ? 0 : Math.round((converted / total) * 100);
 };

 // Function to get color based on conversion percentage
 const getConvertedColor = (percentage) => {
   if (percentage >= 80) return '#22c55e'; // Green
   if (percentage >= 40) return '#facc15'; // Brighter Yellow
   return '#ef4444'; // Red
 };

 // Function to create gradient ID for each bar
 const getGradientId = (user) => `gradient-${user.replace(/\s+/g, '-')}`;

 // Custom color function for bars
 const getBarColor = (bar) => {
   const dataPoint = data.find(d => d.user === bar.indexValue);
   if (bar.id === 'Converted' && dataPoint) {
     return `url(#${getGradientId(bar.indexValue)})`;
   }
   // Default colors for other bars
   const colorScheme = ['#1f77b4', '#ff7f0e', '#8b5cf6']; // Blue, Orange, Violet
   const keyIndex = ['Converted', 'Converting', 'Idle'].indexOf(bar.id);
   return colorScheme[keyIndex] || '#1f77b4';
 };

 useEffect(() => {
   const fetchData = async () => {
     const currentCourse = courseOptions.find(c => c.value === selectedCourse);
     
     if (isAdmin) {
       // Admin mode - existing functionality
       const { data, error } = await supabase
         .from(currentCourse.table)
         .select('*')
         .eq('month', month)
         .eq('year', year);

       if (error) {
         console.error('Error fetching performance data:', error);
         return;
       }

       const formatted = data.map(item => ({
         user: item.name,
         Converted: item.converted_count || 0,
         Converting: item.converting_count || 0,
         Idle: item.idle_count || 0,
       }));

       setData(formatted);
     } else {
       // Non-admin mode - quarterly timeline (RLS will filter by user automatically)
       const currentQuarter = quarterOptions.find(q => q.value === selectedQuarter);
       const { data, error } = await supabase
         .from(currentCourse.table)
         .select('*')
         .eq('year', year)
         .in('month', currentQuarter.months);

       if (error) {
         console.error('Error fetching performance data:', error);
         return;
       }

       // Group by month for timeline view
       const monthlyData = currentQuarter.months.map(monthNum => {
         const monthData = data.filter(item => item.month === monthNum);
         const totalConverted = monthData.reduce((sum, item) => sum + (item.converted_count || 0), 0);
         const totalConverting = monthData.reduce((sum, item) => sum + (item.converting_count || 0), 0);
         const totalIdle = monthData.reduce((sum, item) => sum + (item.idle_count || 0), 0);
         
         return {
           user: monthNames[monthNum - 1],
           Converted: totalConverted,
           Converting: totalConverting,
           Idle: totalIdle,
         };
       });

       setData(monthlyData);
     }
   };

   fetchData();
 }, [month, year, selectedCourse, selectedQuarter, isAdmin]);

 const theme = isDashboard ? dashboardTheme : fullTheme;
 const height = isDashboard ? 350 : 500;
 const margin = isDashboard 
   ? { top: 40, right: 30, bottom: 80, left: 60 }
   : { top: 40, right: 80, bottom: 80, left: 60 };

 const containerClass = isDashboard ? 'performance-chart-container dashboard' : 'performance-chart-container';

 return (
   <div className={containerClass} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '15px', boxSizing: 'border-box' }}>
     {isDashboard && (
       <h5 className="chart-title" style={{marginTop:10,marginLeft:5}}>
         {isAdmin ? 'IDIP STATS' : 'MY IDIP STATS'}
       </h5>
     )}
     
     <div className="dashboard-chart-controls" style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '20px' }}>
       <select 
         value={selectedCourse} 
         onChange={(e) => setSelectedCourse(e.target.value)}
       >
         {courseOptions.map(option => (
           <option key={option.value} value={option.value}>
             {option.label}
           </option>
         ))}
       </select>

       <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
         {[2024, 2025, 2026].map((y) => (
           <option key={y} value={y}>{y}</option>
         ))}
       </select>

       {isAdmin ? (
         <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
           {monthNames.map((name, i) => (
             <option key={i} value={i + 1}>{name}</option>
           ))}
         </select>
       ) : (
         <select value={selectedQuarter} onChange={(e) => setSelectedQuarter(Number(e.target.value))}>
           {quarterOptions.map(option => (
             <option key={option.value} value={option.value}>
               {option.label}
             </option>
           ))}
         </select>
       )}
     </div>

     <div className="dashboard-chart" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', position: 'relative' }}>
       <ResponsiveBar
         data={data}
         keys={['Converted', 'Converting', 'Idle']}
         indexBy="user"
         height={height}
         margin={margin}
         padding={0.3}
         groupMode="grouped"
         colors={getBarColor}
         borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
         axisBottom={{
           tickSize: 5,
           tickPadding: 5,
           tickRotation: isDashboard ? 0 : 0,
           legend: isAdmin ? 'User' : 'Month',
           legendPosition: 'middle',
           legendOffset: 50
         }}
         axisLeft={{
           tickSize: 5,
           tickPadding: 5,
           tickRotation: 0,
           legend: 'Leads',
           legendPosition: 'middle',
           legendOffset: -45
         }}
         labelSkipWidth={12}
         labelSkipHeight={12}
         labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
         legends={isDashboard ? [] : [
           {
             dataFrom: 'keys',
             anchor: 'bottom-right',
             direction: 'column',
             justify: false,
             translateX: 80,
             translateY: -10,
             itemsSpacing: 2,
             itemWidth: 100,
             itemHeight: 20,
             itemDirection: 'left-to-right',
             itemOpacity: 0.85,
             symbolSize: 20,
             effects: [
               {
                 on: 'hover',
                 style: {
                   itemOpacity: 1
                 }
               }
             ]
           }
         ]}
         animate={true}
         motionConfig="gentle"
         theme={theme}
         layers={[
           'grid',
           'axes',
           'bars',
           'markers',
           'legends',
           'annotations',
           // Custom layer for gradients
           (props) => {
             return (
               <defs>
                 {data.map(dataPoint => {
                   const percentage = getConversionPercentage(dataPoint.Converted, dataPoint.Converting, dataPoint.Idle);
                   const gradientId = getGradientId(dataPoint.user);
                   
                   // Calculate stop positions based on percentage
                   let stops = [];
                   
                   if (percentage <= 39) {
                     // All red if 0-39%
                     stops = [
                       { offset: '0%', color: '#ef4444' },
                       { offset: '100%', color: '#ef4444' }
                     ];
                   } else if (percentage <= 79) {
                     // Red to yellow based on how far into 40-79% range
                     stops = [
                       { offset: '0%', color: '#ef4444' },
                       { offset: `${39}%`, color: '#ef4444' },
                       { offset: `${39.1}%`, color: '#facc15' },
                       { offset: '100%', color: '#facc15' }
                     ];
                   } else {
                     // Red to yellow to green
                     stops = [
                       { offset: '0%', color: '#ef4444' },
                       { offset: '39%', color: '#ef4444' },
                       { offset: '39.1%', color: '#facc15' },
                       { offset: '79%', color: '#facc15' },
                       { offset: '79.1%', color: '#22c55e' },
                       { offset: '100%', color: '#22c55e' }
                     ];
                   }
                   
                   return (
                     <linearGradient
                       key={gradientId}
                       id={gradientId}
                       x1="0%"
                       y1="100%"
                       x2="0%"
                       y2="0%"
                     >
                       {stops.map((stop, index) => (
                         <stop
                           key={index}
                           offset={stop.offset}
                           stopColor={stop.color}
                         />
                       ))}
                     </linearGradient>
                   );
                 })}
               </defs>
             );
           },
           // Custom layer for percentage labels - FIXED: Only show one percentage per user
           (props) => {
             return (
               <g>
                 {data.map(dataPoint => {
                   // Calculate conversion percentage for this user
                   const conversionPercentage = getConversionPercentage(dataPoint.Converted, dataPoint.Converting, dataPoint.Idle);
                   const totalLeads = dataPoint.Converted + dataPoint.Converting + dataPoint.Idle;
                   
                   // Only show percentage if user has leads
                   if (totalLeads === 0) return null;
                   
                   // Find the bars for this user to calculate position
                   const userBars = props.bars.filter(bar => bar.data.indexValue === dataPoint.user);
                   if (userBars.length === 0) return null;
                   
                   // Calculate the center position of all bars for this user
                   const minX = Math.min(...userBars.map(bar => bar.x));
                   const maxX = Math.max(...userBars.map(bar => bar.x + bar.width));
                   const centerX = (minX + maxX) / 2;
                   
                   // Find the highest bar to position the percentage above it
                   const highestBar = userBars.reduce((prev, current) => 
                     (prev.y < current.y) ? prev : current
                   );
                   
                   return (
                     <text
                       key={`${dataPoint.user}-percentage`}
                       x={centerX}
                       y={highestBar.y - 10}
                       textAnchor="middle"
                       style={{
                         fontSize: isDashboard ? '11px' : '12px',
                         fontWeight: 'bold',
                         fill: getConvertedColor(conversionPercentage)
                       }}
                     >
                       {conversionPercentage}%
                     </text>
                   );
                 })}
               </g>
             );
           }
         ]}
       />
     </div>
   </div>
 );
};

export default PerformanceChart;