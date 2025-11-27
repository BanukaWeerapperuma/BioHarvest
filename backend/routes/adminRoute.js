import express from 'express';
import { resetAdminCredentials, forgotPassword } from '../controllers/adminController.js';

const router = express.Router();

// Reset admin credentials route (requires authentication)
router.post('/reset-credentials', resetAdminCredentials);

// Forgot password route (no authentication required)
router.post('/forgot-password', forgotPassword);

export default router;

