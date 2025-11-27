import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import { sendForgotPasswordEmail } from "../utils/emailService.js";

// login user

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User Doesn't exist" });
    }
    const isMatch =await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid Credentials" });
    }
    const role=user.role;
    const token = createToken(user._id);
    res.json({ success: true, token,role });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Create token

const createToken = (id) => {
  const jwtSecret = process.env.JWT_SECRET || 'fallback-jwt-secret-for-development';
  return jwt.sign({ id }, jwtSecret);
};

// register user

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // checking user is already exist
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "User already exists" });
    }

    // validating email format and strong password
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter valid email" });
    }
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter strong password",
      });
    }

    // hashing user password

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name: name,
      email: email,
      password: hashedPassword,
    });

    const user = await newUser.save();
    const role=user.role;
    const token = createToken(user._id);
    res.json({ success: true, token, role});
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    console.log('getUserProfile called with userId:', req.user.userId);
    const userId = req.user.userId;
    
    if (!userId) {
      return res.json({ success: false, message: "User ID not provided" });
    }
    
    const user = await userModel.findById(userId).select('-password');
    
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    
    // Ensure stats are always present
    if (!user.stats) {
      user.stats = { orders: 0, courses: 0, points: 0 };
    }
    
    // Ensure preferences are always present
    if (!user.preferences) {
      user.preferences = { dietary: '', allergies: '', notifications: true };
    }
    
    console.log('User found:', user.name, user.email, 'Profile image:', user.profileImage);
    res.json({ success: true, user });
  } catch (error) {
    console.log('Error in getUserProfile:', error);
    res.json({ success: false, message: "Error fetching profile" });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, email, phone, address, preferences } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (preferences) updateData.preferences = preferences;
    
    const user = await userModel.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    
    // Ensure stats are always present
    if (!user.stats) {
      user.stats = { orders: 0, courses: 0, points: 0 };
    }
    
    // Ensure preferences are always present
    if (!user.preferences) {
      user.preferences = { dietary: '', allergies: '', notifications: true };
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error updating profile" });
  }
};

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('Upload profile picture for userId:', userId);
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    if (!userId) {
      console.log('No userId provided in request body');
      return res.json({ success: false, message: "User ID not provided" });
    }
    
    if (!req.file) {
      console.log('No file received in request');
      return res.json({ success: false, message: "No image file provided" });
    }
    
    console.log('File received:', req.file.originalname);
    console.log('File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    
    // Check if user exists before updating
    const existingUser = await userModel.findById(userId);
    if (!existingUser) {
      console.log('User not found in database for ID:', userId);
      return res.json({ success: false, message: "User not found" });
    }
    console.log('User found:', existingUser.name, existingUser.email);
    
    // Upload to Cloudinary
    const { uploadFile, deleteFromCloudinary } = await import('../utils/cloudinary.js');
    
    // Delete old profile image from Cloudinary if exists
    if (existingUser.profileImage && existingUser.profileImage.includes('cloudinary.com')) {
      try {
        await deleteFromCloudinary(existingUser.profileImage, 'image');
      } catch (error) {
        console.log('Error deleting old profile image from Cloudinary:', error);
      }
    }
    
    // Upload new image to Cloudinary
    let imageUrl = '';
    try {
      const uploadResult = await uploadFile(req.file, 'users/profiles', 'image');
      imageUrl = uploadResult.url;
      console.log('Image uploaded to Cloudinary:', imageUrl);
    } catch (error) {
      console.log('Error uploading to Cloudinary:', error);
      return res.json({ success: false, message: "Error uploading image to cloud storage" });
    }
    
    const user = await userModel.findByIdAndUpdate(
      userId,
      { profileImage: imageUrl },
      { new: true }
    ).select('-password');
    
    if (!user) {
      console.log('User not found for ID:', userId);
      return res.json({ success: false, message: "User not found" });
    }
    
    // Ensure stats are always present
    if (!user.stats) {
      user.stats = { orders: 0, courses: 0, points: 0 };
    }
    
    console.log('Profile picture updated successfully for user:', user.name);
    console.log('Updated user object:', {
      name: user.name,
      email: user.email,
      profileImage: user.profileImage
    });
    res.json({ success: true, user });
  } catch (error) {
    console.log('Error uploading profile picture:', error);
    res.json({ success: false, message: "Error uploading profile picture" });
  }
};

// Test upload endpoint
const testUpload = async (req, res) => {
  try {
    console.log('Test upload endpoint called');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('Request headers:', req.headers);
    
    if (req.file) {
      res.json({ 
        success: true, 
        message: "File received successfully",
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size
      });
    } else {
      res.json({ 
        success: false, 
        message: "No file received",
        body: req.body,
        headers: req.headers
      });
    }
  } catch (error) {
    console.log('Test upload error:', error);
    res.json({ success: false, message: "Test upload error", error: error.message });
  }
};

// Test endpoint to check user and token
const testUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('Test user endpoint called with userId:', userId);
    
    if (!userId) {
      return res.json({ success: false, message: "No user ID provided" });
    }
    
    const user = await userModel.findById(userId).select('-password');
    if (!user) {
      return res.json({ success: false, message: "User not found", userId });
    }
    
    res.json({ 
      success: true, 
      message: "User found",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.log('Test user error:', error);
    res.json({ success: false, message: "Error testing user", error: error.message });
  }
};

// Forgot password - send reset instructions via email
const forgotPassword = async (req, res) => {
  try {
    const { username, email } = req.body;

    console.log('Customer forgot password request received:', { username, email });

    // Validate inputs
    if (!username || username.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid username',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Find user by email
    const user = await userModel.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, password reset instructions have been sent.',
      });
    }

    // Verify username matches user's name
    if (user.name.toLowerCase().trim() !== username.toLowerCase().trim()) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, password reset instructions have been sent.',
      });
    }

    // If the request provided currentPassword and newPassword, attempt immediate password update
    const { currentPassword, newPassword } = req.body;

    if (currentPassword || newPassword) {
      // Both fields must be provided to update
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Both current and new passwords are required to change password.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
      }

      try {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        }

        const saltRounds = Number(process.env.SALT) || 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        return res.json({ success: true, message: 'Password updated successfully.' });
      } catch (pwError) {
        console.error('Error updating password:', pwError);
        return res.status(500).json({ success: false, message: 'Error updating password. Please try again later.' });
      }
    }

    // If no immediate password change requested, proceed to send forgot-password email
    // Check if email service is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('Email service not configured. Missing SMTP_USER or SMTP_PASS in .env file');
      return res.status(500).json({
        success: false,
        message: 'Email service is not configured. Please contact support.',
        error: 'Email configuration missing',
      });
    }

    // Send forgot password email
    try {
      console.log('Attempting to send forgot password email to:', email);
      await sendForgotPasswordEmail(email, user.name);
      console.log('Forgot password email sent successfully');
      
      res.json({
        success: true,
        message: 'Password reset instructions have been sent to your email address. Please check your Gmail inbox.',
      });
    } catch (emailError) {
      console.error('Error sending forgot password email:', emailError);
      console.error('Email error details:', {
        message: emailError.message,
        code: emailError.code,
        command: emailError.command,
      });
      
      // Return error response so user knows email failed
      let errorMessage = 'Failed to send password reset email. ';
      
      if (emailError.message && emailError.message.includes('configuration')) {
        errorMessage += emailError.message;
      } else if (emailError.code === 'EAUTH') {
        errorMessage += 'Email authentication failed. Please check your SMTP credentials. ';
        errorMessage += 'For Gmail: Make sure you are using an App Password (not your regular password). ';
        errorMessage += 'Go to: Google Account > Security > 2-Step Verification > App passwords';
      } else if (emailError.code === 'ECONNECTION') {
        errorMessage += 'Could not connect to email server. Please check your SMTP settings.';
      } else {
        errorMessage += emailError.message || 'Please check your email configuration.';
      }
      
      return res.status(500).json({
        success: false,
        message: errorMessage,
        error: 'Email notification failed',
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    console.error('Full error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Error processing forgot password request. Please check server logs for details.',
      error: error.message || 'Unknown error',
    });
  }
};

export { loginUser, registerUser, getUserProfile, updateUserProfile, uploadProfilePicture, testUpload, testUser, forgotPassword };
