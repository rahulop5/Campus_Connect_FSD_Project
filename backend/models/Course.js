import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  section: { type: String, required: true },
  ug: { type: String, required: false },
  classeshpnd: { type: Number, required: true },
  totalclasses: { type: Number, required: true },
  credits: { type: Number, required: true },
  professor: { type: mongoose.Schema.Types.ObjectId, ref: "Professor", required: true },
  gradeDistribution: { type: Map, of: Number, default: {} }, 
});

export default mongoose.model("Course", courseSchema);