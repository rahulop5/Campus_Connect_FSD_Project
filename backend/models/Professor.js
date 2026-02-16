import mongoose from "mongoose";

const professorSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true },
    courses: [{
        course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }
    }]
});

export default mongoose.model("Professor", professorSchema);