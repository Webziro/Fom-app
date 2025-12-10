import axios from 'axios';

const publicAxios = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/',  // Match your main axios baseURL
});

export default publicAxios;