import Professor from "../models/Professor.js";
import bcrypt from "bcryptjs";

// Signup Function
export const professorSignup = async (req, res) => {
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
      phone: phone, 
      courses: [],
    });

    await newProfessor.save();

    req.session.user = newProfessor;

    res.redirect("/prof/dashboard"); 
  } catch (error) {
    console.error("Error during professor signup:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Login Function
export const professorLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const professor = await Professor.findOne({ email });
    if (!professor) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    console.log(professor);
    // Compare the entered password with the hashed password stored in the database
    const isMatch = await bcrypt.compare(password, professor.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    req.session.user = professor;

    // Redirect to the dashboard
    res.redirect("/prof/dashboard"); // Adjust this route as per your app
  } catch (error) {
    console.error("Error during professor login:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};