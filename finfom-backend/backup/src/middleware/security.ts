import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';

// Sanitize data to prevent NoSQL injection
export const sanitizeData = mongoSanitize();

// Prevent XSS attacks
export const preventXSS = xss();

// Prevent HTTP Parameter Pollution
export const preventHPP = hpp({
  whitelist: ['page', 'limit', 'sort', 'visibility'] // Allow these params to be duplicated
});