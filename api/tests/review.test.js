import mongoose from 'mongoose';
import request from 'supertest';
import {app,server} from '../index.js';
import Review from '../models/Review.js';
import User from '../models/User.js';
import MenuItem from '../models/MenuItem.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Category from '../models/Category.js';
dotenv.config({ path: './.env.test' });  // This will load the .env.test file


let user, menuItem, token;

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
    // Create a user and generate a JWT token to use for the tests
    user = new User({
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'password123',
        role: 'customer',
    });
    await user.save();

    // Generate a JWT token for the user
    token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '1h',
    });

    const category = new Category({
        name: 'Main Course',
      });
      await category.save();

    menuItem = new MenuItem({
        name: 'Burger',
        description: 'Delicious burger',
        price: 8.99,
        category: category._id,
        available: true,
        image: { public_id: 'some_id', url: 'http://imageurl.com' },
    });
    await menuItem.save();
});

afterEach(async () => {
    // Clear all collections except 'users'
    const collections = Object.keys(mongoose.connection.collections);
    for (const collectionName of collections) {
      if (collectionName !== 'users' || collectionName !== 'menuitem') { // Don't delete the users collection
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
  

describe('Review API', () => {
    // Test for creating a review
    it('should create a new review', async () => {
        const res = await request(app)
            .post('/api/reviews')
            .set('Authorization', `Bearer ${token}`) // Add JWT token to Authorization header
            .send({
                user: user._id,
                menuItem: menuItem._id,
                rating: 5,
                comment: 'Great food!',
            });

        expect(res.statusCode).toBe(201); // Expect 201 Created
        expect(res.body).toHaveProperty('_id');
        expect(res.body.rating).toBe(5);
        expect(res.body.comment).toBe('Great food!');
        expect(res.body.user).toBe(String(user._id));
        expect(res.body.menuItem).toBe(String(menuItem._id));
    });

    // Test for validation errors (missing required fields)
    it('should return error if required fields are missing', async () => {
        const res = await request(app)
            .post('/api/reviews')
            .set('Authorization', `Bearer ${token}`) // Add JWT token to Authorization header
            .send({
                comment: 'Missing fields',
            });

        expect(res.statusCode).toBe(400); // Expect 400 Bad Request
        expect(res.body).toHaveProperty('message', 'User, menu item, and rating are required');
    });

    // Test for invalid user ID
    it('should return error for invalid user ID', async () => {
        const res = await request(app)
            .post('/api/reviews')
            .set('Authorization', `Bearer ${token}`) // Add JWT token to Authorization header
            .send({
                user: 'invalid_user_id',
                menuItem: menuItem._id,
                rating: 4,
                comment: 'Good food!',
            });

        expect(res.statusCode).toBe(400); // Expect 400 Bad Request
        expect(res.body).toHaveProperty('message', 'Invalid or missing user ID');
    });

    // Test for invalid menu item ID
    it('should return error for invalid menu item ID', async () => {
        const res = await request(app)
            .post('/api/reviews')
            .set('Authorization', `Bearer ${token}`) // Add JWT token to Authorization header
            .send({
                user: user._id,
                menuItem: 'invalid_menuitem_id',
                rating: 4,
                comment: 'Good food!',
            });

        expect(res.statusCode).toBe(400); // Expect 400 Bad Request
        expect(res.body).toHaveProperty('message', 'Invalid or missing menu item ID');
    });

    // Test for invalid rating value
    it('should return error for invalid rating value', async () => {
        const res = await request(app)
            .post('/api/reviews')
            .set('Authorization', `Bearer ${token}`) // Add JWT token to Authorization header
            .send({
                user: user._id,
                menuItem: menuItem._id,
                rating: 7, // Invalid rating
                comment: 'Rating is too high!',
            });

        expect(res.statusCode).toBe(400); // Expect 400 Bad Request
        expect(res.body).toHaveProperty('message', 'Rating must be an integer between 1 and 5');
    });

    // Test for fetching reviews by menu item
    it('should fetch reviews for a specific menu item', async () => {
        const review1 = new Review({
            user: user._id,
            menuItem: menuItem._id,
            rating: 5,
            comment: 'Excellent!',
        });

        const review2 = new Review({
            user: user._id,
            menuItem: menuItem._id,
            rating: 4,
            comment: 'Very good!',
        });

        await review1.save();
        await review2.save();

        const res = await request(app)
            .get(`/api/reviews/menuitem/${menuItem._id}`)
            .set('Authorization', `Bearer ${token}`); // Add JWT token to Authorization header

        expect(res.statusCode).toBe(200); // Expect 200 OK
        expect(res.body.length).toBe(2); // Should return 2 reviews
        expect(res.body[0].comment).toBe('Excellent!');
        expect(res.body[1].comment).toBe('Very good!');
    });

    // Test for deleting a review
    it('should delete a review', async () => {
        const review = new Review({
            user: user._id,
            menuItem: menuItem._id,
            rating: 3,
            comment: 'Average food',
        });

        await review.save();

        const res = await request(app)
            .delete(`/api/reviews/${review._id}`)
            .set('Authorization', `Bearer ${token}`); // Add JWT token to Authorization header

        expect(res.statusCode).toBe(200); // Expect 200 OK
        expect(res.body).toHaveProperty('message', 'Review deleted successfully');
    });

    // Test for handling deletion of a non-existent review
    it('should return 404 when deleting a non-existent review', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .delete(`/api/reviews/${nonExistentId}`)
            .set('Authorization', `Bearer ${token}`); // Add JWT token to Authorization header

        expect(res.statusCode).toBe(404); // Expect 404 Not Found
        expect(res.body).toHaveProperty('message', 'Review not found');
    });
});
