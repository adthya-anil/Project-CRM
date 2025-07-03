import { useState, useEffect } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { supabase } from '../../supabaseClient';

const HorizontalBarChart = ({ isDashboard = false, isAdmin = true }) => {
  // Dashboard-specific theme
  const dashboardTheme = {
    background: 'transparent',
    text: {
      fontSize: 10,
      fill: '#344E67',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    axis: {
      domain: {
        line: {
          stroke: '#e5e7eb',
          strokeWidth: 1
        }
      },
      ticks: {
        line: {
          stroke: '#e5e7eb',
          strokeWidth: 1
        },
        text: {
          fontSize: 9,
          fill: '#6b7280'
        }
      },
      legend: {
        text: {
          fontSize: 10,
          fill: '#344E67',
          fontWeight: 600
        }
      }
    },
    grid: {
      line: {
        stroke: '#f3f4f6',
        strokeWidth: 1
      }
    },
    legends: {
      text: {
        fontSize: 9,
        fill: '#344E67'
      }
    },
    labels: {
      text: {
        fontSize: 9,
        fill: '#1b1b1b',
        fontWeight: 500
      }
    },
    tooltip: {
      container: {
        background: '#ffffff',
        color: '#1b1b1b',
        fontSize: 11,
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        border: '1px solid #e5e7eb'
      }
    }
  };

  // Full-page theme
  const fullTheme = {
    background: 'transparent',
    text: {
      fontSize: 12,
      fill: '#344E67',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    axis: {
      domain: {
        line: {
          stroke: '#d1d5db',
          strokeWidth: 1
        }
      },
      ticks: {
        line: {
          stroke: '#d1d5db',
          strokeWidth: 1
        },
        text: {
          fontSize: 11,
          fill: '#6b7280'
        }
      },
      legend: {
        text: {
          fontSize: 13,
          fill: '#344E67',
          fontWeight: 600
        }
      }
    },
    grid: {
      line: {
        stroke: '#f9fafb',
        strokeWidth: 1
      }
    },
    legends: {
      text: {
        fontSize: 11,
        fill: '#344E67'
      }
    },
    labels: {
      text: {
        fontSize: 11,
        fill: '#1b1b1b',
        fontWeight: 500
      }
    },
    tooltip: {
      container: {
        background: '#ffffff',
        color: '#1b1b1b',
        fontSize: 12,
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        border: '1px solid #e5e7eb'
      }
    }
  };

  const [data, setData] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState('converting_count');
  const [selectedCourse, setSelectedCourse] = useState('other');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const courseOptions = [
    { value: 'idip', label: 'IDIP Leads', table: 'idip_leads_status' },
    { value: 'igc', label: 'IGC Leads', table: 'igc_leads_status' },
    { value: 'other', label: 'Other Courses', table: 'other_lead_status' }
  ];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const columnOptions = [
    { value: 'converted_count', label: 'Converted Count' },
    { value: 'converting_count', label: 'Converting Count' },
    { value: 'idle_count', label: 'Idle Count' }
  ];

  const quarterOptions = [
    { value: 1, label: 'Q1 (Jan-Apr)', months: [1, 2, 3, 4] },
    { value: 2, label: 'Q2 (May-Aug)', months: [5, 6, 7, 8] },
    { value: 3, label: 'Q3 (Sep-Dec)', months: [9, 10, 11, 12] }
  ];

  // Fetch users for admin mode
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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const currentCourse = courseOptions.find(c => c.value === selectedCourse);
        let query = supabase.from(currentCourse.table);

        if (isAdmin) {
          // Admin mode - existing functionality
          query = query
            .select('name, converted_count, converting_count, idle_count')
            .eq('year', selectedYear)
            .eq('month', selectedMonth);

          if (selectedUser !== 'all') {
            query = query.eq('name', selectedUser);
          }

          const { data: leadData, error } = await query;
          if (error) throw error;

          const formattedData = leadData.map(item => ({
            name: item.name,
            [selectedColumn]: item[selectedColumn] || 0,
          }));

          setData(formattedData);
        } else {
          // Non-admin mode - quarterly timeline (RLS will filter by user automatically)
          const currentQuarter = quarterOptions.find(q => q.value === selectedQuarter);
          query = query
            .select('name, month, converted_count, converting_count, idle_count')
            .eq('year', selectedYear)
            .in('month', currentQuarter.months);

          const { data: leadData, error } = await query;
          if (error) throw error;

          // Group by month for timeline view
          const monthlyData = currentQuarter.months.map(month => {
            const monthData = leadData.find(item => item.month === month);
            return {
              name: monthNames[month - 1],
              [selectedColumn]: monthData ? monthData[selectedColumn] || 0 : 0,
            };
          });

          setData(monthlyData);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedColumn, selectedCourse, selectedYear, selectedMonth, selectedUser, selectedQuarter, isAdmin]);

  const theme = isDashboard ? dashboardTheme : fullTheme;
  const height = isDashboard ? 180 : 600;
  const margin = isDashboard 
    ? { top: 10, right: 15, bottom: 40, left: 45 }
    : { top: 50, right: 130, bottom: 50, left: 60 };

  // Updated colors - assign different colors based on the name/index
  const getBarColor = (bar) => {
    const colors = isDashboard 
      ? ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57']
      : ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e'];
    
    // Find the index of this name in the data array to assign consistent colors
    const nameIndex = data.findIndex(item => item.name === bar.indexValue);
    return colors[nameIndex % colors.length];
  };

  if (error) {
    return (
      <div className={isDashboard ? 'dashboard-chart-error' : 'chart-error'}>
        Error loading chart data: {error}
      </div>
    );
  }

  return (
    <div className={isDashboard ? 'dashboard-card' : 'chart-container'} style={{marginLeft: '15px'}}>
      {!isDashboard && (
        <h3 className="chart-title">
          {columnOptions.find(opt => opt.value === selectedColumn)?.label} - 
          {isAdmin ? ' Horizontal Bar Chart' : ' Timeline View'}
        </h3>
      )}
      
      <div
        className={isDashboard ? 'dashboard-chart-controls' : 'chart-controls'}
        style={{ paddingTop: '18px' }}
      >
        <div style={{ display: 'flex', gap: '12px', paddingRight: '10px' }}>
          <select
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            disabled={isLoading}
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
            disabled={isLoading}
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
                disabled={isLoading}
              >
                {monthNames.map((name, i) => (
                  <option key={i} value={i + 1}>{name}</option>
                ))}
              </select>

              <select
                value={selectedUser}
                onChange={e => setSelectedUser(e.target.value)}
                disabled={isLoading}
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
              disabled={isLoading}
            >
              {quarterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedColumn}
            onChange={e => setSelectedColumn(e.target.value)}
            disabled={isLoading}
          >
            {columnOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={isDashboard ? 'dashboard-chart' : 'chart-wrapper'} style={{ height: `${height}px` }}>
        {isLoading ? (
          <div className="dashboard-chart-loading">Loading chart data...</div>
        ) : (
          <ResponsiveBar
            data={data}
            keys={[selectedColumn]}
            margin={margin}
            indexBy="name"
            layout="horizontal"
            padding={0.3}
            colors={getBarColor}
            borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: isDashboard ? '' : selectedColumn.replace(/_/g, ' '),
              legendPosition: 'middle',
              legendOffset: isDashboard ? 25 : 40,
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: isDashboard ? '' : (isAdmin ? 'Name' : 'Month'),
              legendPosition: 'middle',
              legendOffset: isDashboard ? -45 : -90,
            }}
            labelSkipWidth={12}
            labelSkipHeight={12}
            labelTextColor={{ from: 'color', modifiers: [['darker', 1.8]] }}
            tooltip={({ id, value, color, indexValue }) => (
              <div className="nivo-tooltip">
                <strong>{indexValue}</strong>: {value}
              </div>
            )}
            enableLabel={!isDashboard}
            enableGridY={!isDashboard}
            legends={isDashboard ? [] : [
              {
                dataFrom: 'keys',
                anchor: 'bottom-right',
                direction: 'row',
                justify: false,
                translateX: 110,
                translateY: 0,
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
            motionStiffness={90}
            motionDamping={15}
            theme={theme}
          />
        )}
      </div>
    </div>
  );
};

export default HorizontalBarChart;