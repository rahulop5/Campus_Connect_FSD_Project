import Election from '../models/Election.js';
import Student from '../models/Student.js';
import Candidate from '../models/Candidate.js';
import Vote from '../models/Vote.js';

export const ELECTION_ROLES = [
  'SDC President',
  'SLC President',
  'SDC Technical Secretary',
  'SDC Non-technical Secretary',
  'SLC Secretary',
  'SDC Treasurer'
];

// Helper function to validate role
const isValidRole = (role) => ELECTION_ROLES.includes(role);

// Get current election status
export const getElection = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    // We assume there's only one election document that we toggle
    // Or we find the most recent one. For simplicity, let's find the active one or the last created.
    let election = await Election.findOne({ status: 'active', instituteId });
    
    if (!election) {
      // If no active election, check if there is any election at all to show "inactive" state
      election = await Election.findOne({ instituteId }).sort({ createdAt: -1 });
    }

    if (!election) {
      return res.status(200).json({ election: null, candidates: [], hasVoted: false, votedRoles: [] });
    }

    const candidates = await Candidate.find({ electionId: election._id });

    // If the user is a student, check if they have voted and which roles they've voted for
    let hasVoted = false;
    let votedRoles = [];
    if (req.user && req.user.role === 'Student') {
      const userVotes = await Vote.find({ electionId: election._id, voterId: req.user.id });
      
      if (userVotes.length > 0) {
        hasVoted = true;
        // Get all candidates the user voted for and extract their roles
        const votedCandidateIds = userVotes.map(v => v.candidateId);
        const votedCandidates = await Candidate.find({ _id: { $in: votedCandidateIds } }).select('role');
        // Only include valid roles that exist and are still in ELECTION_ROLES
        votedRoles = votedCandidates
          .map(c => c.role)
          .filter(role => role && isValidRole(role));
      }
    }

    res.status(200).json({
      election,
      candidates,
      hasVoted,
      votedRoles
    });
  } catch (error) {
    console.error("Error fetching election:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Start a new election (Admin only)
export const startElection = async (req, res) => {
  try {
    const { title, description, startTime, endTime } = req.body;
    const instituteId = req.user.instituteId;

    const missingFields = [];
    if (!title) missingFields.push('title');
    if (!startTime) missingFields.push('startTime');
    if (!endTime) missingFields.push('endTime');
    if (missingFields.length > 0) {
      return res.status(400).json({ message: `Missing required field(s): ${missingFields.join(', ')}` });
    }

    // End any existing active elections
    await Election.updateMany({ status: 'active', instituteId }, { status: 'ended' });

    // Create a new election
    const newElection = new Election({
      title,
      description,
      status: 'active',
      startTime,
      endTime,
      instituteId
    });

    await newElection.save();
    res.status(201).json({ message: "Election started successfully", election: newElection });
  } catch (error) {
    console.error("Error starting election:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Stop election (Admin only)
export const stopElection = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    // Find active election
    const election = await Election.findOne({ status: 'active', instituteId });
    if (!election) {
      return res.status(400).json({ message: "No active election found to stop" });
    }

    // Update only status and endTime
    const updatedElection = await Election.findByIdAndUpdate(
      election._id,
      {
        status: 'ended',
        endTime: new Date()
      },
      { new: true, select: '_id title description status startTime endTime' }
    );

    res.status(200).json({ 
      message: "Election stopped successfully", 
      election: updatedElection 
    });
  } catch (error) {
    console.error("Error stopping election:", error.message);
    const status = error.statusCode || 500;
    const message = error.message || (status === 400 ? "Bad request" : "Server error");
    res.status(status).json({ message });
  }
};

// Nominate a candidate (Admin only)
export const nominateCandidate = async (req, res) => {
  const { electionId, email, role } = req.body;
  try {
    const missingFields = [];
    if (!electionId) missingFields.push('electionId');
    if (!email) missingFields.push('email');
    if (!role) missingFields.push('role');
    if (missingFields.length > 0) {
      return res.status(400).json({ message: `Missing required field(s): ${missingFields.join(', ')}` });
    }

    if (!ELECTION_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role for election' });
    }

    const election = await Election.findById(electionId);
    if (!election || election.status !== 'active') {
      return res.status(400).json({ message: "No active election" });
    }

    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const existingCandidate = await Candidate.findOne({
      electionId: election._id,
      studentId: student._id
    });

    if (existingCandidate) {
      return res.status(400).json({ message: "Student is already nominated for this election" });
    }

    const candidate = new Candidate({
      electionId: election._id,
      studentId: student._id,
      name: student.name,
      role,
      department: student.branch,
      year: student.ug,
      profileImage: student.pfp
    });

    await candidate.save();

    res.status(200).json({ message: "Candidate nominated", candidate });
  } catch (error) {
    console.error("Error nominating candidate:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Vote for a candidate (Student only)
export const vote = async (req, res) => {
  const { candidateId } = req.body;
  const studentId = req.user.id;

  try {
    const election = await Election.findOne({ status: 'active' });
    if (!election) {
      return res.status(400).json({ message: "No active election" });
    }

    if (election.endTime && new Date(election.endTime) <= new Date()) {
      return res.status(400).json({ message: "Voting is closed. The election has ended." });
    }

    const candidate = await Candidate.findOne({
      _id: candidateId,
      electionId: election._id
    });

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Edge case: Invalid role - candidate has invalid role
    if (!isValidRole(candidate.role)) {
      return res.status(400).json({ message: "Invalid role for this candidate. Contact administrator." });
    }

    const roleCandidates = await Candidate.find({
      electionId: election._id,
      role: candidate.role
    }).select('_id');

    const roleCandidateIds = roleCandidates.map((c) => c._id);

    const existingRoleVote = await Vote.findOne({
      electionId: election._id,
      voterId: studentId,
      candidateId: { $in: roleCandidateIds }
    });

    if (existingRoleVote) {
      return res.status(409).json({ message: "You have already voted for this role." });
    }

    await Vote.create({
      electionId: election._id,
      voterId: studentId,
      candidateId: candidate._id,
      role: candidate.role
    });

    await Candidate.findByIdAndUpdate(
      candidate._id,
      { $inc: { voteCount: 1 } }
    );

    res.status(200).json({ message: "Vote cast successfully" });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "You have already voted for this role." });
    }
    console.error("Error voting:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update manifesto (Candidate only)
export const updateManifesto = async (req, res) => {
  const { manifesto } = req.body;
  const studentId = req.user.id;

  try {
    const election = await Election.findOne({ status: 'active' });
    if (!election) {
      return res.status(400).json({ message: "No active election" });
    }

    if (election.endTime && new Date(election.endTime) <= new Date()) {
      return res.status(400).json({ message: "Manifesto edits are closed. The election has ended." });
    }

    const candidate = await Candidate.findOne({
      electionId: election._id,
      studentId
    });

    if (!candidate) {
      return res.status(403).json({ message: "Unauthorized manifesto edit. You are not a candidate in this election." });
    }

    candidate.manifesto = manifesto;
    await candidate.save();

    res.status(200).json({ message: "Quote updated successfully", manifesto });
  } catch (error) {
    console.error("Error updating manifesto:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove a candidate (Admin only)
// Edge case: When a candidate is removed, all their votes are deleted,
// which makes that role available for voting again
export const removeCandidate = async (req, res) => {
  const { candidateId } = req.params;

  try {
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const election = await Election.findById(candidate.electionId);
    if (!election || election.status !== 'active') {
      return res.status(409).json({ message: "Cannot remove candidate. Election has ended." });
    }

    const deletedCandidate = await Candidate.findByIdAndDelete(candidateId);
    if (!deletedCandidate) {
      return res.status(404).json({ message: "Candidate already removed" });
    }

    // Edge case handling: Delete all votes for this candidate
    // This allows voters who voted for this candidate to vote for another candidate in the same role
    await Vote.deleteMany({ candidateId });

    const candidates = await Candidate.find({ electionId: election._id });

    res.status(200).json({ message: "Candidate removed successfully", candidates });
  } catch (error) {
    console.error("Error removing candidate:", error);
    res.status(500).json({ message: "Server error" });
  }
};
