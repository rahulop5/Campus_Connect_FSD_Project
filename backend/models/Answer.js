import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
  desc: { type: String, required: true },
  votes: { type: Number, default: 0 },
  answerer: { type: mongoose.Schema.Types.ObjectId },
  answererModel: { type: String, enum: ['Student', 'Professor'], default: 'Student' },
  createdAt: { type: Date, default: Date.now },
  voters: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId },
      userModel: { type: String, enum: ['Student', 'Professor'], default: 'Student' },
      voteType: { type: String, enum: ['upvote', 'downvote'] },
      _id: false,
    }
  ],
});

// Optimize: find answers by a specific user
answerSchema.index({ answerer: 1 });
// Optimize: sort answers by date
answerSchema.index({ createdAt: -1 });

const Answer = mongoose.model("Answer", answerSchema);
export default Answer;