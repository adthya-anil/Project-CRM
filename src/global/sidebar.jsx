import { useState, useEffect } from "react";
import { Sidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { Link } from "react-router-dom";
import { tokens } from "../../theme";
import { supabase } from "../../supabaseClient";
import "./SideBar.css"; // Import the styles
import logo from '../assets/react.svg'

// Icons
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import ReceiptOutlinedIcon from "@mui/icons-material/ReceiptOutlined";
import PeopleAltSharpIcon from "@mui/icons-material/PeopleAltSharp";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import PieChartOutlineOutlinedIcon from "@mui/icons-material/PieChartOutlineOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";

const SideBar = ({isAdmin,userId,isAccountant}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [collapsed, setCollapsed] = useState(false);
  const [selected, setSelected] = useState();
  const [userData, setUserData] = useState(null);
  


  useEffect(() => {
    const fetchUserData = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('name,role')
        .eq('user_id', userId)
        .single();
      setUserData(data);
      
    };
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const handleMenuItemClick = (title) => {
    setSelected(title);
  };

  // Determine theme class
  const themeClass = theme.palette.mode === "dark" ? "sidebar-dark" : "sidebar-light";

return (
  <Box className={`professional-sidebar ${themeClass}`}>
    <Sidebar 
      collapsed={collapsed} 
      rootStyles={{
        height: "100%",
        width: collapsed ? '80px' : '280px',
        border: 'none',
        borderRight: 'none'
      }}
    >
      <Menu>
        <MenuItem
          icon={collapsed ? <MenuOutlinedIcon /> : undefined}
          onClick={collapsed ? () => setCollapsed(!collapsed) : undefined}
          style={{
            margin: "0",
            padding: "0",
            background: "transparent"
          }}
        >
          {!collapsed && (
            <Box className="sidebar-header">
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography className="logo-text">
                  <span className="logo-safety">CRM</span>
                  
                </Typography>
                <IconButton 
                  onClick={() => setCollapsed(!collapsed)}
                  className="collapse-button"
                  size="small"
                >
                  <MenuOutlinedIcon />
                </IconButton>
              </Box>
            </Box>
          )}
        </MenuItem>

        {!collapsed && (
          <Box className="profile-section">
            <Box display="flex" justifyContent="center" alignItems="center">
              <img
                alt="profile-user"
                className="profile-image"
                src={logo}
                style={{ cursor: "pointer" }}
              />
            </Box>
            <Typography className="profile-name">
              {userData?.name || "User"}
            </Typography>
            <Typography className="profile-role">
              {userData?.role || "role"}
            </Typography>
          </Box>
        )}

        <Box>
          {isAccountant ? (
            // Accountant only sees Manage Requests
            <MenuItem
              icon={<PeopleAltSharpIcon />}
              component={<Link to="/manage" />}
              active={selected === "Manage Requests"}
              onClick={() => handleMenuItemClick("Manage Requests")}
            >
              Manage Requests
            </MenuItem>
          ) : (
            // Non-accountant users see all menu items
            <>
              <MenuItem
                icon={<HomeOutlinedIcon />}
                component={<Link to="/" />}
                active={selected === "Dashboard"}
                onClick={() => handleMenuItemClick("Dashboard")}
              >
                Dashboard
              </MenuItem>

              {!collapsed && <Typography className="section-header">
                Data Management
              </Typography>}
              
              <MenuItem
                icon={<PeopleOutlinedIcon />}
                component={<Link to="/team" />}
                active={selected === "Manage Team"}
                onClick={() => handleMenuItemClick("Manage Team")}
              >
                {isAdmin ? "Manage Teams" : "Your Statistics"}
              </MenuItem>
              
              <MenuItem
                icon={<PeopleAltSharpIcon />}
                component={<Link to="/leads" />}
                active={selected === "Manage Leads"}
                onClick={() => handleMenuItemClick("Manage Leads")}
              >
                Manage Leads
              </MenuItem>
              
              <MenuItem
                icon={<ReceiptOutlinedIcon />}
                component={<Link to="/reports" />}
                active={selected === "Reports"}
                onClick={() => handleMenuItemClick("Reports")}
              >
                {isAdmin ? "Reports" : "Lead Interaction"}
              </MenuItem>

              {!collapsed && <Typography className="section-header">
                Application Pages
              </Typography>}
              <MenuItem
                icon={<PersonAddAltIcon />}
                component={<Link to="/form" />}
                active={selected === "New Lead"}
                onClick={() => handleMenuItemClick("New Lead")}
              >
                New Lead
              </MenuItem>
              <MenuItem
                icon={<CalendarTodayOutlinedIcon />}
                component={<Link to="/calendar" />}
                active={selected === "Calendar"}
                onClick={() => handleMenuItemClick("Calendar")}
              >
                Calendar
              </MenuItem>
              <MenuItem
                icon={<HelpOutlineOutlinedIcon />}
                component={<Link to="/faq" />}
                active={selected === "FAQ Page"}
                onClick={() => handleMenuItemClick("FAQ Page")}
              >
                FAQ Page
              </MenuItem>

              {!collapsed && <Typography className="section-header">
                Analytics & Charts
              </Typography>}
              <MenuItem
                icon={<BarChartOutlinedIcon />}
                component={<Link to="/bar" />}
                active={selected === "Bar Chart"}
                onClick={() => handleMenuItemClick("Bar Chart")}
              >
                Bar Chart
              </MenuItem>
              <MenuItem
                icon={<PieChartOutlineOutlinedIcon />}
                component={<Link to="/pie" />}
                active={selected === "Pie Chart"}
                onClick={() => handleMenuItemClick("Pie Chart")}
              >
                Pie Chart
              </MenuItem>
              <MenuItem
                icon={<TimelineOutlinedIcon />}
                component={<Link to="/line" />}
                active={selected === "Line Chart"}
                onClick={() => handleMenuItemClick("Line Chart")}
              >
                Line Chart
              </MenuItem>
            </>
          )}
        </Box>
      </Menu>
    </Sidebar>
  </Box>
);
};

export default SideBar;