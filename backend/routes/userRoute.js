import express from "express";
import { loginUser, registerUser, getUserProfile, updateUserProfile, uploadProfilePicture, testUpload, testUser, forgotPassword } from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.js";
import multer from "multer";

const userRouter = express.Router();

// Configure multer to use memory storage for Cloudinary uploads
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    console.log('Multer fileFilter called for file:', file.originalname, 'mimetype:', file.mimetype);
    if (file.mimetype.startsWith('image/')) {
      console.log('File accepted by multer');
      cb(null, true);
    } else {
      console.log('File rejected by multer - not an image');
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/forgot-password", forgotPassword);
userRouter.get("/profile", authMiddleware, getUserProfile);
userRouter.put("/profile", authMiddleware, updateUserProfile);
userRouter.post("/profile/picture", authMiddleware, upload.single('profileImage'), uploadProfilePicture);
userRouter.post("/test-upload", upload.single('profileImage'), testUpload);
userRouter.get("/test-user", authMiddleware, testUser);

// Error handling middleware for multer
userRouter.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.log('Multer error:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.json({ success: false, message: 'File too large. Maximum size is 10MB.' });
    }
    return res.json({ success: false, message: 'File upload error: ' + error.message });
  } else if (error) {
    console.log('Other error:', error);
    return res.json({ success: false, message: error.message });
  }
  next();
});

export default userRouter;
