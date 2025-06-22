import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Tabs,
  Tab
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Edit as EditIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Message as MessageIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Send as SendIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import './LeadInteraction.css';
import { supabase } from '../../supabaseClient';

const LeadInteractions = () => {
  const [interactions, setInteractions] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailLogsLoading, setEmailLogsLoading] = useState(true);
  const [selectedInteraction, setSelectedInteraction] = useState(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [tabValue, setTabValue] = useState(0);

  // Fetch interactions on component mount
  useEffect(() => {
    fetchInteractions();
    fetchEmailLogs();
  }, []);

  const fetchInteractions = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) {
        setSnackbar({
          open: true,
          message: 'User not authenticated',
          severity: 'error'
        });
        return;
      }

      const { data, error } = await supabase
        .from('lead_interactions')
        .select(`
          *,
          mock:lead_id (
            id,
            Name,
            Email,
            Phone
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInteractions(data || []);
    } catch (error) {
      console.error('Error fetching interactions:', error);
      setSnackbar({
        open: true,
        message: 'Error fetching interactions: ' + error.message,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailLogs = async () => {
    setEmailLogsLoading(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) {
        setSnackbar({
          open: true,
          message: 'User not authenticated',
          severity: 'error'
        });
        return;
      }

      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmailLogs(data || []);
    } catch (error) {
      console.error('Error fetching email logs:', error);
      setSnackbar({
        open: true,
        message: 'Error fetching email logs: ' + error.message,
        severity: 'error'
      });
    } finally {
      setEmailLogsLoading(false);
    }
  };

  const handleNotesEdit = (interaction) => {
    setSelectedInteraction(interaction);
    setNotesText(interaction.notes || '');
    setNotesDialogOpen(true);
  };

  const handleNotesUpdate = async () => {
    if (!selectedInteraction) return;

    try {
      const { data, error } = await supabase
        .from('lead_interactions')
        .update({ notes: notesText })
        .eq('id', selectedInteraction.id)
        .select()
        .single();

      if (error) throw error;

      setInteractions(prev => 
        prev.map(interaction => 
          interaction.id === selectedInteraction.id 
            ? { ...interaction, notes: notesText }
            : interaction
        )
      );

      setSnackbar({
        open: true,
        message: 'Notes updated successfully',
        severity: 'success'
      });
      
      setNotesDialogOpen(false);
      setSelectedInteraction(null);
      setNotesText('');
    } catch (error) {
      console.error('Error updating notes:', error);
      setSnackbar({
        open: true,
        message: 'Error updating notes: ' + error.message,
        severity: 'error'
      });
    }
  };

  const getInteractionIcon = (type) => {
    switch (type) {
      case 'phone_call':
        return <PhoneIcon />;
      case 'email':
        return <EmailIcon />;
      case 'sms':
        return <MessageIcon />;
      case 'meeting':
        return <PersonIcon />;
      default:
        return <MessageIcon />;
    }
  };

  const getEmailStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <CheckCircleIcon />;
      case 'failed':
        return <ErrorIcon />;
      case 'queued':
        return <ScheduleIcon />;
      default:
        return <SendIcon />;
    }
  };

  const formatInteractionType = (type) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRefresh = () => {
    if (tabValue === 0) {
      fetchInteractions();
    } else {
      fetchEmailLogs();
    }
  };

  const interactionColumns = [
    {
      field: 'lead_id',
      headerName: 'Lead ID',
      width: 100,
      headerClassName: 'data-grid-header'
    },
    {
      field: 'lead_name',
      headerName: 'Lead Name',
      width: 150,
      headerClassName: 'data-grid-header',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500, color: '#0a3456' }}>
          {params.row.mock?.Name || `Lead #${params.row.lead_id}`}
        </Typography>
      )
    },
    {
      field: 'lead_email',
      headerName: 'Email',
      width: 180,
      headerClassName: 'data-grid-header',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
          {params.row.mock?.Email || 'No email'}
        </Typography>
      )
    },
    {
      field: 'lead_phone',
      headerName: 'Phone',
      width: 130,
      headerClassName: 'data-grid-header',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
          {params.row.mock?.Phone || 'No phone'}
        </Typography>
      )
    },
    {
      field: 'interaction_type',
      headerName: 'Type',
      width: 140,
      headerClassName: 'data-grid-header',
      renderCell: (params) => (
        <Box className="interaction-type-cell">
          {getInteractionIcon(params.value)}
          <Typography variant="body2" sx={{ ml: 1 }}>
            {formatInteractionType(params.value)}
          </Typography>
        </Box>
      )
    },
    {
      field: 'message',
      headerName: 'Message',
      flex: 1,
      headerClassName: 'data-grid-header',
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <Typography variant="body2" className="message-cell">
            {params.value || 'No message'}
          </Typography>
        </Tooltip>
      )
    },
    {
      field: 'notification_sent',
      headerName: 'Notification',
      width: 120,
      headerClassName: 'data-grid-header',
      renderCell: (params) => (
        <Chip
          icon={params.value ? <CheckCircleIcon /> : <CancelIcon />}
          label={params.value ? 'Sent' : 'Not Sent'}
          color={params.value ? 'success' : 'default'}
          size="small"
          className="notification-chip"
        />
      )
    },
    {
      field: 'created_at',
      headerName: 'Response Time',
      width: 180,
      headerClassName: 'data-grid-header',
      renderCell: (params) => (
        <Typography variant="body2" className="datetime-cell">
          {formatDateTime(params.value)}
        </Typography>
      )
    },
    {
      field: 'notes',
      headerName: 'Notes',
      width: 300,
      headerClassName: 'data-grid-header',
      renderCell: (params) => (
        <Box className="notes-cell">
          <Typography variant="body2" className="notes-preview">
            {params.value ? params.value.substring(0, 50) + (params.value.length > 50 ? '...' : '') : 'No notes'}
          </Typography>
          <IconButton
            size="small"
            onClick={() => handleNotesEdit(params.row)}
            className="edit-notes-btn"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    }
  ];

  const emailLogColumns = [
    {
      field: 'sender_email',
      headerName: 'Sender Email',
      width: 200,
      headerClassName: 'data-grid-header',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500, color: '#0a3456' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'recipient_count',
      headerName: 'Recipients',
      width: 100,
      headerClassName: 'data-grid-header',
      renderCell: (params) => (
        <Chip
          label={params.value}
          color="primary"
          size="small"
          variant="outlined"
        />
      )
    },
    {
      field: 'subject',
      headerName: 'Subject',
      width: 250,
      headerClassName: 'data-grid-header',
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <Typography variant="body2" className="message-cell">
            {params.value || 'No subject'}
          </Typography>
        </Tooltip>
      )
    },
    {
      field: 'email_type',
      headerName: 'Type',
      width: 120,
      headerClassName: 'data-grid-header',
      renderCell: (params) => (
        <Chip
          label={formatInteractionType(params.value)}
          color={params.value === 'template' ? 'secondary' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'template_name',
      headerName: 'Template',
      width: 150,
      headerClassName: 'data-grid-header',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
          {params.value || 'N/A'}
        </Typography>
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      headerClassName: 'data-grid-header',
      renderCell: (params) => (
        <Chip
          icon={getEmailStatusIcon(params.value)}
          label={formatInteractionType(params.value)}
          color={
            params.value === 'sent' ? 'success' : 
            params.value === 'failed' ? 'error' : 
            'warning'
          }
          size="small"
        />
      )
    },
    {
      field: 'created_at',
      headerName: 'Sent At',
      width: 180,
      headerClassName: 'data-grid-header',
      renderCell: (params) => (
        <Typography variant="body2" className="datetime-cell">
          {formatDateTime(params.value)}
        </Typography>
      )
    },
    {
      field: 'error_message',
      headerName: 'Error',
      flex: 1,
      headerClassName: 'data-grid-header',
      renderCell: (params) => (
        params.value ? (
          <Tooltip title={params.value} arrow>
            <Typography variant="body2" sx={{ color: 'error.main', fontSize: '0.875rem' }}>
              {params.value.substring(0, 30)}...
            </Typography>
          </Tooltip>
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
            No errors
          </Typography>
        )
      )
    }
  ];

  return (
    <Box className="lead-interactions-container">
      <Paper className="interactions-paper">
        <Box className="interactions-header">
          <Typography variant="h6" className="header-title">
            Lead Communications
          </Typography>
          <Box className="header-actions">
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              className="refresh-btn"
            >
              Refresh
            </Button>
          </Box>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={(event, newValue) => setTabValue(newValue)}
            aria-label="communication tabs"
          >
            <Tab label="Lead Interactions" />
            <Tab label="Email Logs" />
          </Tabs>
        </Box>

        <Box className="data-grid-container">
          {tabValue === 0 && (
            <DataGrid
              rows={interactions}
              columns={interactionColumns}
              loading={loading}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              disableSelectionOnClick
              autoHeight
              className="interactions-grid"
              components={{
                NoRowsOverlay: () => (
                  <Box className="no-data-overlay">
                    <Typography variant="body1">
                      No interactions found for your leads
                    </Typography>
                  </Box>
                )
              }}
            />
          )}

          {tabValue === 1 && (
            <DataGrid
              rows={emailLogs}
              columns={emailLogColumns}
              loading={emailLogsLoading}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              disableSelectionOnClick
              autoHeight
              className="interactions-grid"
              components={{
                NoRowsOverlay: () => (
                  <Box className="no-data-overlay">
                    <Typography variant="body1">
                      No email logs found
                    </Typography>
                  </Box>
                )
              }}
            />
          )}
        </Box>
      </Paper>

      {/* Notes Edit Dialog */}
      <Dialog
        open={notesDialogOpen}
        onClose={() => setNotesDialogOpen(false)}
        maxWidth="md"
        fullWidth
        className="notes-dialog"
      >
        <DialogTitle className="dialog-title">
          Edit Interaction Notes
          {selectedInteraction && selectedInteraction.mock && (
            <Typography variant="subtitle2" sx={{ color: 'beige', mt: 1 }}>
              Lead: {selectedInteraction.mock.Name} | Type: {formatInteractionType(selectedInteraction.interaction_type)}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Notes"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            placeholder="Add your notes about this interaction..."
            className="notes-input"
          />
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button onClick={() => setNotesDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleNotesUpdate} 
            variant="contained"
            className="save-btn"
          >
            Save Notes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LeadInteractions;