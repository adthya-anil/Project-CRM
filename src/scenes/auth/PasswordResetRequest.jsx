// scenes/auth/PasswordResetRequest.jsx
import { useState } from "react";
import { supabase } from "../../../supabaseClient";
import { Box, Button, TextField, Typography } from "@mui/material";

export default function PasswordResetRequest() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  const handleResetRequest = async () => {
    setStatus("Sending reset link...");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setStatus(`Error: ${error.message}`);
    } else {
      setStatus("Password reset email sent. Check your inbox.");
    }
  };

  return (
    <Box p={3} maxWidth={400} mx="auto">
      <Typography variant="h5" mb={2}>Reset Your Password</Typography>
      <TextField
        label="Email"
        type="email"
        fullWidth
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Button variant="contained" fullWidth onClick={handleResetRequest} sx={{color:'white !important'}}>
        Send Reset Link
      </Button>
      {status && <Typography mt={2}>{status}</Typography>}
    </Box>
  );
}
