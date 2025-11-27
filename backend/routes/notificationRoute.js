import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  createNotification,
  getAllNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  toggleNotificationStatus,
  getNotificationStats
} from '../controllers/notificationController.js';

const notificationRouter = express.Router();

// Admin routes (require authentication)
notificationRouter.post('/create', authMiddleware, createNotification);
notificationRouter.get('/all', authMiddleware, getAllNotifications);
notificationRouter.get('/stats', authMiddleware, getNotificationStats);
notificationRouter.get('/:id', authMiddleware, getNotificationById);
notificationRouter.put('/:id', authMiddleware, updateNotification);
notificationRouter.delete('/:id', authMiddleware, deleteNotification);
notificationRouter.patch('/:id/toggle', authMiddleware, toggleNotificationStatus);

export default notificationRouter; 