import mongoose from 'mongoose';
import request from 'supertest';
import {app,server} from '../index.js'; // Import the app
import Category from '../models/Category.js'; // Import the Category model
import User from '../models/User.js'; // Import the User model
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config({ path: './.env.test' });  // This will load the .env.test file


let token; // To store JWT token

// Before all tests, connect to the test database and create a user for authentication
beforeAll(async () => {
  // Use a separate test database for testing purposes
  const url = process.env.CONNECTION_URL;

  if (mongoose.connection.readyState === 0) { // Check if not connected
    await mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
  }

  const collections = Object.keys(mongoose.connection.collections);
  for (const collectionName of collections) {
    await mongoose.connection.collections[collectionName].deleteMany({});
  }
  // Create a user and generate a token
  const user = new User({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin', // Ensure the user has admin privileges
  });
  await user.save();

  // Generate a JWT token for the user
  token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '1h',
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


// After all tests, close the database connection
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

describe('Category API', () => {
  // Test for creating a new category
  it('should create a new category', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`) // Add Authorization header
      .send({
        name: 'Electronics',
        description: 'Category for electronic items',
      });

    expect(res.statusCode).toBe(201); // Expect the status code to be 201 (Created)
    expect(res.body).toHaveProperty('_id');
    expect(res.body.name).toBe('Electronics');
  });

  // Test for missing required fields
  it('should return an error if name is missing', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`) // Add Authorization header
      .send({
        description: 'Category without a name',
      });

    expect(res.statusCode).toBe(400); // Expect the status code to be 400 (Bad Request)
    expect(res.body).toHaveProperty('message', 'Category name is required');
  });

  // Test for fetching all categories
  it('should fetch all categories', async () => {
    // First, create two categories
    const category1 = new Category({ name: 'Electronics', description: 'Category for electronic items' });
    const category2 = new Category({ name: 'Clothing', description: 'Category for clothing items' });

    await category1.save();
    await category2.save();

    // Fetch all categories
    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`); // Add Authorization header

    expect(res.statusCode).toBe(200); // Expect the status code to be 200 (OK)
    expect(res.body.length).toBe(2); // Expect to get 2 categories
    expect(res.body[0]).toHaveProperty('name', 'Electronics');
    expect(res.body[1]).toHaveProperty('name', 'Clothing');
  });

  // Test for fetching a category by ID
  it('should fetch a category by ID', async () => {
    const category = new Category({ name: 'Furniture', description: 'Category for furniture items' });
    await category.save();

    const res = await request(app)
      .get(`/api/categories/${category._id}`)
      .set('Authorization', `Bearer ${token}`); // Add Authorization header

    expect(res.statusCode).toBe(200); // Expect the status code to be 200 (OK)
    expect(res.body).toHaveProperty('name', 'Furniture');
  });

  // Test for handling non-existent category fetch
  it('should return 404 if category is not found', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/categories/${nonExistentId}`)
      .set('Authorization', `Bearer ${token}`); // Add Authorization header

    expect(res.statusCode).toBe(404); // Expect 404 (Not Found)
    expect(res.body).toHaveProperty('message', 'Category not found');
  });

  // Test for updating an existing category
  it('should update an existing category', async () => {
    const category = new Category({ name: 'Books', description: 'Category for books' });
    await category.save();

    const res = await request(app)
      .put(`/api/categories/${category._id}`)
      .set('Authorization', `Bearer ${token}`) // Add Authorization header
      .send({
        name: 'Updated Books',
        description: 'Updated description for books',
      });

    expect(res.statusCode).toBe(200); // Expect 200 (OK)
    expect(res.body).toHaveProperty('name', 'Updated Books');
  });

  // Test for handling update on non-existent category
  it('should return 404 when updating a non-existent category', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/categories/${nonExistentId}`)
      .set('Authorization', `Bearer ${token}`) // Add Authorization header
      .send({
        name: 'Non-Existent',
      });

    expect(res.statusCode).toBe(404); // Expect 404 (Not Found)
    expect(res.body).toHaveProperty('message', 'Category not found');
  });

  // Test for deleting a category
  it('should delete a category', async () => {
    const category = new Category({ name: 'Appliances', description: 'Category for appliances' });
    await category.save();

    const res = await request(app)
      .delete(`/api/categories/${category._id}`)
      .set('Authorization', `Bearer ${token}`); // Add Authorization header

    expect(res.statusCode).toBe(200); // Expect 200 (OK)
    expect(res.body).toHaveProperty('message', 'Category deleted successfully');
  });

  // Test for handling deletion of non-existent category
  it('should return 404 when deleting a non-existent category', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/categories/${nonExistentId}`)
      .set('Authorization', `Bearer ${token}`); // Add Authorization header

    expect(res.statusCode).toBe(404); // Expect 404 (Not Found)
    expect(res.body).toHaveProperty('message', 'Category not found');
  });

});
