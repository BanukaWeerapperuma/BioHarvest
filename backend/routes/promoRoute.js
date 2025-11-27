import express from 'express';
import authMiddleware from '../middleware/auth.js';
import {
  createPromo,
  getAllPromos,
  getPromoById,
  updatePromo,
  deletePromo,
  validatePromo,
  getPromoStats
} from '../controllers/promoController.js';

const promoRouter = express.Router();

// Admin routes (require authentication)
promoRouter.post('/create', authMiddleware, createPromo);
promoRouter.get('/all', authMiddleware, getAllPromos);
promoRouter.get('/stats', authMiddleware, getPromoStats);
promoRouter.get('/:id', authMiddleware, getPromoById);
promoRouter.put('/:id', authMiddleware, updatePromo);
promoRouter.delete('/:id', authMiddleware, deletePromo);

// Customer routes (require authentication)
promoRouter.post('/validate', authMiddleware, validatePromo);

export default promoRouter; 