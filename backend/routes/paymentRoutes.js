import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { createOrder, verifyPayment, getSubscription } from '../controllers/paymentController.js';

const router = express.Router();

// Create a Razorpay order for a plan
router.post('/create-order', verifyToken, createOrder);

// Verify payment after Razorpay checkout
router.post('/verify', verifyToken, verifyPayment);

// Get current user's subscription status
router.get('/subscription', verifyToken, getSubscription);

export default router;
