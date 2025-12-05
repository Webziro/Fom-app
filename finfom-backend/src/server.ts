import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import connectDB from './config/database';
import authRoutes from './routes/auth';
import fileRoutes from './routes/files';
import groupRoutes from './routes/groups';
import errorHandler from './middleware/errorHandler';
import { httpLogger } from './middleware/logger';
import { apiLimiter } from './middleware/rateLimiter';
import { sanitizeData, preventXSS, preventHPP } from './middleware/security';
import logger from './middleware/logger';

// Initialize Express app
const app = express();

// Connect to database
connectDB();

// --- DYNAMIC CORS CONFIGURATION (Fixes localhost issue) ---
const isProduction = process.env.NODE_ENV === 'production';

// 1. Define the allowed origins dynamically.
const allowedOrigins = isProduction
  ? ["https://finfom.netlify.app"]
  : ["http://localhost:5173"];

// Security middleware
app.use(helmet());

// 2. Configure CORS middleware using the dynamic origins array.
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing and compression
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Security: Sanitize data, prevent XSS and HPP
app.use(sanitizeData);
app.use(preventXSS);
app.use(preventHPP);

// Logging
app.use(httpLogger);

// Rate limiting
app.use('/api', apiLimiter);

// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/groups', groupRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// --- FINAL HANDLERS ---

// 404 handler (Must be placed after all defined routes)
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Centralized Error handling (Must be the very last middleware to catch errors)
// Note: Removed redundant 500, 200, and 300 handlers.
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 Allowed CORS Origins: ${allowedOrigins.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

export default app;