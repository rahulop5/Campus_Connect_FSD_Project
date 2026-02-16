import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true },
    rollnumber: { type: String, required: false },
    section: { type: String, required: false },
    branch: { type: String, required: false },
    ug: { type: String, required: false },
    profilePicture: { type: String, default: "" }, // Profile picture path
    courses: [
      {
        course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        attendance: { type: Number },
        grade: { type: Number },
      },
    ],
  });

// Ensure roll number is unique per institute
studentSchema.index({ instituteId: 1, rollnumber: 1 }, { unique: true });

export default mongoose.model("Student", studentSchema);