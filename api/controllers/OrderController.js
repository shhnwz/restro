import Order from '../models/Order.js';
import mongoose from 'mongoose';

// Place a new order
export const createOrder = async (req, res) => {
  const { user, items, totalAmount, paymentMethod, deliveryAddress, dineIn } = req.body;

  // Check if all required fields are present
  if (!user || !items || !totalAmount || !paymentMethod) {
    return res.status(400).json({ message: 'User, items, totalAmount, and paymentMethod are required' });
  }

  // Check if items is an array and has at least one item
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Items must be a non-empty array' });
  }

  // Validate user ID
  if (!mongoose.Types.ObjectId.isValid(user)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  // Validate each item
  for (const item of items) {
    if (!item.menuItemId || !mongoose.Types.ObjectId.isValid(item.menuItemId)) {
      return res.status(400).json({ message: 'Invalid menu item ID' });
    }
    if (!item.quantity || !Number.isInteger(item.quantity) || item.quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be a positive integer' });
    }
    if (typeof item.price !== 'number' || item.price <= 0) {
      return res.status(400).json({ message: 'Price must be a positive number' });
    }
  }

  // Validate totalAmount
  if (typeof totalAmount !== 'number' || totalAmount <= 0) {
    return res.status(400).json({ message: 'Total amount must be a positive number' });
  }

  // Validate payment method
  if (!['cash', 'card'].includes(paymentMethod)) {
    return res.status(400).json({ message: 'Payment method must be either cash or card' });
  }

  // Optional delivery address validation
  if (!dineIn && (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.zip)) {
    return res.status(400).json({ message: 'Delivery address is required for non-dine-in orders' });
  }

  try {
    const newOrder = new Order({
      user,
      items,
      totalAmount,
      paymentMethod,
      deliveryAddress,
      dineIn,
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Error placing order', error });
  }
};

// Get order by ID
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user').populate('items.menuItemId');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving order', error });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  const { status } = req.body;

  // Validate order status
  if (!['pending', 'preparing', 'delivered', 'canceled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status', error });
  }
};

// Get all orders
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user').populate('items.menuItemId');
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving orders', error });
  }
};
