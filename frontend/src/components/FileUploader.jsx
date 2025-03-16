import { useState } from 'react';
import { Box, Button, Typography, LinearProgress, Paper } from '@mui/material';
import { fileService } from '../services/api';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const FileUploader = ({ setLoading, setError, setSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setLoading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prevProgress) => {
        if (prevProgress >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prevProgress + 10;
      });
    }, 300);

    try {
      await fileService.uploadFile(selectedFile);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setSuccess(`File '${selectedFile.name}' uploaded successfully!`);
      setSelectedFile(null);
    } catch (error) {
      clearInterval(progressInterval);
      setError(error.response?.data?.message || 'Error uploading file');
    } finally {
      setUploading(false);
      setLoading(false);
      // Reset progress after a delay
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Upload File
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Button
          variant="contained"
          component="label"
          startIcon={<CloudUploadIcon />}
          disabled={uploading}
        >
          Select File
          <input
            type="file"
            hidden
            onChange={handleFileChange}
          />
        </Button>
        
        <Typography sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selectedFile ? selectedFile.name : 'No file selected'}
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
        >
          Upload
        </Button>
      </Box>
      
      {uploadProgress > 0 && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
          <Typography variant="body2" align="center" sx={{ mt: 1 }}>
            {uploadProgress}%
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default FileUploader;