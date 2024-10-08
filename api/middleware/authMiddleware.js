import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Import the User model to fetch user details if needed

const auth = async (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Verify the token using the JWT secret
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user ID to the request object for use in subsequent routes
    req.userId = decodedData?.id;

    // Fetch user from the database to check their role
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user's role is 'admin' or 'staff'
    if (user.role !== 'admin' && user.role !== 'staff') {
      return res.status(403).json({ message: 'Forbidden - Insufficient privileges' });
    }

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    res.status(403).json({ message: 'Forbidden - Invalid Token' });
    console.log('JWT Authentication Error:', error);
  }
};

export default auth;
