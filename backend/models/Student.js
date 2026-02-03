import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false }, // Optional for OAuth users
    isOAuth: { type: Boolean, default: false }, // Indicates if the account is OAuth-based
    phone: { type: String, required: false },
    rollnumber: { type: String, required: false },
    section: { type: String, required: false },
    branch: { type: String, required: false },
    ug: { type: String, required: false },
    courses: [
      {
        course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        attendance: { type: Number },
        grade: { type: Number },
      },
    ],
  });

export default mongoose.model("Student", studentSchema);