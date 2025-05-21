import { pool, db } from './server/db';
import { users } from './shared/schema';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function createAdminUser() {
  try {
    console.log('Checking if admin user exists...');
    
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, 'admin')
    });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }
    
    // Create admin user
    const hashedPassword = await hashPassword('password');
    
    const admin = {
      username: 'admin',
      password: hashedPassword,
      email: 'admin@tradebikes.com',
      role: 'admin',
      companyName: 'TradeBikes Administration',
      phone: '',
      address: '',
      city: '',
      postcode: '',
      favoriteDealers: []
    };
    
    console.log('Creating admin user...');
    const result = await db.insert(users).values(admin);
    
    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await pool.end();
  }
}

createAdminUser();