import { Box, IconButton, InputBase, useTheme } from "@mui/material";
import { useContext, useState } from "react";
import { ColorModeContext, tokens } from "../../theme";
import { supabase } from "../../supabaseClient";
import { useQueryClient } from "@tanstack/react-query";
//import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
//import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import SearchIcon from "@mui/icons-material/Search";
import NotificationPanel from "../components/NotificationPanel";

const TopBar = ({ isAdmin }) => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);

  const [showNotifications, setShowNotifications] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" p={2}>
        {/* Search bar */}
        <Box
          display="flex"
          alignItems="center"
          backgroundColor={colors.primary[500]}
          borderRadius="8px"
          px={2}
        >
          <InputBase
            sx={{ color: colors.text[500], flex: 1 }}
            placeholder="Search"
          />
          <IconButton type="button" sx={{ color: colors.text[500] }}>
            <SearchIcon />
          </IconButton>
        </Box>

        {/* Icons section */}
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton
            sx={{ color: colors.text[500] }}
            onClick={() => setShowNotifications(true)}
          >
            <NotificationsOutlinedIcon />
          </IconButton>

          {/* <IconButton onClick={colorMode.toggleColorMode} sx={{ color: colors.text[500] }}>
            {theme.palette.mode === "dark" ? (
              <DarkModeOutlinedIcon />
            ) : (
              <LightModeOutlinedIcon />
            )}
          </IconButton> */}

          <IconButton sx={{ color: colors.text[500] }} onClick={handleSignOut}>
            <ExitToAppIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Notification Drawer */}
      <NotificationPanel
        isAdmin={isAdmin}
        supabaseClient={supabase}
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
};

export default TopBar;
