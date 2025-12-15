import axios from './axios';
import publicAxios from './publicAxios';

export const filesAPI = {
  uploadFile: (formData) => axios.post('api/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  // getMyFiles: (params) => axios.get('api/files', { params }),
  getMyFiles: (params = {}) => axios.get('api/files', { params }),
  getPublicFiles: (params) => axios.get('api/files/public', { params }),

  getFile: (id, password = '') => {
    const body = password ? { password } : {};
    return axios.get(`api/files/${id}`, { data: body });
  },

  // Public versions (no auth token)
  // getPublicFile: (id, password = '') => {
  //   const body = password ? { password } : {};
  //   return publicAxios.get(`api/files/${id}`, { data: body });
  // },

  getPublicFile: (id, password = '') => {
  if (password) {
    // Use POST when password is provided
    return publicAxios.post(`api/files/${id}/access`, { password });
  }
  // Initial load - GET
  return publicAxios.get(`api/files/${id}`);
},

  downloadFile: (id, password = '') => axios.post(`api/files/${id}/download`, { password }, {
    responseType: 'blob',
  }),

  downloadPublicFile: (id) => publicAxios.post(`api/files/${id}/download`, {}, {
    responseType: 'blob',
  }),

  updateFile: (id, data) => axios.put(`api/files/${id}`, data),
  deleteFile: (id) => axios.delete(`api/files/${id}`),

  // Folder APIs
  createFolder: (data) => axios.post('api/files/folders', data),
  getMyFolders: () => axios.get('api/files/folders'),
  getFolder: (id) => axios.get(`api/files/folders/${id}`),
  moveFileToFolder: (fileId, folderId) => axios.put(`api/files/${fileId}`, { folderId }),
  updateFolder: (id, data) => axios.put(`api/files/folders/${id}`, data),
  deleteFolder: (id) => axios.delete(`api/files/folders/${id}`),

  // getAnalytics: () => axios.get('api/files/analytics')

  getAnalytics: () => {
  const token = localStorage.getItem('token');
  return axios.get('/api/files/analytics', {
    baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:5000',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
},
};


