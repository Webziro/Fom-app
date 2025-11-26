import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import connectDB from './config/database';
import authRoutes from './routes/auth';
import fileRoutes from './routes/files';
import groupRoutes from './routes/groups';
import errorHandler from './middleware/errorHandler';
import { httpLogger } from './middleware/logger';
import { apiLimiter } from './middleware/rateLimiter';
import { sanitizeData, preventXSS, preventHPP } from './middleware/security';
import logger from './middleware/logger';

dotenv.config();

const app = express();

// Connect to database
connectDB();

// Security middleware and CORS configuration for the frontend
app.use(helmet());

app.use(cors({
  origin: 'http://localhost:5173',  
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

// Routes
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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl 
  });
});

//500 handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

//200 handler
app.use((req, res, next) => {
  res.status(200).json({ message: 'OK' });
  next();
});

//300 handler
app.use((req, res, next) => {
  res.status(300).json({ message: 'Multiple Choices' });
  next();
});

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
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