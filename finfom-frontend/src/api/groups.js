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
  getAllGroups: () => axios.get('/groups'),  // Remove "api/" prefix
  createOrGetGroup: (data) => axios.post('/groups/create-or-get', data),  // Remove "api/" prefix
  createGroup: (data) => axios.post('/groups', data),  // Remove "api/" prefix
  getMyGroups: () => axios.get('/groups/my-groups'),  // Remove "api/" prefix
  getGroup: (id) => axios.get(`/groups/${id}`),  // Remove "api/" prefix
  getGroupFiles: (id, params) => axios.get(`/groups/${id}/files`, { params }),
  updateGroup: (id, data) => axios.put(`/groups/${id}`, data),
  deleteGroup: (id) => axios.delete(`/groups/${id}`),
};