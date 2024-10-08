import mongoose from 'mongoose';
import Review from '../models/Review.js';

// Create a review
export const createReview = async (req, res) => {
  const { user, menuItem, rating, comment } = req.body;

  // Check if all required fields are present
  if (!user || !menuItem || !rating) {
    return res.status(400).json({ message: 'User, menu item, and rating are required' });
  }

  // Validate user ID
  if (!user || !mongoose.Types.ObjectId.isValid(user)) {
    return res.status(400).json({ message: 'Invalid or missing user ID' });
  }

  // Validate menu item ID
  if (!menuItem || !mongoose.Types.ObjectId.isValid(menuItem)) {
    return res.status(400).json({ message: 'Invalid or missing menu item ID' });
  }

  // Check if rating is provided and valid
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
  }

  

  try {
    const newReview = new Review({
      user,
      menuItem,
      rating,
      comment,
    });

    const savedReview = await newReview.save();
    res.status(201).json(savedReview);
  } catch (error) {
    res.status(500).json({ message: 'Error creating review', error });
  }
};

// Get reviews by menu item
export const getReviewsByMenuItem = async (req, res) => {
  const { menuItemId } = req.params;

  // Validate menu item ID
  if (!mongoose.Types.ObjectId.isValid(menuItemId)) {
    return res.status(400).json({ message: 'Invalid menu item ID' });
  }

  try {
    const reviews = await Review.find({ menuItem: menuItemId });
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving reviews', error });
  }
};

// Delete a review
export const deleteReview = async (req, res) => {
  const { id } = req.params;

  // Validate review ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid review ID' });
  }

  try {
    const deletedReview = await Review.findByIdAndDelete(id);
    if (!deletedReview) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting review', error });
  }
};
