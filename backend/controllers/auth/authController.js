import jwt from "jsonwebtoken";
import Professor from "../../models/Professor.js";
import bcrypt from "bcrypt";
import Student from "../../models/Student.js";
import Admin from "../../models/Admin.js";
import User from "../../models/User.js";

//LOGIN

export const handleStudentLogin = async (req, res) => {
  const { email, pass } = req.body;
  
  if (!email || !pass) {
    return res.status(400).json({
      msg: "Email and password are required",
    });
  }
  
  const user = await User.findOne({ email: email });
  if (!user) {
    return res.status(401).json({
      msg: "Invalid Email",
    });
  }
  
  if (user.role !== 'Student') {
      return res.status(401).json({ msg: "Unauthorized Role" });
  }

  const isPasswordCorrect = await bcrypt.compare(pass, user.password);
  if (!isPasswordCorrect) {
    return res.status(401).json({
      message: "Invalid Password",
    });
  }

  const payload = {
    id: user._id,
    email: user.email,
    role: "Student",
    instituteId: user.instituteId,
  };
  const jwt_token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  return res.json({
    name: user.name,
    role: "Student",
    token: jwt_token,
    instituteId: user.instituteId,
  });
};

export const handleProfLogin = async (req, res) => {
  const { email, pass } = req.body;
  
  if (!email || !pass) {
    return res.status(400).json({
      msg: "Email and password are required",
    });
  }
  
  const user = await User.findOne({ email: email });
  if (!user) {
    return res.status(401).json({
      msg: "Invalid Email",
    });
  }

  if (user.role !== 'Professor' && user.role !== 'faculty') {
      return res.status(401).json({ msg: "Unauthorized Role" });
  }
  
  const isPasswordCorrect = await bcrypt.compare(pass, user.password);
  if (!isPasswordCorrect) {
    return res.status(401).json({
      message: "Invalid Password",
    });
  }
  
  const payload = {
    id: user._id,
    email: user.email,
    role: "Professor",
    instituteId: user.instituteId,
  };
  const jwt_token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  return res.json({
    name: user.name,
    role: "Professor",
    token: jwt_token,
    instituteId: user.instituteId,
  });
};

export const handleAdminLogin = async (req, res) => {
  const { email, pass } = req.body;
  
  if (!email || !pass) {
    return res.status(400).json({
      msg: "Email and password are required",
    });
  }
  
  // Try finding in User model first
  let user = await User.findOne({ email: email });
  
  // Fallback to Admin model if not in User (legacy support if needed)
  if (!user) {
      // If Admin model still exists and has email, try that?
      // But assuming we are moving to User. 
      // Let's stick to User for consistency, assuming Admin migration is done or intended.
      // But wait, the existing code used Admin.findOne.
      // If Admin wasn't migrated, this breaks Admin login.
      // Let's try Admin model if User not found, just in case.
       const admin = await Admin.findOne({ email });
       if (admin) {
           // If admin exists in old model, authenticate
            const isMatch = await bcrypt.compare(pass, admin.password);
            if (!isMatch) return res.status(401).json({ message: "Invalid Password" });
            
             const payload = {
                id: admin._id,
                email: admin.email,
                role: "Admin",
                instituteId: admin.instituteId, // Admin model might not have it yet?
            };
            const jwt_token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
            return res.json({ name: admin.name, role: "Admin", token: jwt_token, instituteId: admin.instituteId });
       }
       return res.status(401).json({ msg: "Invalid Email" });
  }
  
  if (user.role !== 'Admin' && user.role !== 'college_admin' && user.role !== 'super_admin') {
       return res.status(401).json({ msg: "Unauthorized Role" });
  }
  
  const isPasswordCorrect = await bcrypt.compare(pass, user.password);
  if (!isPasswordCorrect) {
    return res.status(401).json({
      message: "Invalid Password",
    });
  }
  
  const payload = {
    id: user._id,
    email: user.email,
    role: "Admin",
    instituteId: user.instituteId, 
  };
  const jwt_token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  return res.json({
    name: user.name,
    role: "Admin",
    token: jwt_token,
    instituteId: user.instituteId,
  });
};

//Register
export const registerStudent = async (req, res) => {
  try {
    const { name, email, password, roll, section, phone } = req.body;

    // ---- VALIDATION ----
    const rollRegex = /^S(20[0-2][0-9])00(10|20|30)([0-9]{3})$/;
    if (!roll || !rollRegex.test(roll)) {
      return res.status(400).json({ message: "Invalid Roll Number format. Example: S20230010001" });
    }

    if (!section || !/^[1-9]\d*$/.test(section)) {
      return res.status(400).json({ message: "Section must be a positive number" });
    }

    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
    }

    // Check if user exists in User model
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // ---- Extract from roll no ----
    const year = parseInt(roll.substring(1, 5));
    const currentYear = new Date().getFullYear();
    const ugYear = currentYear - year;

    const branchCode = roll.substring(7, 9);
    let branch = "Unknown";
    if (branchCode === "10") branch = "CSE";
    else if (branchCode === "20") branch = "ECE";
    else if (branchCode === "30") branch = "AIDS";

    // Hash password
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    const isOAuth = !password;

    // Create User first
    const newUser = new User({
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'Student',
        verificationStatus: 'pending' // Default status
    });
    await newUser.save();

    // Create Student linked to User
    const newStudent = new Student({
      userId: newUser._id,
      roll,
      section,
      branch,
      ug: ugYear.toString(),
      courses: [],
    });

    await newStudent.save();
    
    // Update User with profileId
    newUser.profileId = newStudent._id; // Assuming User has profileId field
    await newUser.save();

    // Create JWT
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: "Student", instituteId: newUser.instituteId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      message: "Student registered successfully",
      role: "Student",
      token,
      user: newUser,
    });

  } catch (error) {
    console.error("Error during student registration:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const registerProfessor = async (req, res) => {
  try {
    const { name, email, password, confirm_password, phone } = req.body;

    if (password !== confirm_password) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const newUser = new User({
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'Professor',
        verificationStatus: 'verified' // Maybe professors are verified by default? Or pending?
    });
    await newUser.save();

    const newProfessor = new Professor({
      userId: newUser._id,
      courses: [],
    });

    await newProfessor.save();
    
    newUser.profileId = newProfessor._id;
    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: "Professor", instituteId: newUser.instituteId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      message: "Professor registered successfully",
      role: "Professor",
      token,
      user: newUser,
    });

  } catch (error) {
    console.error("Error during professor signup:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, confirm_password, phone } = req.body;

    const errors = [];

    if (password !== confirm_password) {
      errors.push("Passwords do not match");
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join("; ") });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'Admin'
    });
    await newUser.save();

    const newAdmin = new Admin({
      userId: newUser._id,
      // Admin specific fields if any
    });

    await newAdmin.save();
    
    newUser.profileId = newAdmin._id;
    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: "Admin", instituteId: newUser.instituteId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      message: "Admin registered successfully",
      role: "Admin",
      token,
      user: newUser,
    });

  } catch (error) {
    console.error("Error during admin signup:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMe = async (req, res) => {
  try {
    const { id } = req.user; // Use id from token
    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user,
      role: user.role
    });
  } catch (error) {
    console.error("Error in getMe:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};