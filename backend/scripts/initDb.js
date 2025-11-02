require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * Initialize database with default admin user
 */
const initDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if any users exist
    const userCount = await User.countDocuments();

    if (userCount > 0) {
      console.log(`Database already has ${userCount} users. Skipping initialization.`);
      process.exit(0);
    }

    // Create default admin user
    const defaultAdmin = {
      email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@clinic.com',
      password: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!',
      name: 'Admin User',
      role: 'admin',
    };

    const admin = await User.create(defaultAdmin);

    console.log('✓ Default admin user created successfully');
    console.log('  Email:', admin.email);
    console.log('  Password:', defaultAdmin.password);
    console.log('  Role:', admin.role);
    console.log('\n⚠️  Please change the default password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
};

// Run initialization
initDatabase();
