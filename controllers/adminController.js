import mongoose from "mongoose";
import Course from "../models/Course.js";
import Professor from "../models/Professor.js";
import Student from "../models/Student.js";
import bcrypt from "bcryptjs";

export const adminDashboard = async (req, res) => {
  try {
    // Check if user is an admin
    if (!req.session.user) {
      return res.redirect("/auth/admin/login");
    }

    // Fetch data for rendering the dashboard
    const courses = await Course.find().populate("professor");
    const professors = await Professor.find().select("name email phone");
    const students = await Student.find().select("name email rollnumber phone section");

    // Handle POST requests
    if (req.method === "POST") {
      const { action } = req.body;

      if (action === "add-course") {
        const { name, section, totalclasses, credits, professor } = req.body;

        // Validate inputs
        const errors = [];

        if (!name || typeof name !== "string" || name.trim().length === 0) {
          errors.push("Course name must be a non-empty string");
        }

        if (!section || typeof section !== "string" || section.trim().length === 0) {
          errors.push("Section must be a non-empty string");
        }

        if (!Number.isInteger(Number(totalclasses)) || Number(totalclasses) <= 0) {
          errors.push("Total classes must be a positive integer greater than 0");
        }

        if (!Number.isInteger(Number(credits)) || Number(credits) <= 0) {
          errors.push("Credits must be a positive integer greater than 0");
        }

        if (!professor || !mongoose.Types.ObjectId.isValid(professor)) {
          errors.push("Professor must be a valid ObjectId");
        }

        if (errors.length > 0) {
          return res.status(400).json({ message: errors.join("; ") });
        }

        // Verify professor exists
        const professorExists = await Professor.findById(professor);
        if (!professorExists) {
          return res.status(400).json({ message: "Professor does not exist" });
        }

        // Check for duplicate course
        const existingCourse = await Course.findOne({
          name: name.trim(),
          section: section.trim(),
          professor
        });
        if (existingCourse) {
          return res.status(400).json({ message: "Course with the same name, section, and professor already exists" });
        }

        // Create new Course document
        const newCourse = new Course({
          name: name.trim(),
          section: section.trim(),
          classeshpnd: 0,
          totalclasses: Number(totalclasses),
          credits: Number(credits),
          professor
        });
        await newCourse.save();

        // Update Professor.courses
        await Professor.findByIdAndUpdate(
          professor,
          { $push: { courses: { course: newCourse._id } } },
          { new: true }
        );

        return res.redirect("/admin/dashboard");
      }

      if (action === "add-student") {
        const { name, email, rollnumber, phone, section } = req.body;

        // Validate inputs
        const errors = [];

        if (!name || typeof name !== "string" || name.trim().length === 0) {
          errors.push("Name must be a non-empty string");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
          errors.push("Invalid email format");
        }

        if (!rollnumber || typeof rollnumber !== "string" || rollnumber.trim().length === 0) {
          errors.push("Roll number must be a non-empty string");
        }

        if (!phone || !/^\d{10}$/.test(phone)) {
          errors.push("Phone number must be exactly 10 digits");
        }

        if (!section || typeof section !== "string" || section.trim().length === 0) {
          errors.push("Section must be a non-empty string");
        }

        if (errors.length > 0) {
          return res.status(400).json({ message: errors.join("; ") });
        }

        // Check if email already exists
        const existingEmail = await Student.findOne({ email });
        if (existingEmail) {
          return res.status(400).json({ message: "Email already exists" });
        }

        // Check if roll number already exists
        const existingRoll = await Student.findOne({ rollnumber });
        if (existingRoll) {
          return res.status(400).json({ message: "Roll number already exists" });
        }

        // Create new student
        const newStudent = new Student({
          name: name.trim(),
          email,
          rollnumber: rollnumber.trim(),
          phone,
          section: section.trim(),
          courses: []
        });

        await newStudent.save();

        return res.redirect("/admin/dashboard");
      }

      if (action === "remove-student") {
        const { email } = req.body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
          return res.status(400).json({ message: "Invalid email format" });
        }

        const student = await Student.findOne({ email });
        if (!student) {
          return res.status(404).json({ message: "Student not found" });
        }

        await Student.deleteOne({ email });

        return res.redirect("/admin/dashboard");
      }

      // If action is not recognized, redirect to dashboard
      return res.redirect("/admin/dashboard");
    }

    // Handle GET request: Render the dashboard
    res.render("admindashboard.ejs", {
      name: req.session.user.name,
      courses,
      professors,
      students
    });
  } catch (error) {
    console.error("Error in admin dashboard:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};