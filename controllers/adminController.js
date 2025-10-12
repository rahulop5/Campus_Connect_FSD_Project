import mongoose from "mongoose";
import Course from "../models/Course.js";
import Professor from "../models/Professor.js";
import Student from "../models/Student.js";
import bcrypt from "bcryptjs";

export const adminDashboard = async (req, res) => {
  try {
    // Check if admin is logged in
    if (!req.session.user) {
      return res.redirect("/auth/admin/login");
    }

    // Fetch data for rendering the dashboard
    const courses = await Course.find().populate("professor");
    const professors = await Professor.find().populate({ path: "courses.course", select: "name section" });
    const students = await Student.find().populate({ path: "courses.course", select: "name section" }).select(
      "name email rollnumber phone section"
    );

    // ----------------------------
    // HANDLE POST REQUESTS
    // ----------------------------
    if (req.method === "POST") {
      const { action } = req.body;
      console.log(`Received action: ${action}`, req.body); // Debug log

      // ----------------------------
      // ADD COURSE
      // ----------------------------
      if (action === "add-course") {
        const { name, section, totalclasses, credits, professor } = req.body;

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
          return res.status(400).render("admindashboard.ejs", {
            name: req.session.user.name,
            courses,
            professors,
            students,
            error: errors.join("; "),
          });
        }

        // Check if professor exists
        const professorExists = await Professor.findById(professor);
        if (!professorExists) {
          return res.status(400).render("admindashboard.ejs", {
            name: req.session.user.name,
            courses,
            professors,
            students,
            error: "Professor does not exist",
          });
        }

        // Prevent duplicate courses
        const existingCourse = await Course.findOne({
          name: name.trim(),
          section: section.trim(),
          professor,
        });

        if (existingCourse) {
          return res.status(400).render("admindashboard.ejs", {
            name: req.session.user.name,
            courses,
            professors,
            students,
            error: "Course with the same name, section, and professor already exists",
          });
        }

        // Create the new course
        const newCourse = new Course({
          name: name.trim(),
          section: section.trim(),
          classeshpnd: 0,
          totalclasses: Number(totalclasses),
          credits: Number(credits),
          professor,
        });

        await newCourse.save();

        // Add course reference to the professor
        await Professor.findByIdAndUpdate(
          professor,
          { $push: { courses: { course: newCourse._id } } },
          { new: true }
        );

        console.log("New course added:", newCourse);
        return res.redirect("/admin/dashboard");
      }

      // ----------------------------
      // ADD STUDENT
      // ----------------------------
      if (action === "add-student") {
        const { name, email, rollnumber, phone, section, password } = req.body;

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
          return res.status(400).render("admindashboard.ejs", {
            name: req.session.user.name,
            courses,
            professors,
            students,
            error: errors.join("; "),
          });
        }

        // Prevent duplicates
        const existingEmail = await Student.findOne({ email });
        if (existingEmail) {
          return res.status(400).render("admindashboard.ejs", {
            name: req.session.user.name,
            courses,
            professors,
            students,
            error: "Email already exists",
          });
        }

        const existingRoll = await Student.findOne({ rollnumber });
        if (existingRoll) {
          return res.status(400).render("admindashboard.ejs", {
            name: req.session.user.name,
            courses,
            professors,
            students,
            error: "Roll number already exists",
          });
        }

        // Build new student object
        const studentData = {
          name: name.trim(),
          email,
          rollnumber: rollnumber.trim(),
          phone,
          section: section.trim(),
          courses: [],
        };

        if (password && password.length > 0) {
          const hashedPassword = await bcrypt.hash(password, 10);
          studentData.password = hashedPassword;
          studentData.isOAuth = false;
        }

        // Optional: derive branch & UG year (safe best-effort)
        try {
          const year = parseInt(rollnumber.substring(1, 5));
          const currentYear = new Date().getFullYear();
          if (!isNaN(year) && year > 1900 && year <= currentYear) {
            studentData.ug = (currentYear - year).toString();
          }

          const branchCode = rollnumber.charAt(7);
          switch (branchCode) {
            case "1":
              studentData.branch = "CSE";
              break;
            case "2":
              studentData.branch = "ECE";
              break;
            case "3":
              studentData.branch = "AIDS";
              break;
            default:
              studentData.branch = "Unknown";
          }
        } catch (err) {
          console.warn("Error deriving UG/branch:", err);
        }

        const newStudent = new Student(studentData);
        await newStudent.save();

        console.log("New student added:", newStudent);
        return res.redirect("/admin/dashboard");
      }

      // ----------------------------
      // ADD PROFESSOR
      // ----------------------------
      if (action === "add-professor") {
        const { name, email, phone, password } = req.body;

        const errors = [];

        if (!name || typeof name !== "string" || name.trim().length === 0) {
          errors.push("Professor name must be a non-empty string");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
          errors.push("Invalid email format");
        }

        if (!phone || !/^\d{10}$/.test(phone)) {
          errors.push("Phone number must be exactly 10 digits");
        }

        if (!password || typeof password !== "string" || password.trim().length < 6) {
          errors.push("Password must be at least 6 characters long");
        }

        if (errors.length > 0) {
          return res.status(400).render("admindashboard.ejs", {
            name: req.session.user.name,
            courses,
            professors,
            students,
            error: errors.join("; "),
          });
        }

        // Prevent duplicate professors
        const existingProfessor = await Professor.findOne({ email });
        if (existingProfessor) {
          return res.status(400).render("admindashboard.ejs", {
            name: req.session.user.name,
            courses,
            professors,
            students,
            error: "Professor already exists",
          });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newProfessor = new Professor({
          name: name.trim(),
          email,
          password: hashedPassword,
          phone,
          courses: [],
        });

        await newProfessor.save();
        console.log("New professor added:", newProfessor);

        return res.redirect("/admin/dashboard");
      }

      // ----------------------------
      // ASSIGN COURSE TO PROFESSOR
      // ----------------------------
      if (action === "assign-course-professor") {
        const { course, professor } = req.body;

        // Basic validation
        if (!course || !professor) {
          return res.status(400).render("admindashboard.ejs", {
            name: req.session.user.name,
            courses,
            professors,
            students,
            error: "Course and professor are required",
          });
        }

        if (!mongoose.Types.ObjectId.isValid(course) || !mongoose.Types.ObjectId.isValid(professor)) {
          return res.status(400).render("admindashboard.ejs", {
            name: req.session.user.name,
            courses,
            professors,
            students,
            error: "Invalid ObjectId(s) provided",
          });
        }

        const courseDoc = await Course.findById(course);
        const profDoc = await Professor.findById(professor);

        if (!courseDoc || !profDoc) {
          return res.status(404).render("admindashboard.ejs", {
            name: req.session.user.name,
            courses,
            professors,
            students,
            error: "Course or Professor not found",
          });
        }

        // Check if the course is already assigned to this professor
        const isAlreadyAssigned = profDoc.courses.some(c => c.course.toString() === course);

        // Remove course from the old professor's courses array, if any
        if (courseDoc.professor && courseDoc.professor.toString() !== professor) {
          await Professor.findByIdAndUpdate(
            courseDoc.professor,
            { $pull: { courses: { course: courseDoc._id } } },
            { new: true }
          );
        }

        // Update course's professor
        courseDoc.professor = professor;
        await courseDoc.save();

        // Add course to the professor's courses array only if not already assigned
        if (!isAlreadyAssigned) {
          await Professor.findByIdAndUpdate(professor, { $addToSet: { courses: { course } } });
        }

        console.log(`Assigned course ${course} to professor ${professor}`);
        return res.redirect("/admin/dashboard");
      }

      // ----------------------------
      // ASSIGN COURSE TO STUDENT
      // ----------------------------
      if (action === "assign-course-student") {
        const { course, student } = req.body;
        console.log(`Assign course to student - Course: ${course}, Student: ${student}`);

        // Basic validation
        if (!course || !student) {
          return res.status(400).render("admindashboard.ejs", {
            name: req.session.user.name,
            courses,
            professors,
            students,
            error: "Course and student are required",
          });
        }

        if (!mongoose.Types.ObjectId.isValid(course) || !mongoose.Types.ObjectId.isValid(student)) {
          return res.status(400).render("admindashboard.ejs", {
            name: req.session.user.name,
            courses,
            professors,
            students,
            error: "Invalid ObjectId(s) provided",
          });
        }

        const courseDoc = await Course.findById(course);
        const studDoc = await Student.findById(student);

        if (!courseDoc || !studDoc) {
          return res.status(404).render("admindashboard.ejs", {
            name: req.session.user.name,
            courses,
            professors,
            students,
            error: "Course or Student not found",
          });
        }

        // Check if the course is already assigned to this student
        const isAlreadyAssigned = studDoc.courses.some(c => c.course.toString() === course);

        // Add the course to student's courses only if not already assigned
        if (!isAlreadyAssigned) {
          const updateResult = await Student.findByIdAndUpdate(
            student,
            { $addToSet: { courses: { course } } },
            { new: true }
          );
          if (!updateResult) {
            console.error(`Failed to update student ${student} with course ${course}`);
            return res.status(500).render("admindashboard.ejs", {
              name: req.session.user.name,
              courses,
              professors,
              students,
              error: "Failed to assign course to student",
            });
          }
          console.log(`Student ${student} updated with course ${course}:`, updateResult.courses);
        } else {
          console.log(`Course ${course} already assigned to student ${student}`);
        }

        return res.redirect("/admin/dashboard");
      }

     

        // Delete the professor
        await Professor.deleteOne({ _id: professor });
        console.log(`Professor ${professor} deleted`);

        return res.redirect("/admin/dashboard");
      }

      // ----------------------------
      // REMOVE STUDENT
      // ----------------------------
      if (action === "remove-student") {
        const { email } = req.body;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email || !emailRegex.test(email)) {
          return res.status(400).render("admindashboard.ejs", {
            name: req.session.user.name,
            courses,
            professors,
            students,
            error: "Invalid email format",
          });
        }

        const student = await Student.findOne({ email });
        if (!student) {
          return res.status(404).render("admindashboard.ejs", {
            name: req.session.user.name,
            courses,
            professors,
            students,
            error: "Student not found",
          });
        }

        await Student.deleteOne({ email });
        console.log("Student removed:", email);
        return res.redirect("/admin/dashboard");
      }

      // Default redirect if unknown action
      return res.status(400).render("admindashboard.ejs", {
        name: req.session.user.name,
        courses,
        professors,
        students,
        error: "Unknown action",
      });
    }

    // ----------------------------
    // HANDLE GET REQUEST
    // ----------------------------
    res.render("admindashboard.ejs", {
      name: req.session.user.name,
      courses,
      professors,
      students,
      error: null,
    });
  } catch (error) {
    console.error("Error in admin dashboard:", error);
    res.status(500).render("admindashboard.ejs", {
      name: req.session.user.name,
      courses,
      professors,
      students,
      error: "Internal Server Error",
    });
  }
};