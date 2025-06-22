import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { ResponsivePie } from '@nivo/pie';

const DoughNut = ({isDashboard = false}) => {
  const [selectedColumn, setSelectedColumn] = useState('JobTitle'); // default
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .rpc('get_counts_by_column', { column_name: selectedColumn });

      if (error) {
        console.error('Error fetching data:', error);
        return;
      }

      // Transform data to Nivo Pie Chart format
      const pieData = data.map(item => ({
        id: item.name || 'Unknown', // handle nulls
        label: item.name || 'Unknown',
        value: item.count,
      }));

      setChartData(pieData);
    };

    fetchData();
  }, [selectedColumn]);

  const containerClass = isDashboard ? 'performance-chart-container dashboard' : 'performance-chart-container';

  return (
    <div className={containerClass}>
      <div style={{marginLeft:8,marginTop:0}}>
         <select value={selectedColumn} onChange={e => setSelectedColumn(e.target.value)}>
        <option value="JobTitle">Job Title</option>
        <option value="State">State</option>
        <option value="Country">Country</option>
        <option value="temperature">Temperature</option>
        <option value="status">Status</option>
        <option value="Source">Source</option>
      </select>
      </div>
     

      <div style={{ height: isDashboard ? '100%' : '700px', width: '100%' }} >
        <ResponsivePie
          data={chartData}
           margin={isDashboard 
          ? { top: 20, right: 20, bottom: 20, left: 20 }
          : { top: 40, right: 80, bottom: 80, left: 80 }
        }
          innerRadius={isDashboard ? 0.6 : 0.5}
          padAngle={isDashboard ? 1 : 0.7}
        cornerRadius={isDashboard ? 2 : 3}
        enableArcLabels={!isDashboard}
        enableArcLinkLabels={!isDashboard}
          activeOuterRadiusOffset={8}
          borderWidth={1}
          borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
          arcLinkLabelsSkipAngle={10}
          arcLinkLabelsTextColor="#333333"
          arcLinkLabelsThickness={2}
          arcLinkLabelsColor={{ from: 'color' }}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
          legends={isDashboard ? [] : [
          {
            anchor: 'bottom-right',
            direction: 'column',
            justify: false,
            translateX: 0,
            translateY: 56,
            itemsSpacing: 2,
            itemWidth: 100,
            itemHeight: 18,
            itemTextColor: '#1b1b1b',
            itemDirection: 'left-to-right',
            itemOpacity: 1,
            symbolSize: 18,
            symbolShape: 'circle',
          }
        ]}
        />
      </div>
  </div>
  );
    
};

export default DoughNut;
