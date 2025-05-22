# TradeBikes Deployment Guide

This document outlines how to deploy the TradeBikes platform.

## Quick Deployment

For the quickest and most reliable deployment, use the standalone server:

```
node start-server.cjs
```

This server provides all essential functionality including:
- User authentication (login/registration)
- Motorcycle listings
- Dealer information
- WebSocket for real-time communication

## Test Accounts

You can use these pre-configured accounts to test the system:

- Admin account:
  - Username: `admin`
  - Password: `password`

- Test dealer account:
  - Username: `johndealer` 
  - Password: `password123`

## Deployment Troubleshooting

If you encounter any issues with the PostCSS configuration or build system, the standalone server bypasses these problems by using a simplified approach that doesn't rely on complex build tools.

## Alternative Deployment Methods

The following methods are also available but may require additional configuration:

```
NODE_ENV=production tsx server/index.ts
```

Or:

```
node production-server.js
```

## Replit Deployment

For Replit deployment, the standalone server is recommended for its reliability and simplified approach.