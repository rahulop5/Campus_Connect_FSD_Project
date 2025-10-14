import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";

// Signup Function
export const adminSignup = async (req, res) => {
  try {
    const { name, email, password, confirm_password, phone } = req.body;

    // Validate inputs
    const errors = [];

    // if (!name || name.trim().length === 0) {
    //   errors.push("Name is required");
    // }

    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // if (!email || !emailRegex.test(email)) {
    //   errors.push("Invalid email format");
    // }

    // if (password.length < 6) {
    //   errors.push("Password must be at least 6 characters long");
    // }
    if (password !== confirm_password) {
      errors.push("Passwords do not match");
    }

    // if (!phone || !/^\d{10}$/.test(phone)) {
    //   errors.push("Phone number must be exactly 10 digits");
    // }

    // if (errors.length > 0) {
    //   return res.status(400).json({ message: errors.join("; ") });
    // }

    // Check if email already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const newAdmin = new Admin({
      name,
      email,
      password: hashedPassword,
      phone
    });

    await newAdmin.save();

    // Store in session
    req.session.user = newAdmin;

    res.redirect("/admin/dashboard");
  } catch (error) {
    console.error("Error during admin signup:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Login Function
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    // if (!isMatch) {
    //   return res.status(400).json({ message: "Invalid email or password" });
    // }

    // Store in session
    req.session.user = admin;

    res.redirect("/admin/dashboard");
  } catch (error) {
    console.error("Error during admin login:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};