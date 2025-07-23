import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Upload as UploadIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';

const CollateralsWithUpload = () => {
  // State for file upload
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // File input ref
  const fileInputRef = useRef(null);

  // Sample collateral data (this would come from your API)
  const [collaterals, setCollaterals] = useState([
    {
      id: 1,
      name: 'sample_email_template.docx',
      type: 'Word Document',
      uploadedOn: '07-22-2025',
      uploadedBy: 'Sales Lead'
    },
    {
      id: 2,
      name: 'Ignitho_value_proposition.docx',
      type: 'Word Document',
      uploadedOn: '07-22-2025',
      uploadedBy: 'Sales Lead'
    },
    {
      id: 3,
      name: 'Ignitho_value_proposition.docx',
      type: 'Word Document',
      uploadedOn: '07-23-2025',
      uploadedBy: 'Sales Lead'
    },
    {
      id: 4,
      name: 'Sales Leader 1.pdf',
      type: 'PDF',
      uploadedOn: '07-23-2025',
      uploadedBy: 'Sales Lead'
    }
  ]);

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Handle upload button click
  const handleUploadClick = () => {
    setUploadDialogOpen(true);
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!selectedFile) {
      setSnackbar({
        open: true,
        message: 'Please select a file to upload',
        severity: 'error'
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Add new file to collaterals list
      const newCollateral = {
        id: collaterals.length + 1,
        name: selectedFile.name,
        type: selectedFile.type.includes('pdf') ? 'PDF' : 'Word Document',
        uploadedOn: new Date().toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        }).replace(/\//g, '-'),
        uploadedBy: 'Sales Lead'
      };

      setCollaterals(prev => [...prev, newCollateral]);
      
      setSnackbar({
        open: true,
        message: 'File uploaded successfully!',
        severity: 'success'
      });

      // Reset states
      setSelectedFile(null);
      setUploadDialogOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Upload failed. Please try again.',
        severity: 'error'
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle dialog close
  const handleDialogClose = () => {
    if (!uploading) {
      setUploadDialogOpen(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Get file type icon
  const getFileTypeIcon = (type) => {
    return type === 'PDF' ? '📄' : '📝';
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header Section */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#ff6b35', fontWeight: 'bold' }}>
            ← Collaterals
          </Typography>
        </Box>

        {/* Upload Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={handleUploadClick}
            sx={{
              backgroundColor: '#ff6b35',
              '&:hover': {
                backgroundColor: '#e55a2b',
              },
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 'bold',
              px: 3,
              py: 1
            }}
          >
            Upload File
          </Button>
        </Box>
      </Box>

      {/* Collaterals Table */}
      <Paper sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>
                  Collateral Name
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>
                  Type
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>
                  Uploaded On
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>
                  Uploaded By
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#333' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {collaterals.map((collateral) => (
                <TableRow 
                  key={collateral.id}
                  sx={{ 
                    '&:hover': { backgroundColor: '#f8f9fa' },
                    '&:last-child td, &:last-child th': { border: 0 }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{getFileTypeIcon(collateral.type)}</span>
                      <Typography variant="body2">
                        {collateral.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={collateral.type}
                      size="small"
                      sx={{
                        backgroundColor: collateral.type === 'PDF' ? '#e3f2fd' : '#f3e5f5',
                        color: collateral.type === 'PDF' ? '#1976d2' : '#7b1fa2',
                        fontWeight: 'medium'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {collateral.uploadedOn}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {collateral.uploadedBy}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        size="small" 
                        sx={{ color: '#666' }}
                        title="View"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        sx={{ color: '#666' }}
                        title="Download"
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Upload Dialog */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px' }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudUploadIcon sx={{ color: '#ff6b35' }} />
            <Typography variant="h6" fontWeight="bold">
              Upload Collateral
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          <Box
            sx={{
              border: '2px dashed #ddd',
              borderRadius: '8px',
              p: 4,
              textAlign: 'center',
              backgroundColor: '#fafafa',
              cursor: 'pointer',
              '&:hover': {
                borderColor: '#ff6b35',
                backgroundColor: '#fff5f2'
              }
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <CloudUploadIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              {selectedFile ? selectedFile.name : 'Click to select a file or drag and drop'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supported formats: PDF, DOC, DOCX
            </Typography>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx"
              style={{ display: 'none' }}
            />
          </Box>

          {uploading && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Uploading... {uploadProgress}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={uploadProgress}
                sx={{
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#ff6b35'
                  }
                }}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleDialogClose}
            disabled={uploading}
            sx={{ color: '#666' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleFileUpload}
            variant="contained"
            disabled={!selectedFile || uploading}
            sx={{
              backgroundColor: '#ff6b35',
              '&:hover': {
                backgroundColor: '#e55a2b',
              },
              '&:disabled': {
                backgroundColor: '#ccc'
              }
            }}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CollateralsWithUpload;