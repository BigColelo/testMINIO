import { useState, useEffect } from 'react';
import { Container, Typography, Box, CircularProgress, Alert } from '@mui/material';
import FileUploader from './components/FileUploader';
import FileList from './components/FileList';
import './App.css';

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          MinIO File Manager
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}
        
        <FileUploader 
          setLoading={setLoading} 
          setError={setError} 
          setSuccess={setSuccess} 
        />
        
        <FileList 
          loading={loading} 
          setLoading={setLoading} 
          setError={setError} 
        />
      </Box>
    </Container>
  );
}

export default App;
