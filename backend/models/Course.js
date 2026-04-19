import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  section: { type: String, required: true },
  ug: { type: String, required: false },
  classeshpnd: { type: Number, required: true },
  totalclasses: { type: Number, required: true },
  credits: { type: Number, required: true },
  professor: { type: mongoose.Schema.Types.ObjectId, ref: "Professor", required: false },
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true },
  gradeDistribution: { type: Map, of: Number, default: {} }, 
});

// Optimize: filter courses by institute, section, and year
courseSchema.index({ instituteId: 1, section: 1, ug: 1 });
// Optimize: find courses taught by a professor
courseSchema.index({ professor: 1 });
// Optimize: course name lookups
courseSchema.index({ name: 1, instituteId: 1 });

export default mongoose.model("Course", courseSchema);