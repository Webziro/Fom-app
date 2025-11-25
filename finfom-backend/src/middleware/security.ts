import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';

export const sanitizeData = mongoSanitize();
export const preventXSS = xss();
export const preventHPP = hpp({
  whitelist: ['page', 'limit', 'sort', 'visibility']
});