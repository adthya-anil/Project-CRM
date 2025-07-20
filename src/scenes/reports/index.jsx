import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient'; // Adjust import path as needed
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Grid, 
  Chip,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Search, TrendingUp, Assignment, Person, School } from '@mui/icons-material';
import LeadInteractions from '../../components/LeadInteraction';

const Reports = ({isAdmin}) => {

  if(!isAdmin){
    return <LeadInteractions />
  }
  const [kbData, setKbData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalEntries: 0,
    totalAmount: 0,
    avgAmount: 0,
    uniqueLeads: 0,
    currentMonthEntries: 0,
    uniqueLeadsThisMonth: 0
  });

  useEffect(() => {
    fetchKbData();
  }, []);

  const fetchKbData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch KB numbers with lead and user information
      const { data, error } = await supabase
        .from('kb_numbers')
        .select(`
          id,
          lead_id,
          kb_number,
          course_name,
          amount,
          created_at,
          mock!fk_lead_id (
            id,
            Name,
            Email,
            Phone,
            user_id,
            users!mock_user_id_fkey (
              name,
              role
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process data for DataGrid
      const processedData = data.map((item, index) => ({
        id: item.id,
        leadId: item.lead_id,
        leadName: item.mock?.Name || 'N/A',
        email: item.mock?.Email || 'N/A',
        phone: item.mock?.Phone || 'N/A',
        kbNumber: item.kb_number,
        courseName: item.course_name || 'N/A',
        amount: parseFloat(item.amount) || 0,
        courseAdvisor: item.mock?.users?.name || 'Unassigned',
        advisorRole: item.mock?.users?.role || 'N/A',
        createdAt: new Date(item.created_at).toLocaleDateString(),
        createdDateTime: new Date(item.created_at)
      }));

      setKbData(processedData);

      // Calculate statistics - reset monthly
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      // Filter data for current month only
      const currentMonthData = processedData.filter(item => {
        const itemDate = item.createdDateTime;
        return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
      });
      
      const totalAmount = currentMonthData.reduce((sum, item) => sum + item.amount, 0);
      const uniqueLeads = new Set(processedData.map(item => item.leadId)).size;
      const uniqueLeadsThisMonth = new Set(currentMonthData.map(item => item.leadId)).size;
      
      setStats({
        totalEntries: processedData.length,
        totalAmount: totalAmount, // Current month only
        avgAmount: currentMonthData.length > 0 ? totalAmount / currentMonthData.length : 0, // Current month only
        uniqueLeads: uniqueLeads,
        currentMonthEntries: currentMonthData.length,
        uniqueLeadsThisMonth: uniqueLeadsThisMonth
      });

    } catch (error) {
      console.error('Error fetching KB data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = kbData.filter(row => 
    row.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.kbNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.courseAdvisor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      field: 'leadId',
      headerName: 'Lead ID',
      width: 92,
      headerClassName: 'data-grid-header',
    },
    {
      field: 'leadName',
      headerName: 'Lead Name',
      width: 180,
      headerClassName: 'data-grid-header',
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="500">
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 200,
      headerClassName: 'data-grid-header',
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 200,
      headerClassName: 'data-grid-header',
    },
    {
      field: 'kbNumber',
      headerName: 'KB Number',
      width: 180,
      headerClassName: 'data-grid-header',
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          size="small" 
          sx={{ 
            backgroundColor: '#e3f2fd',
            color: '#0a3456',
            fontWeight: 'bold'
          }}
        />
      ),
    },
    {
      field: 'courseName',
      headerName: 'Course Name',
      width: 180,
      headerClassName: 'data-grid-header',
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 150,
      headerClassName: 'data-grid-header',
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="600" color="#0a3456">
          ₹{params.value.toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'courseAdvisor',
      headerName: 'Course Advisor',
      width: 180,
      headerClassName: 'data-grid-header',
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="500">
            {params.value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.advisorRole}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'createdAt',
      headerName: 'Created Date',
      width: 150,
      headerClassName: 'data-grid-header',
    },
  ];

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '400px' 
        }}
      >
        <CircularProgress sx={{ color: '#3196c9' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Error loading data: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ color: '#0a3456', fontWeight: 'bold' }}>
              Course Enrollment Reports
            </Typography>
            <Typography variant="body1" color="text.secondary">
              KB Numbers and Course Advisor assignments
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">
              Revenue tracking for
            </Typography>
            <Typography variant="h6" sx={{ color: '#0a3456', fontWeight: 'bold' }}>
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#fff', borderTop: '4px solid #3196c9' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Assignment sx={{ fontSize: 40, color: '#3196c9', mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0a3456' }}>
                    {stats.totalEntries}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Entries
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#fff', borderTop: '4px solid #0a3456' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ fontSize: 40, color: '#0a3456', mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0a3456' }}>
                    ₹{stats.totalAmount.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This Month's Revenue
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#fff', borderTop: '4px solid #3196c9' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <School sx={{ fontSize: 40, color: '#3196c9', mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0a3456' }}>
                    ₹{stats.avgAmount.toFixed(0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monthly Avg. Amount
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ backgroundColor: '#fff', borderTop: '4px solid #0a3456' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Person sx={{ fontSize: 40, color: '#0a3456', mr: 2 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0a3456' }}>
                    {stats.uniqueLeads}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Unique Leads
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by lead name, email, KB number, course, or advisor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ color: '#3196c9', mr: 1 }} />,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderColor: '#3196c9',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#0a3456',
              },
            },
          }}
        />
      </Paper>

      {/* Results Info */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Showing {filteredData.length} of {kbData.length} results
      </Typography>

      {/* DataGrid */}
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredData}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[5, 10, 25, 50]}
          checkboxSelection
          disableSelectionOnClick
          sx={{
            '& .data-grid-header': {
              backgroundColor: '#f8f9fa',
              color: '#0a3456',
              fontWeight: 'bold',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: '#f0f8ff',
            },
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-row.Mui-selected': {
              backgroundColor: '#e3f2fd',
            },
            '& .MuiDataGrid-footerContainer': {
              backgroundColor: '#f8f9fa',
            },
          }}
        />
      </Paper>
    </Box>
  );
};

export default Reports;