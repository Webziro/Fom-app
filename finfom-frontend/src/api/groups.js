import axios from './axios';

export const groupsAPI = {
  createGroup: (data) => axios.post('api/groups', data),
  getMyGroups: () => axios.get('api/groups'),
  getGroup: (id) => axios.get(`api/groups/${id}`),
  getGroupFiles: (id, params) => axios.get(`api/groups/${id}/files`, { params }),
  updateGroup: (id, data) => axios.put(`api/groups/${id}`, data),
  deleteGroup: (id) => axios.delete(`api/groups/${id}`),
};