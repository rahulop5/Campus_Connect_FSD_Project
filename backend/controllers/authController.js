import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Register User
export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role, instituteId: newUser.instituteId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({ 
      token, 
      user: { 
        id: newUser._id, 
        name: newUser.name, 
        role: newUser.role, 
        instituteId: newUser.instituteId 
      } 
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Login User
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, instituteId: user.instituteId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        role: user.role, 
        instituteId: user.instituteId,
        verificationStatus: user.verificationStatus
      } 
    });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user, role: user.role }); 
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error: error.message });
  }
};

// OAuth Callbacks
export const oauthCallback = (req, res) => {
    // Generate token
    const token = jwt.sign(
      { id: req.user._id, role: req.user.role, instituteId: req.user.instituteId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    
    // Redirect to frontend with token
    // Adjust logic to redirect to landing or dashboard based on user state if needed,
    // but the frontend checks that on load anyway.
    res.redirect(`http://localhost:5173/oauth-callback?token=${token}`);
};
