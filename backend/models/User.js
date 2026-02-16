import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
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
  profileId: { type: mongoose.Schema.Types.ObjectId } // Reference to Student or Professor document
});

export default mongoose.model("User", userSchema);
