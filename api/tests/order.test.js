import mongoose from 'mongoose';
import request from 'supertest';
import {app,server} from '../index.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import MenuItem from '../models/MenuItem.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Category from '../models/Category.js';
dotenv.config({ path: './.env.test' });  // This will load the .env.test file


let token; // Store the token here
let user, menuItem;

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

  const category = new Category({
    name: 'Main Course',
  });
  await category.save();
  // Create a user and generate a token
  user = new User({
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'password123',
    role: 'admin', // Ensure this user has the necessary privileges
  });
  await user.save();

  // Generate a JWT token for the user
  token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

  // Create a sample menu item
  menuItem = new MenuItem({
    name: 'Pizza',
    description: 'Delicious cheese pizza',
    price: 9.99,
    category: category._id,
    available: true,
    image: { public_id: 'some_public_id', url: 'http://imageurl.com' },
  });
  await menuItem.save();
});

afterEach(async () => {
  // Clear all collections except 'users'
  const collections = Object.keys(mongoose.connection.collections);
  for (const collectionName of collections) {
    if (collectionName !== 'users' || collectionName !== 'menuitem'|| collectionName !== 'category') { // Don't delete the users collection
      const collection = mongoose.connection.collections[collectionName];
      await collection.deleteMany({}); // Clear each collection
    }
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


describe('Order API', () => {
  // Test for creating a new order
  it('should create a new order', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`) // Add Authorization header
      .send({
        user: user._id,
        items: [
          {
            menuItemId: menuItem._id,
            quantity: 2,
            price: 9.99,
          },
        ],
        totalAmount: 19.98,
        paymentMethod: 'card',
        deliveryAddress: {
          street: '123 Main St',
          city: 'Some City',
          state: 'Some State',
          zip: '12345',
        },
        dineIn: false,
      });

    expect(res.statusCode).toBe(201); // Expect 201 Created
    expect(res.body).toHaveProperty('_id');
    expect(res.body.totalAmount).toBe(19.98);
    expect(res.body.paymentMethod).toBe('card');
    expect(res.body.deliveryAddress).toHaveProperty('street', '123 Main St');
  });

  // Test for missing required fields
  it('should return error if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`) // Add Authorization header
      .send({
        items: [
          {
            menuItemId: menuItem._id,
            quantity: 2,
            price: 9.99,
          },
        ],
        totalAmount: 19.98,
        paymentMethod: 'card',
        deliveryAddress: {
          street: '123 Main St',
          city: 'Some City',
          state: 'Some State',
          zip: '12345',
        },
        dineIn: false,
      });

    expect(res.statusCode).toBe(400); // Expect 400 Bad Request
    expect(res.body).toHaveProperty('message', 'User, items, totalAmount, and paymentMethod are required');
  });

  // Test for invalid user ID
  it('should return error for invalid user ID', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`) // Add Authorization header
      .send({
        user: 'invalidUserId',
        items: [
          {
            menuItemId: menuItem._id,
            quantity: 2,
            price: 9.99,
          },
        ],
        totalAmount: 19.98,
        paymentMethod: 'card',
        deliveryAddress: {
          street: '123 Main St',
          city: 'Some City',
          state: 'Some State',
          zip: '12345',
        },
        dineIn: false,
      });

    expect(res.statusCode).toBe(400); // Expect 400 Bad Request
    expect(res.body).toHaveProperty('message', 'Invalid user ID');
  });

  // Test for fetching a single order by ID
  it('should fetch an order by ID', async () => {
    const order = new Order({
      user: user._id,
      items: [
        {
          menuItemId: menuItem._id,
          quantity: 2,
          price: 9.99,
        },
      ],
      totalAmount: 19.98,
      paymentMethod: 'card',
      deliveryAddress: {
        street: '123 Main St',
        city: 'Some City',
        state: 'Some State',
        zip: '12345',
      },
      dineIn: false,
    });
    await order.save();

    const res = await request(app)
      .get(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${token}`); // Add Authorization header

    expect(res.statusCode).toBe(200); // Expect 200 OK
    expect(res.body).toHaveProperty('_id');
    expect(res.body.totalAmount).toBe(19.98);
  });

  // Test for handling non-existent order fetch
  it('should return 404 if order is not found', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/orders/${nonExistentId}`)
      .set('Authorization', `Bearer ${token}`); // Add Authorization header

    expect(res.statusCode).toBe(404); // Expect 404 Not Found
    expect(res.body).toHaveProperty('message', 'Order not found');
  });

  // Test for updating order status
  it('should update the order status', async () => {
    const order = new Order({
      user: user._id,
      items: [
        {
          menuItemId: menuItem._id,
          quantity: 2,
          price: 9.99,
        },
      ],
      totalAmount: 19.98,
      paymentMethod: 'card',
      deliveryAddress: {
        street: '123 Main St',
        city: 'Some City',
        state: 'Some State',
        zip: '12345',
      },
      dineIn: false,
    });
    await order.save();

    const res = await request(app)
      .put(`/api/orders/${order._id}`)
      .set('Authorization', `Bearer ${token}`) // Add Authorization header
      .send({ status: 'delivered' });

    expect(res.statusCode).toBe(200); // Expect 200 OK
    expect(res.body.status).toBe('delivered');
  });

  // Test for handling update on non-existent order
  it('should return 404 when updating a non-existent order', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/orders/${nonExistentId}`)
      .set('Authorization', `Bearer ${token}`) // Add Authorization header
      .send({ status: 'delivered' });

    expect(res.statusCode).toBe(404); // Expect 404 Not Found
    expect(res.body).toHaveProperty('message', 'Order not found');
  });

  // Test for fetching all orders
  it('should fetch all orders', async () => {
    const order1 = new Order({
      user: user._id,
      items: [
        {
          menuItemId: menuItem._id,
          quantity: 2,
          price: 9.99,
        },
      ],
      totalAmount: 19.98,
      paymentMethod: 'card',
      dineIn: false,
    });

    const order2 = new Order({
      user: user._id,
      items: [
        {
          menuItemId: menuItem._id,
          quantity: 1,
          price: 9.99,
        },
      ],
      totalAmount: 9.99,
      paymentMethod: 'cash',
      dineIn: true,
    });
    await order1.save();
    await order2.save();
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`); // Add Authorization header
    expect(res.statusCode).toBe(200); // Expect 200 OK
    expect(res.body.length).toBe(2); // Should return 2 orders
    expect(res.body[0]).toHaveProperty('totalAmount', 19.98);
    expect(res.body[1]).toHaveProperty('totalAmount', 9.99);
  });
});