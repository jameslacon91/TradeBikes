# TradeBikes Deployment Instructions

To successfully deploy your TradeBikes application on Replit, please follow these steps:

## How to Deploy Without Errors

1. When deploying on Replit, use this custom run command in the deployment settings:
   ```
   NODE_ENV=production tsx server/index.ts
   ```

2. This bypasses the need for the build process and serves your application directly from the source files.

3. Make sure you're logged in with an admin account to access the admin dashboard:
   - Username: admin
   - Password: password

## About This Deployment

This deployment runs the server directly from the TypeScript files instead of trying to build and run from the dist directory. This approach avoids the dependency issues with autoprefixer and other build tools.

Your TradeBikes application includes:
- Full admin dashboard with message viewing
- PostgreSQL database integration
- WebSocket support for real-time communications
- Complete B2B motorcycle trading platform functionality

## Troubleshooting

If you encounter any issues:
- Check that the DATABASE_URL environment variable is correctly set
- Make sure the application is running on the correct port (5000)
- Verify that all required dependencies are installed