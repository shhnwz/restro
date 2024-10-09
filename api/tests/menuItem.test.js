import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import {app,server} from '../index.js';
import MenuItem from '../models/MenuItem.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();  // This will load the .env.test file

let token;
let userId;


/// Mocking cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload: jest.fn(() =>
        Promise.resolve({
          public_id: 'sample_id',
          secure_url: 'http://imageurl.com/sample',
        })
      ),
      destroy: jest.fn(() => Promise.resolve({ result: 'ok' })),
    },
    config: jest.fn(),
  },
}));




beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.CONNECTION_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  }

  const collections = Object.keys(mongoose.connection.collections);
  for (const collectionName of collections) {
    await mongoose.connection.collections[collectionName].deleteMany({});
  }

  // Register a user and retrieve the token
  const userResponse = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'admin',
      phone: '1234567890',
      address: [{ street: '123 Main St', city: 'New York', state: 'NY', zip: '10001' }],
    });

  if (userResponse.body && userResponse.body.token) {
    token = userResponse.body.token;
    userId = userResponse.body.user.id;
  } else {
    console.error('User creation failed. Response:', userResponse.body);
  }
});

afterEach(async () => {
  // Clear collections after each test
  const collections = Object.keys(mongoose.connection.collections);
  for (const collectionName of collections) {
    if (collectionName !== 'users') { // Don't delete the users collection
      const collection = mongoose.connection.collections[collectionName];
      await collection.deleteMany({}); // Clear each collection
    }
  }
});

afterAll(async () => {
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
  await mongoose.connection.close();
await new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) return reject(err);  // If there's an error, reject the promise
      resolve();  // Resolve the promise when server has closed successfully
    });
  });

});

describe('Menu Items API', () => {
  let category;

  // Create a category before each test
  beforeEach(async () => {
    category = new Category({
      name: 'Main Course',
      description: 'Main course category',
    });
    await category.save();
  });

  // Test for creating a new menu item
  it('should create a new menu item', async () => {
    const res = await request(app)
      .post('/api/menuitems')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Pizza',
        description: 'Delicious cheese pizza',
        price: 9.99,
        category: category._id, // Reference the created category
        available: true,
        image: 'http://imageurl.com/pizza',
      });

    expect(res.statusCode).toBe(201); // Expect 201 Created
    expect(res.body).toHaveProperty('_id');
    expect(res.body.name).toBe('Pizza');
    expect(res.body.image).toHaveProperty('url');
    expect(res.body.category).toBe(String(category._id)); // Ensure the category reference is correct
  });

  // Test for missing fields during creation
  it('should return error if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/menuitems')
      .set('Authorization', `Bearer ${token}`)
      .send({
        description: 'Delicious cheese pizza',
        price: 9.99,
        available: true,
        image: 'http://imageurl.com/pizza',
      });

    expect(res.statusCode).toBe(400); // Expect 400 Bad Request
    expect(res.body).toHaveProperty('message', 'All required fields must be filled');
  });

  // Test for invalid category ID during creation
  it('should return error if category ID is invalid', async () => {
    const res = await request(app)
      .post('/api/menuitems')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Burger',
        description: 'Juicy beef burger',
        price: 5.99,
        category: 'invalid_category_id', // Invalid category ID
        available: true,
        image: 'http://imageurl.com/burger',
      });

    expect(res.statusCode).toBe(400); // Expect 400 Bad Request
    expect(res.body).toHaveProperty('message', 'Invalid category ID');
  });

  // Test for fetching all menu items
  it('should fetch all menu items', async () => {
    const menuItem1 = new MenuItem({
      name: 'Pizza',
      description: 'Delicious cheese pizza',
      price: 9.99,
      category: category._id,
      available: true,
      image: {public_id:'some_id',
        url:'http://imageurl.com/pizza'},
    });

    const menuItem2 = new MenuItem({
      name: 'Burger',
      description: 'Juicy beef burger',
      price: 5.99,
      category: category._id,
      available: true,
      image: {public_id:'some_id',
        url:'http://imageurl.com/pizza'},
    });

    await menuItem1.save();
    await menuItem2.save();

    const res = await request(app).get('/api/menuitems').set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200); // Expect 200 OK
    expect(res.body.length).toBe(2); // Should return 2 menu items
    expect(res.body[0]).toHaveProperty('name', 'Pizza');
    expect(res.body[1]).toHaveProperty('name', 'Burger');
  });

  // Test for fetching a menu item by ID
  it('should fetch a menu item by ID', async () => {
    const menuItem = new MenuItem({
      name: 'Pasta',
      description: 'Creamy pasta',
      price: 7.99,
      category: category._id,
      available: true,
      image: {public_id:'some_id',
        url:'http://imageurl.com/pizza'},
    });

    await menuItem.save();

    const res = await request(app).get(`/api/menuitems/${menuItem._id}`).set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200); // Expect 200 OK
    expect(res.body).toHaveProperty('name', 'Pasta');
    expect(res.body).toHaveProperty('description', 'Creamy pasta');
  });

  // Test for handling non-existent menu item fetch
  it('should return 404 if menu item is not found', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/menuitems/${nonExistentId}`).set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404); // Expect 404 Not Found
    expect(res.body).toHaveProperty('message', 'Menu item not found');
  });

  // Test for updating a menu item
  it('should update a menu item', async () => {
    const menuItem = new MenuItem({
      name: 'Fries',
      description: 'Crispy french fries',
      price: 2.99,
      category: category._id,
      available: true,
      image: {public_id:'some_id',
        url:'http://imageurl.com/pizza'},
    });

    await menuItem.save();

    const res = await request(app)
      .put(`/api/menuitems/${menuItem._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Cheesy Fries',
        description: 'Crispy fries with cheese',
        price: 3.99,
        category: category._id,
        available: true,
        image: {public_id:'some_id',
          url:'http://imageurl.com/fries'},
      });

    expect(res.statusCode).toBe(200); // Expect 200 OK
    expect(res.body).toHaveProperty('name', 'Cheesy Fries');
    expect(res.body).toHaveProperty('price', 3.99);
  });

  // Test for handling update on non-existent menu item
  it('should return 404 when updating a non-existent menu item', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/menuitems/${nonExistentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Non-existent item',
        price: 10.99,
      });

    expect(res.statusCode).toBe(404); // Expect 404 Not Found
    expect(res.body).toHaveProperty('message', 'Menu item not found');
  });

  // Test for deleting a menu item
  it('should delete a menu item', async () => {
    const menuItem = new MenuItem({
      name: 'Salad',
      description: 'Fresh garden salad',
      price: 4.99,
      category: category._id,
      available: true,
      image: {public_id:'some_id',
        url:'http://imageurl.com/pizza'},
    });

    await menuItem.save();

    const res = await request(app).delete(`/api/menuitems/${menuItem._id}`).set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200); // Expect 200 OK
    expect(res.body).toHaveProperty('message', 'Menu item deleted successfully');
  });

  // Test for handling deletion of non-existent menu item
  it('should return 404 when deleting a non-existent menu item', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/api/menuitems/${nonExistentId}`).set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404); // Expect 404 Not Found
    expect(res.body).toHaveProperty('message', 'Menu item not found');
  });

  // Additional tests for validations
  it('should return error if available field is not boolean', async () => {
    const res = await request(app)
      .post('/api/menuitems')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Pizza',
        description: 'Delicious cheese pizza',
        price: 9.99,
        category: category._id,
        available: 'yes', // Invalid boolean field
        image: 'http://imageurl.com/pizza',
      });

    expect(res.statusCode).toBe(400); // Expect 400 Bad Request
    expect(res.body).toHaveProperty('message', 'Available field must be true or false');
  });
});
