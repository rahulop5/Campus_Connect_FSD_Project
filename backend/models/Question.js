import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  heading: { type: String, required: true },
  desc: { type: String, required: true },
  votes: { type: Number, default: 0 },
  tags: [{ type: String }],
  asker: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true },
  createdAt: { type: Date, default: Date.now },
  wealth: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  answers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Answer" }],
  voters: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
      voteType: { type: String, enum: ['upvote', 'downvote'] },
      _id: false,
    }
  ],
});

const Question = mongoose.model("Question", questionSchema);
export default Question;