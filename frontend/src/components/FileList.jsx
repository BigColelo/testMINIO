import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton, 
  Divider, 
  CircularProgress 
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { fileService } from '../services/api';

const FileList = ({ loading, setLoading, setError }) => {
  const [files, setFiles] = useState([]);
  const [localLoading, setLocalLoading] = useState(true);

  const fetchFiles = async () => {
    setLocalLoading(true);
    try {
      const data = await fileService.listFiles();
      setFiles(data.files || []);
    } catch (error) {
      setError(error.response?.data?.message || 'Error fetching files');
    } finally {
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [loading]); // Refetch when loading state changes (after upload)

  const handleDownload = async (filename) => {
    setLoading(true);
    try {
      await fileService.downloadFile(filename);
    } catch (error) {
      setError(error.response?.data?.message || 'Error downloading file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Files in Bucket
      </Typography>
      
      {localLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {files.length === 0 ? (
            <Typography align="center" sx={{ my: 4 }}>
              No files found in the bucket
            </Typography>
          ) : (
            <List>
              {files.map((filename, index) => (
                <Box key={filename}>
                  <ListItem
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        aria-label="download" 
                        onClick={() => handleDownload(filename)}
                      >
                        <DownloadIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText primary={filename} />
                  </ListItem>
                  {index < files.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </>
      )}
    </Paper>
  );
};

export default FileList;