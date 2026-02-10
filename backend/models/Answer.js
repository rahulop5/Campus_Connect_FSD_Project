import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
  desc: { type: String, required: true },
  votes: { type: Number, default: 0 },
  answerer: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  createdAt: { type: Date, default: Date.now },
  voters: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
      voteType: { type: String, enum: ['upvote', 'downvote'] },
      _id: false,
    }
  ],
});

const Answer = mongoose.model("Answer", answerSchema);
export default Answer;