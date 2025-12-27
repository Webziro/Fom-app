import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import connectDB from './config/database';
import { createClient } from 'redis';
import authRoutes from './routes/auth';
import fileRoutes from './routes/files';
import errorHandler from './middleware/errorHandler';
import { httpLogger } from './middleware/logger';
import { apiLimiter } from './middleware/rateLimiter';
import { sanitizeData, preventXSS, preventHPP } from './middleware/security';
import logger from './middleware/logger';

// Initialize the Express app
const app = express();

// Connect to MongoDB
connectDB();

// --- REDIS CONNECTION ---
const redisClient = createClient({
  url: 'redis://localhost:6379', // your Docker Redis URL
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));

const connectRedis = async () => {
  try {
    await redisClient.connect();
    logger.info('Redis connected successfully');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
  }
};

connectRedis(); // Call this early

// Keep Redis connection alive with periodic pings
setInterval(async () => {
  try {
    await redisClient.ping();
  } catch (err) {
    console.error('Redis ping failed:', err);
  }
}, 30000);

// --- DYNAMIC CORS CONFIGURATION ---
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = isProduction
  ? ["https://finfom.netlify.app"]
  : ["http://localhost:5173"];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition'],
}));

// Security middleware
app.use(helmet());

// Body parsing and compression
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Security middleware
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

// Root handler
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Finfom API',
    status: 'running',
    documentation: '/api-docs'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

//Redis test route vist http://localhost:5000/redis-test
app.get('/redis-test', async (req, res) => {
  try {
    await redisClient.set('test-key', 'Hello from Redis!');
    const value = await redisClient.get('test-key');
    res.json({ message: 'Redis is working!', value });
  } catch (error) {
    logger.error('Redis test error:', error);
    res.status(500).json({ message: 'Redis test failed', error: error.message });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error handler (last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Allowed CORS Origins: ${allowedOrigins.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    redisClient.quit().catch(() => logger.error('Failed to close Redis'));
    process.exit(0);
  });
});

process.on('unhandledRejection', (err: Error) => {
  logger.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

export default app;