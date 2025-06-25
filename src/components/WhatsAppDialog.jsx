// components/WhatsAppDialog.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  LinearProgress,
  Alert,
  IconButton,
  Avatar,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  CloudUpload,
  Close,
  Image as ImageIcon,
  WhatsApp,
  Person,
  Description as Template,
  Message,
  ExpandMore,
  Refresh
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { supabase } from '../../supabaseClient'; // adjust path
import { sendWhatsAppMessage } from './SendMessage'; // adjust path

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const WhatsAppDialog = ({ open, onClose, selectedLeads = [] }) => {
  // Message/Template Mode
  const [messageMode, setMessageMode] = useState(0); // 0: Custom Message, 1: Template

  // Custom Message States
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Template States
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templateVariables, setTemplateVariables] = useState({});
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Common States
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch templates from Twilio edge function
  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    setError('');
    
    try {
      const { data, error } = await supabase.functions.invoke('get-templates');
      
      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      
      console.log('Full response from edge function:', data);
      
      if (data?.templates) {
        setTemplates(data.templates);
        console.log('Fetched templates:', data.templates);
        console.log('Debug info:', data.debug);
        
        if (data.templates.length === 0) {
          setError(`No WhatsApp templates found. Debug: ${JSON.stringify(data.debug || {})}`);
        }
      } else {
        setError('No templates found in response');
        console.log('No templates in response:', data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setError('Failed to fetch templates: ' + error.message);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Load templates when dialog opens and template tab is selected
  useEffect(() => {
    if (open && messageMode === 1 && templates.length === 0) {
      fetchTemplates();
    }
  }, [open, messageMode]);

  const handleModeChange = (event, newValue) => {
    setMessageMode(newValue);
    setError('');
    setSuccess('');
    
    // Reset form states when switching modes
    if (newValue === 0) {
      // Switching to custom message
      setSelectedTemplate('');
      setTemplateVariables({});
    } else {
      // Switching to template mode
      setMessage('');
      setImageFile(null);
      setImagePreview(null);
      if (templates.length === 0) {
        fetchTemplates();
      }
    }
  };

  const handleTemplateSelect = (templateSid) => {
    const template = templates.find(t => t.sid === templateSid);
    setSelectedTemplate(templateSid);
    
    // Reset template variables
    const variables = {};
    if (template?.variables) {
      template.variables.forEach((variable, index) => {
        variables[variable] = '';
      });
    }
    setTemplateVariables(variables);
  };

  const handleTemplateVariableChange = (variable, value) => {
    setTemplateVariables(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setImageFile(file);
      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setUploadProgress(0);
  };

  const uploadImageToSupabase = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `whatsapp-images/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const { data, error } = await supabase.storage
        .from('images') // Replace with your bucket name
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      setUploadProgress(100);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

const sendTemplateMessage = async (phone, templateSid, variables = {}) => {
  try {
    console.log('Sending template message:', { phone, templateSid, variables });
    
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    
    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: {
        to: formattedPhone,
        templateSid: templateSid,
        variables: variables
      }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message || 'Unknown error occurred');
    }
    
    console.log('Message sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to send template message:', error);
    throw new Error(`Failed to send template message: ${error.message}`);
  }
};

// Example usage:
// await sendTemplateMessage('+1234567890', 'HX...', { '1': 'John', '2': 'Doe' });

  const handleSend = async () => {
    if (messageMode === 0) {
      // Custom message validation
      if (!message.trim()) {
        setError('Please enter a message');
        return;
      }
    } else {
      // Template validation
      if (!selectedTemplate) {
        setError('Please select a template');
        return;
      }
      
      const template = templates.find(t => t.sid === selectedTemplate);
      if (template?.variables) {
        const missingVariables = template.variables.filter(variable => 
          !templateVariables[variable]?.trim()
        );
        if (missingVariables.length > 0) {
          setError(`Please fill in all template variables: ${missingVariables.join(', ')}`);
          return;
        }
      }
    }

    if (selectedLeads.length === 0) {
      setError('No leads selected');
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');

    try {
      let imageUrl = null;
      
      // Upload image if selected (only for custom messages)
      if (messageMode === 0 && imageFile) {
        imageUrl = await uploadImageToSupabase(imageFile);
      }

      // Send messages to all selected leads
      const results = [];
      for (let lead of selectedLeads) {
        const phone = lead.Phone;
        const name = lead.Name;

        try {
          let response;
          
          if (messageMode === 0) {
            // Send custom message
            const personalizedMessage = message.replace(/\{name\}/g, name);
            response = await sendWhatsAppMessage(phone, personalizedMessage, imageUrl);
          } else {
            // Send template message
            const template = templates.find(t => t.sid === selectedTemplate);
            const personalizedVariables = { ...templateVariables };
            
            // Replace {name} in template variables with actual name
            Object.keys(personalizedVariables).forEach(key => {
              personalizedVariables[key] = personalizedVariables[key].replace(/\{name\}/g, name);
            });
            
            response = await sendTemplateMessage(phone, selectedTemplate, personalizedVariables);
          }
          
          results.push({ success: true, name, response });
          console.log(`✅ Sent to ${name}:`, response);
        } catch (error) {
          results.push({ success: false, name, error: error.message });
          console.error(`❌ Failed to send to ${name}:`, error);
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;
      
      setSuccess(`Messages sent successfully to ${successCount} leads${failCount > 0 ? `, failed for ${failCount} leads` : ''}`);
      
      // Reset form after successful send
      if (successCount > 0) {
        setTimeout(() => {
          handleClose();
        }, 2000);
      }

    } catch (error) {
      setError('Failed to send messages: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending && !uploading && !loadingTemplates) {
      setMessage('');
      setImageFile(null);
      setImagePreview(null);
      setSelectedTemplate('');
      setTemplateVariables({});
      setError('');
      setSuccess('');
      setUploadProgress(0);
      setMessageMode(0);
      onClose();
    }
  };

  const selectedTemplateData = templates.find(t => t.sid === selectedTemplate);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={sending || uploading || loadingTemplates}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WhatsApp color="success" />
        Send WhatsApp Message
        <IconButton
          aria-label="close"
          onClick={handleClose}
          disabled={sending || uploading || loadingTemplates}
          sx={{ ml: 'auto' }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Selected Leads Preview */}
        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            Sending to {selectedLeads.length} lead(s):
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedLeads.slice(0, 5).map((lead) => (
              <Chip
                key={lead.id}
                icon={<Person />}
                label={lead.Name}
                variant="outlined"
                size="small"
              />
            ))}
            {selectedLeads.length > 5 && (
              <Chip label={`+${selectedLeads.length - 5} more`} size="small" />
            )}
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Mode Selection Tabs */}
        <Tabs 
          value={messageMode} 
          onChange={handleModeChange} 
          sx={{ mb: 3 }}
          disabled={sending || uploading || loadingTemplates}
        >
          <Tab 
            icon={<Message />} 
            label="Custom Message" 
            iconPosition="start"
          />
          <Tab 
            icon={<Template />} 
            label="Template Message" 
            iconPosition="start"
          />
        </Tabs>

        {/* Custom Message Mode */}
        {messageMode === 0 && (
          <>
            {/* Image Upload Section */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ImageIcon />
                  Attach Image (Optional)
                </Typography>
                
                {!imagePreview ? (
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    disabled={uploading || sending}
                    fullWidth
                    sx={{ py: 2 }}
                  >
                    Choose Image (Max 5MB)
                    <VisuallyHiddenInput
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                  </Button>
                ) : (
                  <Box>
                    <Box sx={{ position: 'relative', display: 'inline-block' }}>
                      <Avatar
                        src={imagePreview}
                        variant="rounded"
                        sx={{ width: 120, height: 120 }}
                      />
                      <IconButton
                        size="small"
                        onClick={removeImage}
                        disabled={uploading || sending}
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          bgcolor: 'background.paper',
                          border: 1,
                          borderColor: 'divider'
                        }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {imageFile?.name}
                    </Typography>
                  </Box>
                )}

                {uploading && (
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress variant="determinate" value={uploadProgress} />
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                      Uploading... {uploadProgress}%
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Message Input */}
            <TextField
              autoFocus
              label="Message"
              multiline
              rows={4}
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here... Use {name} to personalize with lead's name"
              disabled={sending || uploading}
              sx={{ mb: 2 }}
            />

            <Typography variant="caption" color="text.secondary">
              💡 Tip: Use {'{name}'} in your message to automatically insert each lead's name
            </Typography>
          </>
        )}

        {/* Template Message Mode */}
        {messageMode === 1 && (
          <>
            {/* Template Selection */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <FormControl fullWidth disabled={loadingTemplates || sending}>
                  <InputLabel>Select Template</InputLabel>
                  <Select
                    value={selectedTemplate}
                    label="Select Template"
                    onChange={(e) => handleTemplateSelect(e.target.value)}
                  >
                    {templates.length === 0 ? (
                      <MenuItem disabled>
                        {loadingTemplates ? 'Loading templates...' : 'No templates available'}
                      </MenuItem>
                    ) : (
                      templates.map((template) => (
                        <MenuItem key={template.sid} value={template.sid}>
                          {template.friendlyName || template.sid}
                          {template.status && (
                            <Chip 
                              label={template.status} 
                              size="small" 
                              sx={{ ml: 1 }}
                              color={template.status === 'approved' ? 'success' : 'default'}
                            />
                          )}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
                <IconButton 
                  onClick={fetchTemplates} 
                  disabled={loadingTemplates || sending}
                  title="Refresh Templates"
                >
                  <Refresh />
                </IconButton>
              </Box>

              {loadingTemplates && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress sx={{ flexGrow: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Loading templates...
                  </Typography>
                </Box>
              )}

              {!loadingTemplates && templates.length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    No WhatsApp templates found in your Twilio account. 
                    <br />
                    Make sure you have created and approved WhatsApp message templates in your Twilio Console.
                  </Typography>
                </Alert>
              )}
            </Box>

            {/* Template Preview and Variables */}
            {selectedTemplateData && (
              <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Template: {selectedTemplateData.friendlyName}
                  </Typography>
                  
                  {/* Template Body Preview */}
                  {selectedTemplateData.body && (
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="subtitle2">Template Preview</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            bgcolor: 'grey.50', 
                            p: 2, 
                            borderRadius: 1,
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap'
                          }}
                        >
                          {selectedTemplateData.body}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {/* Template Variables */}
                  {selectedTemplateData.variables && selectedTemplateData.variables.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Template Variables:
                      </Typography>
                      {selectedTemplateData.variables.map((variable, index) => (
                        <TextField
                          key={variable}
                          label={`Variable: ${variable}`}
                          fullWidth
                          value={templateVariables[variable] || ''}
                          onChange={(e) => handleTemplateVariableChange(variable, e.target.value)}
                          placeholder={`Enter value for ${variable}... Use {name} for lead's name`}
                          disabled={sending}
                          sx={{ mb: 2 }}
                        />
                      ))}
                      <Typography variant="caption" color="text.secondary">
                        💡 Tip: Use {'{name}'} in template variables to insert each lead's name
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Status Messages */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button 
          onClick={handleClose} 
          disabled={sending || uploading || loadingTemplates}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSend}
          variant="contained"
          color="success"
          disabled={
            sending || 
            uploading || 
            loadingTemplates ||
            (messageMode === 0 && !message.trim()) ||
            (messageMode === 1 && !selectedTemplate)
          }
          startIcon={sending ? null : <WhatsApp />}
        >
          {sending 
            ? 'Sending...' 
            : `Send ${messageMode === 0 ? 'Message' : 'Template'} to ${selectedLeads.length} Lead(s)`
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WhatsAppDialog;