import passport from "passport";
import bcrypt from "bcryptjs";
import Student from "../models/Student.js";

// Google Authentication
export const googleAuth = passport.authenticate("google", { scope: ["profile", "email"] });

export const googleAuthCallback = passport.authenticate("google", { failureRedirect: "/" });

export const handleGoogleAuthCallback = async (req, res) => {
  try {
    const { user } = req.session.passport;
    const existingStudent = await Student.findOne({ email: user.email });

    if (existingStudent) {
      req.session.user = existingStudent; 
      res.redirect("/dashboard"); 
    } else {
      // Temporarily store the user data in the session for registration
      req.session.user = {
        name: user.name,
        email: user.email,
      };
      res.redirect("/register"); // Redirect to the registration page
    }
  } catch (error) {
    console.error("Error during Google callback:", error);
    res.redirect("/");
  }
};

// GitHub Authentication
export const githubAuth = passport.authenticate("github", { scope: ["user:email"] });

export const githubAuthCallback = passport.authenticate("github", { failureRedirect: "/" });

export const handleGithubAuthCallback = async (req, res) => {
  try {
    const { user } = req.session.passport;
    // Check if user already exists in the database
    const existingStudent = await Student.findOne({ email: user.email });

    if (existingStudent) {
      req.session.user = existingStudent; // Store the user in the session
      res.redirect("/dashboard"); // Redirect to the dashboard
    } else {
      // Temporarily store the user data in the session for registration
      req.session.user = {
        name: user.name,
        email: user.email,
      };
      res.redirect("/register"); // Redirect to the registration page
    }
  } catch (error) {
    console.error("Error during GitHub callback:", error);
    res.redirect("/");
  }
};

// Register Student
export const registerStudent = async (req, res) => {
  try {
    const { roll, section, phone } = req.body;

    // Validate roll number
    const rollRegex = /^S(20[0-2][0-5])00(10|20|30)([0-9]{3})$/;
    if (!roll || !rollRegex.test(roll)) {
      const rollErrors = [];
      if (!roll || roll[0] !== 'S') {
        rollErrors.push("Roll number must start with capital 'S'");
      }
      const yearMatch = roll && roll.match(/^S(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1]) : null;
      const currentYear = new Date().getFullYear();
      if (!year || year <= 2000 || year >= currentYear) {
        rollErrors.push("Year must be between 2001 and ${currentYear}");
      }
      if (!roll || roll.substring(5, 7) !== '00') {
        rollErrors.push("Roll number must have '00' after the year");
      }
      if (!roll || !['10', '20', '30'].includes(roll.substring(7, 9))) {
        rollErrors.push("Branch code must be '10', '20', or '30'");
      }
      const lastThree = roll && roll.match(/(\d{3})$/);
      const lastThreeNum = lastThree ? parseInt(lastThree[1]) : 0;
      if (!lastThree || lastThreeNum === 0) {
        rollErrors.push("Last three digits must be a number greater than 0");
      }
      return res.status(400).json({ message: rollErrors.join("; ") });
    }

    // Validate section
    if (!section || !/^\d+$/.test(section) || !Number.isInteger(parseInt(section)) || parseInt(section) <= 0) {
      return res.status(400).json({ message: "Section must be a natural number (positive integer greater than 0)" });
    }

    // Validate phone number
    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
    }

    // Extract year, branch, and UG year from roll number
    const year = parseInt(roll.substring(1, 5));
    const currentYear = new Date().getFullYear();
    const ugYear = currentYear - year;x

    const branchCode = roll.substring(7, 9);
    let branch;
    switch (branchCode) {
      case "10":
        branch = "CSE";
        break;
      case "20":
        branch = "ECE";
        break;
      case "30":
        branch = "AIDS";
        break;
      default:
        branch = "Unknown";
    }

    // Create a new student object
    const newStudent = new Student({
      name: req.session.user.name,
      email: req.session.user.email,
      password: req.session.user.password || null, // Password will be null for OAuth users
      isOAuth: !req.session.user.password, // If there is no password, mark the account as OAuth
      phone,
      roll,
      section,
      branch,
      ug: ugYear.toString(),
      courses: [],
    });

    // Save the new student to the database
    await newStudent.save();

    // Update session with the registered user
    req.session.user = newStudent;

    // Redirect to the dashboard
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error during student registration:", error);
    res.status(500).send("Internal Server Error");
  }
};


// Signup Student
export const signupStudent = async (req, res) => {
  try {
    const { name, email, password, confirm_password } = req.body;

    // Validate name
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: "Name is required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password requirements
    const passwordErrors = [];
    if (password.length < 6) {
      passwordErrors.push("Password must be at least 6 characters long");
    }
    if (!/[A-Z]/.test(password)) {
      passwordErrors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      passwordErrors.push("Password must contain at least one lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
      passwordErrors.push("Password must contain at least one number");
    }
    if (!/[@$!%*?&]/.test(password)) {
      passwordErrors.push("Password must contain at least one special character (@$!%*?&)");
    }

    if (passwordErrors.length > 0) {
      return res.status(400).json({ message: passwordErrors.join("; ") });
    }

    // Check if passwords match
    if (password !== confirm_password) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check if email already exists in the database
    const existingUser = await Student.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    req.session.user = {
      name,
      email,
      password: hashedPassword,
    };

    // Redirect to the register page for completing the profile
    res.redirect("/register");
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists in the database
    const user = await Student.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check if the account is OAuth-based
    if (user.isOAuth) {
      return res.status(400).json({
        message: "This account was created using Google or GitHub. Please log in using those methods.",
      });
    }

    // Compare the entered password with the hashed password stored in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Store the user in the session
    req.session.user = user;

    // Redirect to the dashboard
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};