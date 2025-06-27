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
  
  Close,
  
  WhatsApp,
  Person,
  Description as Template,
  
  ExpandMore,
  Refresh
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { supabase } from '../../supabaseClient'; // adjust path


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
  // Template Mode
 const SHOW_TEMPLATES = ['welcome','idip','_welcome_image'];

  

 

  // Template States
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templateVariables, setTemplateVariables] = useState({});
  const [loadingTemplates, setLoadingTemplates] = useState(false);

// Common States
const [sending, setSending] = useState(false);

const [error, setError] = useState('');
const [success, setSuccess] = useState('');

  // Fetch templates from Twilio edge function
// Updated fetchTemplates function in WhatsAppDialog.jsx
const fetchTemplates = async () => {
  setLoadingTemplates(true);
  setError('');
  
  try {
    const { data, error } = await supabase.functions.invoke('get-templates', {
      method: 'GET'
    });
    
    if (error) {
      console.error('Supabase function error:', error);
      throw error;
    }
    
    console.log('Full response from edge function:', data);
    
if (data?.templates && Array.isArray(data.templates)) {
  // Filter templates to only show those that EXACTLY match names in SHOW_TEMPLATES array
  const filteredTemplates = data.templates.filter(template => {
    const templateName = (template.friendlyName || template.sid || '').toLowerCase().trim();
    
    // Strict exact match - template name must be exactly one of the allowed names
    return SHOW_TEMPLATES.includes(templateName) || 
           SHOW_TEMPLATES.includes(template.friendlyName) ||
           SHOW_TEMPLATES.includes(template.sid);
  });

  setTemplates(filteredTemplates);

  // Debug: Show what template names were found vs what we're looking for
  console.log('Available template names:', data.templates.map(t => t.friendlyName || t.sid));
  console.log('Looking for strict exact matches:', SHOW_TEMPLATES);

  if (filteredTemplates.length === 0) {
    setError(`No templates found with exact names: ${SHOW_TEMPLATES.join(', ')}. Available templates: ${data.templates.map(t => t.friendlyName || t.sid).join(', ')}`);
  }

  console.log('All templates from Twilio:', data.templates);
  console.log('Filtered templates to show:', filteredTemplates);
  console.log('Templates allowed to show:', SHOW_TEMPLATES);

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
  if (open && templates.length === 0) {
    fetchTemplates();
  }
}, [open]);

  

  const handleTemplateSelect = (templateSid) => {
    const template = templates.find(t => t.sid === templateSid);
    setSelectedTemplate(templateSid);
    
    // Reset template variables
    const variables = {};
    if (template?.variables && Array.isArray(template.variables)) {
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





// Fixed sendTemplateMessage function in WhatsAppDialog.jsx
const sendTemplateMessage = async (phone, templateSid, variables = {}) => {
  try {
    console.log('Sending template message:', { phone, templateSid, variables });
    
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    
    // FIX: Change parameter names to match the function expectation
    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: {
        to: formattedPhone,
        contentSid: templateSid,        // Changed from templateSid
        contentVariables: variables     // Changed from variables
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
    // Template validation
if (!selectedTemplate) {
  setError('Please select a template');
  return;
}

const template = templates.find(t => t.sid === selectedTemplate);
if (template?.variables && Array.isArray(template.variables)) {
  const missingVariables = template.variables.filter(variable => 
    !templateVariables[variable]?.trim()
  );
  if (missingVariables.length > 0) {
    setError(`Please fill in all template variables: ${missingVariables.join(', ')}`);
    return;
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

      // Send messages to all selected leads
      const results = [];
      for (let lead of selectedLeads) {
        const phone = lead.Phone;
        const name = lead.Name;

        try {
  // Send template message
  const template = templates.find(t => t.sid === selectedTemplate);
  const personalizedVariables = { ...templateVariables };
  
  // Replace {name} in template variables with actual name
  Object.keys(personalizedVariables).forEach(key => {
    personalizedVariables[key] = personalizedVariables[key].replace(/\{name\}/g, name);
  });
  
  const response = await sendTemplateMessage(phone, selectedTemplate, personalizedVariables);
          
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
    if (!sending && !loadingTemplates) {
     setSelectedTemplate('');
setTemplateVariables({});
setError('');
setSuccess('');
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
    disableEscapeKeyDown={sending || loadingTemplates}
  >
    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <WhatsApp color="success" />
      Send WhatsApp Template
      <IconButton
        aria-label="close"
        onClick={handleClose}
        disabled={sending || loadingTemplates}
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
          templates.map((template) => {
            const status =
              template?.types?.whatsapp?.approval_status ||
              template?.raw?.types?.["twilio/quick-reply"]?.approval_status ||
              template?.approvalStatus ||
              null;

            return (
              <MenuItem key={template.sid} value={template.sid}>
                <Box>
                  <Typography variant="body1">
                    {template.friendlyName || template.sid}
                  </Typography>
                  {status && (
                    <Chip
                      label={status}
                      size="small"
                      sx={{ ml: 1 }}
                      color={status === 'approved' ? 'success' : 'default'}
                    />
                  )}
                </Box>
              </MenuItem>
            );
          })
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
        No templates found matching: <strong>{SHOW_TEMPLATES.join(', ')}</strong><br />
        Make sure your Twilio templates have these names and are approved.
      </Typography>
    </Alert>
  )}

  {/* Debug info */}
  {!loadingTemplates && (
    <Typography variant="caption" color="text.secondary">
      Showing Only Approved Templates.
    </Typography>
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
                  💡 Tip: USE ONLY 'welcome' for NOW!
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
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
        disabled={sending || loadingTemplates}
      >
        Cancel
      </Button>
      <Button
        onClick={handleSend}
        variant="contained"
        color="success"
        disabled={
          sending || 
          loadingTemplates ||
          !selectedTemplate
        }
        startIcon={sending ? null : <WhatsApp />}
      >
        {sending 
          ? 'Sending...' 
          : `Send Template to ${selectedLeads.length} Lead(s)`
        }
      </Button>
    </DialogActions>
  </Dialog>
);
};

export default WhatsAppDialog;