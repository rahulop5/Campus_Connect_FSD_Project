import mongoose from 'mongoose';

const ELECTION_ROLES = [
  'SDC President',
  'SLC President',
  'SDC Technical Secretary',
  'SDC Non-technical Secretary',
  'SLC Secretary',
  'SDC Treasurer'
];

const candidateSchema = new mongoose.Schema({
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  name: {
    type: String,
    trim: true,
    required: true
  },
  role: {
    type: String,
    enum: ELECTION_ROLES,
    required: true
  },
  department: {
    type: String,
    trim: true,
    required: true
  },
  year: {
    type: String,
    trim: true,
    required: true
  },
  profileImage: {
    type: String,
    trim: true,
    default: ''
  },
  manifesto: {
    type: String,
    trim: true,
    default: ''
  },
  voteCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export default mongoose.model('Candidate', candidateSchema);
