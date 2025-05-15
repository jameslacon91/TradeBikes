// Deployment configuration settings for TradeBikes
// This centralizes all deployment-specific settings

// Environment detection
export const isProduction: boolean = process.env.NODE_ENV === 'production' || 
  process.env.REPLIT_DEPLOYMENT === 'true' ||
  process.env.REPLIT_ENVIRONMENT === 'production';

// Cookie settings for different environments
export const cookieConfig = {
  // Session cookie settings
  session: {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
    sameSite: isProduction ? 'none' as const : 'lax' as const,
    secure: isProduction // true in production, false in development
  },
  
  // Browser-readable cookie settings
  browser: {
    httpOnly: false, // Readable by JavaScript
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
    sameSite: isProduction ? 'none' as const : 'lax' as const,
    secure: isProduction // true in production, false in development
  }
};

// CORS settings
export const corsConfig = {
  // List of allowed origins for cross-domain requests
  allowedOrigins: [
    'https://trade-bikes-jameslacon1.replit.app',
    'https://trade-bikes.jameslacon1.repl.co',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    // Replit Janeway domains
    /^https:\/\/[a-f0-9-]+-[a-z0-9]+\.janeway\.replit\.dev$/
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

// Get the application's base URL based on environment
export const getAppBaseUrl = (): string => {
  if (isProduction) {
    return process.env.APP_URL || 'https://trade-bikes-jameslacon1.replit.app';
  }
  return 'http://localhost:5000';
};

// Print deployment information at startup
console.log(`Application environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`Cookie settings: sameSite=${cookieConfig.session.sameSite}, secure=${cookieConfig.session.secure}`);
console.log(`Allowed origins:`, corsConfig.allowedOrigins.map(origin => 
  origin instanceof RegExp ? origin.toString() : origin
).join(', '));