import { Box, Typography, Button, useTheme } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useState, useEffect } from "react";
import { tokens } from "../../../theme";
import Header from "../../components/Header";
import { useLeads } from "../../hooks/useLeads";
import LoadingComponent from "../../loading/LoadingComponent"
import DropDown from "../../components/DropDown";
import { getLeadsStyles } from "./leadsStyles"; // Import the styles
import ScoreCell from "../../components/ScoreCell"; // adjust path
import WhatsAppDialog from "../../components/WhatsAppDialog"; // Import the new dialog
import EmailDialog from "../../components/EmailDialog"; // Import the email dialog
import { Select, MenuItem } from '@mui/material';
import { supabase } from "../../../supabaseClient";
import { useQueryClient } from "@tanstack/react-query";
import { Email as EmailIcon, WhatsApp as WhatsAppIcon } from '@mui/icons-material';

const Leads = ({isAdmin}) => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [selectedRows, setSelectedRows] = useState([]);
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false); // Add email dialog state
  const [bulkAssignUser, setBulkAssignUser] = useState('');
  
  // Get professional styles
  const styles = getLeadsStyles(theme);
  //const MemoizedDropDown = React.memo(DropDown);
  
   
  const TABLE_NAME = 'mock';
  // Exclude user_id from select fields - get all other fields
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

// Only fetch users if isAdmin is true
useEffect(() => {
  if (isAdmin) {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('users').select('user_id, name');
      if (!error) setUsers(data || []);
    };
    fetchUsers();
  }
}, [isAdmin]);

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
    //data is updated instantly
  } else {
    console.error("Assignment failed", error);
  }
};

// Bulk assign function
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
    console.log(`Bulk assigned ${selectedRows.length} leads to user: ${bulkAssignUser}`);
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

  const handleSendWhatsApp = () => {
    if (!selectedRows.length) return;
    setWhatsappDialogOpen(true);
  };

  // Add email handler
  const handleSendEmail = () => {
    if (!selectedRows.length) return;
    setEmailDialogOpen(true);
  };

  const selectedLeads = leads.filter((lead) =>
    selectedRows.includes(lead.id)
  );

  const columns = [
    { field: "id", headerName: "ID", flex: 1, editable: true },
    { field: "Name", headerName: "Name", flex: 1, editable: true },
    { field: "Email", headerName: "Email", flex: 1, editable: true },
    { field: "Phone", headerName: "Phone", flex: 1, editable: true },
    { field: "JobTitle", headerName: "Job Title", flex: 1, editable: true },
    { field: "Organization", headerName: "Organization", flex: 1, editable: true },
    { field: "State", headerName: "State", flex: 1, editable: true },
    ...(isAdmin && users.length > 0
  ? [{
      field: 'user_id',
      headerName: 'Assigned User',
      flex: 1,
      filterable: true,
      minWidth: 120,
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
    { field: 'temperature', headerName: 'Lead Temperature', flex: 1,sortable: false,minWidth:120,
      renderCell: (params) => {
        return (<DropDown id={params.id} value={params.value} table={TABLE_NAME} option={['Hot','Warm','Cold']} column={'temperature'} />)
      }
    },
    { field: 'status', headerName: 'Status ', flex: 1,sortable: false,minWidth: 170,
      renderCell: (params) => {
        return (<DropDown id={params.id} value={params.value} table={TABLE_NAME} option={['Converted','Converting','Idle']} column={'status'}/>)
      }
    },
    { field: "coursesAttended", headerName: "Courses Attended", flex: 1, editable: false,
      renderCell: (params) => (params.value?.join(", ") || "")
     },
     { field: "next_course", headerName: "Next Course", flex: 1, editable: true },
     { field: "referrals", headerName: "Referrals", flex: 1, editable: false,
      renderCell: (params) => (params.value?.join(", ") || "")
     },
     { field: "Source", headerName: "Source", flex: 1, editable: true },
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

  if(isLoading) {
    return(
        <LoadingComponent />
    )
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
        <Header title="LEADS" subtitle="Manage your leads data" />

        <Box sx={styles.actionButtonsContainer}>
            <Button
                variant="contained"
                onClick={refetch}
                disabled={isFetching}
                sx={styles.refreshButton}
            >
                {isFetching ? "Refreshing..." : "Refresh"}
            </Button>
            {isAdmin && <Button
                variant="contained"
                color="error"
                disabled={isDeleting || isBulkDeleting || !selectedRows.length}
                onClick={handleDelete}
                sx={styles.deleteButton}
            >
                {isDeleting || isBulkDeleting ? "Deleting..." : "Delete Selected"}
            </Button>}
            
            {/* Email Button */}
            <Button
                variant="contained"
                color="white"
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

            {/* WhatsApp Button */}
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

            {/* Bulk Assign User Section - Only show if admin and has selected rows */}
            {isAdmin && users.length > 0 && selectedRows.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, gap: 1 }}>
                <Select
                  value={bulkAssignUser}
                  onChange={(e) => setBulkAssignUser(e.target.value)}
                  displayEmpty
                  size="small"
                  sx={{
                    ...getSelectStyles(theme),
                    minWidth: 150,
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: theme.palette.mode === 'dark' ? '#2c2c2c' : '#ffffff',
                        '& .MuiMenuItem-root': getMenuItemStyles(theme),
                      },
                    },
                  }}
                >
                  <MenuItem value="" sx={getMenuItemStyles(theme)}>Select User</MenuItem>
                  <MenuItem value="unassign" sx={getMenuItemStyles(theme)}>Unassign All</MenuItem>
                  {users.map((u) => (
                    <MenuItem key={u.user_id} value={u.user_id} sx={getMenuItemStyles(theme)}>
                      {u.name}
                    </MenuItem>
                  ))}
                </Select>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={!bulkAssignUser}
                  onClick={handleBulkAssignUser}
                  sx={{ 
                    minWidth: 'auto',
                    color: 'white',
                    px: 2,
                    backgroundColor: theme.palette.mode === 'dark' ? '#1976d2' : '#1976d2',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' ? '#1565c0' : '#1565c0',
                    },
                  }}
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
                columns={columns}
                loading={isLoading || isFetching}
                getRowId={(row) => row.id}
                onRowSelectionModelChange={(newSelection) => {
                  console.log("Raw selection:", newSelection);
                  
                  // Handle different formats the DataGrid might return
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

        {/* Email Dialog */}
        <EmailDialog
          open={emailDialogOpen}
          onClose={() => setEmailDialogOpen(false)}
          selectedRecipients={selectedLeads}
          //allLeads={allLeads}
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