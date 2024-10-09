import MenuItem from '../models/MenuItem.js';
import Category from '../models/Category.js';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary'; // Import Cloudinary


// Get all menu items
export const getAllMenuItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.find().populate('category');
    res.status(200).json(menuItems);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving menu items', error });
  }
};

// Get menu item by ID
export const getMenuItemById = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).populate('category');
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.status(200).json(menuItem);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving menu item', error });
  }
};

// Create a new menu item
export const createMenuItem = async (req, res) => {
  const { name, description, price, category, image, available } = req.body;

  console.log("Create Menu Item Request Received", { name, price, category, available });

  // Validate required fields
  if (!name || !price || !category || !image) {
    return res.status(400).json({ message: 'All required fields must be filled' });
  }

  // Validate that category ID is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(category)) {
    return res.status(400).json({ message: 'Invalid category ID' });
  }

  // Validate available field (it should be boolean)
  if (typeof available !== 'boolean') {
    return res.status(400).json({ message: 'Available field must be true or false' });
  }

  try {
    // Check if the category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    // Upload image to Cloudinary
    let result;
    try {
      result = await cloudinary.uploader.upload(image, {
        folder: 'menuItems', // Folder in Cloudinary where images will be stored
      });
    } catch (cloudinaryError) {
      console.error("Cloudinary Upload Error:", cloudinaryError);
      return res.status(500).json({ message: 'Error uploading image to Cloudinary', error: cloudinaryError });
    }

    console.log("Image uploaded to Cloudinary", result);

    // Create a new menu item
    const newMenuItem = new MenuItem({
      name,
      description,
      price,
      category, // Category ID reference
      image: {
        public_id: result.public_id,
        url: result.secure_url,
      }, // Cloudinary image object { public_id, url }
      available,
    });

    const savedMenuItem = await newMenuItem.save();
    res.status(201).json(savedMenuItem);
  } catch (error) {
    console.error("Error creating menu item:", error);
    res.status(500).json({ message: 'Error creating menu item', error });
  }
};

export const updateMenuItem = async (req, res) => {
  const { category, image, available } = req.body;

  try {
    // Validate image and category fields if provided in the update
    if (image && (!image.public_id || !image.url)) {
      return res.status(400).json({ message: 'Invalid image data' });
    }

    // Validate that category ID is a valid ObjectId if provided
    if (category && !mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    // Validate available field (it should be boolean)
    if (typeof available !== 'undefined' && typeof available !== 'boolean') {
      return res.status(400).json({ message: 'Available field must be true or false' });
    }

    // Check if the category exists (if category is provided)
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ message: 'Invalid category' });
      }
    }

    // Find the menu item by ID
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // If a new image is provided, upload it to Cloudinary and delete the old image
    if (image) {
      // Delete the old image from Cloudinary
      if (menuItem.image && menuItem.image.public_id) {
        await cloudinary.uploader.destroy(menuItem.image.public_id);
      }

      // Upload the new image to Cloudinary
      const result = await cloudinary.uploader.upload(image, {
        folder: 'menuItems',
      });

      // Update the image details in the request body
      req.body.image = {
        public_id: result.public_id,
        url: result.secure_url,
      };
    }

    // Update the menu item with new data
    const updatedMenuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // Return the updated object
    }).populate('category');

    res.status(200).json(updatedMenuItem);
  } catch (error) {
    res.status(500).json({ message: 'Error updating menu item', error });
  }
};

// Delete a menu item
export const deleteMenuItem = async (req, res) => {
  try {
    // Find the menu item by ID
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // Delete the image from Cloudinary if it exists
    if (menuItem.image && menuItem.image.public_id) {
      await cloudinary.uploader.destroy(menuItem.image.public_id);
    }

    // Delete the menu item from the database
    await MenuItem.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting menu item', error });
  }
};
