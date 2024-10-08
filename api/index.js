import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import { v2 as cloudinary } from 'cloudinary'; // Import Cloudinary

import authRoutes from './routes/auth.js';
import menuItemRoutes from './routes/menuItems.js';
import orderRoutes from './routes/orders.js';
import categoryRoutes from './routes/categories.js';
import reviewRoutes from './routes/reviews.js';

import { swaggerDefinition } from './swaggerDefinition.js';

// Load environment variables from .env
dotenv.config();


console.log('MongoDB Connection URL:', process.env.CONNECTION_URL);


// Initialize the Express app
const app = express();

// Enable CORS for all requests
app.use(cors());

// Middleware to parse JSON request bodies and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose
  .connect(process.env.CONNECTION_URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Swagger definition setup
const swaggerOptions = {
  swaggerDefinition,
  apis: ['./routes/*.js'], // Path to the API docs
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use('/api/auth', authRoutes);
app.use('/api/menuitems', menuItemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reviews', reviewRoutes);

// Define the port and start the server
const PORT = process.env.PORT;
const server = app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
export  {app, server};