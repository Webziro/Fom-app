import axios from './axios';

export const authAPI = {
  register: (data) => axios.post('/auth/register', data),
  login: (data) => axios.post('/auth/login', data),
  getMe: () => axios.get('/auth/me'),
  updateProfile: (data) => axios.put('/auth/profile', data),
  changePassword: (data) => axios.put('/auth/password', data),
};