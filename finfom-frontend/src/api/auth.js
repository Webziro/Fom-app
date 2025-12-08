import axios from './axios';

export const authAPI = {
  register: (data) => axios.post('api/auth/register', data),
  login: (data) => axios.post('api/auth/login', data),
  getMe: () => axios.get('api/auth/me'),
  updateProfile: (data) => axios.put('api/auth/profile', data),
  changePassword: (data) => axios.put('api/auth/password', data),
  forgotPassword: (email) => axios.post('api/auth/forgot-password', { email }),
  resetPassword: (token, password) => axios.put(`api/auth/reset-password/${token}`, { password }),
  googleLogin: (token) => axios.post('api/auth/google', { token }),
};