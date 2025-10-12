import passport from "passport";
import bcrypt from "bcryptjs";
import Student from "../models/Student.js";

// ==================================
// == GOOGLE AUTHENTICATION
// ==================================
export const googleAuth = passport.authenticate("google", { scope: ["profile", "email"] });

export const googleAuthCallback = passport.authenticate("google", { failureRedirect: "/" });

export const handleGoogleAuthCallback = async (req, res) => {
  try {
    const { user } = req.session.passport;
    const existingStudent = await Student.findOne({ email: user.email });

    if (existingStudent) {
      // User already exists, log them in and redirect to dashboard
      req.session.user = existingStudent;
      res.redirect("/dashboard");
    } else {
      // New user, store their Google info in session and redirect to complete registration
      req.session.user = {
        name: user.name,
        email: user.email,
      };
      res.redirect("/register");
    }
  } catch (error) {
    console.error("Error during Google callback:", error);
    res.redirect("/");
  }
};

// ==================================
// == GITHUB AUTHENTICATION
// ==================================
export const githubAuth = passport.authenticate("github", { scope: ["user:email"] });

export const githubAuthCallback = passport.authenticate("github", { failureRedirect: "/" });

export const handleGithubAuthCallback = async (req, res) => {
  try {
    const { user } = req.session.passport;
    const existingStudent = await Student.findOne({ email: user.email });

    if (existingStudent) {
      // User already exists, log them in
      req.session.user = existingStudent;
      res.redirect("/dashboard");
    } else {
      // New user, store GitHub info and redirect to complete registration
      req.session.user = {
        name: user.name,
        email: user.email,
      };
      res.redirect("/register");
    }
  } catch (error) {
    console.error("Error during GitHub callback:", error);
    res.redirect("/");
  }
};

// ==================================
// == LOCAL SIGNUP (Step 1: Name, Email, Password)
// ==================================
export const signupStudent = async (req, res) => {
  try {
    const { name, email, password, confirm_password } = req.body;

    // --- VALIDATION ---
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: "Name is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

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

    const existingUser = await Student.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }
    // --- END VALIDATION ---

    const hashedPassword = await bcrypt.hash(password, 10);

    // Store partial data in session and proceed to the next registration step
    req.session.user = {
      name,
      email,
      password: hashedPassword,
    };

    res.redirect("/register");

  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ==================================
// == REGISTER (Step 2: Roll, Section, Phone) - The Final Step
// ==================================
export const registerStudent = async (req, res) => {
  try {
    const { roll, section, phone } = req.body;

    // --- VALIDATION ---
    const rollRegex = /^S(20[0-2][0-9])00(10|20|30)([0-9]{3})$/; // Updated regex for year 2000-2029
    if (!roll || !rollRegex.test(roll)) {
      return res.status(400).json({ message: "Invalid Roll Number format. Example: S20230010001" });
    }

    if (!section || !/^[1-9]\d*$/.test(section)) {
      return res.status(400).json({ message: "Section must be a positive number (e.g., 1, 2, 3)" });
    }

    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
    }
    // --- END VALIDATION ---

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

    // Create the final student object using data from session and form
    const newStudent = new Student({
      name: req.session.user.name,
      email: req.session.user.email,
      password: req.session.user.password || null, // Password will be null for OAuth users
      isOAuth: !req.session.user.password,
      phone,
      roll,
      section,
      branch,
      ug: ugYear.toString(),
      courses: [],
    });

    await newStudent.save();

    // Update session with the complete, saved user profile
    req.session.user = newStudent;

    res.redirect("/dashboard");

  } catch (error) {
    console.error("Error during student registration:", error);
    res.status(500).send("Internal Server Error");
  }
};

// ==================================
// == LOCAL LOGIN
// ==================================
export const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Student.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (user.isOAuth) {
      return res.status(400).json({
        message: "This account was created using Google or GitHub. Please log in using those methods.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    req.session.user = user;
    res.redirect("/dashboard");

  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};