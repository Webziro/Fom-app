import axios from './axios';

export const filesAPI = {
  uploadFile: (formData) => axios.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMyFiles: (params) => axios.get('/files', { params }),
  getPublicFiles: (params) => axios.get('/files/public', { params }),
  getFile: (id, password) => axios.get(`/files/${id}`, { data: { password } }),
  downloadFile: (id, password) => axios.post(`/files/${id}/download`, { password }),
  updateFile: (id, data) => axios.put(`/files/${id}`, data),
  deleteFile: (id) => axios.delete(`/files/${id}`),
};