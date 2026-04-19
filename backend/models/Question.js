import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  heading: { type: String, required: true },
  desc: { type: String, required: true },
  votes: { type: Number, default: 0 },
  tags: [{ type: String }],
  asker: { type: mongoose.Schema.Types.ObjectId, required: true },
  askerModel: { type: String, enum: ['Student', 'Professor'], default: 'Student' },
  instituteId: { type: mongoose.Schema.Types.ObjectId, ref: "Institute", required: true },
  createdAt: { type: Date, default: Date.now },
  wealth: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  answers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Answer" }],
  voters: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId },
      userModel: { type: String, enum: ['Student', 'Professor'], default: 'Student' },
      voteType: { type: String, enum: ['upvote', 'downvote'] },
      _id: false,
    }
  ],
});

// Custom populate helper for voters
questionSchema.methods.populateVoters = function() {
  return this.populate({
    path: 'voters.userId',
    model: function() {
      // This will be handled manually in the controller
      return null;
    }
  });
};

// Optimize: forum listing sorted by newest first within an institute
questionSchema.index({ instituteId: 1, createdAt: -1 });
// Optimize: full-text search on question content
questionSchema.index({ heading: 'text', desc: 'text', tags: 'text' });
// Optimize: find questions by asker
questionSchema.index({ asker: 1 });

const Question = mongoose.model("Question", questionSchema);
export default Question;