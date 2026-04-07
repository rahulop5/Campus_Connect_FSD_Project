import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  planId: { 
    type: String, 
    enum: ["student_core", "student_collective"], 
    required: true 
  },
  planName: { 
    type: String, 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true  // Amount in paise
  },
  currency: { 
    type: String, 
    default: "INR" 
  },
  razorpayOrderId: { 
    type: String, 
    required: true 
  },
  razorpayPaymentId: { 
    type: String 
  },
  razorpaySignature: { 
    type: String 
  },
  status: { 
    type: String, 
    enum: ["created", "paid", "failed"], 
    default: "created" 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

export default mongoose.model("Payment", paymentSchema);
