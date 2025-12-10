import axios from './axios';
import publicAxios from './publicAxios';

export const filesAPI = {
  uploadFile: (formData) => axios.post('api/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMyFiles: (params) => axios.get('api/files', { params }),
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
};