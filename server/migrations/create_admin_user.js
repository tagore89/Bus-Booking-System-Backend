import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@travelease.com' });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 8);
      
      const adminUser = new User({
        name: 'Admin',
        email: 'admin@travelease.com',
        password: hashedPassword,
        isAdmin: true
      });
      
      await adminUser.save();
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

createAdminUser();