import express from 'express';
import multer from 'multer';
import {
  getAllBlogPosts,
  getBlogPostById,
  getBlogReactions,
  addReaction,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getAllBlogPostsAdmin
} from '../controllers/blogController.js';

const router = express.Router();

// Configure multer to use memory storage for Cloudinary uploads
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Admin routes (bypass auth for local admin system)
router.get('/admin/list', (req, res, next) => {
  // Add dummy token for admin routes
  req.headers.authorization = 'Bearer admin-token';
  next();
}, getAllBlogPostsAdmin);

router.post('/admin/add', (req, res, next) => {
  req.headers.authorization = 'Bearer admin-token';
  next();
}, upload.single('image'), createBlogPost);

router.put('/admin/update/:id', (req, res, next) => {
  req.headers.authorization = 'Bearer admin-token';
  next();
}, upload.single('image'), updateBlogPost);

router.delete('/admin/remove/:id', (req, res, next) => {
  req.headers.authorization = 'Bearer admin-token';
  next();
}, deleteBlogPost);

// Public routes
router.get('/list', getAllBlogPosts);
router.get('/:id', getBlogPostById);
router.get('/:id/reactions', getBlogReactions);
router.post('/:id/react', addReaction);

// Error handling middleware for multer
router.use((error, req, res, next) => {
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

export default router; 