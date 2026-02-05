import jwt from "jsonwebtoken";
import Professor from "../../models/Professor.js";
import bcrypt from "bcrypt";
import Student from "../../models/Student.js";
import Admin from "../../models/Admin.js";

//LOGIN

export const handleStudentLogin = async (req, res) => {
  const { email, pass } = req.body;
  
  if (!email || !pass) {
    return res.status(400).json({
      msg: "Email and password are required",
    });
  }
  
  const user = await Student.findOne({ email: email });
  if (!user) {
    return res.status(401).json({
      msg: "Invalid Email",
    });
  }
  
  if (!user.password) {
    return res.status(500).json({
      msg: "User password not set",
    });
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
  };
  const jwt_token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  return res.json({
    name: user.name,
    role: "Student",
    token: jwt_token,
  });
};

export const handleProfLogin = async (req, res) => {
  const { email, pass } = req.body;
  const user = await Professor.findOne({ email: email });
  if (!user) {
    return res.status(401).json({
      msg: "Invalid Email",
    });
  }
  const isPasswordCorrect = await bcrypt.compare(pass, user.password);
  // if (!isPasswordCorrect) {
  //   return res.status(401).json({
  //     message: "Invalid Password",
  //   });
  // }
  const payload = {
    id: user._id,
    email: user.email,
    role: "Professor",
  };
  const jwt_token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  return res.json({
    name: user.name,
    role: "Professor",
    token: jwt_token,
  });
};

export const handleAdminLogin = async (req, res) => {
  const { email, pass } = req.body;
  console.log("asdasd")
  const user = await Admin.findOne({ email: email });
  if (!user) {
    return res.status(401).json({
      msg: "Invalid Email",
    });
  }
  const isPasswordCorrect = await bcrypt.compare(pass, user.password);
  // if (!isPasswordCorrect) {
  //   return res.status(401).json({
  //     message: "Invalid Password",
  //   });
  // }
  const payload = {
    id: user._id,
    email: user.email,
    role: "Admin",
  };
  const jwt_token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  return res.json({
    name: user.name,
    role: "Admin",
    token: jwt_token,
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

    // Check if student exists
    const existing = await Student.findOne({ email });
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

    const newStudent = new Student({
      name,
      email,
      password: hashedPassword,
      isOAuth,
      phone,
      roll,
      section,
      branch,
      ug: ugYear.toString(),
      courses: [],
    });

    await newStudent.save();

    // Create JWT
    const token = jwt.sign(
      { id: newStudent._id, email: newStudent.email, role: "Student" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      message: "Student registered successfully",
      role: "Student",
      token,
      user: newStudent,
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

    const existingProfessor = await Professor.findOne({ email });
    if (existingProfessor) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newProfessor = new Professor({
      name,
      email,
      password: hashedPassword,
      phone,
      courses: [],
    });

    await newProfessor.save();

    const token = jwt.sign(
      { id: newProfessor._id, email: newProfessor.email, role: "Professor" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      message: "Professor registered successfully",
      role: "Professor",
      token,
      user: newProfessor,
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

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      name,
      email,
      password: hashedPassword,
      phone
    });

    await newAdmin.save();

    const token = jwt.sign(
      { id: newAdmin._id, email: newAdmin.email, role: "Admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      message: "Admin registered successfully",
      role: "Admin",
      token,
      user: newAdmin,
    });

  } catch (error) {
    console.error("Error during admin signup:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMe = async (req, res) => {
  try {
    const { email, role } = req.user;
    console.log(role);
    let user;

    if (role === "Student") {
      user = await Student.findOne({ email }).select("-password");
    } else if (role === "Professor") {
      user = await Professor.findOne({ email }).select("-password");
    } else if (role === "Admin") {
      user = await Admin.findOne({ email }).select("-password");
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user,
      role
    });
  } catch (error) {
    console.error("Error in getMe:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};