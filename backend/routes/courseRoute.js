import express from 'express';
import multer from 'multer';
import {
  getAllCourses,
  getCourseById,
  adminGetAllCourses,
  addCourse,
  updateCourse,
  deleteCourse,
  toggleCourseStatus,
  getCoursesByCategory,
  searchCourses,
  incrementEnrollment
} from '../controllers/courseController.js';

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
}).any();

// Public routes
router.get('/list', getAllCourses);
router.get('/search', searchCourses);
router.get('/category/:category', getCoursesByCategory);
router.get('/:id', getCourseById);

// Admin routes (bypass authentication)
router.get('/admin/list', adminGetAllCourses);
router.post('/admin/add', upload, addCourse);
router.put('/admin/update/:id', upload, updateCourse);
router.delete('/admin/delete/:id', deleteCourse);
router.put('/admin/toggle/:id', toggleCourseStatus);
router.put('/admin/enroll/:id', incrementEnrollment);

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
    if (error.message.includes('Only image and PDF files are allowed')) {
      return res.json({ success: false, message: 'Invalid file type. Only images and PDF files are allowed.' });
    }
    return res.json({ success: false, message: error.message });
  }
  next();
});

export default router; 