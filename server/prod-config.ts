/**
 * Simplified production configuration for TradeBikes deployment
 * This file contains hardcoded values for production deployment
 * It is used as a fallback when environment variables are not available
 */

// Always production mode in this file
export const isProduction = true;

// Cookie settings for production environments (hardcoded for deployment)
export const cookieConfig = {
  // Session cookie settings
  session: {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
    sameSite: 'none' as const,
    secure: true // Always secure in production
  },
  
  // Browser-readable cookie settings
  browser: {
    httpOnly: false, // Readable by JavaScript
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
    sameSite: 'none' as const,
    secure: true // Always secure in production
  }
};

// CORS settings with permissive origin handling for deployment
export const corsConfig = {
  // List of allowed origins for cross-domain requests
  allowedOrigins: [
    // Deployed domain
    'https://trade-bikes-jameslacon1.replit.app',
    // Alternative domains
    'https://trade-bikes-jameslacon1.repl.co',
    // General Replit patterns
    /^https:\/\/.*\.replit\.app$/,
    /^https:\/\/.*\.repl\.co$/
  ],
  
  // Other CORS options
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
  exposedHeaders: ['set-cookie'],
  optionsSuccessStatus: 200
};

// Public paths that are accessible without authentication
export const publicPaths = [
  '/api/login',
  '/api/register',
  '/favicon.ico',
  '/_next',
  '/static',
  '/images'
];

// Get the application's base URL (hardcoded for production)
export const getAppBaseUrl = (): string => {
  return 'https://trade-bikes-jameslacon1.replit.app';
};

// Print deployment information at startup
console.log('⚠️ PRODUCTION MODE ACTIVE (using hardcoded deployment configuration)');
console.log(`Cookie settings: sameSite=${cookieConfig.session.sameSite}, secure=${cookieConfig.session.secure}`);