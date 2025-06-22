import Header from "../../components/Header";
import { Box, Typography } from "@mui/material";
import { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import { format } from "date-fns";
import LeadInteractions from "../../components/LeadInteraction";

const Reports = ({ isAdmin }) => {
  // If not admin, render early and skip all logic
  if (!isAdmin) {
    return <LeadInteractions />;
  }

  const [pendingTasks, setPendingTasks] = useState([]);

  useEffect(() => {
    const fetchPendingTasks = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) return;

      const { data: tasks, error } = await supabase
        .from("events")
        .select("*")
        .eq("created_by", user.id)
        .neq("user_id", user.id)
        // .is('done_at', null)
        .order("start_time", { ascending: true });

      if (!error) {
        setPendingTasks(tasks || []);
      } else {
        console.error("Error fetching tasks:", error.message);
      }
    };

    fetchPendingTasks();
  }, []);

  return (
    <Box ml="40px" mr="40px">
      <Header title="REPORTS" subtitle="Monitor Assigned Tasks" />
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
                  📅 {format(new Date(task.start_time), "PPP")} at{" "}
                  {format(new Date(task.start_time), "p")}
                </Typography>
                {task.done_at && (
                  <Typography variant="body2" color="success.main">
                    ✅ Done at: {format(new Date(task.done_at), "PPP")} at{" "}
                    {format(new Date(task.done_at), "p")}
                  </Typography>
                )}
              </div>
            ))}
          </Box>
        )}
      </div>
    </Box>
  );
};

export default Reports;
