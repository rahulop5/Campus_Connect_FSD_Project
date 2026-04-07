import crypto from 'crypto';
import razorpayInstance from '../config/razorpayConfig.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';

// Plan definitions
const PLANS = {
  student_core: {
    id: 'student_core',
    name: 'Student Core',
    amount: 2900, // ₹29 in paise
    currency: 'INR',
  },
  student_collective: {
    id: 'student_collective',
    name: 'Student Collective',
    amount: 9900, // ₹99 in paise
    currency: 'INR',
  },
};

// Create Razorpay Order
export const createOrder = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;

    // Validate plan
    const plan = PLANS[planId];
    if (!plan) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }

    // Create Razorpay order
    const options = {
      amount: plan.amount,
      currency: plan.currency,
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: {
        userId,
        planId: plan.id,
        planName: plan.name,
      },
    };

    const order = await razorpayInstance.orders.create(options);

    // Save payment record with status = created
    const payment = new Payment({
      userId,
      planId: plan.id,
      planName: plan.name,
      amount: plan.amount,
      currency: plan.currency,
      razorpayOrderId: order.id,
      status: 'created',
    });
    await payment.save();

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: plan.amount,
      currency: plan.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      planName: plan.name,
      planId: plan.id,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
};

// Verify payment signature and activate subscription
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification details' });
    }

    // Verify signature using HMAC SHA256
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      // Update payment status to failed
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: 'failed' }
      );
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Update Payment record
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'paid',
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    // Update User subscription
    await User.findByIdAndUpdate(userId, {
      subscription: {
        plan: payment.planId,
        status: 'active',
        paymentId: payment._id,
        subscribedAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified and subscription activated',
      payment: {
        id: payment._id,
        planId: payment.planId,
        planName: payment.planName,
        amount: payment.amount,
        status: payment.status,
      },
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Payment verification error', error: error.message });
  }
};

// Get current user's subscription status
export const getSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('subscription');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      subscription: user.subscription || { plan: 'free', status: 'inactive' },
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ message: 'Error fetching subscription', error: error.message });
  }
};
