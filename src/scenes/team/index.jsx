import { Box, Typography, Button, useTheme } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useState } from "react";
import { tokens } from "../../../theme";
import Header from "../../components/Header";
import { useMonthlyLeadsSummary } from "../../hooks/UseMockCounts";
import LoadingComponent from "../../loading/LoadingComponent";
import { getLeadsStyles } from "../leads/leadsStyles";

const Team = ({isAdmin}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [selectedRows, setSelectedRows] = useState([]);
  const styles = getLeadsStyles(theme);
  
  const {
    data: leads = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useMonthlyLeadsSummary();

 const columns = [
  { field: "id", headerName: "ID", flex: 0.5 },
  { field: "name", headerName: "Name", flex: 1.5 },
  { field: "converted_count", headerName: "Converted Leads", flex: 1 },
  { field: "converting_count", headerName: "Converting Leads", flex: 1 },
  { field: "idle_count", headerName: "Idle Leads", flex: 1 },
  { field: "year", headerName: "Year", flex: 0.8 },
  { field: "month", headerName: "Month", flex: 1 },
  { field: "new_leads_count", headerName: "Total Leads This Month", flex: 1.2 },
];

  if (isLoading) {
    return <LoadingComponent />;
  }
  
  if (isError) {
    return (
      <Box m={2}>
        {isAdmin ? <Header title="TEAMS" subtitle="Monthly Leads Summary" /> : <Header title="PERFORMANCE" subtitle="Monthly Leads Summary" /> }
        <Typography color="error" mb={1}>
          Failed to load monthly leads summary: {error?.message}
        </Typography>
        <Button variant="contained" onClick={refetch}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={styles.mainContainer}>
      {isAdmin ? <Header title="TEAMS" subtitle="Monthly Leads Summary" /> : <Header title="PERFORMANCE" subtitle="Monthly Leads Summary" /> }

      <Box sx={styles.actionButtonsContainer}>
        <Button
          variant="contained"
          onClick={refetch}
          disabled={isFetching}
          sx={{ backgroundColor: colors.primary[500] }}
        >
          {isFetching ? "Refreshing..." : "Refresh"}
        </Button>
        <Typography variant="body2" sx={styles.statsTypography}>
          Total Records: {leads.length} | Selected: {selectedRows.length}
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
            const ids = newSelection?.ids
              ? Array.from(newSelection.ids)
              : Array.isArray(newSelection)
                ? newSelection
                : [];
            setSelectedRows(ids);
          }}
        />
      </Box>
    </Box>
  );
};

export default Team;