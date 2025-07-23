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
  Divider,
  Tabs,
  Tab
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
import ReportsTable from '../reports/index.jsx';

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
  const courseOptions = [
    { label: 'IDIP', value: 'IDIP' },
    { label: 'IGC', value: 'IGC' },
    { label: 'OTHER', value: 'OTHER' }
  ];
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [courseAmounts, setCourseAmounts] = useState({});
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  // Alert states
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
  const [validationError, setValidationError] = useState('');

  // Fetch leads with KB Requested status
  const fetchKBRequestLeads = async () => {
    setIsLoading(true);
    try {
      const { data: leads, error: leadsError } = await supabase
        .from('mock')
        .select('id, Name, Phone, next_course, status, timestamp')
        .eq('status', 'KB Requested')
        .order('timestamp', { ascending: false });

      if (leadsError) throw leadsError;

      // Get KB numbers for these leads to show conversion history
      const leadIds = leads?.map(lead => lead.id) || [];
      
      let kbData = [];
      if (leadIds.length > 0) {
        const { data: kbResult, error: kbError } = await supabase
          .from('kb_numbers')
          .select('lead_id, kb_number, course_name, amount, created_at')
          .in('lead_id', leadIds)
          .order('created_at', { ascending: false });

        if (kbError) throw kbError;
        kbData = kbResult || [];
      }

      // Combine data
      const enrichedLeads = (leads || []).map(lead => ({
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
    console.log('Submitting KB for lead:', selectedLead, kbNumber, selectedCourses, courseAmounts);
    if (!selectedLead || !kbNumber.trim() || selectedCourses.length === 0) {
      setValidationError('Please fill in all required fields and select at least one course');
      return;
    }
    // Validate all selected course amounts
    for (const course of selectedCourses) {
      if (!courseAmounts[course] || isNaN(parseFloat(courseAmounts[course]))) {
        setValidationError(`Please enter a valid amount for ${course}`);
        return;
      }
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
      // Insert KB number record for each selected course
      for (const course of selectedCourses) {
        const { error: kbError } = await supabase
          .from('kb_numbers')
          .insert({
            lead_id: selectedLead.id,
            kb_number: kbNumber.trim(),
            course_name: course,
            amount: parseFloat(courseAmounts[course])
          });
        if (kbError) throw kbError;
      }
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
    setSelectedCourses([]);
    setCourseAmounts({});
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
    console.log('Convert clicked for lead:', lead);
    setSelectedLead(lead);
    setKbDialogOpen(true);
  };

  // DataGrid columns with custom styling
// Updated DataGrid columns with centered text and increased font size
const columns = [
  { 
    field: "id", 
    headerName: "Lead ID", 
    width: 100,
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
        <Chip
          label={params.value}
          size="small"
          sx={{
            backgroundColor: brandColors.primaryLight,
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.875rem'
          }}
        />
      </Box>
    )
  },
  { 
    field: "Name", 
    headerName: "Lead Name", 
    flex: 1,
    minWidth: 150,
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 600,
            color: brandColors.textPrimary,
            fontSize: '0.95rem',
            textAlign: 'center'
          }}
        >
          {params.value}
        </Typography>
      </Box>
    )
  },
  { 
    field: "Phone", 
    headerName: "Phone", 
    flex: 1,
    minWidth: 130,
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
        <Typography 
          variant="body2" 
          sx={{ 
            color: brandColors.textSecondary,
            fontSize: '0.9rem',
            textAlign: 'center'
          }}
        >
          {params.value}
        </Typography>
      </Box>
    )
  },
  {
    field: "next_course",
    headerName: "Requested Courses",
    flex: 1,
    minWidth: 180,
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => {
      const value = Array.isArray(params.value) ? params.value : [];
      return (
        <Typography variant="body2" sx={{ color: brandColors.textSecondary, textAlign: 'center', width: '100%' }}>
          {value.length > 0 ? value.join(', ') : <span style={{ fontStyle: 'italic' }}>None</span>}
        </Typography>
      );
    }
  },
  { 
    field: "timestamp", 
    headerName: "Request Date", 
    flex: 1,
    minWidth: 150,
    headerAlign: 'center',
    align: 'center',
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
        <Typography 
          variant="body2" 
          sx={{ 
            color: brandColors.textSecondary,
            fontSize: '0.9rem',
            textAlign: 'center'
          }}
        >
          {params.formattedValue}
        </Typography>
      </Box>
    )
  },
  {
    field: "lastKbNumber",
    headerName: "Last KB Number",
    width: 150,
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
        {params.value ? (
          <Chip
            label={params.value}
            size="small"
            sx={{
              backgroundColor: brandColors.success,
              color: 'white',
              fontSize: '0.875rem'
            }}
          />
        ) : (
          <Typography 
            variant="body2" 
            sx={{ 
              color: brandColors.textSecondary,
              fontStyle: 'italic',
              fontSize: '0.9rem',
              textAlign: 'center'
            }}
          >
            None
          </Typography>
        )}
      </Box>
    )
  },
  {
    field: "actions",
    headerName: "Actions",
    width: 120,
    headerAlign: 'center',
    align: 'center',
    sortable: false,
    filterable: false,
    renderCell: (params) => (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
        <Button
          variant="contained"
          size="small"
          onClick={() => handleConvertClick(params.row)}
          sx={{ 
            fontSize: '0.875rem',
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
      </Box>
    )
  }
];


// Also update the DataGrid container styles for better text presentation
const dataGridStyles = {
  height: 600,
  '& .MuiDataGrid-root': {
    border: 'none',
    fontFamily: 'inherit',
    fontSize: '0.9rem' // Base font size increase
  },
  '& .MuiDataGrid-cell': {
    borderBottom: `1px solid ${brandColors.primary}08`,
    py: 2,
    display: 'flex !important',
    alignItems: 'center !important',
    justifyContent: 'center !important', // Center cell content
    textAlign: 'center !important'
  },
  '& .MuiDataGrid-cellContent': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%'
  },
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: brandColors.primary,
    borderBottom: 'none',
    '& .MuiDataGrid-columnHeader': {
      backgroundColor: brandColors.primary,
      display: 'flex !important',
      alignItems: 'center !important',
      justifyContent: 'center !important',
      '& .MuiDataGrid-columnHeaderTitle': {
        color: 'white',
        fontWeight: 600,
        fontSize: '1rem', // Increased header font size
        textAlign: 'center !important'
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
    '& .MuiTablePagination-root': {
      fontSize: '0.9rem' // Increased pagination font size
    }
  },
  '& .MuiDataGrid-row:hover': {
    backgroundColor: `${brandColors.secondary}08`
  },
  // Additional styles to ensure proper centering
  '& .MuiDataGrid-row .MuiDataGrid-cell': {
    display: 'flex !important',
    alignItems: 'center !important',
    justifyContent: 'center !important'
  },
  '& .MuiDataGrid-row .MuiDataGrid-cell > div': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%'
  }
};

  if (isLoading) {
    return <LoadingComponent />;
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: brandColors.background, p: 3 }}>
      <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab label="Accountant" />
        <Tab label="Reports" />
      </Tabs>
      {tabValue === 0 && (
        <>
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
            
            <Box sx={dataGridStyles}>
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
                Convert Lead: {selectedLead?.Name} (ID: {selectedLead?.id})
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
                error={!!validationError && !kbNumber.trim()}
                helperText={!!validationError && !kbNumber.trim() ? validationError : ''}
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

              {/* Course selection checkboxes and amount fields */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Select Course(s)
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {courseOptions.map((course) => (
                    <Box key={course.value} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <input
                        type="checkbox"
                        id={`course-${course.value}`}
                        checked={selectedCourses.includes(course.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCourses([...selectedCourses, course.value]);
                          } else {
                            setSelectedCourses(selectedCourses.filter((c) => c !== course.value));
                            setCourseAmounts((prev) => {
                              const updated = { ...prev };
                              delete updated[course.value];
                              return updated;
                            });
                          }
                        }}
                      />
                      <label htmlFor={`course-${course.value}`}>{course.label}</label>
                      {selectedCourses.includes(course.value) && (
                        <TextField
                          label="Amount"
                          type="number"
                          value={courseAmounts[course.value] || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setCourseAmounts((prev) => ({ ...prev, [course.value]: value }));
                          }}
                          size="small"
                          sx={{ width: 100, ml: 1 }}
                          inputProps={{ min: 0, step: 0.01 }}
                        />
                      )}
                    </Box>
                  ))}
                </Box>
                {validationError && selectedCourses.length === 0 && (
                  <Typography color="error" variant="body2" sx={{ mt: 1 }}>{validationError}</Typography>
                )}
              </Box>
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
                disabled={isSubmitting || !kbNumber.trim() || selectedCourses.length === 0}
                sx={{
                  backgroundColor: brandColors.primary,
                  fontWeight: 600,
                  color:'white !important',
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
        </>
      )}
      {tabValue === 1 && (
        <ReportsTable onlyTable isAdmin={true} />
      )}
    </Box>
  );
};

export default AccountantSection;