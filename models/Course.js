import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    section: { type: String, required: true },
    classeshpnd: { type: Number, required: true },
    totalclasses: { type: Number, required: true },
    credits: { type: Number, required: true },
    professor: { type: mongoose.Schema.Types.ObjectId, ref: 'Professor', required: true },
});

//prof sec creds totclassses noofclasseshpnd

export default mongoose.model("Course", courseSchema);