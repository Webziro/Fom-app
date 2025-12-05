import axios from './axios';

export const filesAPI = {
  uploadFile: (formData) => axios.post('api/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMyFiles: (params) => axios.get('api/files', { params }),
  getPublicFiles: (params) => axios.get('api/files/public', { params }),
  getFile: (id, password) => axios.get(`api/files/${id}`, { data: { password } }),
  downloadFile: (id, password) => axios.post(`api/files/${id}/download`, { password }, {
    responseType: 'blob', // Important: handle binary data
  }),
  updateFile: (id, data) => axios.put(`api/files/${id}`, data),
  deleteFile: (id) => axios.delete(`api/files/${id}`),
};