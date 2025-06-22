import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Box
} from "@mui/material";
import { supabase } from "../../supabaseClient"; // Adjust your Supabase client import

const ScoreCell = ({ row }) => {
  const [open, setOpen] = useState(false);
  const [recency, setRecency] = useState(row.recency || 1);
  const [frequency, setFrequency] = useState(row.frequency || 1);
  const [monetary, setMonetary] = useState(row.monetary || 1);
  const [score, setScore] = useState(row.score || 1);
  const [classification, setClassification] = useState(row.classification || "Cold");

  useEffect(() => {
    const fetchLeadData = async () => {
      const { data, error } = await supabase
        .from("mock") // replace with your actual table
        .select("recency, frequency, monetary, score, classification")
        .eq("id", row.id)
        .single();

      if (error) {
        console.error("Error fetching lead data:", error.message);
        return;
      }

      setRecency(data.recency || 1);
      setFrequency(data.frequency || 1);
      setMonetary(data.monetary || 1);
      setScore(data.score || 1);
      setClassification(data.classification || "Cold");
    };

    fetchLeadData();
  }, [row.id]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSave = async () => {
    // Calculate score and classification
    const r = Math.min(5, recency);
    const f = Math.min(5, frequency);
    const m = Math.min(5, monetary);
    const finalScore = r * f * m;

    let classificationResult = "Cold";
    if (finalScore >= 100) classificationResult = "Hot";
    else if (finalScore >= 50) classificationResult = "Warm";

    // Update local state
    setScore(finalScore);
    setClassification(classificationResult);

    // Update in Supabase with the freshly calculated values
    const { error } = await supabase
      .from("mock") // replace with your actual table name
      .update({
        recency,
        frequency,
        monetary,
        score: finalScore,
        classification: classificationResult
      })
      .eq("id", row.id);

    if (error) {
      console.error("Error updating lead:", error.message);
    } else {
      console.log("Lead updated successfully!");
      handleClose();
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        onClick={handleClickOpen}
        sx={{
          color: "#3196c6",
          borderColor: "#3196c6",
          "&:hover": { backgroundColor: "rgba(49, 150, 198, 0.1)" }
        }}
      >
        {score > 0 ? `Score: ${score} (${classification})` : "Set Score"}
      </Button>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Set Lead Score</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} my={2}>
            <TextField
              label="Recency (max 5)"
              type="number"
              inputProps={{ max: 5, min: 1 }}
              value={recency}
              onChange={(e) => setRecency(Number(e.target.value))}
              fullWidth
            />
            <TextField
              label="Frequency (max 5)"
              type="number"
              inputProps={{ max: 5, min: 1 }}
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))}
              fullWidth
            />
            <TextField
              label="Monetary (max 5)"
              type="number"
              inputProps={{ max: 5, min: 1 }}
              value={monetary}
              onChange={(e) => setMonetary(Number(e.target.value))}
              fullWidth
            />
            <Typography variant="body1" color="primary">
              Final Score: {score}
            </Typography>
            <Typography
              variant="body2"
              color={
                classification === "Hot"
                  ? "red"
                  : classification === "Warm"
                  ? "orange"
                  : "gray"
              }
            >
              Classification: {classification}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{ background: "#0a3456" }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ScoreCell;
