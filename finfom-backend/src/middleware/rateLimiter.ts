import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Upload limit exceeded, please try again later.',
});

export const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Download limit exceeded, please try again later.',
});

export const groupCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Group creation limit exceeded, please try again later.',
});

export const fileAccessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'File access limit exceeded, please try again later.',
});