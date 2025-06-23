import { Box, useTheme, Button, Snackbar } from "@mui/material";
import Header from "../../components/Header";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { styled } from "@mui/material/styles";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useState } from "react";

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  backgroundColor: '#ffffff',
  border: '1px solid #e0e7ff',
  borderRadius: '12px !important',
  marginBottom: '16px',
  boxShadow: '0 2px 8px rgba(10, 52, 86, 0.08)',
  '&:before': {
    display: 'none',
  },
  '&.Mui-expanded': {
    margin: '0 0 16px 0',
    boxShadow: '0 4px 16px rgba(10, 52, 86, 0.12)',
  },
}));

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  minHeight: '64px',
  padding: '0 24px',
  '&.Mui-expanded': {
    backgroundColor: '#0a3456',
    borderRadius: '12px 12px 0 0',
    '& .MuiTypography-root': {
      color: '#ffffff',
    },
    '& .MuiSvgIcon-root': {
      color: '#3196c9',
    },
  },
  '& .MuiAccordionSummary-expandIconWrapper': {
    color: '#0a3456',
  },
}));

const StyledAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
  padding: '24px',
  backgroundColor: '#ffffff',
  borderRadius: '0 0 12px 12px',
}));

const FAQ = () => {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);

  const promptText = `Upload your CSV file to format it according to our Supabase CRM schema. The system will validate and return a file named formatted_for_crm.csv with the following specifications:

📄 Expected Columns:
"Name", "JobTitle", "Phone", "Email", "State", "Country", "Organization", "temperature", "timestamp", "status", "coursesAttended", "referrals", "Source", "recency", "frequency", "monetary", "score", "classification", "next_course", "created_at", "status_updated_at"

🔁 Rules & Transformations:

1. ✅ **Normalize all column headers** to match exact casing. For example:
   - \`name\`, \`NamE\`, \`nAme\` → \`Name\`
   - \`organisation\` → \`Organization\` ✅
   - \`country\` → \`Country\` ✅
   - \`job title\`, \`Jobtitle\`, \`jobtitle\` → \`JobTitle\` ✅
   - 🔒 No valid column (like \`email\`, \`phone\`, etc.) will be deleted — they will be matched by intent and renamed correctly.

2. ⏱️ **Timestamps** are assumed to be in **IST (UTC+5:30)** and converted to:
   - \`timestamp\` → UTC ISO (e.g., \`"2025-06-23T04:00:00"\`)
   - \`created_at\`, \`status_updated_at\` → UTC with timezone (e.g., \`"2025-06-23T04:00:00Z"\`)

3. 🕒 If timestamp fields are **missing or invalid**:
   - \`timestamp\` → current UTC (ISO, no \`Z\`)
   - \`created_at\`, \`status_updated_at\` → current UTC with \`Z\`

4. 🚫 **Missing or empty values** are filled as:
   - **String fields** → \`"null"\`
   - **Number fields** → \`null\`
   - **Array fields** (\`coursesAttended\`, \`referrals\`) → \`[]\` (valid JSON array)

5. 🧹 **Data Cleaning & Constraints**:
   - \`recency\`, \`frequency\`, \`monetary\` → must be < 6 or \`null\`; if ≥ 6, set to \`5\`
   - \`score\` → must be < 126 or \`null\`; if ≥ 126, set to \`125\`
   - \`status\` → must be: \`"Converted"\`, \`"Converting"\`, \`"Idle"\`; others → \`"Idle"\`
   - \`temperature\` → must be: \`"Hot"\`, \`"Warm"\`, \`"Cold"\`; others → \`"Cold"\`

6. 🧷 **No valid columns will be deleted**. If column names are incorrect, they will be corrected using header normalization.

7. 📭 **If a required column is completely missing**, it will be excluded from the output. Supabase will apply its default value.

8. 📚 **Array fields** (\`coursesAttended\`, \`referrals\`) must be valid JSON arrays:
   - ✅ Correct: \`["item1", "item2"]\`
   - ❌ Incorrect: \`"[\\"item1\\", \\"item2\\"]"\` or raw \`item1, item2\`

9. ✨ **Auto-correction of common header mistakes**:
   - \`"organisation"\` (UK spelling) → \`"Organization"\`
   - \`"country"\` → \`"Country"\` (case normalization)
   - \`"job title"\`, \`"Jobtitle"\`, \`"jobtitle"\` → \`"JobTitle"\`

10. 📤 Output will be returned as: \`formatted_for_crm.csv\``;


  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
  };

  return (
    <Box m="20px" maxWidth="1000px" mx="auto">
      <Header 
        title="FAQ" 
        subtitle="Frequently Asked Questions - CRM & Data Management" 
      />

      <StyledAccordion defaultExpanded>
        <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography 
            color="#3196c9 !important" 
            variant="h5" 
            fontWeight="600"
            sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}
          >
            📄 How to Format Your CSV for Supabase Upload
          </Typography>
        </StyledAccordionSummary>
        <StyledAccordionDetails>
          <div style={{ marginBottom: '16px' }}>
            <Typography variant="body1" sx={{ fontWeight: '600', color: '#0a3456', mb: 2, fontSize: '1.1rem' }}>
              ✅ Required Column Format:
            </Typography>
            
            <Box sx={{ 
              backgroundColor: '#f8fafc', 
              border: '2px solid #3196c9', 
              borderRadius: 2, 
              p: 3, 
              mb: 3 
            }}>
              <Typography variant="body1" sx={{ fontWeight: '700', color: '#0a3456', mb: 2, fontSize: '1rem' }}>
                Your CSV must have these columns in this exact order:
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1, mb: 2 }}>
                {[
                  '1. Name', '2. JobTitle', '3. Phone', '4. Email', 
                  '5. State', '6. Country', '7. Organization', '8. temperature',
                  '9. timestamp', '10. status', '11. coursesAttended', '12. referrals',
                  '13. Source', '14. recency', '15. frequency', '16. monetary',
                  '17. score', '18. classification', '19. next_course', '20. created_at',
                  '21. status_updated_at'
                ].map((column, index) => (
                  <Typography 
                    key={index}
                    variant="body2" 
                    sx={{ 
                      backgroundColor: index < 4 ? '#e3f2fd' : '#f5f5f5', 
                      p: 1, 
                      borderRadius: 1, 
                      fontWeight: index < 4 ? '600' : '500',
                      fontSize: '0.95rem',
                      color: '#0a3456',
                      border: index < 4 ? '1px solid #2196f3' : '1px solid #ddd'
                    }}
                  >
                    {column}
                  </Typography>
                ))}
              </Box>

              <Typography variant="body2" sx={{ 
                fontStyle: 'italic', 
                color: '#666', 
                fontSize: '0.9rem',
                backgroundColor: '#fff3e0',
                p: 1.5,
                borderRadius: 1,
                border: '1px solid #ff9800'
              }}>
                💡 <strong>Tip:</strong> The first 4 columns (Name, JobTitle, Phone, Email) are highlighted in blue as they are the most important for your CRM data.
              </Typography>
            </Box>

            <Typography variant="body1" sx={{ fontWeight: '600', color: '#0a3456', mb: 1, fontSize: '1.1rem' }}>
              🔁 Unique Fields:
            </Typography>
            <Typography variant="body2" sx={{ ml: 2, mb: 2, fontSize: '1rem' }}>
              • <strong>Phone</strong> and <strong>Email</strong> must be <strong>unique</strong> (no duplicates)
            </Typography>

            <Typography variant="body1" sx={{ fontWeight: '600', color: '#0a3456', mb: 1, fontSize: '1.1rem' }}>
              📬 Most Important Fields to Fill:
            </Typography>
            <Box sx={{ 
              backgroundColor: '#e8f5e8', 
              border: '1px solid #4caf50', 
              borderRadius: 1, 
              p: 2, 
              mb: 2 
            }}>
              <Typography variant="body2" sx={{ fontSize: '1rem', lineHeight: 1.6 }}>
                <strong>Essential:</strong> Name, Phone, Email<br/>
                <strong>Recommended:</strong> JobTitle, State, Country, Organization, temperature, status, Source, next_course
              </Typography>
            </Box>

            <Typography variant="body1" sx={{ fontWeight: '600', color: '#0a3456', mb: 1, fontSize: '1.1rem' }}>
              🗂️ Array Fields (Special Format Required):
            </Typography>
            <Typography variant="body2" sx={{ ml: 2, mb: 1, fontSize: '1rem' }}>
              • <code>coursesAttended</code> and <code>referrals</code> columns need special formatting
            </Typography>
            <Box sx={{ ml: 2, mb: 2 }}>
              <Typography variant="body2" sx={{ 
                fontFamily: 'monospace', 
                backgroundColor: '#e8f5e8', 
                p: 1.5, 
                borderRadius: 1, 
                color: '#0a3456',
                fontSize: '0.95rem',
                border: '1px solid #4caf50'
              }}>
                ✅ <strong>Correct format:</strong> "[""NEBOSH IGC"", ""Fire Safety""]"
              </Typography>
              <Typography variant="body2" sx={{ 
                fontFamily: 'monospace', 
                backgroundColor: '#ffebee', 
                p: 1.5, 
                borderRadius: 1, 
                color: '#d32f2f',
                fontSize: '0.95rem',
                border: '1px solid #f44336',
                mt: 1
              }}>
                ❌ <strong>Wrong format:</strong> ["NEBOSH IGC", "Fire Safety"]
              </Typography>
            </Box>

            <Typography variant="body1" sx={{ fontWeight: '600', color: '#0a3456', mb: 1, fontSize: '1.1rem' }}>
              📊 Optional RFM Metrics:
            </Typography>
            <Typography variant="body2" sx={{ ml: 2, mb: 2, fontSize: '1rem' }}>
              • <code>recency</code>, <code>frequency</code>, <code>monetary</code> → Enter numbers from 0 to 5<br/>
              • <code>score</code> → Enter any number less than 126
            </Typography>

            <Typography variant="body1" sx={{ fontWeight: '600', color: '#0a3456', mb: 1, fontSize: '1.1rem' }}>
              🕒 Date/Time Fields:
            </Typography>
            <Typography variant="body2" sx={{ ml: 2, mb: 2, fontSize: '1rem' }}>
              • <code>timestamp</code>, <code>created_at</code>, <code>status_updated_at</code> → You can leave these blank - they will be filled automatically
            </Typography>
          </div>
        </StyledAccordionDetails>
      </StyledAccordion>

      <StyledAccordion>
        <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography 
            color="#3196c9 !important" 
            variant="h5" 
            fontWeight="600"
            sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}
          >
            📥 Auto-Format CSV with AI
          </Typography>
        </StyledAccordionSummary>
        <StyledAccordionDetails>
          
            <div style={{ fontWeight: '600', color: '#0a3456', marginBottom: '8px', fontSize: '1.1rem' }}>
              📥 Want to automatically format your CSV? Copy & paste this prompt into any AI platforms:
            </div>
<Box
      sx={{
        position: 'relative',
        backgroundColor: '#f1f5f9',
        p: 2,
        borderRadius: 2,
        border: '1px solid #3196c9',
        fontFamily: 'monospace',
        fontSize: '0.9rem',
        whiteSpace: 'pre-wrap',
        overflow: 'auto'
      }}
    >
      <Button
        size="small"
        onClick={handleCopy}
        startIcon={<ContentCopyIcon />}
        sx={{ position: 'absolute', top: 8, right: 8,width:"50px",}}
        variant="contained"
      >
        Copy
      </Button>
      {promptText}
      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message="Copied to clipboard"
      />
    </Box>
        </StyledAccordionDetails>
      </StyledAccordion>

      <StyledAccordion>
        <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography 
            color="#3196c9 !important" 
            variant="h5" 
            fontWeight="600"
            sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}
          >
            🔄 Data Import Best Practices
          </Typography>
        </StyledAccordionSummary>
        
        <StyledAccordionDetails>
          <div style={{ lineHeight: 1.7, fontSize: '1rem' }}>
            <strong style={{ color: '#0a3456' }}>Before uploading:</strong><br/>
            • Remove any special characters from headers<br/>
            • Ensure phone numbers follow a consistent format<br/>
            • Validate email addresses are properly formatted<br/>
            • Check for duplicate entries in Phone/Email columns<br/>
            • Save your file as UTF-8 encoded CSV to preserve special characters<br/>
            • For array fields, use proper JSON string format: "[""item1"", ""item2""]"<br/><br/>
            <strong style={{ color: '#0a3456' }}>Example of properly formatted CSV row:</strong><br/>
            <Box sx={{ fontFamily: 'monospace', backgroundColor: '#f1f5f9', p: 1, borderRadius: 1, mt: 1, fontSize: '0.85rem', overflow: 'auto' }}>
{`John Doe,Manager,+1234567890,john@example.com,HSE,USA,TechCorp,Warm,,"[""NEBOSH IGC"", ""Fire Safety""]","[""Jane Smith""]",Website,4,3,5,60,Champion,IDIP,,`}
            </Box><br/>
            <strong style={{ color: '#0a3456' }}>File size limits:</strong><br/>
            • Maximum 10MB per upload<br/>
            • For larger files, consider splitting into smaller batches
          </div>
        </StyledAccordionDetails>
      </StyledAccordion>

      <StyledAccordion>
        <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography 
            color="#3196c9 !important" 
            variant="h5" 
            fontWeight="600"
            sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}
          >
            ⚠️ Common Upload Errors & Solutions
          </Typography>
        </StyledAccordionSummary>
        
        <StyledAccordionDetails>
          <div style={{ lineHeight: 1.7, fontSize: '1rem' }}>
            <strong style={{ color: '#d32f2f' }}>"Duplicate phone/email found":</strong><br/>
            Remove duplicate entries before upload or use the "Update existing" option.<br/><br/>
            
            <strong style={{ color: '#d32f2f' }}>"Invalid array format":</strong><br/>
            Array fields must use proper JSON string format with escaped quotes:<br/>
            ✅ Correct: "[""item1"", ""item2""]"<br/>
            ❌ Wrong: ["item1", "item2"] or [item1, item2]<br/><br/>
            
            <strong style={{ color: '#d32f2f' }}>"Missing required Name field":</strong><br/>
            Every row must have a value in the Name column.<br/><br/>
            
            <strong style={{ color: '#d32f2f' }}>"CSV parsing error":</strong><br/>
            Ensure all commas within field values are properly quoted, especially in array fields.<br/><br/>
            
            <strong style={{ color: '#d32f2f' }}>"Invalid timestamp format":</strong><br/>
            Use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ) or leave blank for auto-generation.
          </div>
        </StyledAccordionDetails>
      </StyledAccordion>

      <StyledAccordion>
        <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography 
            color="#3196c9 !important" 
            variant="h5" 
            fontWeight="600"
            sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}
          >
            📊 Understanding RFM Scoring
          </Typography>
        </StyledAccordionSummary>
        <StyledAccordionDetails>
          <Typography variant="body2" sx={{ lineHeight: 1.7, fontSize: '1rem' }}>
            <strong style={{ color: '#0a3456' }}>RFM Analysis helps segment customers:</strong><br/><br/>
            
            <strong style={{ color: '#3196c9' }}>Recency (0-5):</strong> How recently did they engage?<br/>
            • 5 = Very recent (within 30 days)<br/>
            • 1 = Long ago (over 1 year)<br/><br/>
            
            <strong style={{ color: '#3196c9' }}>Frequency (0-5):</strong> How often do they engage?<br/>
            • 5 = Very frequent<br/>
            • 1 = Rarely<br/><br/>
            
            <strong style={{ color: '#3196c9' }}>Monetary (0-5):</strong> How much value do they bring?<br/>
            • 5 = High value<br/>
            • 1 = Low value<br/><br/>
            
            <strong style={{ color: '#0a3456' }}>Score calculation:</strong> Recency × Frequency × Monetary (max 125)
          </Typography>
        </StyledAccordionDetails>
      </StyledAccordion>
    </Box>
  );
};

export default FAQ;