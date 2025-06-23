import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Alert, Box, Chip,
  Select, MenuItem, InputLabel, FormControl, CircularProgress
} from '@mui/material';
import { Email } from '@mui/icons-material';
import { supabase } from '../../supabaseClient';

const EmailDialog = ({ open, onClose, selectedRecipients = [] }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [emailType, setEmailType] = useState('custom');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [template, setTemplate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Replace with your actual Mailgun template names
  const availableTemplates = ['test', 'idip template - july batch', 'offer-july', 'webinar-invite'];

  useEffect(() => {
    if (open) {
      setSenderEmail('noreply@safetycatch.in');
      setSenderName('SafetyCatch');
    }
  }, [open]);

  useEffect(() => {
    if (open && emailType === 'template') {
      setTemplate(availableTemplates[0]);
    }
  }, [open, emailType]);

  const handleSend = async () => {
  if (!subject.trim()) return setError('Subject is required');
  if (!selectedRecipients.length) return setError('No recipients selected');
  if (!senderEmail.trim()) return setError('Sender email is required');
  if (emailType === 'custom' && !message.trim()) return setError('Message body is required');
  if (emailType === 'template' && !template.trim()) return setError('Template is required');

  setLoading(true);
  setError('');
  setSuccess('');

  try {
    const payload = {
      recipients: selectedRecipients.map(lead => ({
        email: lead.Email,
        name: lead.Name || '',
        variables: {
          name: lead.Name || '',
          phone: lead.Phone || '',
          course: lead.next_course || '',
        }
      })),
      subject,
      emailType,
      senderEmail: senderEmail.trim(),
      senderName: senderName.trim(),
      ...(emailType === 'custom' && { customContent: { text: message } }),
      ...(emailType === 'template' && {
        templateData: {
          templateName: template,
          templateVersion: 'active',
        }
      })
    };

    const res = await supabase.functions.invoke('send-bulk-email', {
      body: payload
    });

    // Always check res.error first
    if (res.error) {
      throw new Error(res.error.message || 'Function invocation failed');
    }

    const result = res.data;

    if (!result?.success) {
      throw new Error(result?.error || 'Email delivery failed');
    }

    setSuccess(`✅ Sent email to ${result.recipients_count} recipients.`);
    setTimeout(() => handleClose(), 2000);

  } catch (err) {
    console.error('Send failed:', err);
    setError(err?.message || 'Unexpected error occurred');
  } finally {
    setLoading(false);
  }
};


  const handleClose = () => {
    if (!loading) {
      setSubject('');
      setMessage('');
      setEmailType('custom');
      setTemplate('');
      setError('');
      setSuccess('');
      setSenderEmail('');
      setSenderName('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Email /> Send Bulk Email
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="subtitle2" gutterBottom>
          Sending to {selectedRecipients.length} lead(s):
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {selectedRecipients.slice(0, 5).map(lead => (
            <Chip key={lead.id} label={lead.Name || lead.Email} />
          ))}
          {selectedRecipients.length > 5 && (
            <Chip label={`+${selectedRecipients.length - 5} more`} />
          )}
        </Box>

        <TextField
          label="Sender Name"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          label="Sender Email"
          value={senderEmail}
          onChange={(e) => setSenderEmail(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Email Type</InputLabel>
          <Select
            value={emailType}
            onChange={(e) => setEmailType(e.target.value)}
            label="Email Type"
          >
            <MenuItem value="custom">Plain Text</MenuItem>
            <MenuItem value="template">Visual Builder Template</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        {emailType === 'custom' && (
          <TextField
            label="Message Body"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            multiline
            rows={6}
            fullWidth
            placeholder="Write your message here..."
            sx={{ mb: 2 }}
          />
        )}

        {emailType === 'custom' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Pro Tip: Variables like <code>{'{{name}}'}</code> will be substituted for Personalised Messages.
          </Alert>
        )}

        {emailType === 'template' && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Template</InputLabel>
            <Select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              label="Select Template"
            >
              {availableTemplates.map(tpl => (
                <MenuItem key={tpl} value={tpl}>{tpl}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {emailType === 'template' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            This will use the selected <strong>{template}</strong> template created in Template Builder.
            Previews are not available, but variables like <code>{'{{name}}'}</code> will be substituted.
          </Alert>
        )}

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button
          onClick={handleSend}
          variant="contained"
          disabled={loading || !subject.trim() || !senderEmail.trim() ||
            (emailType === 'custom' && !message.trim()) ||
            (emailType === 'template' && !template.trim())}
        >
          {loading ? <CircularProgress size={20} /> : `Send to ${selectedRecipients.length}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailDialog;
