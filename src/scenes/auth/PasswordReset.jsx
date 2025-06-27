import { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import { Box, Button, TextField, Typography } from "@mui/material";

export default function PasswordReset() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        setStatus("Session not found. Please use the link from your email again.");
      } else {
        setIsReady(true);
      }
    };
    checkSession();
  }, []);

const handleUpdatePassword = async () => {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    setStatus(`Error: ${error.message}`);
  } else {
    setStatus("✅ Password updated! Redirecting to login...");
    await supabase.auth.signOut();

    // Redirect to sign-in page after 3 seconds
    setTimeout(() => {
      window.location.href = "/";
    }, 1500);
  }
};


  return (
    <Box p={3} maxWidth={400} mx="auto">
      <Typography variant="h5" mb={2}>Set New Password</Typography>
      {!isReady ? (
        <Typography>{status || "Loading..."}</Typography>
      ) : (
        <>
          <TextField
            label="New Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button fullWidth variant="contained" onClick={handleUpdatePassword} sx={{color:'white !important'}}>
            Update Password
          </Button>
          {status && <Typography mt={2}>{status}</Typography>}
        </>
      )}
    </Box>
  );
}
