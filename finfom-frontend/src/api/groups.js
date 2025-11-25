import axios from './axios';

export const groupsAPI = {
  createGroup: (data) => axios.post('/groups', data),
  getMyGroups: () => axios.get('/groups'),
  getGroup: (id) => axios.get(`/groups/${id}`),
  getGroupFiles: (id, params) => axios.get(`/groups/${id}/files`, { params }),
  updateGroup: (id, data) => axios.put(`/groups/${id}`, data),
  deleteGroup: (id) => axios.delete(`/groups/${id}`),
};