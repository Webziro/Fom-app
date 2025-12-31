
// Polyfill process.version to prevent readable-stream slice error
if (typeof process === 'undefined' || !process.version) {
  window.process = window.process || {};
  window.process.version = 'v18.0.0';
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import { GoogleOAuthProvider } from '@react-oauth/google';

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId="71499386946-r8og2fnm870srro2os988a7gi6s0kh1g.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);