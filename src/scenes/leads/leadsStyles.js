// leadsStyles.js - Professional DataGrid Styling (Fixed)
export const getLeadsStyles = (theme) => {
  const isDark = theme.palette.mode === 'dark';
  
  // Custom color palette
  const customColors = {
    primary: isDark ? '#0a3456' : '#3196c9',
    primaryLight: isDark ? '#1a4a6b' : '#4aa8d8',
    primaryDark: isDark ? '#052338' : '#2681b4',
    background: {
      main: isDark ? '#1a1a1a' : '#ffffff',
      paper: isDark ? '#2d2d2d' : '#f8f9fa',
      elevated: isDark ? '#383838' : '#ffffff',
    },
    text: {
      primary: isDark ? '#ffffff' : '#2c3e50',
      secondary: isDark ? '#b0b0b0' : '#7f8c8d',
      muted: isDark ? '#888888' : '#95a5a6',
    },
    border: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
    hover: isDark ? 'rgba(10, 52, 86, 0.15)' : 'rgba(49, 150, 201, 0.08)',
  };

  return {
    // Main container styles
    mainContainer: {
      m: "20px",
      '& .MuiPaper-root': {
        borderRadius: '12px',
        boxShadow: isDark 
          ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
          : '0 8px 32px rgba(0, 0, 0, 0.1)',
      }
    },

    // Action buttons container
    actionButtonsContainer: {
      display: "flex", 
      gap: 2, 
      mb: 3,
      '& .MuiButton-root': {
        borderRadius: '8px',
        textTransform: 'none',
        fontWeight: 600,
        padding: '10px 20px',
        boxShadow: 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: isDark 
            ? '0 4px 20px rgba(0, 0, 0, 0.4)' 
            : '0 4px 20px rgba(0, 0, 0, 0.15)',
        },
        '&:disabled': {
          opacity: 0.6,
          transform: 'none',
          boxShadow: 'none',
        }
      }
    },

    // Refresh button specific styles
    refreshButton: {
      backgroundColor: customColors.primary,
      color: 'white',
      '&:hover': {
        backgroundColor: customColors.primaryDark,
      }
    },

    // Delete button specific styles
    deleteButton: {
      backgroundColor: isDark ? '#d32f2f' : '#f44336',
      color: 'white',
      '&:hover': {
        backgroundColor: isDark ? '#b71c1c' : '#d32f2f',
      }
    },

    // Stats typography
    statsTypography: {
      color: customColors.text.secondary, 
      ml: "auto",
      fontWeight: 500,
      fontSize: '0.95rem',
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      '&::before': {
        content: '"📊"',
        marginRight: '4px',
      }
    },

    // DataGrid container
    dataGridContainer: {
      display: 'block',
      height: "75vh",
      ml: 'auto',
      mr: 'auto',
      borderRadius: '12px',
      overflow: 'hidden',
      backgroundColor: customColors.background.elevated,
      boxShadow: isDark 
        ? '0 4px 24px rgba(0, 0, 0, 0.2)' 
        : '0 4px 24px rgba(0, 0, 0, 0.08)',
      
      // Main DataGrid root styles
      "& .MuiDataGrid-root": {
        border: "none",
        backgroundColor: customColors.background.elevated,
        borderRadius: '12px',
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        color: customColors.text.primary,
      },

      // Column headers styling
      "& .MuiDataGrid-columnHeaders": {
        backgroundColor: `${customColors.primary} !important`,
        color: 'white !important',
        fontWeight: '600 !important',
        fontSize: '0.95rem',
        borderBottom: `2px solid ${customColors.primaryDark}`,
        minHeight: '56px !important',
        '& .MuiDataGrid-columnHeaderTitle': {
          fontWeight: '600',
          color: 'white',
        },
        '& .MuiDataGrid-iconButtonContainer': {
          '& .MuiIconButton-root': {
            color: 'white',
          },
        },
        '& .MuiDataGrid-menuIcon': {
          color: 'white',
        },
        '& .MuiDataGrid-sortIcon': {
          color: 'white',
        },
      },

      // Column header cells
      "& .MuiDataGrid-columnHeader": {
        backgroundColor: `${customColors.primary} !important`,
        '&:hover': {
          backgroundColor: `${customColors.primaryLight} !important`,
        },
        '&.MuiDataGrid-columnHeader--sorted': {
          backgroundColor: `${customColors.primaryDark} !important`,
        },
        '&:focus': {
          outline: 'none',
        },
        '&:focus-within': {
          outline: `2px solid rgba(255, 255, 255, 0.5)`,
          outlineOffset: '-2px',
        },
      },

      // Footer styling
      "& .MuiDataGrid-footerContainer": {
        backgroundColor: customColors.primary,
        borderTop: "none",
        color: 'white',
        minHeight: '52px',
        '& .MuiTablePagination-root': {
          color: 'white',
        },
        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
          color: 'white',
        },
        '& .MuiTablePagination-select': {
          color: 'white',
        },
        '& .MuiTablePagination-selectIcon': {
          color: 'white',
        },
        '& .MuiIconButton-root': {
          color: 'white',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
          '&.Mui-disabled': {
            color: 'rgba(255, 255, 255, 0.5)',
          },
        },
      },

      // Rows styling
      "& .MuiDataGrid-row": {
        backgroundColor: 'transparent',
        '&:hover': {
          backgroundColor: customColors.hover,
          cursor: 'pointer',
        },
        '&.Mui-selected': {
          backgroundColor: customColors.hover,
          '&:hover': {
            backgroundColor: isDark 
              ? 'rgba(10, 52, 86, 0.25)' 
              : 'rgba(49, 150, 201, 0.15)',
          },
        },
        '&:nth-of-type(even)': {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
        },
      },

      // Cell styling
      "& .MuiDataGrid-cell": {
        borderBottom: `1px solid ${customColors.border}`,
        padding: '12px 16px',
        fontSize: '0.9rem',
        color: customColors.text.primary,
        '&:focus': {
          outline: `2px solid ${customColors.primary}`,
          outlineOffset: '-2px',
        },
        '&--editable': {
          '&:hover': {
            backgroundColor: customColors.hover,
          },
        },
      },

      // Checkbox styling
      "& .MuiCheckbox-root": {
        color: customColors.primary,
        '&.Mui-checked': {
          color: customColors.primary,
        },
        '&:hover': {
          backgroundColor: customColors.hover,
        },
      },

      // Scrollbar styling
      "& .MuiDataGrid-virtualScroller": {
        '&::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: customColors.border,
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: customColors.primary,
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: customColors.primaryDark,
          },
        },
      },

      // Loading overlay
      "& .MuiDataGrid-loadingOverlay": {
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.8)',
        '& .MuiCircularProgress-root': {
          color: customColors.primary,
        },
      },

      // No rows overlay
      "& .MuiDataGrid-noRowsContainer": {
        backgroundColor: 'transparent',
        '& .MuiDataGrid-noRowsLabel': {
          color: customColors.text.muted,
          fontSize: '1.1rem',
        },
      },
    },

    // DataGrid component specific styles
    dataGridStyles: {
      // Toolbar styling
      '& .MuiDataGrid-toolbar': {
        backgroundColor: customColors.background.paper,
        color: customColors.text.primary,
        padding: '12px 16px',
        borderBottom: `1px solid ${customColors.border}`,
        '& .MuiButton-root': {
          color: customColors.text.primary,
          '&:hover': {
            backgroundColor: customColors.hover,
          },
        },
        '& .MuiInputBase-root': {
          color: customColors.text.primary,
        },
        '& .MuiSvgIcon-root': {
          color: customColors.text.secondary,
        },
      },

      // Enhanced visual appeal
      boxShadow: 'none',
      border: 'none',
      borderRadius: '12px',

      // Menu styling
      '& .MuiDataGrid-menu': {
        '& .MuiPaper-root': {
          backgroundColor: customColors.background.elevated,
          boxShadow: isDark 
            ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
            : '0 8px 32px rgba(0, 0, 0, 0.15)',
          border: `1px solid ${customColors.border}`,
        },
        '& .MuiMenuItem-root': {
          color: customColors.text.primary,
          '&:hover': {
            backgroundColor: customColors.hover,
          },
        },
      },

      // Edit mode styling
      '& .MuiDataGrid-cell--editing': {
        backgroundColor: customColors.hover,
        '& .MuiInputBase-root': {
          color: customColors.text.primary,
          fontSize: '0.9rem',
          '& input': {
            padding: '8px',
          },
        },
      },

      // Column separator
      '& .MuiDataGrid-columnSeparator': {
        color: 'rgba(255, 255, 255, 0.3)',
        '&:hover': {
          color: 'rgba(255, 255, 255, 0.6)',
        },
      },
    }
  };
};