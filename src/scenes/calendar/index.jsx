
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from "@fullcalendar/timegrid";
import { supabase } from '../../../supabaseClient';
import { useLeads as useTableData } from '../../hooks/useLeads';
import {
  Container,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  MenuItem,
  DialogActions,
  Box,
  List,
  ListItem,
  ListItemText,
  Paper,
} from '@mui/material';
import { format } from 'date-fns';
import './calendarStyles.css';


const Calendar = ({isAdmin}) => {
  const [user, setUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [users, setUsers] = useState([]);
  const [assignedUser, setAssignedUser] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error(error);
      } else {
        setUser(data?.user);
      }
    };
    fetchUser();
  }, []);

  const {
    leads: events,
    createLead,
    updateLead,
    deleteLead,
    isCreating,
    isUpdating,
    isDeleting,
  } = useTableData('events', '*');

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('users').select('user_id, name');
      if (!error) setUsers(data || []);
    };
    fetchUsers();
  }, []);

  const handleCreateTask = async () => {
    if (!user) return;

    const now = new Date();
    const localDate = new Date(date + 'T00:00:00'); // date as local midnight
    localDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0); // apply current time

    const newTask = {
      title,
      start_time: localDate.toISOString(),
      end_time: localDate.toISOString(),
      user_id: assignedUser && assignedUser.trim() !== '' ? assignedUser : user.id,
      created_by: user.id,
    };

    createLead(newTask);
    setOpenDialog(false);
    setTitle('');
    setAssignedUser('');
    setDate('');
  };

  const handleDateClick = (arg) => {
    setDate(arg.dateStr);
    setOpenDialog(true);
  };

const handleMarkDone = (id) => {
  const now = new Date();
  updateLead({ id, done_at: now });
};


  // This line is unnecessary and incorrect.
  // You already receive `isAdmin` as a prop in the function parameter.
  // Remove this line entirely.
  const incompleteTasks = user ? events.filter(e => !e.done_at && e.user_id === user.id) : [];
  const doneTasks = user ? events.filter(e =>
    e.done_at &&
    e.user_id === user.id &&
    new Date(e.done_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ) : [];

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        My Calendar
      </Typography>

      <Box mb={4}>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin, timeGridPlugin]}
          editable={true}
          initialView="dayGridMonth"
          timeZone="local"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={incompleteTasks.map(event => ({
            id: event.id,
            title: event.title,
            start: event.start_time,
          }))}
          eventDrop={async (info) => {
            const eventId = Number(info.event.id, 10);

            const original = events.find(e => e.id === eventId);
            if (!original) return info.revert();

            const originalTime = new Date(original.start_time);
            const droppedDate = new Date(info.event.start);

            droppedDate.setHours(originalTime.getHours(), originalTime.getMinutes(), originalTime.getSeconds(), 0);

            const { data, error } = await supabase
              .from('events')
              .update({ start_time: droppedDate.toISOString() })
              .eq('id', eventId)
              .select();

            if (error || !data || data.length === 0) {
              console.error('Update failed:', error || 'No rows updated.');
              info.revert();
            }
          }}
          dateClick={handleDateClick}
          height="auto"
          eventDisplay="block"
          dayMaxEvents={3}
          moreLinkClick="popover"
        />
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Task Title"
            placeholder="Enter task description"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Date"
            type="date"
            fullWidth
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          {isAdmin && (
            <TextField
              select
              label="Assign to User"
              fullWidth
              value={assignedUser}
              onChange={(e) => setAssignedUser(e.target.value)}
              margin="dense"
              helperText="Leave empty to assign to yourself"
            >
              {users.map((u) => (
                <MenuItem key={u.user_id} value={u.user_id}>
                  {u.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateTask}
            variant="contained"
            disabled={!title.trim() || isCreating}
            sx={{ colour: 'white' }}
          >
            {isCreating ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogActions>
      </Dialog>

      <Box mt={4}>
        <Typography variant="h5" gutterBottom>
          📋 My Tasks ({incompleteTasks.length})
        </Typography>
        <Paper elevation={0}>
          {incompleteTasks.length === 0 ? (
            <Box p={3} textAlign="center" color="text.secondary">
              <Typography variant="body1">No pending tasks. Great job! 🎉</Typography>
            </Box>
          ) : (
            <List>
              {incompleteTasks.map(task => (
                <ListItem
                  key={task.id}
                  divider
                  secondaryAction={
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleMarkDone(task.id)}
                        disabled={isUpdating}
                      >
                        {isUpdating ? 'Updating...' : 'Mark Done'}
                      </Button>
                      <Button
                        sx={{ color: '#a81010 !important' }}
                        size="small"
                        color="error"
                        onClick={() => deleteLead(task.id)}
                        disabled={isDeleting}
                      >
                        Delete
                      </Button>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={task.title}
                    secondary={`📅 ${format(new Date(task.start_time), 'PPP')}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Box>

      {doneTasks.length > 0 && (
        <Box mt={4}>
          <Typography variant="h5" gutterBottom>
            ✅ Completed Tasks (Last 24h)
          </Typography>
          <Paper elevation={0}>
            <List>
              {doneTasks.map(task => (
                <ListItem
                  key={task.id}
                  divider
                  secondaryAction={
                    <Button
                      size="small"
                      color="error"
                      onClick={() => deleteLead(task.id)}
                      disabled={isDeleting}
                    >
                      Delete
                    </Button>
                  }
                >
                  <ListItemText
                    primary={task.title}
                    secondary={`✅ Completed: ${format(new Date(task.done_at), 'PPpp')}`}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default Calendar;
