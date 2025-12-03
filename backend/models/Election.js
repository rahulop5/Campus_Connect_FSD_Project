import mongoose from 'mongoose';

const electionSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'inactive'
  },
  candidates: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    manifesto: {
      type: String,
      default: ''
    },
    votes: {
      type: Number,
      default: 0
    }
  }],
  voters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }]
}, { timestamps: true });

export default mongoose.model('Election', electionSchema);
