import request from 'supertest';
import {app,server} from '../index.js'; // Import your Express app
import mongoose from 'mongoose';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config({ path: './.env.test' });  // This will load the .env.test file



beforeAll(async () => {
  // Use a separate test database for testing purposes
  const url = process.env.CONNECTION_URL;

  if (mongoose.connection.readyState === 0) {  // Check if not connected
    await mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
  }

  const collections = Object.keys(mongoose.connection.collections);
  for (const collectionName of collections) {
    await mongoose.connection.collections[collectionName].deleteMany({});
  }
});

afterAll(async () => {
  // Loop through all collections and drop them
  const collections = Object.keys(mongoose.connection.collections);
  for (const collectionName of collections) {
    const collection = mongoose.connection.collections[collectionName];
    try {
      await collection.drop();
    } catch (error) {
      // Ignore errors that occur if the collection doesn't exist
      if (error.message === 'ns not found') return;
      if (error.message.includes('a background operation is currently running')) return;
      console.log(`Error dropping collection: ${collectionName}`, error.message);
    }
  }
  
  // Ensure the connection is closed after all tests are done
  await mongoose.connection.close();
  await new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) return reject(err);  // If there's an error, reject the promise
      resolve();  // Resolve the promise when server has closed successfully
    });
  });
});


afterEach(async () => {
  // Clear all collections except 'users'
  const collections = Object.keys(mongoose.connection.collections);
  for (const collectionName of collections) {
    if (collectionName !== 'users') { // Don't delete the users collection
      const collection = mongoose.connection.collections[collectionName];
      await collection.deleteMany({}); // Clear each collection
    }
  }
});


describe('Auth API', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'customer',
        phone: '1234567890',
        address: [{ street: 'String', city: 'String', state: 'String', zip: 'String',}]
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('id');
  });

  // Add more test cases as needed
});


// Clean up the database after each test
afterEach(async () => {
  await User.deleteMany({});
});

// Disconnect from the database after all tests

describe('Auth API', () => {

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const newUser = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'customer',
        phone: '1234567890',
        address: [{ street: '123 Main St', city: 'New York', state: 'NY', zip: '10001' }]
      };

      const res = await request(app).post('/api/auth/register').send(newUser);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.name).toBe('John Doe');
    });

    it('should return error if user already exists', async () => {
      const existingUser = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'customer',
        phone: '1234567890',
        address: [{ street: 'String', city: 'String', state: 'String', zip: 'String',}]

      });
      await existingUser.save();

      const res = await request(app).post('/api/auth/register').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'customer',
        phone: '1234567890',
        address: [{ street: 'String', city: 'String', state: 'String', zip: 'String',}]
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login an existing user', async () => {
      const user = new User({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: await bcrypt.hash('password123', 10), // Pre-hash the password
        role: 'customer',
      });
      await user.save();

      const res = await request(app).post('/api/auth/login').send({
        email: 'jane@example.com',
        password: 'password123',
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.name).toBe('Jane Doe');
    });

    it('should return error if user does not exist', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('message', 'User not found');
    });

    it('should return error if password is incorrect', async () => {
      const user = new User({
        name: 'Jack Doe',
        email: 'jack@example.com',
        password: await bcrypt.hash('correct_password', 10), // Pre-hash the password
        role: 'customer',
      });
      await user.save();

      const res = await request(app).post('/api/auth/login').send({
        email: 'jack@example.com',
        password: 'wrong_password',
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });
  });
});
