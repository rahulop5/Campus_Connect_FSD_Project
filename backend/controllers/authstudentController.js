import passport from "passport";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Student from "../models/Student.js";

// ==================================
// == GOOGLE OAUTH
// ==================================
export const googleAuth = passport.authenticate("google", { scope: ["profile", "email"] });

export const googleAuthCallback = passport.authenticate("google", { failureRedirect: "http://localhost:5173/login?error=oauth_failed" });

export const handleGoogleAuthCallback = async (req, res) => {
  try {
    // req.user contains the authenticated user from passport
    const { email, name } = req.user;
    
    // Check if user already exists
    let student = await Student.findOne({ email });

    if (student) {
      // Existing user - generate JWT and redirect
      const payload = {
        email: student.email,
        role: "Student",
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      
      // Redirect to frontend with token in URL
      return res.redirect(`http://localhost:5173/oauth-callback?token=${token}&name=${encodeURIComponent(student.name)}&role=Student`);
    } else {
      // New user - redirect to registration with pre-filled data
      // Since we need additional info (roll, section, phone), redirect to register page
      // Pass the OAuth data so user can complete registration
      return res.redirect(`http://localhost:5173/register?oauth=true&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`);
    }
  } catch (error) {
    console.error("Error during Google callback:", error);
    res.redirect("http://localhost:5173/login?error=oauth_error");
  }
};

// ==================================
// == GITHUB OAUTH
// ==================================
export const githubAuth = passport.authenticate("github", { scope: ["user:email"] });

export const githubAuthCallback = passport.authenticate("github", { failureRedirect: "http://localhost:5173/login?error=oauth_failed" });

export const handleGithubAuthCallback = async (req, res) => {
  try {
    // req.user contains the authenticated user from passport
    const { email, name } = req.user;

    if (!email) {
      return res.redirect("http://localhost:5173/login?error=no_email");
    }

    // Check if user already exists
    let student = await Student.findOne({ email });

    if (student) {
      // Existing user - generate JWT and redirect
      const payload = {
        email: student.email,
        role: "Student",
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      
      // Redirect to frontend with token in URL
      return res.redirect(`http://localhost:5173/oauth-callback?token=${token}&name=${encodeURIComponent(student.name)}&role=Student`);
    } else {
      // New user - redirect to registration with pre-filled data
      return res.redirect(`http://localhost:5173/register?oauth=true&email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`);
    }
  } catch (error) {
    console.error("Error during GitHub callback:", error);
    res.redirect("http://localhost:5173/login?error=oauth_error");
  }
};

// ==================================
// == STUDENT REGISTRATION (JWT-based)
// ==================================
export const registerStudent = async (req, res) => {
  try {
    const { name, email, password, confirm_password, roll, section, phone } = req.body;

    // --- VALIDATION ---
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: "Name is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check if user already exists
    const existingUser = await Student.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    // Password validation (only if not OAuth)
    let hashedPassword = null;
    let isOAuth = false;

    if (password) {
      const passwordErrors = [];
      if (password.length < 6) passwordErrors.push("Password must be at least 6 characters long");
      if (!/[A-Z]/.test(password)) passwordErrors.push("Password must contain at least one uppercase letter");
      if (!/[0-9]/.test(password)) passwordErrors.push("Password must contain at least one number");
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) passwordErrors.push("Password must contain at least one special character");

      if (passwordErrors.length > 0) {
        return res.status(400).json({ message: passwordErrors.join(".\n") });
      }

      if (password !== confirm_password) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      hashedPassword = await bcrypt.hash(password, 10);
    } else {
      isOAuth = true;
    }

    // Roll number validation (for students)
    const rollRegex = /^S(20[0-2][0-9])00(10|20|30)([0-9]{3})$/;
    if (!roll || !rollRegex.test(roll)) {
      return res.status(400).json({ message: "Invalid Roll Number format. Example: S20230010001" });
    }

    if (!section || !/^[1-9]\d*$/.test(section)) {
      return res.status(400).json({ message: "Section must be a positive number (e.g., 1, 2, 3)" });
    }

    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
    }

    // Extract data from roll number
    const year = parseInt(roll.substring(1, 5));
    const currentYear = new Date().getFullYear();
    const ugYear = currentYear - year;

    const branchCode = roll.substring(7, 9);
    let branch;
    switch (branchCode) {
      case "10": branch = "CSE"; break;
      case "20": branch = "ECE"; break;
      case "30": branch = "AIDS"; break;
      default: branch = "Unknown";
    }

    // Create the student
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

    // Generate JWT token
    const payload = {
      email: newStudent.email,
      role: "Student",
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Return JWT token
    return res.json({
      name: newStudent.name,
      role: "Student",
      token,
    });

  } catch (error) {
    console.error("Error during student registration:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};