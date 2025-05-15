# TradeBikes Deployment Guide

This document explains how to properly deploy the TradeBikes application on Replit.

## Deployment Process

1. **Prepare the Build**:
   - Make sure all your changes are saved
   - The `package.json` file has the correct build and start scripts

2. **Run the Build Manually** (do this before clicking "Deploy" in Replit):
   ```bash
   npm run build
   ```

3. **Set Environment Variables**:
   - In Replit, click on the "Secrets" tool (lock icon) in the left sidebar
   - Add the following secrets:
     - `SESSION_SECRET`: A secure random string for session encryption
     - `NODE_ENV`: Set this to `production`
     - `REPLIT_DEPLOYMENT`: Set this to `true`

4. **Deploy the Application**:
   - Click the "Deploy" button in the Replit interface
   - Select "Autoscale" as the deployment type if prompted
   - Wait for the deployment process to complete

5. **Verify Deployment**:
   - Once deployment is complete, click the provided URL (e.g., https://trade-bikes-jameslacon1.replit.app)
   - If you encounter any issues, check the deployment logs

## Troubleshooting

If you encounter issues with deployment, try these fixes:

1. **Manual deployment**:
   ```bash
   # Build the client and server
   vite build
   esbuild server/deploy.ts server/auth.ts server/prod-config.ts server/routes.ts server/storage.ts server/vite.ts server/utils.ts server/websocket.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
   
   # Run in production mode
   NODE_ENV=production node dist/deploy.js
   ```

2. **WebSocket Connection Issues**:
   - Make sure your browser allows mixed content if you're accessing HTTP resources from HTTPS
   - Try clearing browser cookies and cache

3. **CORS Issues**:
   - The application is configured to handle CORS for all Replit domains
   - If you're accessing from another domain, add it to the allowedOrigins in server/prod-config.ts

4. **Session/Cookie Issues**:
   - Ensure your browser is accepting cookies from the domain
   - Try accessing the site in an incognito/private browsing window

## Production Environment

The deployed application runs with:
- Production mode enabled
- Secure cookies (requires HTTPS)
- In-memory session storage (sessions are lost on server restart)
- Static assets served from the dist/client directory