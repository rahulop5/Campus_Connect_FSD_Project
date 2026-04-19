import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  phone: { type: String },
  role: {
    type: String,
    enum: ['super_admin', 'college_admin', 'student', 'faculty', 'user'],
    default: 'user'
  },
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Institute" },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'none'],
    default: 'none'
  },
  profileId: { type: mongoose.Schema.Types.ObjectId }, // Reference to Student or Professor document
  subscription: {
    plan: { 
      type: String, 
      enum: ['free', 'student_core', 'student_collective'], 
      default: 'free' 
    },
    status: { 
      type: String, 
      enum: ['active', 'inactive'], 
      default: 'inactive' 
    },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    subscribedAt: { type: Date }
  }
});

// Optimize: admin dashboard filters users by role within an institute
userSchema.index({ role: 1, instituteId: 1 });
// Optimize: pending verification lookups
userSchema.index({ verificationStatus: 1, instituteId: 1 });
// Optimize: subscription status queries
userSchema.index({ 'subscription.status': 1 });

export default mongoose.model("User", userSchema);
