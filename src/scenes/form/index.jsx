import React, { useState, useRef, useEffect } from "react";
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
  List,
  IconButton,
  ListItem, 
  ListItemText, 
 Container,
 CircularProgress,
 Alert,
 Checkbox,
 FormGroup
} from "@mui/material";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "../../../supabaseClient";
import Papa from "papaparse";
//import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { Upload, FileText } from 'lucide-react';


const CSVUploader = ({ tableName = 'mock' }) => {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState([]);

  // Expected columns for CRM schema
  const expectedColumns = [
    "Name", "JobTitle", "Phone", "Email", "State", "Country", "Organization", 
    "temperature", "timestamp", "status", "coursesAttended", "referrals", 
    "Source", "recency", "frequency", "monetary", "score", "classification", 
    "next_course", "created_at", "status_updated_at"
  ];

  // Header normalization mapping
// Keyword-based header detection
const detectHeaderByKeywords = (header) => {
  // Remove all non-alphanumeric characters and normalize
  const cleanHeader = header.toLowerCase().trim().replace(/[^a-z]/g, '');
  
  // Name detection
  if (cleanHeader.includes('name') || 
      cleanHeader.includes('fullname') ||
      cleanHeader.includes('firstname') ||
      cleanHeader.includes('lastname')) {
    return 'Name';
  }
  
  // Phone detection
  if (cleanHeader.includes('phone') || cleanHeader.includes('mobile') || 
      cleanHeader.includes('contact') || cleanHeader.includes('number')) {
    return 'Phone';
  }
  
  // Email detection
  if (cleanHeader.includes('email') || cleanHeader.includes('mail')) {
    return 'Email';
  }
  
  // JobTitle detection
  if (cleanHeader.includes('job') || cleanHeader.includes('title') || 
      cleanHeader.includes('occupation') || cleanHeader.includes('position') ||
      cleanHeader.includes('work') || cleanHeader.includes('role')) {
    return 'JobTitle';
  }
  
  // Organization detection
  if (cleanHeader.includes('organization') || cleanHeader.includes('organisation') ||
      cleanHeader.includes('company') || cleanHeader.includes('firm') ||
      cleanHeader.includes('employer')) {
    return 'Organization';
  }
  
  // State detection
  if (cleanHeader.includes('state') || cleanHeader.includes('city') ||
      cleanHeader.includes('district') || cleanHeader.includes('location') ||
      cleanHeader.includes('region')) {
    return 'State';
  }
  
  // Country detection
  if (cleanHeader.includes('country') || cleanHeader.includes('nation')) {
    return 'Country';
  }
  
  // Source detection
  if (cleanHeader.includes('source') || cleanHeader.includes('lead')) {
    return 'Source';
  }
  
  // Temperature detection
  if (cleanHeader.includes('temp') || cleanHeader.includes('temperature')) {
    return 'temperature';
  }
  
  // Status detection
  if (cleanHeader.includes('status')) {
    return 'status';
  }
  
  // Timestamp detection
  if (cleanHeader.includes('time') || cleanHeader.includes('date') ||
      cleanHeader.includes('stamp')) {
    return 'timestamp';
  }
  
  // Created at detection
  if (cleanHeader.includes('created')) {
    return 'created_at';
  }
  
  // Updated at detection
  if (cleanHeader.includes('updated') || cleanHeader.includes('modified')) {
    return 'status_updated_at';
  }
  
  // Courses detection
  // if (cleanHeader.includes('course') || cleanHeader.includes('training') ||
  //     cleanHeader.includes('attended')) {
  //   return 'coursesAttended';
  // }
  
  // Referrals detection
  if (cleanHeader.includes('referral') || cleanHeader.includes('refer')) {
    return 'referrals';
  }
  
  // RFM fields detection
  if (cleanHeader.includes('recency')) return 'recency';
  if (cleanHeader.includes('frequency')) return 'frequency';
  if (cleanHeader.includes('monetary')) return 'monetary';
  if (cleanHeader.includes('score')) return 'score';
  
  // Classification detection
  if (cleanHeader.includes('class') || cleanHeader.includes('category') ||
      cleanHeader.includes('type') || cleanHeader.includes('segment')) {
    return 'classification';
  }
  
  // Next course detection
  if (cleanHeader.includes('next') && cleanHeader.includes('course')) {
    return 'next_course';
  }
  
  // If no keywords match, return original header
  return header;
};


  const convertISTToUTC = (istDateString) => {
    if (!istDateString || istDateString === 'null' || istDateString === '') {
      return null;
    }
    
    try {
      const date = new Date(istDateString);
      if (isNaN(date.getTime())) {
        return null;
      }
      
      // Convert IST (UTC+5:30) to UTC
      const utcDate = new Date(date.getTime() - (5.5 * 60 * 60 * 1000));
      return utcDate;
    } catch (error) {
      console.error('Date conversion error:', error);
      return null;
    }
  };

  const formatPhoneNumber = (phoneValue) => {
    if (!phoneValue || phoneValue === 'null' || phoneValue === '') {
      return 'null';
    }
    
    let phoneStr = String(phoneValue);
    
    // Handle scientific notation (e.g., 9.19541E+11)
    if (phoneStr.includes('E+') || phoneStr.includes('e+')) {
      try {
        const phoneNum = parseFloat(phoneStr);
        if (!isNaN(phoneNum)) {
          phoneStr = phoneNum.toString();
        }
      } catch (error) {
        console.error('Phone number conversion error:', error);
      }
    }
    
    // Remove any non-digit characters except +
    phoneStr = phoneStr.replace(/[^\d+]/g, '');
    
    // Ensure it starts with + if it's an international number
    if (phoneStr.length > 10 && !phoneStr.startsWith('+')) {
      phoneStr = '+' + phoneStr;
    }
    
    return phoneStr;
  };

  const validateAndCleanData = (row) => {
    const cleanedRow = {};
    
    expectedColumns.forEach(column => {
      const value = row[column];
      
      switch (column) {
        case 'Phone':
          cleanedRow[column] = formatPhoneNumber(value);
          break;
          
        case 'recency':
        case 'frequency':
        case 'monetary':
          if (value === undefined || value === null || value === '' || value === 'null') {
            cleanedRow[column] = null;
          } else {
            const numValue = Number(value);
            if (isNaN(numValue)) {
              cleanedRow[column] = null;
            } else if (numValue >= 6) {
              cleanedRow[column] = 5;
            } else {
              cleanedRow[column] = numValue;
            }
          }
          break;
          
        case 'score':
          if (value === undefined || value === null || value === '' || value === 'null') {
            cleanedRow[column] = null;
          } else {
            const numValue = Number(value);
            if (isNaN(numValue)) {
              cleanedRow[column] = null;
            } else if (numValue >= 126) {
              cleanedRow[column] = 125;
            } else {
              cleanedRow[column] = numValue;
            }
          }
          break;
          
        case 'status':
          const validStatuses = ['Converted', 'Converting', 'Idle'];
          cleanedRow[column] = validStatuses.includes(value) ? value : 'Idle';
          break;
          
        case 'temperature':
          const validTemperatures = ['Hot', 'Warm', 'Cold'];
          cleanedRow[column] = validTemperatures.includes(value) ? value : 'Cold';
          break;
          
        // In your validateAndCleanData function, replace the coursesAttended and referrals case with this:

case 'coursesAttended':
case 'referrals':
  if (value === undefined || value === null || value === '' || value === 'null') {
    cleanedRow[column] = []; // Empty array for Supabase
  } else if (Array.isArray(value)) {
    // If it's already an array, ensure all elements are strings
    cleanedRow[column] = value.map(item => String(item).trim()).filter(item => item !== '');
  } else if (typeof value === 'string') {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        cleanedRow[column] = parsed.map(item => String(item).trim()).filter(item => item !== '');
      } else {
        // If JSON parsing gives non-array, treat as comma-separated
        cleanedRow[column] = [String(parsed).trim()].filter(item => item !== '');
      }
    } catch (error) {
      // If JSON parsing fails, split by comma
      const items = value.split(',').map(item => item.trim()).filter(item => item !== '');
      cleanedRow[column] = items.length > 0 ? items : [];
    }
  } else {
    // For any other type, convert to string and wrap in array
    const stringValue = String(value).trim();
    cleanedRow[column] = stringValue !== '' ? [stringValue] : [];
  }
  break;
          
        case 'timestamp':
          const utcDate = convertISTToUTC(value);
          if (utcDate) {
            cleanedRow[column] = utcDate.toISOString().slice(0, -1);
          } else {
            cleanedRow[column] = new Date().toISOString().slice(0, -1);
          }
          break;
          
        case 'created_at':
        case 'status_updated_at':
          const utcDateWithZ = convertISTToUTC(value);
          if (utcDateWithZ) {
            cleanedRow[column] = utcDateWithZ.toISOString();
          } else {
            cleanedRow[column] = new Date().toISOString();
          }
          break;
          
        default:
          if (value === undefined || value === null || value === '') {
            cleanedRow[column] = 'null';
          } else {
            cleanedRow[column] = String(value).trim();
          }
          break;
      }
    });
    
    return cleanedRow;
  };

  const checkExistingRecords = async (data) => {
    try {
      const phones = data.map(row => row.Phone).filter(phone => phone && phone !== 'null');
      const emails = data.map(row => row.Email).filter(email => email && email !== 'null');
      
      const promises = [];
      
      // Check existing phone numbers
      if (phones.length > 0) {
        promises.push(
          supabase
            .from(tableName)
            .select('Phone')
            .in('Phone', phones)
        );
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }
      
      // Check existing emails
      if (emails.length > 0) {
        promises.push(
          supabase
            .from(tableName)
            .select('Email')
            .in('Email', emails)
        );
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }
      
      const [phoneResult, emailResult] = await Promise.all(promises);
      
      if (phoneResult.error) throw phoneResult.error;
      if (emailResult.error) throw emailResult.error;
      
      const existingPhoneSet = new Set((phoneResult.data || []).map(record => record.Phone));
      const existingEmailSet = new Set((emailResult.data || []).map(record => record.Email?.toLowerCase()));
      
      return { existingPhoneSet, existingEmailSet };
    } catch (error) {
      console.error('Error checking existing records:', error);
      throw error;
    }
  };

  const checkAllDuplicates = async (data) => {
    const duplicateErrors = [];
    const phoneNumbers = new Set();
    const emails = new Set();
    
    const { existingPhoneSet, existingEmailSet } = await checkExistingRecords(data);
    
    data.forEach((row, index) => {
      const rowNumber = index + 1;
      
      // Check for duplicate phone numbers within the file
      if (row.Phone && row.Phone !== 'null') {
        if (phoneNumbers.has(row.Phone)) {
          duplicateErrors.push({
            type: 'file_duplicate',
            field: 'Phone',
            value: row.Phone,
            row: rowNumber,
            message: `Row ${rowNumber}: Duplicate phone number "${row.Phone}" found in uploaded file`
          });
        } else {
          phoneNumbers.add(row.Phone);
        }
        
        if (existingPhoneSet.has(row.Phone)) {
          duplicateErrors.push({
            type: 'database_duplicate',
            field: 'Phone',
            value: row.Phone,
            row: rowNumber,
            message: `Row ${rowNumber}: Phone number "${row.Phone}" already exists in database`
          });
        }
      }
      
      // Check for duplicate emails within the file
      if (row.Email && row.Email !== 'null') {
        const emailLower = row.Email.toLowerCase();
        if (emails.has(emailLower)) {
          duplicateErrors.push({
            type: 'file_duplicate',
            field: 'Email',
            value: row.Email,
            row: rowNumber,
            message: `Row ${rowNumber}: Duplicate email "${row.Email}" found in uploaded file`
          });
        } else {
          emails.add(emailLower);
        }
        
        if (existingEmailSet.has(emailLower)) {
          duplicateErrors.push({
            type: 'database_duplicate',
            field: 'Email',
            value: row.Email,
            row: rowNumber,
            message: `Row ${rowNumber}: Email "${row.Email}" already exists in database`
          });
        }
      }
    });
    
    return duplicateErrors;
  };

  const insertIntoSupabase = async (data) => {
    try {
      const results = {
        successful: [],
        failed: [],
        totalProcessed: 0
      };
      
      for (let i = 0; i < data.length; i++) {
        try {
          results.totalProcessed++;
          
          const { data: insertedRecord, error } = await supabase
            .from(tableName)
            .insert([data[i]])
            .select();
          
          if (error) throw error;
          
          results.successful.push({
            row: i + 1,
            data: data[i]
          });
          
        } catch (error) {
          let errorMessage = error.message;
          let duplicateField = null;
          let duplicateValue = null;
          
          if (errorMessage.includes('unique constraint') || errorMessage.includes('duplicate key')) {
            if (errorMessage.toLowerCase().includes('phone')) {
              duplicateField = 'Phone';
              duplicateValue = data[i].Phone;
            } else if (errorMessage.toLowerCase().includes('email')) {
              duplicateField = 'Email';
              duplicateValue = data[i].Email;
            }
          }
          
          results.failed.push({
            row: i + 1,
            data: data[i],
            error: errorMessage,
            duplicateField,
            duplicateValue
          });
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!supabase) {
      setMessage("Supabase client not provided");
      return;
    }

    setUploading(true);
    setMessage("");
    setErrors([]);

    Papa.parse(file, {
  header: true,
  skipEmptyLines: true,
  transformHeader: (header) => {
    // Normalize headers during parsing
    const detectedHeader = detectHeaderByKeywords(header);
    console.log(`Header mapping: "${header}" -> "${detectedHeader}"`);
    return detectedHeader;
  },
  complete: async function (results) {
    try {
      
      console.log('Normalized headers:', results.meta.fields);
      console.log('Sample parsed data:', results.data.slice(0, 2));
      
      // Data is already normalized by transformHeader
      const normalizedData = results.data;
      
      console.log('Sample normalized data:', normalizedData.slice(0, 2));
          
          const cleanedData = normalizedData.map(validateAndCleanData);
          
          console.log('Sample cleaned data:', cleanedData.slice(0, 2));
          
          const duplicateErrors = await checkAllDuplicates(cleanedData);
          
          if (duplicateErrors.length > 0) {
            setErrors(duplicateErrors.map(error => error.message));
            setMessage(`Found ${duplicateErrors.length} duplicate entries. Please fix these issues before uploading.`);
            setUploading(false);
            return;
          }
          
          const result = await insertIntoSupabase(cleanedData);
          
          if (result.failed && result.failed.length > 0) {
            const failureErrors = result.failed.map(failure => {
              if (failure.duplicateField && failure.duplicateValue) {
                return `Row ${failure.row}: ${failure.duplicateField} "${failure.duplicateValue}" already exists in database`;
              }
              return `Row ${failure.row}: ${failure.error}`;
            });
            
            setErrors(failureErrors);
            setMessage(`Processed ${result.totalProcessed} records. ${result.successful.length} successful, ${result.failed.length} failed.`);
          } else if (result.successful) {
            setMessage(`Successfully uploaded ${result.successful.length} records to the database.`);
          } else {
            setMessage("Failed to upload data to the database.");
          }
          
        } catch (error) {
          console.error("Processing error:", error);
          setMessage("Failed to process CSV file: " + error.message);
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
    <Box sx={{ mb: 5 }}>
      {/* CSV Upload Section */}
      <Box sx={{ mb: 3 }}>
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
            Bulk Upload CSV
          </Typography>
        </Box>
        
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
          {/* File Upload Button */}
          <Box sx={{ mb: 3 }}>
            <input
              accept=".csv"
              style={{ display: 'none' }}
              id="csv-upload-input"
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <label htmlFor="csv-upload-input">
              <Button
                variant="contained"
                component="span"
                startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <Upload size={20} />}
                disabled={uploading}
                sx={{
                  background: 'linear-gradient(135deg, #0a3456 0%, #3196c6 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0a3456 0%, #2680b0 100%)',
                  },
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontSize: '16px',
                  fontWeight: 500,
                  boxShadow: '0 4px 15px rgba(10, 52, 86, 0.2)',
                  '&:disabled': {
                    background: '#e5e7eb',
                    color: '#9ca3af'
                  }
                }}
              >
                {uploading ? 'Processing...' : 'Choose CSV File'}
              </Button>
            </label>
          </Box>

          {/* Tip */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '14px' }}>
              ⚡ Tip: Ensure your CSV file has the correct headers and format
            </Typography>
          </Box>

          {/* Loading State */}
          {uploading && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={20} />
                <Typography>Processing and uploading...</Typography>
              </Box>
            </Alert>
          )}

          {/* Success/Error Message */}
          {message && (
            <Alert 
              severity={errors.length > 0 ? "warning" : "success"} 
              sx={{ mb: 3 }}
            >
              {message}
            </Alert>
          )}

          {/* Error List */}
          {errors.length > 0 && (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: '#fef2f2',
                borderColor: '#fecaca',
                maxHeight: 300,
                overflow: 'auto'
              }}
            >
              <Typography variant="subtitle2" fontWeight="bold" color="error" sx={{ mb: 2 }}>
                Issues Found:
              </Typography>
              <List dense>
                {errors.map((error, index) => (
                  <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" color="error">
                          {error}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Paper>
      </Box>

      <Divider sx={{ my: 4, borderColor: 'rgba(49, 150, 198, 0.2)' }} />
    </Box>
  );
};






const Form = () => {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setFocus,
    watch,
    setValue
  } = useForm({
    mode: 'onTouched'
  });

  const [coursesAttended, setCoursesAttended] = useState([""]);
  const [referrals, setReferrals] = useState([""]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const messageRef = useRef(null);

  useEffect(() => {
    if (successMessage || errorMessage) {
      messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [successMessage, errorMessage]);

  async function insertLeadRow(newLead) {
    const { data, error } = await supabase.from("mock").insert([newLead]);
    if (error) {
      console.log('Supabase insert error:', error);
      let msg = "Error inserting row: " + error.message;
      if (error.message.toLowerCase().includes('unique') || error.message.toLowerCase().includes('duplicate')) {
  if (error.message.toLowerCase().includes('email') && newLead.Email && newLead.Email.trim() !== '') {
    msg = `Email "${newLead.Email}" already exists in database.`;
  } else if (error.message.toLowerCase().includes('phone') && newLead.Phone && newLead.Phone.trim() !== '') {
    msg = `Phone "${newLead.Phone}" already exists in database.`;
  }
}
      setErrorMessage(msg);
      setSuccessMessage("");
      setTimeout(() => {
        messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return false;
    }
    setSuccessMessage("Lead inserted successfully!");
    setErrorMessage("");
    reset();
    setTimeout(() => {
      messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    return true;
  }

  const onSubmit = async (data) => {
    const filteredCourses = coursesAttended.filter(course => course.trim() !== "");
    const filteredReferrals = referrals.filter(referral => referral.trim() !== "");
    const finalData = {
      ...data,
      Email: data.Email?.trim() || null,
  Phone: data.Phone?.trim() || null,
      coursesAttended: filteredCourses,
      referrals: filteredReferrals,
      next_course: Array.isArray(data.next_course)
        ? data.next_course
        : typeof data.next_course === 'string'
          ? data.next_course.split(',').map(s => s.trim()).filter(Boolean)
          : []
    };
    const success = await insertLeadRow(finalData);
    if (success) {
      // Scroll to success message after reset
      setTimeout(() => {
        messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  // Universal error handler for required fields
  const onError = (errors) => {
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      setFocus(firstErrorField);
      setErrorMessage(errors[firstErrorField].message || "Please fill all required fields.");
    }
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
          {(successMessage || errorMessage) && (
            <Alert
              ref={messageRef}
              severity={successMessage ? "success" : "error"}
              sx={{ mb: 3 }}
              aria-live="polite"
            >
              {successMessage || errorMessage}
            </Alert>
          )}
          <form onSubmit={handleSubmit(onSubmit, onError)} noValidate>
            
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
                    {...register("Email")}
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
                    label="Phone Number"
                    {...register("Phone", { required: "Phone is required" })}
                    error={!!errors.Phone}
                    helperText={errors.Phone?.message}
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
                    <FormGroup row>
                      {['IDIP', 'IGC', 'OTHER'].map(option => (
                        <FormControlLabel
                          key={option}
                          control={
                            <Checkbox
                              checked={Array.isArray(watch('next_course')) && watch('next_course').includes(option)}
                              onChange={e => {
                                const current = Array.isArray(watch('next_course')) ? watch('next_course') : [];
                                if (e.target.checked) {
                                  setValue('next_course', [...current, option]);
                                } else {
                                  setValue('next_course', current.filter(c => c !== option));
                                }
                              }}
                            />
                          }
                          label={option}
                        />
                      ))}
                    </FormGroup>
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
                        rules={{ required: 'Please select a temperature' }}
                        render={({ field }) => (
                          <RadioGroup row {...field}>
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
                      rules={{ required: 'Please select a status' }}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.status}>
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
                            <MenuItem value="KB Requested">KB Requested</MenuItem>
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
                      {...register("Source", { required: "Source is required" })}
                      error={!!errors.Source}
                      helperText={errors.Source?.message}
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