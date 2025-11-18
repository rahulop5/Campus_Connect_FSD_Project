import Course from "../models/Course.js";
import fs from "fs";
import csvParser from "csv-parser";

// Middleware like multer should handle file upload (assumed to be configured)
// export const professorDashboard = async (req, res) => {
//   try {
//     if (!req.session.user) {
//       return res.redirect("/auth/prof/login");
//     }

//     const professorId = req.session.user._id;

//     // Fetch only the courses assigned to this professor
//     const courses = await Course.find({ professor: professorId });
//     courses.forEach((course) => {
//       const shortForm = course.name
//         .split(" ")
//         .map((word) => word[0].toUpperCase())
//         .join("");
//       course.name = shortForm;
//     });
//     // Pass the professor details and the assigned courses to the template
//     res.render("profdashboard.ejs", {
//       professor: req.session.user,
//       courses,
//     });
//   } catch (error) {
//     console.error("Error rendering professor dashboard:", error);
//     res.status(500).send("Internal Server Error");
//   }
// };

//new shiih

// GET /prof/dashboard
export const professorDashboard = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/auth/prof/login");
    }

    // Just render the shell, don’t embed courses
    res.render("profdashboard.ejs", {
      professor: req.session.user, // still okay to embed professor name
      courses: [] // send empty for now
    });
  } catch (error) {
    console.error("Error rendering professor dashboard:", error);
    res.status(500).send("Internal Server Error");
  }
};

// GET /api/prof/courses
export const getProfessorCourses = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const professorId = req.session.user._id;
    const courses = await Course.find({ professor: professorId });

    const formattedCourses = courses.map(course => ({
      id: course._id,
      name: course.name
        .split(" ")
        .map(word => word[0].toUpperCase())
        .join(""),
      section: course.section
    }));

    res.json({ courses: formattedCourses });
  } catch (error) {
    console.error("Error fetching professor courses:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};