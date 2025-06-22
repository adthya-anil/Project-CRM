import React, { useState, useEffect } from 'react';
import {
  Drawer,
  IconButton,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  Button,
  Divider,
  Avatar
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  PersonAdd as PersonAddIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { supabase } from '../../supabaseClient';

const NotificationPanel = ({ isAdmin = false, open, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [open, isAdmin]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      if (isAdmin) {
        const { data, error } = await supabase
          .from('mock')
          .select(`
            id,
            Name,
            next_course,
            status,
            status_updated_at,
            is_converted_read,
            users!mock_user_id_fkey(name)
          `)
          .eq('status', 'Converted')
          .eq('is_converted_read', false)
          .gte('status_updated_at', twentyFourHoursAgo)
          .order('status_updated_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        const processed = data.map(lead => ({
          id: `conversion-${lead.id}`,
          leadId: lead.id,
          leadName: lead.Name,
          course: lead.next_course,
          type: 'conversion',
          converterName: lead.users?.name || 'Unknown User',
          timestamp: lead.status_updated_at,
          read: false
        }));

        setNotifications(processed);
      } else {
        const { data, error } = await supabase
          .from('mock')
          .select(`
            id,
            Name,
            next_course,
            status_updated_at,
            reassigned
          `)
          .eq('reassigned', true)
          .gte('status_updated_at', twentyFourHoursAgo)
          .order('status_updated_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        const processed = data.map(lead => ({
          id: `reassignment-${lead.id}`,
          leadId: lead.id,
          leadName: lead.Name,
          course: lead.next_course,
          type: 'reassignment',
          timestamp: lead.status_updated_at,
          read: false
        }));

        setNotifications(processed);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mock'
        },
        (payload) => {
          handleRealtimeUpdate(payload.new);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleRealtimeUpdate = async (updatedLead) => {
    const notificationId = `conversion-${updatedLead.id}`;

    // Prevent duplicates
    const alreadyExists = notifications.some(n => n.id === notificationId);
    if (alreadyExists) return;

    if (isAdmin && updatedLead.status === 'Converted' && !updatedLead.is_converted_read) {
      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('user_id', updatedLead.user_id)
        .single();

      const newNotification = {
        id: notificationId,
        leadId: updatedLead.id,
        leadName: updatedLead.Name,
        course: updatedLead.next_course,
        type: 'conversion',
        converterName: userData?.name || 'Unknown User',
        timestamp: updatedLead.status_updated_at,
        read: false
      };

      setNotifications(prev => [newNotification, ...prev.slice(0, 19)]);
    } else if (!isAdmin && updatedLead.reassigned === true) {
      const notificationId = `reassignment-${updatedLead.id}`;
      const alreadyExists = notifications.some(n => n.id === notificationId);
      if (alreadyExists) return;

      const newNotification = {
        id: notificationId,
        leadId: updatedLead.id,
        leadName: updatedLead.Name,
        course: updatedLead.next_course,
        type: 'reassignment',
        timestamp: updatedLead.status_updated_at,
        read: false
      };

      setNotifications(prev => [newNotification, ...prev.slice(0, 19)]);
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  const markAllAsRead = async () => {
    try {
      const leadIds = notifications.map(n => n.leadId);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      setNotifications([]); // Clear local after marking read

      if (leadIds.length > 0) {
        if (isAdmin) {
          await supabase
            .from('mock')
            .update({ is_converted_read: true })
            .in('id', leadIds)
            .eq('status', 'Converted')
            .eq('is_converted_read', false)
            .gte('status_updated_at', twentyFourHoursAgo);
        } else {
          const {
            data: { user },
            error: userError
          } = await supabase.auth.getUser();

          if (userError) throw userError;

          await supabase
            .from('mock')
            .update({ reassigned: false })
            .in('id', leadIds)
            .eq('user_id', user.id)
            .eq('reassigned', true);
        }
      }
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const NotificationItem = ({ notification }) => {
    const isConversion = notification.type === 'conversion';

    return (
      <ListItem
        onClick={() => markAsRead(notification.id)}
        sx={{
          cursor: 'pointer',
          backgroundColor: !notification.read ? 'action.hover' : 'transparent',
          borderLeft: !notification.read ? '4px solid' : 'none',
          borderLeftColor: 'primary.main',
          '&:hover': {
            backgroundColor: 'action.selected'
          }
        }}
      >
        <ListItemIcon>
          <Avatar
            sx={{
              bgcolor: isConversion ? 'success.main' : 'info.main',
              width: 40,
              height: 40
            }}
          >
            {isConversion ? <CheckCircleIcon /> : <PersonAddIcon />}
          </Avatar>
        </ListItemIcon>

        <ListItemText
          primary={
            <Box>
              {isConversion ? (
                <Typography variant="body2" sx={{ color: '#0a3456' }}>
                  <strong>{notification.converterName}</strong> converted lead{' '}
                  <strong>{notification.leadName}</strong>
                </Typography>
              ) : (
                <Typography variant="body2" sx={{ color: '#0a3456' }}>
                  You have been assigned lead{' '}
                  <strong>{notification.leadName}</strong>
                </Typography>
              )}
            </Box>
          }
          secondary={
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Lead ID: {notification.leadId}
              </Typography>
              {notification.course && (
                <Chip
                  label={notification.course}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1, height: 20 }}
                />
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <AccessTimeIcon sx={{ fontSize: 12, mr: 0.5 }} />
                <Typography variant="caption" color="text.secondary">
                  {formatTimeAgo(notification.timestamp)}
                </Typography>
              </Box>
            </Box>
          }
        />

        {!notification.read && (
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              ml: 1
            }}
          />
        )}
      </ListItem>
    );
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '90vw', sm: '400px', md: '25vw' },
          minWidth: '320px'
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'grey.50'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NotificationsIcon color="primary" />
          <Typography variant="h6">
            {isAdmin ? 'Lead Conversions' : 'Your Notifications'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {notifications.length > 0 && unreadCount > 0 && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Button
            onClick={markAllAsRead}
            size="small"
            variant="text"
            color="primary"
          >
            Mark all as read
          </Button>
        </Box>
      )}

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              p: 4
            }}
          >
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
              color: 'text.secondary'
            }}
          >
            <NotificationsIcon sx={{ fontSize: 48, mb: 2, color: 'grey.300' }} />
            <Typography variant="body2" align="center">
              {isAdmin
                ? 'No recent conversions'
                : 'No new lead assignments'}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <NotificationItem notification={notification} />
                {index < notifications.length - 1 && <Divider component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'grey.50'
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          align="center"
          display="block"
        >
          {isAdmin
            ? 'Showing conversions from the last 24 hours'
            : 'Showing assignments from the last 24 hours'}
        </Typography>
      </Box>
    </Drawer>
  );
};

export default NotificationPanel;
