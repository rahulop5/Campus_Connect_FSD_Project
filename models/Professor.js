import mongoose from "mongoose";

const professorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    courses: [{
        course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }
    }]
});

export default mongoose.model("Professor", professorSchema);