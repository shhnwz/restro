
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['customer', 'admin', 'staff'],
      default: 'customer',
    },
    phone: {
      type: String,
    },
    address: [
      {
        street: String,
        city: String,
        state: String,
        zip: String,
      },
    ],
  },
  { timestamps: true } // Adds createdAt and updatedAt
);

const User = mongoose.model('User', userSchema);
export default User;
