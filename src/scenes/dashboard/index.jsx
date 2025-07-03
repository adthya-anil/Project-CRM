import { Box, useTheme, Grid, Paper, Typography } from "@mui/material";
import { tokens } from "../../../theme";
import Header from "../../components/Header.jsx";
//import HorizontalBarChart from "../../components/bar.jsx";
import LineChart from "../../components/line.jsx";
import DoughNut from "../../components/DoughNut.jsx";
//import ScatterPlot from "../../components/scatterplot.jsx";
import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import { format } from "date-fns";
import "./dashboard.css";
import PerformanceChart from "../../components/Barstack.jsx"
import HorizontalBarChart from "../../components/bar.jsx";
import LoadingComponent from "../../loading/LoadingComponent.jsx";

const Dashboard = ({ isDashboard = true, isAdmin}) => {

  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [pendingTasks, setPendingTasks] = useState([]);

  useEffect(() => {
    const fetchPendingTasks = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: tasks, error } = await supabase
          .from('events')
          .select('*')
          .eq('user_id', user.id)
          .is('done_at', null)
          .order('start_time', { ascending: true });

        if (!error) {
          setPendingTasks(tasks || []);
        }
      }
    };

    fetchPendingTasks();
  }, []);

  return (
    <Box m="20px" className="dashboard-root" data-theme={theme.palette.mode}>
      <Header title="DASHBOARD" subtitle="Welcome to your dashboard" />
      <div className="dashboard-grid">
        {/* Bar Chart */}
        <div className={`dashboard-card${isDashboard ? ' dashboard-fit' : ''}`}>
          <Typography variant="h5" mb={2}>
            Lead Statistics
          </Typography>
          <div className="dashboard-chart">
            <PerformanceChart isDashboard={isDashboard} isAdmin={isAdmin} />
          </div>
        </div>
        {/* Line Chart */}
        <div className={`dashboard-card${isDashboard ? ' dashboard-fit' : ''}`}>
          <Typography variant="h5" mb={2}>
            Trends
          </Typography>
          <div className="dashboard-chart">
            <LineChart isDashboard={isDashboard} isAdmin={isAdmin} />
          </div>
        </div>
        {/* Doughnut Chart */}
        <div className={`dashboard-card${isDashboard ? ' dashboard-fit' : ''}`}>
          <Typography variant="h5" mb={2}>
            Distribution
          </Typography>
          <div className="dashboard-chart">
            <DoughNut isDashboard={isDashboard} />
          </div>
        </div>
        {/* Scatter Plot */}
        <div className={`dashboard-card${isDashboard ? ' dashboard-fit' : ''}`}>
          <Typography variant="h5" mb={2}>
            Correlations
          </Typography>
          <div className="dashboard-chart">
            <HorizontalBarChart isDashboard={isDashboard} isAdmin={isAdmin} />
          </div>
        </div>
      </div>
      {/* Pending Tasks */}
      <div className="dashboard-tasks">
        <Typography variant="h5" mb={2}>
          📋 Pending Tasks ({pendingTasks.length})
        </Typography>
        {pendingTasks.length === 0 ? (
          <Box p={3} textAlign="center" color="text.secondary">
            <Typography variant="body1">
              No pending tasks. Great job! 🎉
            </Typography>
          </Box>
        ) : (
          <Box>
            {pendingTasks.map((task) => (
              <div className="dashboard-task-item" key={task.id}>
                <Typography variant="h6">{task.title}</Typography>
                <Typography variant="body2">
                  📅 {format(new Date(task.start_time), "PPP")}
                </Typography>
              </div>
            ))}
          </Box>
        )}
      </div>
    </Box>
  );
};

export default Dashboard;
