// components/WhatsAppDialog.jsx
import React, { useState } from 'react';
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
  Chip
} from '@mui/material';
import {
  CloudUpload,
  Close,
  Image as ImageIcon,
  WhatsApp,
  Person
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
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleSend = async () => {
    if (!message.trim()) {
      setError('Please enter a message');
      return;
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
      
      // Upload image if selected
      if (imageFile) {
        imageUrl = await uploadImageToSupabase(imageFile);
      }

      // Send messages to all selected leads
      const results = [];
      for (let lead of selectedLeads) {
        const phone = lead.Phone;
        const name = lead.Name;

        // Personalize message
        const personalizedMessage = message.replace(/\{name\}/g, name);

        try {
          const response = await sendWhatsAppMessage(phone, personalizedMessage, imageUrl);
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
    if (!sending && !uploading) {
      setMessage('');
      setImageFile(null);
      setImagePreview(null);
      setError('');
      setSuccess('');
      setUploadProgress(0);
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={sending || uploading}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WhatsApp color="success" />
        Send WhatsApp Message
        <IconButton
          aria-label="close"
          onClick={handleClose}
          disabled={sending || uploading}
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
          disabled={sending || uploading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSend}
          variant="contained"
          color="success"
          disabled={sending || uploading || !message.trim()}
          startIcon={sending ? null : <WhatsApp />}
        >
          {sending ? 'Sending...' : `Send to ${selectedLeads.length} Lead(s)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WhatsAppDialog;