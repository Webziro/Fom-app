import rateLimit from 'express-rate-limit';

//function that creates various rate limiters for different use cases.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

//function that limits login attempts to prevent brute-force attacks.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

//function that limits file uploads to prevent abuse.
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: 'Upload limit exceeded, please try again later.',
});

//function that limits file downloads to manage bandwidth.
export const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Download limit exceeded, please try again later.',
});


//function that limits file access to ensure fair usage.
export const fileAccessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'File access limit exceeded, please try again later.',
});