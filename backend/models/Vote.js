import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema({
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  role: {
    type: String,
    required: true
  },
  voterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  }
}, { timestamps: true });

voteSchema.index({ electionId: 1, voterId: 1 }, { unique: true });
voteSchema.index({ electionId: 1, voterId: 1, role: 1 }, { unique: true });

export default mongoose.model('Vote', voteSchema);
