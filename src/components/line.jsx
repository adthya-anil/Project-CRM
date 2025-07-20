import { useState, useEffect } from 'react';
import { ResponsiveLine } from '@nivo/line';
import { supabase } from '../../supabaseClient';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const getQuarterFromMonth = (month) => {
  if (month >= 1 && month <= 4) return 1;
  if (month >= 5 && month <= 8 ) return 2;
  if (month >= 9 && month <= 12) return 3;
  
  return 1;
};

const LineChart = ({ isDashboard = false, isAdmin = true }) => {
  const [chartData, setChartData] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('igc');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedUser, setSelectedUser] = useState('all');
  const [users, setUsers] = useState([]);
  const [selectedQuarter, setSelectedQuarter] = useState(
    getQuarterFromMonth(new Date().getMonth() + 1)
  );

  useEffect(() => {
    setSelectedQuarter(getQuarterFromMonth(selectedMonth));
  }, [selectedMonth]);

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
    }
  };

  // Fetch users (only for admin)
  useEffect(() => {
    if (!isAdmin) return;

    const fetchUsers = async () => {
      const currentCourse = courseOptions.find(c => c.value === selectedCourse);
      const { data: userData, error } = await supabase
        .from(currentCourse.table)
        .select('name')
        .eq('year', selectedYear)
        .eq('month', selectedMonth);

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      const uniqueUsers = [...new Set(userData.map(item => item.name))];
      setUsers(uniqueUsers);
    };

    fetchUsers();
  }, [selectedCourse, selectedYear, selectedMonth, isAdmin]);

  // Fetch data for admin users (original functionality)
  const fetchAdminData = async () => {
    const currentCourse = courseOptions.find(c => c.value === selectedCourse);
    let query = supabase
      .from(currentCourse.table)
      .select('name, converted_count, converting_count, idle_count')
      .eq('year', selectedYear)
      .eq('month', selectedMonth);

    if (selectedUser !== 'all') {
      query = query.eq('name', selectedUser);
    }

    const { data: leadData, error } = await query;

    if (error) {
      console.error('Error fetching data:', error);
      return;
    }

    // Transform to multiple lines for each user
    const transformedData = leadData.map(item => ({
      id: item.name || 'Unknown',
      data: [
        { x: 'converted_count', y: item.converted_count || 0 },
        { x: 'converting_count', y: item.converting_count || 0 },
        { x: 'idle_count', y: item.idle_count || 0 },
      ],
    }));

    setChartData(transformedData);
  };

  // Fetch data for non-admin users (4-month timeline)
  const fetchNonAdminData = async () => {
    const currentCourse = courseOptions.find(c => c.value === selectedCourse);
    const currentQuarter = quarterOptions.find(q => q.value === selectedQuarter);
    
    const { data: leadData, error } = await supabase
      .from(currentCourse.table)
      .select('month, year, converted_count, converting_count, idle_count')
      .eq('year', selectedYear)
      .in('month', currentQuarter.months);

    if (error) {
      console.error('Error fetching data:', error);
      return;
    }

    // Create a map for easy lookup
    const dataMap = new Map();
    leadData.forEach(item => {
      dataMap.set(item.month, item);
    });

    // Transform to timeline format with month names
    const convertedData = {
      id: 'Converted',
      data: currentQuarter.months.map(month => {
        const monthData = dataMap.get(month);
        return {
          x: monthNames[month - 1].substring(0, 3), // Short month name
          y: monthData ? monthData.converted_count || 0 : 0
        };
      })
    };

    const convertingData = {
      id: 'Converting',
      data: currentQuarter.months.map(month => {
        const monthData = dataMap.get(month);
        return {
          x: monthNames[month - 1].substring(0, 3),
          y: monthData ? monthData.converting_count || 0 : 0
        };
      })
    };

    const idleData = {
      id: 'Idle',
      data: currentQuarter.months.map(month => {
        const monthData = dataMap.get(month);
        return {
          x: monthNames[month - 1].substring(0, 3),
          y: monthData ? monthData.idle_count || 0 : 0
        };
      })
    };

    setChartData([convertedData, convertingData, idleData]);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    } else {
      fetchNonAdminData();
    }
  }, [selectedCourse, selectedYear, selectedMonth, selectedUser, selectedQuarter, isAdmin]);

  const theme = isDashboard ? dashboardTheme : fullTheme;
  const margin = isDashboard 
    ? { top: 10, right: 20, bottom: 580, left: 50 }
    : { top: 50, right: 110, bottom: 130, left: 60 };

  const containerClass = isDashboard ? 'performance-chart-container dashboard' : 'performance-chart-container';

  return (
    <div className={containerClass}>
      {isDashboard && <h5 className="chart-title" style={{marginTop:10,marginLeft:5}}>
        {isAdmin ? 'ADMIN STATS' : 'MY STATS'}
      </h5>}
      
      <div className="dashboard-chart-controls">
        <select
          value={selectedCourse}
          onChange={e => setSelectedCourse(e.target.value)}
        >
          {courseOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={selectedYear}
          onChange={e => setSelectedYear(Number(e.target.value))}
        >
          {[2024, 2025, 2026].map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

        {isAdmin ? (
          <>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
            >
              {monthNames.map((name, i) => (
                <option key={i} value={i + 1}>{name}</option>
              ))}
            </select>

            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
            >
              <option value="all">All Users</option>
              {users.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </>
        ) : (
          <select
            value={selectedQuarter}
            onChange={e => setSelectedQuarter(Number(e.target.value))}
          >
            {quarterOptions.map(quarter => (
              <option key={quarter.value} value={quarter.value}>
                {quarter.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="dashboard-chart">
        <ResponsiveLine
          data={chartData}
          margin={margin}
          xScale={{ type: 'point' }}
          yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
          axisBottom={{ 
            legend: isAdmin ? 'Metrics' : 'Months', 
            legendOffset: 36,
          }}
          axisLeft={{ legend: 'Count', legendOffset: -40 }}
          colors={{ scheme: 'category10' }}
          pointSize={isDashboard ? 6 : 8}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'seriesColor' }}
          pointLabelYOffset={-12}
          enableArea={true}
          areaBlendMode="multiply"
          enableTouchCrosshair={true}
          animate={false}
          useMesh={true}
          legends={isDashboard ? [] : [
            {
              anchor: 'bottom-right',
              direction: 'column',
              translateX: 100,
              itemWidth: 80,
              itemHeight: 22,
              symbolShape: 'circle',
              itemTextColor: '#1b1b1b',
            },
          ]}
          theme={theme}
        />
      </div>
    </div>
  );
};

export default LineChart;