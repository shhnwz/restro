import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Register a new user
export const registerUser = async (req, res) => {
  const { name, email, password, role, phone, address } = req.body;

  // Check if all required fields are present
  if (!name || !email || !password || !role || !phone || !address[0]) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

if (!emailRegex.test(email)) {
  return res.status(400).json({ message: 'Invalid email format' });
}


  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
if (!passwordRegex.test(password)) {
  return res.status(400).json({ message: 'Password must contain at least one letter and one number' });
}

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      address,
    });

    const savedUser = await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: savedUser._id, role: savedUser.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(201).json({ token, user: { id: savedUser._id, name: savedUser.name, email: savedUser.email } });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
};

// Login user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Check if all required fields are present
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
};
