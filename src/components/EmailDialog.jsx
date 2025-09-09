import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Alert, Box, Chip,
  Select, MenuItem, InputLabel, FormControl, CircularProgress,
  IconButton, List, ListItem, ListItemText, ListItemSecondaryAction
} from '@mui/material';
import { Email, AttachFile, Delete, CloudUpload } from '@mui/icons-material';
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
  const [attachments, setAttachments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Mailgun template names
  const availableTemplates = ['idip template - july batch', 'igc', 'welcome', 'follow up - idip', 'follow up - igc'];

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

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    // Validate file size (10MB limit per file)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      setError(`Files too large: ${oversizedFiles.map(f => f.name).join(', ')}. Maximum size is 10MB per file.`);
      return;
    }

    // Validate total attachment size (25MB limit)
    const currentSize = attachments.reduce((sum, att) => sum + att.size, 0);
    const newSize = files.reduce((sum, file) => sum + file.size, 0);
    if (currentSize + newSize > 25 * 1024 * 1024) {
      setError('Total attachment size cannot exceed 25MB.');
      return;
    }

    setUploadingFiles(true);
    setError('');

    try {
      const uploadPromises = files.map(async (file) => {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `email-attachments/${fileName}`;

        // Upload to Supabase storage
        const { data, error: uploadError } = await supabase.storage
          .from('attachments') // Make sure this bucket exists in your Supabase storage
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('attachments')
          .getPublicUrl(filePath);

        return {
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: publicUrl,
          path: filePath
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      setAttachments(prev => [...prev, ...uploadedFiles]);
      
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.message || 'Failed to upload attachments');
    } finally {
      setUploadingFiles(false);
      // Clear the input
      event.target.value = '';
    }
  };

  const removeAttachment = async (attachment) => {
    try {
      // Delete from Supabase storage
      const { error: deleteError } = await supabase.storage
        .from('attachments')
        .remove([attachment.path]);

      if (deleteError) {
        console.error('Failed to delete file from storage:', deleteError);
      }

      // Remove from state
      setAttachments(prev => prev.filter(att => att.id !== attachment.id));
    } catch (err) {
      console.error('Error removing attachment:', err);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
        attachments: attachments.map(att => ({
          filename: att.name,
          url: att.url,
          contentType: att.type
        })),
        ...(emailType === 'custom' && { customContent: { text: message } }),
        ...(emailType === 'template' && {
          templateData: {
            templateName: template,
            templateVersion: 'active',
          }
        })
      };

      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        setError("You must be logged in to send emails.");
        return;
      }

      const accessToken = session.access_token;

      const res = await supabase.functions.invoke('send-bulk-email', {
        body: payload,
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
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
      setAttachments([]);
      onClose();
    }
  };

  const totalAttachmentSize = attachments.reduce((sum, att) => sum + att.size, 0);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
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

        {/* Attachments Section */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachFile fontSize="small" />
            Attachments ({formatFileSize(totalAttachmentSize)} / 25MB)
          </Typography>
          
          <input
            accept="*/*"
            style={{ display: 'none' }}
            id="attachment-upload"
            multiple
            type="file"
            onChange={handleFileUpload}
            disabled={uploadingFiles}
          />
          <label htmlFor="attachment-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={uploadingFiles ? <CircularProgress size={16} /> : <CloudUpload />}
              disabled={uploadingFiles || totalAttachmentSize >= 25 * 1024 * 1024}
              sx={{ mb: 1 }}
            >
              {uploadingFiles ? 'Uploading...' : 'Add Attachments'}
            </Button>
          </label>

          {attachments.length > 0 && (
            <List dense>
              {attachments.map((attachment) => (
                <ListItem key={attachment.id} sx={{ pl: 0 }}>
                  <ListItemText
                    primary={attachment.name}
                    secondary={`${formatFileSize(attachment.size)} • ${attachment.type || 'Unknown type'}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => removeAttachment(attachment)}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}

          <Alert severity="info" sx={{ mt: 1 }}>
            Maximum 10MB per file, 25MB total. Files are temporarily stored and will be deleted after sending.
          </Alert>
        </Box>

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
            (emailType === 'template' && !template.trim()) ||
            uploadingFiles}
        >
          {loading ? <CircularProgress size={20} /> : `Send to ${selectedRecipients.length}`}
          {attachments.length > 0 && ` (${attachments.length} files)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailDialog;