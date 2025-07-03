import { Box, Typography, Button, useTheme, Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Autocomplete, MenuItem, Select, FormControl, InputLabel } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useState, useEffect, } from "react";
import { tokens } from "../../../theme";
import Header from "../../components/Header";
import { useLeads } from "../../hooks/useLeads";
import LoadingComponent from "../../loading/LoadingComponent"
import DropDown from "../../components/DropDown";
import { getLeadsStyles } from "./leadsStyles"; // Import the styles
import ScoreCell from "../../components/ScoreCell"; // adjust path
import WhatsAppDialog from "../../components/WhatsAppDialog"; // Import the new dialog
import EmailDialog from "../../components/EmailDialog"; // Import the email dialog
import { Email as EmailIcon, WhatsApp as WhatsAppIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { supabase } from "../../../supabaseClient";
import { useQueryClient } from "@tanstack/react-query";

const Leads = ({isAdmin}) => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectedFollowupRows, setSelectedFollowupRows] = useState([]);
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [bulkAssignUser, setBulkAssignUser] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  
  // Follow-up states
  const [followups, setFollowups] = useState([]);
  const [followupDialogOpen, setFollowupDialogOpen] = useState(false);
  const [followupType, setFollowupType] = useState('fresh'); // 'fresh' or 'next_stage'
  const [selectedLead, setSelectedLead] = useState(null);
  const [followupDate, setFollowupDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isLoadingFollowups, setIsLoadingFollowups] = useState(false);
  const [isDeletingFollowups, setIsDeletingFollowups] = useState(false);
  
  // Get professional styles
  const styles = getLeadsStyles(theme);
  
  const TABLE_NAME = 'mock';
  const SELECT_FIELDS = 'id, user_id, Name, Email, Phone, State, JobTitle, Country, timestamp, Organization, temperature, status, coursesAttended, referrals, Source, next_course, classification'
  
  const {
    leads,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    updateLead,
    deleteLead,
    bulkDelete,
    isDeleting,
    isBulkDeleting,
  } = useLeads(TABLE_NAME,SELECT_FIELDS);

  const [users, setUsers] = useState([]);

  // Fetch users if admin
  useEffect(() => {
    if (isAdmin) {
      const fetchUsers = async () => {
        const { data, error } = await supabase.from('users').select('user_id, name');
        if (!error) setUsers(data || []);
      };
      fetchUsers();
    }
  }, [isAdmin]);

  // Fetch follow-ups
  const fetchFollowups = async () => {
    setIsLoadingFollowups(true);
    const { data, error } = await supabase
      .from('followups')
      .select(`
        id,
        lead_id,
        followup_stage,
        followup_date,
        remarks,
        status,
        created_at,
        mock:lead_id (
          Name,
          Email,
          Phone
        )
      `)
      .order('lead_id')
      .order('followup_stage');
    
    if (!error) {
      setFollowups(data || []);
    }
    setIsLoadingFollowups(false);
  };

  useEffect(() => {
    if (tabValue === 1) {
      fetchFollowups();
    }
  }, [tabValue]);

  // Enhanced styles for MenuItems
  const getMenuItemStyles = (theme) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#2c2c2c' : '#f5f5f5',
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' ? '#404040' : '#e0e0e0',
    },
    '&.Mui-selected': {
      backgroundColor: theme.palette.mode === 'dark' ? '#404040' : '#d0d0d0',
      '&:hover': {
        backgroundColor: theme.palette.mode === 'dark' ? '#505050' : '#c5c5c5',
      },
    },
  });

  const getSelectStyles = (theme) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#2c2c2c' : '#ffffff',
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.mode === 'dark' ? '#555555' : '#cccccc',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.mode === 'dark' ? '#777777' : '#999999',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
    },
  });

  const AssignUserCell = ({ value, row, onAssign, users }) => {
    const handleChange = (e) => {
      const newUserId = e.target.value;
      onAssign(row.id, newUserId);
    };

    const validUserIds = users.map((u) => u.user_id);
    const safeValue = validUserIds.includes(value) ? value : "";

    return (
      <Select
        value={safeValue}
        onChange={handleChange}
        displayEmpty
        size="small"
        fullWidth
        sx={getSelectStyles(theme)}
        MenuProps={{
          PaperProps: {
            sx: {
              backgroundColor: theme.palette.mode === 'dark' ? '#2c2c2c' : '#ffffff',
              '& .MuiMenuItem-root': getMenuItemStyles(theme),
            },
          },
        }}
      >
        <MenuItem value="" sx={getMenuItemStyles(theme)}>Unassigned</MenuItem>
        {users.map((u) => (
          <MenuItem key={u.user_id} value={u.user_id} sx={getMenuItemStyles(theme)}>
            {u.name}
          </MenuItem>
        ))}
      </Select>
    );
  };
const handleAssignUser = async (rowId, newUserId) => {
  const { error } = await supabase
    .from('mock')
    .update({ user_id: newUserId || null })
    .eq('id', rowId);

  if (!error) {
    queryClient.setQueryData([TABLE_NAME], (old) =>
      old?.map((lead) =>
        lead.id === rowId ? { ...lead, user_id: newUserId || null } : lead
      )
    );

    // Send WhatsApp notification if user is assigned (not unassigned)
    if (newUserId) {
      try {
        // Get user phone number
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('phone')
          .eq('user_id', newUserId)
          .single();

        if (userError) {
          console.error("Failed to fetch user phone:", userError);
          return;
        }

        // Get lead details for template variables
        const { data: leadData, error: leadError } = await supabase
          .from('mock')
          .select('id, Name')
          .eq('id', parseInt(rowId))
          .single();

        if (leadError) {
          console.error("Failed to fetch lead details:", leadError);
          return;
        }

        console.log("Lead data for WhatsApp:", { id: leadData.id, Name: leadData.Name });

        // Send WhatsApp message via edge function
        const { error: whatsappError } = await supabase.functions.invoke('send-whatsapp', {
          body: {
            to: userData.phone,
            contentSid: 'HX5f55d18be109a69387d5810694f560f9', // Content template SID for lead_interested
            contentVariables: {
              "1": leadData.id.toString(), // Lead ID for {{1}}
              "2": leadData.Name           // Lead Name for {{2}}
            }
          }
        });

        if (whatsappError) {
          console.error("Failed to send WhatsApp message:", whatsappError);
        }
      } catch (error) {
        console.error("Error sending WhatsApp notification:", error);
      }
    }
  } else {
    console.error("Assignment failed", error);
  }
};
  const handleBulkAssignUser = async () => {
    if (!selectedRows.length || !bulkAssignUser) return;
    
    const { error } = await supabase
      .from('mock')
      .update({ user_id: bulkAssignUser === 'unassign' ? null : bulkAssignUser })
      .in('id', selectedRows);

    if (!error) {
      queryClient.setQueryData([TABLE_NAME], (old) =>
        old?.map((lead) =>
          selectedRows.includes(lead.id) 
            ? { ...lead, user_id: bulkAssignUser === 'unassign' ? null : bulkAssignUser } 
            : lead
        )
      );
      setBulkAssignUser('');
      setSelectedRows([]);
    } else {
      console.error("Bulk assignment failed", error);
    }
  };

  const handleRowEdit = (params) => {
    updateLead({ id: params.id, ...params.row });
  };

  const handleDelete = () => {
    if (!selectedRows.length) return;
    if (window.confirm(`Delete ${selectedRows.length} lead(s)?`)) {
      selectedRows.length === 1
        ? deleteLead(selectedRows[0])
        : bulkDelete(selectedRows);
      setSelectedRows([]);
    }
  };

  // Handle follow-up deletion
  const handleDeleteFollowups = async () => {
    if (!selectedFollowupRows.length) return;
    
    if (window.confirm(`Delete ${selectedFollowupRows.length} follow-up(s)?`)) {
      setIsDeletingFollowups(true);
      
      try {
        const { error } = await supabase
          .from('followups')
          .delete()
          .in('id', selectedFollowupRows);

        if (!error) {
          setSelectedFollowupRows([]);
          fetchFollowups(); // Refresh the follow-ups list
        } else {
          console.error("Failed to delete follow-ups:", error);
        }
      } catch (err) {
        console.error("Error deleting follow-ups:", err);
      } finally {
        setIsDeletingFollowups(false);
      }
    }
  };

  const handleSendWhatsApp = () => {
    if (!selectedRows.length) return;
    setWhatsappDialogOpen(true);
  };

  const handleSendEmail = () => {
    if (!selectedRows.length) return;
    setEmailDialogOpen(true);
  };

  // Follow-up handlers
  const handleCreateFollowup = (type) => {
    setFollowupType(type);
    setSelectedLead(null);
    setFollowupDate('');
    setRemarks('');
    setFollowupDialogOpen(true);
  };

  const handleSubmitFollowup = async () => {
    if (!selectedLead || !followupDate || !remarks) return;

    let nextStage = 1;
    
    if (followupType === 'next_stage') {
      // Get the highest stage for this lead
      const existingFollowups = followups.filter(f => f.lead_id === selectedLead.id);
      nextStage = existingFollowups.length > 0 ? Math.max(...existingFollowups.map(f => f.followup_stage)) + 1 : 1;
    }

    const { error } = await supabase
      .from('followups')
      .insert({
        lead_id: selectedLead.id,
        followup_stage: nextStage,
        followup_date: followupDate,
        remarks: remarks,
        status: 'pending'
      });

    if (!error) {
      setFollowupDialogOpen(false);
      fetchFollowups();
    } else {
      console.error("Failed to create follow-up:", error);
    }
  };

  const handleFollowupStatusChange = async (followupId, newStatus) => {
    const { error } = await supabase
      .from('followups')
      .update({ status: newStatus })
      .eq('id', followupId);

    if (!error) {
      fetchFollowups();
    } else {
      console.error("Failed to update status:", error);
    }
  };

  const selectedLeads = leads.filter((lead) =>
    selectedRows.includes(lead.id)
  );

  const leadsColumns = [
    { field: "id", headerName: "ID", flex: 1, editable: true },
    { field: "Name", headerName: "Name", minWidth: 150, editable: true },
    { field: "Email", headerName: "Email", minWidth: 200, editable: true },
    { field: "Phone", headerName: "Phone", minWidth: 150, editable: true },
    { field: "JobTitle", headerName: "Job Title", minWidth: 100, editable: true },
    { field: "Organization", headerName: "Organization", flex: 1, editable: true },
    { field: "State", headerName: "State", minWidth: 50, editable: true },
    ...(isAdmin && users.length > 0
      ? [{
          field: 'user_id',
          headerName: 'Course Advisor',
          flex: 1,
          filterable: true,
          sortable: true,
          minWidth: 150,
          renderCell: (params) => (
            <AssignUserCell
              value={params.value}
              row={params.row}
              users={users}
              onAssign={handleAssignUser}
            />
          ),
        }]
      : [{
          field: "Country",
          headerName: "Country",
          flex: 1,
          editable: true
        }]
    ),
    { 
      field: 'temperature', 
      headerName: 'Lead Temperature', 
      flex: 1,
      sortable: false,
      minWidth: 120,
      renderCell: (params) => {
        return (<DropDown id={params.id} value={params.value} table={TABLE_NAME} option={['Hot','Warm','Cold']} column={'temperature'} />)
      }
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      flex: 1,
      sortable: false,
      minWidth: 170,
      renderCell: (params) => {
        return (<DropDown id={params.id} value={params.value} table={TABLE_NAME} option={['KB Requested','Converting','Idle']} column={'status'}/>)
      }
    },
    {
      field: "coursesAttended",
      headerName: "Courses Attended",
      flex: 1,
      editable: true,
      renderCell: (params) => {
        if (!params.value) return "";
        return Array.isArray(params.value) ? params.value.join(", ") : params.value;
      },
      valueGetter: (value) => {
        if (!value) return "";
        return Array.isArray(value) ? value.join(", ") : value;
      },
      valueSetter: (value, row) => {
        if (!value) {
          return { ...row, coursesAttended: [] };
        }
        
        const stringValue = typeof value === 'string' ? value : String(value);
        
        const updatedArray = stringValue
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item !== "");

        return {
          ...row,
          coursesAttended: updatedArray,
        };
      }
    },
    { field: "next_course", headerName: "Next Course", minWidth: 200, editable: true,
      renderCell: (params) => {
        const courseOptions = [
          { label: 'IDIP', value: 'IDIP' },
          { label: 'IGC', value: 'IGC' },
          { label: 'OTHER', value: 'OTHER' }
        ];
        const value = Array.isArray(params.value) ? params.value : [];
        const rowId = params.id;
        const [updating, setUpdating] = useState(false);
        // Regex-based checked logic
        const isChecked = (course) => {
          if (course === 'IDIP') {
            return value.some(v => /idip/i.test(v));
          } else if (course === 'IGC') {
            return value.some(v => /igc/i.test(v));
          } else if (course === 'OTHER') {
            return value.some(v => !/idip/i.test(v) && !/igc/i.test(v));
          }
          return false;
        };
        // When user checks/unchecks, update the array accordingly
        const handleChange = async (course, checked) => {
          setUpdating(true);
          let newSelection = [...value];
          if (course === 'IDIP') {
            if (checked && !newSelection.some(v => /idip/i.test(v))) {
              newSelection.push('IDIP');
            } else if (!checked) {
              newSelection = newSelection.filter(v => !/idip/i.test(v));
            }
          } else if (course === 'IGC') {
            if (checked && !newSelection.some(v => /igc/i.test(v))) {
              newSelection.push('IGC');
            } else if (!checked) {
              newSelection = newSelection.filter(v => !/igc/i.test(v));
            }
          } else if (course === 'OTHER') {
            if (checked) {
              // Add a generic 'OTHER' if no non-idip/igc exists
              if (!newSelection.some(v => !/idip/i.test(v) && !/igc/i.test(v))) {
                newSelection.push('OTHER');
              }
            } else {
              newSelection = newSelection.filter(v => /idip/i.test(v) || /igc/i.test(v));
            }
          }
          await supabase
            .from('mock')
            .update({ next_course: newSelection })
            .eq('id', rowId);
          queryClient.invalidateQueries(['mock']);
          setUpdating(false);
        };
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {courseOptions.map((course) => (
              <label key={course.value} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <input
                  type="checkbox"
                  checked={isChecked(course.value)}
                  disabled={updating}
                  onChange={e => handleChange(course.value, e.target.checked)}
                />
                {course.label}
              </label>
            ))}
          </Box>
        );
      }
    },
    { 
      field: "referrals", 
      headerName: "Referrals", 
      flex: 1, 
      editable: false,
      renderCell: (params) => (params.value?.join(", ") || "")
    },
    { field: "Source", headerName: "Source", minWidth: 80, editable: true },
    {
      field: "timestamp",
      headerName: "Timestamp",
      flex: 1,
    },
    {
      field: "classification",
      headerName: "Lead Score",
      filterable: true,
      width: 150,
      renderCell: (params) => <ScoreCell row={params.row} />
    }
  ];

  const followupColumns = [
    { field: "id", headerName: "ID", width: 80, hide: true },
    { 
      field: "lead_name", 
      headerName: "Lead Name", 
      flex: 1,
      valueGetter: (value, row) => row.mock?.Name || 'Unknown'
    },
    { 
      field: "lead_email", 
      headerName: "Email", 
      flex: 1,
      valueGetter: (value, row) => row.mock?.Email || 'Unknown'
    },
    { 
      field: "lead_phone", 
      headerName: "Phone", 
      flex: 1,
      valueGetter: (value, row) => row.mock?.Phone || 'Unknown'
    },
    { field: "followup_stage", headerName: "Stage", width: 80 },
    { 
      field: "followup_date", 
      headerName: "Follow-up Date", 
      flex: 1,
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
      }
    },
    { field: "remarks", headerName: "Remarks", flex: 2 },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: (params) => (
        <Select
          value={params.value}
          onChange={(e) => handleFollowupStatusChange(params.row.id, e.target.value)}
          size="small"
          fullWidth
          sx={getSelectStyles(theme)}
        >
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
          <MenuItem value="cancelled">Cancelled</MenuItem>
        </Select>
      )
    },
    { 
      field: "created_at", 
      headerName: "Created", 
      flex: 1,
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
      }
    }
  ];

  if(isLoading) {
    return <LoadingComponent />
  }

  if (isError) {
    return (
      <Box m={2}>
        <Header title="LEADS" subtitle="Manage your leads data" />
        <Typography color="error" mb={1}>
          Failed to load leads: {error?.message}
        </Typography>
        <Button variant="contained" onClick={refetch}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={styles.mainContainer}>
      <Header title="LEADS MANAGEMENT" subtitle="Manage your leads and follow-ups" />

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Manage Leads" />
          <Tab label="Follow-ups" />
        </Tabs>
      </Box>

      {/* Leads Tab */}
      {tabValue === 0 && (
        <>
          <Box sx={styles.actionButtonsContainer}>
            <Button
              variant="contained"
              onClick={refetch}
              disabled={isFetching}
              sx={styles.refreshButton}
            >
              {isFetching ? "Refreshing..." : "Refresh"}
            </Button>
            
            {isAdmin && (
              <Button
                variant="contained"
                color="error"
                disabled={isDeleting || isBulkDeleting || !selectedRows.length}
                onClick={handleDelete}
                sx={styles.deleteButton}
              >
                {isDeleting || isBulkDeleting ? "Deleting..." : "Delete Selected"}
              </Button>
            )}
            
            <Button
              variant="contained"
              disabled={!selectedRows.length}
              onClick={handleSendEmail}
              startIcon={<EmailIcon />}
              sx={{ 
                ml: 2,
                color: 'white',
                backgroundColor: theme.palette.mode === 'dark' ? '#0a3456' : '#0a3456',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#1565c0' : '#1565c0',
                },
              }}
            >
              Send Email
            </Button>

            <Button
              variant="contained"
              color="success"
              disabled={!selectedRows.length}
              onClick={handleSendWhatsApp}
              startIcon={<WhatsAppIcon />}
              sx={{ ml: 2 }}
            >
              WhatsApp
            </Button>

            {/* Bulk Assign User Section */}
            {isAdmin && users.length > 0 && selectedRows.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, gap: 1 }}>
                <Select
                  value={bulkAssignUser}
                  onChange={(e) => setBulkAssignUser(e.target.value)}
                  displayEmpty
                  size="small"
                  sx={{ ...getSelectStyles(theme), minWidth: 150 }}
                >
                  <MenuItem value="">Select User</MenuItem>
                  <MenuItem value="unassign">Unassign All</MenuItem>
                  {users.map((u) => (
                    <MenuItem key={u.user_id} value={u.user_id}>
                      {u.name}
                    </MenuItem>
                  ))}
                </Select>
                <Button
                  variant="contained"
                  disabled={!bulkAssignUser}
                  onClick={handleBulkAssignUser}
                  sx={{ minWidth: 'auto', px: 2 }}
                >
                  Assign
                </Button>
              </Box>
            )}

            <Typography variant="body2" sx={styles.statsTypography}>
              Total: {leads.length} | Selected: {selectedRows.length}
            </Typography>
          </Box>

          <Box sx={styles.dataGridContainer}>
            <DataGrid 
              showToolbar
              sx={styles.dataGridStyles}
              checkboxSelection
              rows={leads}
              columns={leadsColumns}
              loading={isLoading || isFetching}
              getRowId={(row) => row.id}
              onRowSelectionModelChange={(newSelection) => {
                const ids = newSelection?.ids ? Array.from(newSelection.ids) : 
                            Array.isArray(newSelection) ? newSelection : [];
                setSelectedRows(ids);
              }}
              processRowUpdate={(newRow, oldRow) => {
                if (JSON.stringify(newRow) !== JSON.stringify(oldRow)) {
                  handleRowEdit({ id: newRow.id, row: newRow });
                }
                return newRow;
              }}
              onProcessRowUpdateError={(err) =>
                console.error("Row update error:", err)
              }
            />
          </Box>
        </>
      )}

      {/* Follow-ups Tab */}
      {tabValue === 1 && (
        <>
          <Box sx={styles.actionButtonsContainer}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleCreateFollowup('fresh')}
              sx={{ mr: 2,color:'white' }}
            >
              Create Fresh Follow-up
            </Button>
            
            <Button
              variant="dashed"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={() => handleCreateFollowup('next_stage')}
              sx={{ mr: 2 ,backgroundColor:'#a3b1bd'}}
            >
              Create Next Stage Follow-up
            </Button>

            <Button
              variant="contained"
              color="error"
              disabled={isDeletingFollowups || !selectedFollowupRows.length}
              onClick={handleDeleteFollowups}
              startIcon={<DeleteIcon />}
            >
              {isDeletingFollowups ? "Deleting..." : "Delete Selected"}
            </Button>

            <Typography variant="body2" sx={styles.statsTypography}>
              Total Follow-ups: {followups.length} | Selected: {selectedFollowupRows.length}
            </Typography>
          </Box>

          <Box sx={styles.dataGridContainer}>
            <DataGrid 
              columnVisibilityModel={{
    id:false, // hides the column initially
  }}
              showToolbar
              sx={styles.dataGridStyles}
              checkboxSelection
              rows={followups}
              columns={followupColumns}
              loading={isLoadingFollowups}
              getRowId={(row) => row.id}
              onRowSelectionModelChange={(newSelection) => {
                const ids = newSelection?.ids ? Array.from(newSelection.ids) : 
                            Array.isArray(newSelection) ? newSelection : [];
                setSelectedFollowupRows(ids);
              }}
            />
          </Box>
        </>
      )}

      {/* Follow-up Dialog */}
      <Dialog open={followupDialogOpen} onClose={() => setFollowupDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {followupType === 'fresh' ? 'Create Fresh Follow-up' : 'Create Next Stage Follow-up'}
        </DialogTitle>
        <DialogContent>
          <Autocomplete
            options={leads}
            getOptionLabel={(option) => `${option.Name} (${option.Email})`}
            value={selectedLead}
            onChange={(event, newValue) => setSelectedLead(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Lead"
                margin="normal"
                fullWidth
              />
            )}
          />
          
          <TextField
            label="Follow-up Date"
            type="datetime-local"
            value={followupDate}
            onChange={(e) => setFollowupDate(e.target.value)}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          
          <TextField
            label="Remarks"
            multiline
            rows={4}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFollowupDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitFollowup} 
            variant="contained"
            disabled={!selectedLead || !followupDate || !remarks}
          >
            Create Follow-up
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Dialog */}
      <EmailDialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        selectedRecipients={selectedLeads}
      />

      {/* WhatsApp Dialog */}
      <WhatsAppDialog
        open={whatsappDialogOpen}
        onClose={() => setWhatsappDialogOpen(false)}
        selectedLeads={selectedLeads}
      />
    </Box>
  );
};

export default Leads;