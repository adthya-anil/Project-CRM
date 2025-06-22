import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  TextField,
  Button,
  Grid,
  Box,
  Typography,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Divider,
  Container,
  Chip,
  IconButton,
  Alert, 
  AlertTitle, 
  CircularProgress
} from "@mui/material";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "../../../supabaseClient";
import Papa from "papaparse";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';



const CSVUploader = () => {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    
    const batchInsert = async (rows, batchSize = 100) => {
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const { error } = await supabase.from("mock").insert(chunk);
    if (error) {
      console.error("Error inserting batch:", error);
      throw error;
    }
  }
};


    setUploading(true);
    setMessage("");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async function (results) {
  const rows = results.data.map((row) => ({
    ...row,
    coursesAttended: row.coursesAttended ? JSON.parse(row.coursesAttended) : [],
    referrals: row.referrals ? JSON.parse(row.referrals) : [],
    recency: row.recency ? Number(row.recency) : 0,
    frequency: row.frequency ? Number(row.frequency) : 0,
    monetary: row.monetary ? Number(row.monetary) : 0,
    score: row.score ? Number(row.score) : 0,
    created_at: row.created_at || new Date().toISOString(),
    status_updated_at: row.status_updated_at || new Date().toISOString()
  }));

  try {
    await batchInsert(rows); // insert in batches of 100
    setMessage("CSV data uploaded successfully!");
  } catch (error) {
    console.error("Upload error:", error);
    setMessage("Failed to upload data: " + error.message);
  }

  setUploading(false);
},
      error: function (err) {
        console.error("Parsing error:", err);
        setMessage("Failed to parse CSV file.");
        setUploading(false);
      }
    });
  };

  return (
    <Box 
  sx={{ 
    my: 3,
    p: 3,
    border: '2px dashed #e0e7ff',
    borderRadius: 2,
    backgroundColor: '#fafbff',
    transition: 'all 0.3s ease',
    '&:hover': {
      borderColor: '#3b82f6',
      backgroundColor: '#f8faff'
    }
  }}
>
  <Typography 
    variant="h6" 
    sx={{ 
      fontWeight: 600, 
      color: '#0a3456', 
      mb: 2,
      display: 'flex',
      alignItems: 'center',
      gap: 1
    }}
  >
    📊 Bulk Upload CSV
  </Typography>
  
  <Box sx={{ mb: 2 }}>
    <input
      type="file"
      accept=".csv"
      onChange={handleFileUpload}
      disabled={uploading}
      id="csv-upload"
      style={{ display: 'none' }}
    />
    <label htmlFor="csv-upload">
      <Button
        variant="outlined"
        component="span"
        disabled={uploading}
        startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
        sx={{
          borderColor: '#3b82f6',
          color: '#3b82f6',
          fontWeight: 500,
          px: 3,
          py: 1.5,
          borderRadius: 2,
          textTransform: 'none',
          fontSize: '0.95rem',
          '&:hover': {
            borderColor: '#2563eb',
            backgroundColor: '#eff6ff'
          },
          '&:disabled': {
            opacity: 0.6
          }
        }}
      >
        {uploading ? 'Uploading...' : 'Choose CSV File'}
      </Button>
    </label>
  </Box>

  {message && (
    <Alert 
      severity={uploading ? "info" : "success"}
      sx={{ 
        mt: 2,
        borderRadius: 2,
        '& .MuiAlert-icon': {
          fontSize: '1.2rem'
        }
      }}
    >
      <AlertTitle sx={{ fontWeight: 600 }}>
        {uploading ? 'Processing' : 'Success'}
      </AlertTitle>
      {message}
    </Alert>
  )}

  <Typography 
    variant="body2" 
    sx={{ 
      color: '#6b7280',
      mt: 2,
      fontStyle: 'italic'
    }}
  >
    💡 Tip: Ensure your CSV file has the correct headers and format
  </Typography>
</Box>
  );
};


const Form = () => {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  const [coursesAttended, setCoursesAttended] = useState([""]);
  const [referrals, setReferrals] = useState([""]);
 
 
  async function insertLeadRow(newLead) {
  const { data, error } = await supabase
    .from("mock")
    .insert([newLead]) // Insert a single row (or multiple rows as an array)

  if (error) {
    console.error("Error inserting row:", error.message);
    return;
  }

  console.log("Row inserted successfully:", data);
}

  const onSubmit = (data) => {
    // Filter out empty strings from arrays
    const filteredCourses = coursesAttended.filter(course => course.trim() !== "");
    const filteredReferrals = referrals.filter(referral => referral.trim() !== "");
    
    const finalData = {
      ...data,
      coursesAttended: filteredCourses,
      referrals: filteredReferrals
    };
    
    insertLeadRow(finalData);
    reset();
  };

  const addCourseField = () => {
    setCoursesAttended([...coursesAttended, ""]);
  };

  const removeCourseField = (index) => {
    if (coursesAttended.length > 1) {
      const newCourses = coursesAttended.filter((_, i) => i !== index);
      setCoursesAttended(newCourses);
    }
  };

  const updateCourseField = (index, value) => {
    const newCourses = [...coursesAttended];
    newCourses[index] = value;
    setCoursesAttended(newCourses);
  };

  const addReferralField = () => {
    setReferrals([...referrals, ""]);
  };

  const removeReferralField = (index) => {
    if (referrals.length > 1) {
      const newReferrals = referrals.filter((_, i) => i !== index);
      setReferrals(newReferrals);
    }
  };

  const updateReferralField = (index, value) => {
    const newReferrals = [...referrals];
    newReferrals[index] = value;
    setReferrals(newReferrals);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <CSVUploader />
      <Paper 
        elevation={8} 
        sx={{ 
          borderRadius: 3,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)'
        }}
      >
        {/* Header Section */}
        <Box 
          sx={{ 
            background: 'linear-gradient(135deg, #0a3456 0%, #3196c6 100%)',
            px: 4,
            py: 5,
            textAlign: 'center',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)'
            }
          }}
        >
          <Typography 
            variant="h3" 
            sx={{ 
              color: 'white',
              fontWeight: 700,
              mb: 1,
              position: 'relative',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            Create New Lead
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'rgba(255,255,255,0.9)',
              fontWeight: 300,
              position: 'relative'
            }}
          >
            Build your sales pipeline with detailed lead information
          </Typography>
        </Box>

        <Box sx={{ px: 5, py: 4 }}>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            
            {/* Personal Information Section */}
            <Box sx={{ mb: 5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box 
                  sx={{ 
                    width: 4, 
                    height: 40, 
                    background: 'linear-gradient(135deg, #0a3456, #3196c6)',
                    borderRadius: 2,
                    mr: 2 
                  }} 
                />
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#0a3456 !important',
                    letterSpacing: '0.5px'
                  }}
                >
                  Personal Information
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    {...register("Name", { required: "Name is required" })}
                    error={!!errors.Name}
                    helperText={errors.Name?.message}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: '',
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3196c6',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#0a3456',
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: 'black',
                      },
                      'input': {
                        color: '#0a3456',
                      }
                    }}
                  />
                </Grid>

                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    fullWidth
                    label="Email"
                    {...register("Email", {
                      required: "Email is required",
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: "Invalid email format",
                      },
                    })}
                    error={!!errors.Email}
                    helperText={errors.Email?.message}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white',
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3196c6',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#0a3456',
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#0a3456',
                      },
                      'input': {
                        color: '#0a3456',
                      }
                    }}
                  />
                </Grid>

                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    fullWidth
                    label="Job Title"
                    {...register("JobTitle")}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white',
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3196c6',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#0a3456',
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#0a3456',
                      },
                      'input': {
                        color: '#0a3456',
                      }
                    }}
                  />
                </Grid>

                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    {...register("Phone")}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white',
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3196c6',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#0a3456',
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#0a3456',
                      },
                      'input': {
                        color: '#0a3456',
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 4, borderColor: 'rgba(49, 150, 198, 0.2)' }} />

            {/* Location & Organization Section */}
            <Box sx={{ mb: 5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box 
                  sx={{ 
                    width: 4, 
                    height: 40, 
                    background: 'linear-gradient(135deg, #3196c6, #0a3456)',
                    borderRadius: 2,
                    mr: 2 
                  }} 
                />
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#0a3456 !important',
                    letterSpacing: '0.5px'
                  }}
                >
                  Location & Organization
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    fullWidth
                    label="State"
                    {...register("State")}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white',
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3196c6',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#0a3456',
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#0a3456',
                      },
                      'input': {
                        color: '#0a3456',
                      }
                    }}
                  />
                </Grid>

                <Grid size={{xs: 12, md: 6}}>
                  <TextField
                    fullWidth
                    label="Country"
                    {...register("Country")}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white',
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3196c6',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#0a3456',
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#0a3456',
                      },
                      'input': {
                        color: '#0a3456',
                      }
                    }}
                  />
                </Grid>

                <Grid size={{xs: 12}}>
                  <TextField
                    fullWidth
                    label="Organization"
                    {...register("Organization")}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white',
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3196c6',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#0a3456',
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#0a3456',
                      },
                      'input': {
                        color: '#0a3456',
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 4, borderColor: 'rgba(49, 150, 198, 0.2)' }} />

            {/* Courses & Referrals Section */}
            <Box sx={{ mb: 5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box 
                  sx={{ 
                    width: 4, 
                    height: 40, 
                    background: 'linear-gradient(135deg, #3196c6, #0a3456)',
                    borderRadius: 2,
                    mr: 2 
                  }} 
                />
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#0a3456 !important',
                    letterSpacing: '0.5px'
                  }}
                >
                  Courses & Referrals
                </Typography>
              </Box>
              
              <Grid container spacing={4}>
                {/* Courses Attended */}
                <Grid size={{xs: 12, md: 6}}>
                  <Paper 
                    elevation={2}
                    sx={{ 
                      p: 4, 
                      borderRadius: 3,
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      border: '1px solid rgba(49, 150, 198, 0.2)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 8px 25px rgba(10, 52, 86, 0.15)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600, 
                          color: '#0a3456'
                        }}
                      >
                        Courses Attended
                      </Typography>
                      <Button
                        onClick={addCourseField}
                        size="small"
                        sx={{ 
                          color: '#3196c6',
                          '&:hover': { backgroundColor: 'rgba(49, 150, 198, 0.1)' }
                        }}
                      >
                        <Plus size={16} style={{ marginRight: '4px' }} />
                        Add
                      </Button>
                    </Box>
                    
                    {coursesAttended.map((course, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <TextField
                          fullWidth
                          label={`Course ${index + 1}`}
                          value={course}
                          onChange={(e) => updateCourseField(index, e.target.value)}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: 'white',
                              borderRadius: 2,
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#3196c6',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#0a3456',
                              }
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                              color: '#0a3456',
                            },
                      'input': {
                        color: '#0a3456',
                      }
                          }}
                        />
                        {coursesAttended.length > 1 && (
                          <IconButton
                            onClick={() => removeCourseField(index)}
                            sx={{ ml: 1, color: '#ef4444' }}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        )}
                      </Box>
                    ))}
                  </Paper>
                </Grid>
                <Grid size={{xs: 12, md: 6}}>
  <Paper
    elevation={2}
    sx={{
      p: 4,
      borderRadius: 3,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      border: '1px solid rgba(49, 150, 198, 0.2)',
      transition: 'all 0.3s ease',
      '&:hover': {
        boxShadow: '0 8px 25px rgba(10, 52, 86, 0.15)',
        transform: 'translateY(-2px)'
      }
    }}
  >
    <Typography
      variant="h6"
      sx={{
        fontWeight: 600,
        color: '#0a3456',
        mb: 2
      }}
    >
      Next Course
    </Typography>
    <TextField
      fullWidth
      label="Next Course"
      {...register("next_course")}
      sx={{
        '& .MuiOutlinedInput-root': {
          backgroundColor: 'white',
          borderRadius: 2,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3196c6',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0a3456',
          }
        },
        '& .MuiInputLabel-root.Mui-focused': {
          color: '#0a3456',
        },
        'input': {
          color: '#0a3456',
        }
      }}
    />
  </Paper>
</Grid>


                {/* Referrals */}
                <Grid size={{xs: 12, md: 6}}>
                  <Paper 
                    elevation={2}
                    sx={{ 
                      p: 4, 
                      borderRadius: 3,
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      border: '1px solid rgba(49, 150, 198, 0.2)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 8px 25px rgba(10, 52, 86, 0.15)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600, 
                          color: '#0a3456'
                        }}
                      >
                        Referrals
                      </Typography>
                      <Button
                        onClick={addReferralField}
                        size="small"
                        sx={{ 
                          color: '#3196c6',
                          '&:hover': { backgroundColor: 'rgba(49, 150, 198, 0.1)' }
                        }}
                      >
                        <Plus size={16} style={{ marginRight: '4px' }} />
                        Add
                      </Button>
                    </Box>
                    
                    {referrals.map((referral, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <TextField
                          fullWidth
                          label={`Referral ${index + 1}`}
                          value={referral}
                          onChange={(e) => updateReferralField(index, e.target.value)}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: 'white',
                              borderRadius: 2,
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#3196c6',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#0a3456',
                              }
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                              color: '#0a3456',
                            },
                      'input': {
                        color: '#0a3456',
                      }
                          }}
                        />
                        {referrals.length > 1 && (
                          <IconButton
                            onClick={() => removeReferralField(index)}
                            sx={{ ml: 1, color: '#ef4444' }}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        )}
                      </Box>
                    ))}
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 4, borderColor: 'rgba(49, 150, 198, 0.2)' }} />

            {/* Lead Classification Section */}
            <Box sx={{ mb: 5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box 
                  sx={{ 
                    width: 4, 
                    height: 40, 
                    background: 'linear-gradient(135deg, #0a3456, #3196c6)',
                    borderRadius: 2,
                    mr: 2 
                  }} 
                />
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 600,
                    color: '#0a3456 !important',
                    letterSpacing: '0.5px'
                  }}
                >
                  Lead Classification
                </Typography>
              </Box>
              
              <Grid container spacing={4}>
                <Grid size={{xs: 12, md: 4}}>
                  <Paper 
                    elevation={2}
                    sx={{ 
                      p: 4, 
                      borderRadius: 3,
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      border: '1px solid rgba(49, 150, 198, 0.2)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 8px 25px rgba(10, 52, 86, 0.15)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <FormControl component="fieldset" fullWidth>
                      <FormLabel 
                        component="legend" 
                        sx={{ 
                          fontWeight: 600, 
                          color: '#0a3456',
                          fontSize: '1.1rem',
                          mb: 2
                        }}
                      >
                        Lead Temperature
                      </FormLabel>
                      <Controller
                        name="temperature"
                        control={control}
                        defaultValue=""
                        rules={{required: 'Please Select An Option'}}
                        render={({ field }) => (
                          <RadioGroup column {...field}>
                            <FormControlLabel 
                              value="Hot" 
                              control={<Radio sx={{ color: '#e85f5c', '&.Mui-checked': { color: '#e85f5c' } }} />} 
                              label={<Typography sx={{ fontWeight: 500, color: '#e85f5c' }}>HOT</Typography>}
                              sx={{ mb: 1 }}
                            />
                            <FormControlLabel 
                              value="Warm" 
                              control={<Radio sx={{ color: 'orange', '&.Mui-checked': { color: 'orange' } }} />} 
                              label={<Typography sx={{ fontWeight: 500, color: 'orange' }}>WARM</Typography>}
                              sx={{ mb: 1 }}
                            />
                            <FormControlLabel 
                              value="Cold" 
                              control={<Radio sx={{ color: '#6b7280', '&.Mui-checked': { color: '#6b7280' } }} />} 
                              label={<Typography sx={{ fontWeight: 500, color: '#6b7280' }}>COLD</Typography>}
                            />
                          </RadioGroup>
                        )}
                      />
                    </FormControl>
                  </Paper>
                </Grid>
                
                <Grid size={{xs: 12, md: 4}}>
                  <Paper 
                    elevation={2}
                    sx={{ 
                      p: 4, 
                      borderRadius: 3,
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      border: '1px solid rgba(49, 150, 198, 0.2)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 8px 25px rgba(10, 52, 86, 0.15)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <Controller
                      name="status"
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel 
                            id="status"
                            sx={{ 
                              fontWeight: 500,
                              '&.Mui-focused': { color: '#0a3456' },
                      'input': {
                        color: '#0a3456',
                      }
                            }}
                          >
                            Status
                          </InputLabel>
                          <Select
                            labelId="status"
                            label="Status"
                            {...field}
                            sx={{
                              borderRadius: 2,
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(49, 150, 198, 0.3)',
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#3196c6',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#0a3456',
                              },
                       "& .MuiSelect-select": {
                                  color: "#0a3456", //  changes selected value text color
                                },
                            }}
                          >
                            <MenuItem value="Converted">Converted</MenuItem>
                            <MenuItem value="Converting">Converting</MenuItem>
                            <MenuItem value="Idle">Idle</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Paper>
                </Grid>

                <Grid size={{xs: 12, md: 4}}>
                  <Paper 
                    elevation={2}
                    sx={{ 
                      p: 4, 
                      borderRadius: 3,
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      border: '1px solid rgba(49, 150, 198, 0.2)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 8px 25px rgba(10, 52, 86, 0.15)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <TextField
                      fullWidth
                      label="Source"
                      {...register("Source")}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'white',
                          borderRadius: 2,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#3196c6',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#0a3456',
                          }
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#0a3456',
                        },
                        'input': {
                          color: '#0a3456',
                        }
                      }}
                    />
                  </Paper>
                </Grid>
              </Grid>
            </Box>

            {/* Submit Button */}
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 3 }}>
              <Button 
                type="submit" 
                variant="contained" 
                size="large"
                sx={{ 
                  px: 6, 
                  py: 2,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #0a3456 0%, #3196c6 100%)',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 8px 25px rgba(10, 52, 86, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0a3456 0%, #2680b0 100%)',
                    boxShadow: '0 12px 35px rgba(10, 52, 86, 0.4)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Create Lead
              </Button>
            </Box>
          </form>
        </Box>
      </Paper>
    </Container>
  );
};

export default Form;