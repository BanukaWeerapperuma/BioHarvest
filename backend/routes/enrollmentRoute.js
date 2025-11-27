import express from 'express';
import {
  enrollInCourse,
  getUserEnrollments,
  getEnrollmentDetails,
  updateProgress,
  markVideoWatched,
  submitAssignment,
  submitQuiz,
  generateCertificate,
  downloadCertificate
} from '../controllers/enrollmentController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Enroll in a course
router.post('/courses/:courseId/enroll', enrollInCourse);

// Get user's enrollments
router.get('/user', getUserEnrollments);

// Get enrollment details
router.get('/enrollments/:enrollmentId', getEnrollmentDetails);

// Update progress
router.put('/enrollments/:enrollmentId/progress', updateProgress);

// Mark video as watched
router.put('/enrollments/:enrollmentId/video', markVideoWatched);

// Submit assignment
router.put('/enrollments/:enrollmentId/assignment', submitAssignment);

// Submit quiz
router.put('/enrollments/:enrollmentId/quiz', submitQuiz);

// Generate certificate
router.post('/enrollments/:enrollmentId/certificate', generateCertificate);

// Download certificate
router.get('/enrollments/:enrollmentId/certificate/download', downloadCertificate);

export default router; 