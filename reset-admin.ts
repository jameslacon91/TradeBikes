import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { storage } from './server/storage';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function createAdminUser() {
  try {
    console.log('Creating admin user with memory storage...');
    
    const adminPassword = await hashPassword('password');
    
    const admin = {
      username: 'admin',
      password: adminPassword,
      email: 'admin@tradebikes.com',
      role: 'admin',
      companyName: 'TradeBikes Administration',
      phone: '123456789',
      address: 'Admin HQ',
      city: 'London',
      postcode: 'EC1A 1BB',
      favoriteDealers: []
    };
    
    const existingAdmin = await storage.getUserByUsername('admin');
    
    if (existingAdmin) {
      console.log('Admin user already exists, updating password...');
      await storage.updateUser(existingAdmin.id, { password: adminPassword });
      console.log('Admin password updated');
    } else {
      console.log('Creating new admin user...');
      const result = await storage.createUser(admin);
      console.log('Admin user created with ID:', result.id);
    }
    
    console.log('Admin account ready. Username: admin, Password: password');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();