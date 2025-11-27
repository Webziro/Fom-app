// import axios from './axios';

// export const groupsAPI = {
//   createGroup: (data) => axios.post('api/groups', data),
//   getMyGroups: () => axios.get('api/groups'),
//   getGroup: (id) => axios.get(`api/groups/${id}`),
//   getGroupFiles: (id, params) => axios.get(`api/groups/${id}/files`, { params }),
//   updateGroup: (id, data) => axios.put(`api/groups/${id}`, data),
//   deleteGroup: (id) => axios.delete(`api/groups/${id}`),
// };


import axios from './axios';

export const groupsAPI = {
  // Existing functions
  createGroup: (data) => axios.post('api/groups', data),
  getMyGroups: () => axios.get('api/groups/my-groups'), // Fixed to use correct endpoint
  getGroup: (id) => axios.get(`api/groups/${id}`),
  getGroupFiles: (id, params) => axios.get(`api/groups/${id}/files`, { params }),
  updateGroup: (id, data) => axios.put(`api/groups/${id}`, data),
  deleteGroup: (id) => axios.delete(`api/groups/${id}`),
  getAllGroups: () => axios.get('api/groups'), 
  createOrGetGroup: (data) => axios.post('api/groups/create-or-get', data), 
};