// Simple admin account setup for TradeBikes
import { storage } from "./storage";
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

console.log("Creating admin account for TradeBikes...");

// Helper functions for password hashing
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// Admin credentials
const credentials = {
  username: "admin",
  password: "password"
};

// This will be automatically executed when importing this file
async function setupAdmin() {
  try {
    // We're using memory storage, so this is a simpler approach
    console.log("Creating new admin account directly...");
    
    // Direct in-memory approach
    const adminPassword = await hashPassword(credentials.password);
    
    // Simple creation approach - direct addition to storage
    const admin = {
      id: 999, // Special admin ID
      username: "admin",
      password: adminPassword,
      email: "admin@tradebikes.com",
      role: "admin",
      companyName: "TradeBikes Administration",
      phone: "123456789",
      address: "Admin HQ",
      city: "London",
      postcode: "EC1A 1BB",
      rating: 5,
      totalRatings: 0,
      favoriteDealers: [],
      createdAt: new Date()
    };
    
    // Add admin through the storage interface instead of direct access
    try {
      // First check if admin exists
      const existingAdmin = await storage.getUserByUsername("admin");
      if (existingAdmin) {
        console.log("Admin already exists, skipping creation");
      } else {
        // Create the admin through the proper interface
        await storage.createUser({
          username: "admin",
          password: adminPassword,
          email: "admin@tradebikes.com",
          role: "admin",
          companyName: "TradeBikes Administration",
          phone: "123456789",
          address: "Admin HQ",
          city: "London",
          postcode: "EC1A 1BB",
          favoriteDealers: []
        });
      }
    } catch (innerError) {
      console.log("Error adding admin directly:", innerError);
    }
    console.log("Admin account ready - Username: admin, Password: password");
    
  } catch (error) {
    console.error("Error setting up admin account:", error);
  }
}

// Export for use in routes.ts
export { setupAdmin };