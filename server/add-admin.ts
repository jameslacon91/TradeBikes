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
    // Add admin user if it doesn't exist
    let adminUser = await storage.getUserByUsername(credentials.username);
    
    if (!adminUser) {
      console.log("Creating new admin account...");
      adminUser = await storage.createUser({
        username: credentials.username,
        password: await hashPassword(credentials.password),
        email: "admin@tradebikes.com",
        role: "admin",
        companyName: "TradeBikes Administration",
        phone: "123456789",
        address: "Admin HQ",
        city: "London",
        postcode: "EC1A 1BB",
        favoriteDealers: []
      });
      console.log(`Admin account created with ID: ${adminUser.id}`);
    } else {
      console.log("Admin account already exists");
    }
    
    // Ensure admin password is correct (update if necessary)
    const pwdValid = await storage.comparePasswords(
      credentials.password,
      adminUser.password
    );
    
    if (!pwdValid) {
      console.log("Updating admin password...");
      adminUser = await storage.updateUser(
        adminUser.id, 
        { password: await hashPassword(credentials.password) }
      );
      console.log("Admin password updated");
    }
    
    console.log("Admin account ready - Username: admin, Password: password");
    
  } catch (error) {
    console.error("Error setting up admin account:", error);
  }
}

// Export for use in routes.ts
export { setupAdmin };