import { 
  Box, 
  Typography, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Alert,
  Snackbar,
  useTheme,
  Card,
  CardContent,
  Chip,
  IconButton,
  Divider
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useState, useEffect } from "react";
import { 
  Refresh as RefreshIcon,
  AccountBalance as AccountBalanceIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon
} from "@mui/icons-material";
import Header from "../../components/Header";
import LoadingComponent from "../../loading/LoadingComponent";
import { supabase } from "../../../supabaseClient";
import { useQueryClient } from "@tanstack/react-query";

const AccountantSection = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  
  // Brand colors
  const brandColors = {
    primary: '#0a3456',
    secondary: '#3196c9',
    primaryLight: '#1a4a70',
    secondaryLight: '#4db3e6',
    primaryDark: '#062740',
    secondaryDark: '#2685b8',
    background: '#f8fafc',
    cardBackground: '#ffffff',
    textPrimary: '#0a3456',
    textSecondary: '#64748b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };
  
  // State management
  const [kbRequestLeads, setKbRequestLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [kbDialogOpen, setKbDialogOpen] = useState(false);
  const [kbNumber, setKbNumber] = useState('');
  const [courseName, setCourseName] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Alert states
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [validationError, setValidationError] = useState('');

  // Fetch leads with KB Requested status
  const fetchKBRequestLeads = async () => {
    setIsLoading(true);
    try {
      const { data: leads, error: leadsError } = await supabase
        .from('mock')
        .select('id, Name, Phone, Email, status, timestamp')
        .eq('status', 'KB Requested')
        .order('timestamp', { ascending: false });

      if (leadsError) throw leadsError;

      // Get KB numbers for these leads to show conversion history
      const leadIds = leads.map(lead => lead.id);
      const { data: kbData, error: kbError } = await supabase
        .from('kb_numbers')
        .select('lead_id, kb_number, course_name, amount, created_at')
        .in('lead_id', leadIds)
        .order('created_at', { ascending: false });

      if (kbError) throw kbError;

      // Combine data
      const enrichedLeads = leads.map(lead => ({
        ...lead,
        kbHistory: kbData.filter(kb => kb.lead_id === lead.id),
        lastKbNumber: kbData.find(kb => kb.lead_id === lead.id)?.kb_number || null
      }));

      setKbRequestLeads(enrichedLeads);
    } catch (error) {
      console.error('Error fetching KB request leads:', error);
      showAlert('error', 'Failed to fetch leads');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKBRequestLeads();
  }, []);

  // Validate KB number
  const validateKbNumber = async (leadId, kbNumber) => {
    if (!kbNumber.trim()) {
      return 'KB number is required';
    }

    try {
      // Check if KB number exists for different lead
      const { data: existingKb, error } = await supabase
        .from('kb_numbers')
        .select('lead_id, kb_number')
        .eq('kb_number', kbNumber.trim());

      if (error) throw error;

      if (existingKb && existingKb.length > 0) {
        const differentLeadKb = existingKb.find(kb => kb.lead_id !== leadId);
        if (differentLeadKb) {
          return `KB number ${kbNumber} already exists for different lead (ID: ${differentLeadKb.lead_id})`;
        }

        // Check if it matches the last KB number for this lead
        const sameLeadKb = existingKb.find(kb => kb.lead_id === leadId);
        if (sameLeadKb) {
          const lead = kbRequestLeads.find(l => l.id === leadId);
          if (lead && lead.lastKbNumber && lead.lastKbNumber !== kbNumber) {
            return `KB number doesn't match with the last entered KB number (${lead.lastKbNumber}) for this lead`;
          }
        }
      }

      return null; // No validation error
    } catch (error) {
      console.error('Error validating KB number:', error);
      return 'Error validating KB number';
    }
  };

  // Handle KB number submission
  const handleKbSubmit = async () => {
    if (!selectedLead || !kbNumber.trim()) {
      setValidationError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setValidationError('');

    try {
      // Validate KB number
      const validationError = await validateKbNumber(selectedLead.id, kbNumber.trim());
      if (validationError) {
        setValidationError(validationError);
        setIsSubmitting(false);
        return;
      }

      // Insert KB number record
      const { error: kbError } = await supabase
        .from('kb_numbers')
        .insert({
          lead_id: selectedLead.id,
          kb_number: kbNumber.trim(),
          course_name: courseName.trim() || null,
          amount: amount ? parseFloat(amount) : null
        });

      if (kbError) throw kbError;

      // Update lead status to Converted
      const { error: statusError } = await supabase
        .from('mock')
        .update({ status: 'Converted' })
        .eq('id', selectedLead.id);

      if (statusError) throw statusError;

      // Success - close dialog and refresh data
      setKbDialogOpen(false);
      resetForm();
      await fetchKBRequestLeads();
      showAlert('success', `Lead ${selectedLead.Name} successfully converted with KB number ${kbNumber.trim()}`);

      // Invalidate leads query cache if using react-query
      queryClient.invalidateQueries(['mock']);

    } catch (error) {
      console.error('Error processing KB number:', error);
      showAlert('error', 'Failed to process KB number');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedLead(null);
    setKbNumber('');
    setCourseName('');
    setAmount('');
    setValidationError('');
  };

  // Show alert
  const showAlert = (type, message) => {
    setAlert({ open: true, type, message });
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setKbDialogOpen(false);
    resetForm();
  };

  // Handle convert button click
  const handleConvertClick = (lead) => {
    setSelectedLead(lead);
    setKbDialogOpen(true);
  };

  // DataGrid columns with custom styling
  const columns = [
    { 
      field: "id", 
      headerName: "Lead ID", 
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            backgroundColor: brandColors.primaryLight,
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.75rem'
          }}
        />
      )
    },
    { 
      field: "Name", 
      headerName: "Lead Name", 
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 600,
            color: brandColors.textPrimary
          }}
        >
          {params.value}
        </Typography>
      )
    },
    { 
      field: "Phone", 
      headerName: "Phone", 
      flex: 1,
      minWidth: 130,
      renderCell: (params) => (
        <Typography 
          variant="body2" 
          sx={{ color: brandColors.textSecondary }}
        >
          {params.value}
        </Typography>
      )
    },
    { 
      field: "Email", 
      headerName: "Email", 
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Typography 
          variant="body2" 
          sx={{ color: brandColors.textSecondary }}
        >
          {params.value}
        </Typography>
      )
    },
    { 
      field: "timestamp", 
      headerName: "Request Date", 
      flex: 1,
      minWidth: 150,
      valueFormatter: (value) => {
        const date = new Date(value);
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      },
      renderCell: (params) => (
        <Typography 
          variant="body2" 
          sx={{ color: brandColors.textSecondary }}
        >
          {params.formattedValue}
        </Typography>
      )
    },
    {
      field: "lastKbNumber",
      headerName: "Last KB Number",
      width: 150,
      renderCell: (params) => (
        params.value ? (
          <Chip
            label={params.value}
            size="small"
            sx={{
              backgroundColor: brandColors.success,
              color: 'white',
              fontSize: '0.75rem'
            }}
          />
        ) : (
          <Typography 
            variant="body2" 
            sx={{ 
              color: brandColors.textSecondary,
              fontStyle: 'italic'
            }}
          >
            None
          </Typography>
        )
      )
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          onClick={() => handleConvertClick(params.row)}
          sx={{ 
            fontSize: '0.75rem',
            px: 2,
            py: 0.5,
            backgroundColor: brandColors.secondary,
            color: 'white',
            fontWeight: 600,
            boxShadow: '0 2px 4px rgba(49, 150, 201, 0.2)',
            '&:hover': {
              backgroundColor: brandColors.secondaryDark,
              boxShadow: '0 4px 8px rgba(49, 150, 201, 0.3)'
            }
          }}
        >
          Convert
        </Button>
      )
    }
  ];

  if (isLoading) {
    return <LoadingComponent />;
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: brandColors.background,
      p: 3
    }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <AccountBalanceIcon 
            sx={{ 
              fontSize: 32, 
              color: brandColors.primary, 
              mr: 2 
            }} 
          />
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              color: brandColors.primary,
              fontSize: '2rem'
            }}
          >
            ACCOUNTANT SECTION
          </Typography>
        </Box>
        <Typography 
          variant="h6" 
          sx={{ 
            color: brandColors.textSecondary,
            fontWeight: 400,
            ml: 6
          }}
        >
          Manage KB numbers and convert leads
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        gap: 3,
        mb: 4
      }}>
        <Card 
          elevation={0}
          sx={{ 
            backgroundColor: brandColors.cardBackground,
            border: `1px solid ${brandColors.secondary}20`,
            borderRadius: 3,
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 700, 
                    color: brandColors.primary,
                    mb: 1
                  }}
                >
                  {kbRequestLeads.length}
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: brandColors.textSecondary,
                    fontWeight: 500
                  }}
                >
                  Pending KB Requests
                </Typography>
              </Box>
              <Box 
                sx={{
                  backgroundColor: brandColors.secondary,
                  borderRadius: 2,
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <AssignmentIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card 
          elevation={0}
          sx={{ 
            backgroundColor: brandColors.cardBackground,
            border: `1px solid ${brandColors.success}20`,
            borderRadius: 3
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 700, 
                    color: brandColors.success,
                    mb: 1
                  }}
                >
                  {kbRequestLeads.filter(lead => lead.lastKbNumber).length}
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: brandColors.textSecondary,
                    fontWeight: 500
                  }}
                >
                  With KB Numbers
                </Typography>
              </Box>
              <Box 
                sx={{
                  backgroundColor: brandColors.success,
                  borderRadius: 2,
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <TrendingUpIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card 
          elevation={0}
          sx={{ 
            backgroundColor: brandColors.cardBackground,
            border: `1px solid ${brandColors.primary}20`,
            borderRadius: 3
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: brandColors.textSecondary,
                    fontWeight: 500,
                    mb: 2
                  }}
                >
                  Quick Actions
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchKBRequestLeads}
                  size="small"
                  sx={{ 
                    borderColor: brandColors.primary,
                    color: brandColors.primary,
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: brandColors.primaryDark,
                      backgroundColor: `${brandColors.primary}08`
                    }
                  }}
                >
                  Refresh Data
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* DataGrid Section */}
      <Card 
        elevation={0}
        sx={{ 
          backgroundColor: brandColors.cardBackground,
          borderRadius: 3,
          border: `1px solid ${brandColors.primary}10`,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ 
          p: 3,
          borderBottom: `1px solid ${brandColors.primary}10`
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              color: brandColors.primary,
              mb: 1
            }}
          >
            KB Request Queue
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ color: brandColors.textSecondary }}
          >
            Review and process leads requesting KB numbers
          </Typography>
        </Box>
        
        <Box sx={{ 
          height: 600,
          '& .MuiDataGrid-root': {
            border: 'none',
            fontFamily: 'inherit'
          },
          '& .MuiDataGrid-cell': {
            borderBottom: `1px solid ${brandColors.primary}08`,
            py: 2
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: brandColors.primary,
            borderBottom: 'none',
            '& .MuiDataGrid-columnHeader': {
              backgroundColor: brandColors.primary,
              '& .MuiDataGrid-columnHeaderTitle': {
                color: 'white',
                fontWeight: 600,
                fontSize: '0.875rem'
              }
            },
            '& .MuiDataGrid-columnSeparator': {
              color: 'white'
            },
            '& .MuiDataGrid-iconButtonContainer': {
              color: 'white'
            },
            '& .MuiDataGrid-sortIcon': {
              color: 'white'
            }
          },
          '& .MuiDataGrid-virtualScroller': {
            backgroundColor: brandColors.cardBackground,
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: `1px solid ${brandColors.primary}10`,
            backgroundColor: brandColors.background,
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: `${brandColors.secondary}08`
          }
        }}>
          <DataGrid
            rows={kbRequestLeads}
            columns={columns}
            pageSize={25}
            rowsPerPageOptions={[25, 50, 100]}
            disableSelectionOnClick
            getRowId={(row) => row.id}
          />
        </Box>
      </Card>

      {/* KB Number Dialog */}
      <Dialog 
        open={kbDialogOpen} 
        onClose={handleDialogClose}
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: `1px solid ${brandColors.primary}20`
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            backgroundColor: brandColors.primary,
            color: 'white',
            fontWeight: 600,
            fontSize: '1.25rem'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AssignmentIcon sx={{ mr: 2 }} />
            Convert Lead: {selectedLead?.Name}
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: brandColors.textSecondary,
                backgroundColor: brandColors.background,
                p: 2,
                borderRadius: 2,
                border: `1px solid ${brandColors.primary}10`
              }}
            >
              <strong>Lead ID:</strong> {selectedLead?.id} | <strong>Phone:</strong> {selectedLead?.Phone}
            </Typography>
            
            {selectedLead?.lastKbNumber && (
              <Alert 
                severity="info" 
                sx={{ 
                  mt: 2,
                  backgroundColor: `${brandColors.secondary}10`,
                  border: `1px solid ${brandColors.secondary}30`,
                  '& .MuiAlert-icon': {
                    color: brandColors.secondary
                  }
                }}
              >
                Last KB Number for this lead: <strong>{selectedLead.lastKbNumber}</strong>
              </Alert>
            )}
          </Box>

          <TextField
            label="KB Number"
            value={kbNumber}
            onChange={(e) => setKbNumber(e.target.value.toUpperCase())}
            fullWidth
            margin="normal"
            required
            error={!!validationError}
            helperText={validationError}
            placeholder="Enter KB number"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: brandColors.secondary,
                },
                '&.Mui-focused fieldset': {
                  borderColor: brandColors.primary,
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: brandColors.primary,
              },
            }}
          />

          <TextField
            label="Course Name"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            fullWidth
            margin="normal"
            placeholder="Enter course name (optional)"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: brandColors.secondary,
                },
                '&.Mui-focused fieldset': {
                  borderColor: brandColors.primary,
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: brandColors.primary,
              },
            }}
          />

          <TextField
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            fullWidth
            margin="normal"
            placeholder="Enter amount (optional)"
            inputProps={{ min: 0, step: 0.01 }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: brandColors.secondary,
                },
                '&.Mui-focused fieldset': {
                  borderColor: brandColors.primary,
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: brandColors.primary,
              },
            }}
          />
        </DialogContent>
        
        <Divider />
        
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleDialogClose} 
            disabled={isSubmitting}
            sx={{ 
              color: brandColors.textSecondary,
              fontWeight: 600
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleKbSubmit} 
            variant="contained"
            disabled={isSubmitting || !kbNumber.trim()}
            sx={{
              backgroundColor: brandColors.primary,
              fontWeight: 600,
              px: 3,
              '&:hover': {
                backgroundColor: brandColors.primaryDark
              },
              '&:disabled': {
                backgroundColor: brandColors.textSecondary
              }
            }}
          >
            {isSubmitting ? 'Converting...' : 'Convert Lead'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert Snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={() => setAlert({ ...alert, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setAlert({ ...alert, open: false })} 
          severity={alert.type}
          sx={{ 
            width: '100%',
            fontWeight: 500,
            '&.MuiAlert-standardSuccess': {
              backgroundColor: brandColors.success,
              color: 'white'
            },
            '&.MuiAlert-standardError': {
              backgroundColor: brandColors.error,
              color: 'white'
            }
          }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AccountantSection;