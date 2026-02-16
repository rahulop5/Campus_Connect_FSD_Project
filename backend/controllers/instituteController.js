import Institute from "../models/Institute.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Professor from "../models/Professor.js";
import jwt from "jsonwebtoken";

// List all institutes
export const getAllInstitutes = async (req, res) => {
  try {
    const institutes = await Institute.find({}, 'name code address');
    res.json(institutes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching institutes", error: error.message });
  }
};

// Create Institute (User becomes College Admin)
export const createInstitute = async (req, res) => {
  try {
    const { name, code, address } = req.body;
    const userId = req.user.id; // From authMiddleware

    const existingInstitute = await Institute.findOne({ code });
    if (existingInstitute) return res.status(400).json({ message: "Institute code already exists" });

    const newInstitute = new Institute({
      name,
      code,
      address,
      adminId: userId
    });
    await newInstitute.save();

    // Update User
    await User.findByIdAndUpdate(userId, {
      role: 'college_admin',
      instituteId: newInstitute._id,
      verificationStatus: 'verified' // Auto-verify admin
    });

    // Create a new token with updated role/institute
    const token = jwt.sign(
      { id: userId, role: 'college_admin', instituteId: newInstitute._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    
    res.status(201).json({ 
        message: "Institute created successfully", 
        institute: newInstitute,
        token: token,
        user: { id: userId, role: 'college_admin', instituteId: newInstitute._id, verificationStatus: 'verified' }
    });
  } catch (error) {
    if (error.code === 11000) {
        return res.status(400).json({ message: "Institute code already exists" });
    }
    res.status(500).json({ message: "Error creating institute", error: error.message });
  }
};

// Join Institute
export const joinInstitute = async (req, res) => {
  try {
    const { instituteId, role, rollnumber, section, branch, ug } = req.body; 
    const userId = req.user.id;

    if (!['student', 'faculty'].includes(role)) {
      return res.status(400).json({ message: "Invalid role selected" });
    }

    // Check if user already has a pending or verified request? 
    // For now assuming the frontend protects this via 'none' status check.

    let profileId = null;

    if (role === 'student') {
        if (!rollnumber || !section || !branch) {
            return res.status(400).json({ message: "Roll number, Section, and Branch are required for students" });
        }
        
        // Create Student Profile immediately
        const newStudent = new Student({
            userId,
            instituteId,
            rollnumber,
            section,
            branch,
            ug: ug || "1",
            courses: []
        });
        await newStudent.save();
        profileId = newStudent._id;
    } else if (role === 'faculty') {
        // Create Professor Profile
        const newProfessor = new Professor({
            userId,
            instituteId,
            courses: []
        });
        await newProfessor.save();
        profileId = newProfessor._id;
    }

    await User.findByIdAndUpdate(userId, {
      instituteId,
      role, 
      verificationStatus: 'pending',
      profileId: profileId
    });

    // Generate new token with updated details
    const token = jwt.sign(
      { id: userId, role, instituteId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ 
        message: "Join request sent. Please wait for admin verification.",
        token, // Send new token to frontend
        user: { id: userId, role, instituteId, verificationStatus: 'pending' }
    });
  } catch (error) {
    if (error.code === 11000) {
      console.log(error);
        // Duplicate key error (likely roll number if we enforced unique index, which we should but seemingly haven't yet)
        return res.status(400).json({ message: "Error: Profile details might be duplicate" });
    }
    res.status(500).json({ message: "Error joining institute", error: error.message });
  }
};

// Get Pending Verifications (for Admin)
export const getPendingVerifications = async (req, res) => {
  try {
      const adminUser = await User.findById(req.user.id);
      if (adminUser.role !== 'college_admin') {
          return res.status(403).json({ message: "Access denied" });
      }

      // We should populate the profile data to show roll numbers etc in the request list
      const users = await User.find({ instituteId: adminUser.instituteId, verificationStatus: 'pending' })
        .populate('profileId'); // profileId points to Student or Professor via ref path? 
                                // Mongoose dynamic ref for 'profileId' isn't standard unless using refPath. 
                                // But here update `User` schema or just manually fetch if we need details.
                                // For now, simple user list is okay.
      res.json(users);
  } catch (error) {
      res.status(500).json({ message: "Error fetching requests", error: error.message });
  }
}

// Verify User
export const verifyUser = async (req, res) => {
  try {
    const { userId, action } = req.body; // action: 'approve' or 'reject'
    const adminId = req.user.id;
    
    const adminUser = await User.findById(adminId);
    if (!adminUser || adminUser.role !== 'college_admin') {
        return res.status(403).json({ message: "Access denied" });
    }

    if (action === 'reject') {
        const user = await User.findById(userId);
        if (user.instituteId.toString() !== adminUser.instituteId.toString()) {
             return res.status(403).json({ message: "Cannot manage users from other institutes" });
        }

        // If rejecting, we should delete the tentative profile created during join
        if (user.profileId) {
            if (user.role === 'student') await Student.findByIdAndDelete(user.profileId);
            if (user.role === 'faculty') await Professor.findByIdAndDelete(user.profileId);
        }

        await User.findByIdAndUpdate(userId, { 
            verificationStatus: 'rejected', 
            instituteId: null, 
            role: 'user',
            profileId: null 
        });
        return res.json({ message: "User rejected" });
    }

    if (action === 'approve') {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.instituteId.toString() !== adminUser.instituteId.toString()) {
            return res.status(403).json({ message: "Cannot manage users from other institutes" });
       }

        // Profile should already exist from joinInstitute step
        // If not (legacy data), created it here. 
        if (!user.profileId) {
             let profile;
            if (user.role === 'student') {
                 profile = new Student({ userId: user._id, instituteId: user.instituteId });
                 await profile.save();
            } else if (user.role === 'faculty') {
                 profile = new Professor({ userId: user._id, instituteId: user.instituteId });
                 await profile.save();
            }
            user.profileId = profile._id;
        }

        user.verificationStatus = 'verified';
        await user.save();

        return res.json({ message: "User verified successfully" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error verifying user", error: error.message });
  }
};
