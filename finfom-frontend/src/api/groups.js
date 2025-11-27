import axios from './axios';

export const groupsAPI = {
  getAllGroups: () => axios.get('/api/groups'),  // Include the full path starting with /api/groups
  createOrGetGroup: (data) => axios.post('/api/groups/create-or-get', data),
  createGroup: (data) => axios.post('/api/groups', data),
  getMyGroups: () => axios.get('/api/groups/my-groups'),
  getGroup: (id) => axios.get(`/api/groups/${id}`),
  getGroupFiles: (id, params) => axios.get(`/api/groups/${id}/files`, { params }),
  updateGroup: (id, data) => axios.put(`/api/groups/${id}`, data),
  deleteGroup: (id) => axios.delete(`/api/groups/${id}`),
};