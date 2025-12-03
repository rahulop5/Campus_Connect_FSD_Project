import Election from '../models/Election.js';
import Student from '../models/Student.js';

// Get current election status
export const getElection = async (req, res) => {
  try {
    // We assume there's only one election document that we toggle
    // Or we find the most recent one. For simplicity, let's find the active one or the last created.
    let election = await Election.findOne({ status: 'active' }).populate('candidates.student', 'name email roll section branch ug pfp');
    
    if (!election) {
      // If no active election, check if there is any election at all to show "inactive" state
      election = await Election.findOne().sort({ createdAt: -1 });
    }

    if (!election) {
      return res.status(200).json({ status: 'inactive', candidates: [] });
    }

    // If the user is a student, check if they have voted
    let hasVoted = false;
    if (req.user && req.user.role === 'Student') {
      hasVoted = election.voters.includes(req.user.id);
    }

    res.status(200).json({
      election,
      hasVoted
    });
  } catch (error) {
    console.error("Error fetching election:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Start a new election (Admin only)
export const startElection = async (req, res) => {
  try {
    // Deactivate any existing active elections
    await Election.updateMany({ status: 'active' }, { status: 'inactive' });

    // Create a new election
    const newElection = new Election({
      status: 'active',
      candidates: [],
      voters: []
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
    const election = await Election.findOne({ status: 'active' });
    if (!election) {
      return res.status(400).json({ message: "No active election to stop" });
    }

    election.status = 'inactive';
    await election.save();
    res.status(200).json({ message: "Election stopped successfully", election });
  } catch (error) {
    console.error("Error stopping election:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Nominate a candidate (Admin only)
export const nominateCandidate = async (req, res) => {
  const { email } = req.body;
  try {
    const election = await Election.findOne({ status: 'active' });
    if (!election) {
      return res.status(400).json({ message: "No active election" });
    }

    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if already nominated
    const isNominated = election.candidates.some(c => c.student.toString() === student._id.toString());
    if (isNominated) {
      return res.status(400).json({ message: "Student is already nominated" });
    }

    election.candidates.push({ student: student._id });
    await election.save();

    // Return populated election
    const populatedElection = await Election.findById(election._id).populate('candidates.student', 'name email roll section branch ug pfp');
    res.status(200).json({ message: "Candidate nominated", election: populatedElection });
  } catch (error) {
    console.error("Error nominating candidate:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Vote for a candidate (Student only)
export const vote = async (req, res) => {
  const { candidateId } = req.body; // This is the _id of the candidate object inside the array, or the student ID? Let's use student ID for clarity.
  const studentId = req.user.id;

  try {
    const election = await Election.findOne({ status: 'active' });
    if (!election) {
      return res.status(400).json({ message: "No active election" });
    }

    if (election.voters.includes(studentId)) {
      return res.status(400).json({ message: "You have already voted" });
    }

    // Find the candidate
    const candidateIndex = election.candidates.findIndex(c => c.student.toString() === candidateId);
    if (candidateIndex === -1) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Increment vote
    election.candidates[candidateIndex].votes += 1;
    election.voters.push(studentId);

    await election.save();
    res.status(200).json({ message: "Vote cast successfully" });
  } catch (error) {
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

    const candidate = election.candidates.find(c => c.student.toString() === studentId);
    if (!candidate) {
      return res.status(403).json({ message: "You are not a candidate in this election" });
    }

    candidate.manifesto = manifesto;
    await election.save();

    res.status(200).json({ message: "Quote updated successfully", manifesto });
  } catch (error) {
    console.error("Error updating manifesto:", error);
    res.status(500).json({ message: "Server error" });
  }
};
