import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fileService = {
  // List all files in the bucket
  listFiles: async () => {
    try {
      const response = await api.get('/files');
      return response.data;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  },

  // Upload a file to the bucket
  uploadFile: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Download a file from the bucket
  downloadFile: async (filename) => {
    try {
      const response = await api.get(`/files/download/${filename}`, {
        responseType: 'blob',
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return true;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }
};

export default api;