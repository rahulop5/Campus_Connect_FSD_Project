import Course from "../models/Course.js";
import fs from "fs";
import csvParser from "csv-parser";

// Middleware like multer should handle file upload (assumed to be configured)
export const professorDashboard = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/auth/prof/login");
    }

    const professorId = req.session.user._id;

    // Fetch only the courses assigned to this professor
    const courses = await Course.find({ professor: professorId });
    courses.forEach((course) => {
      const shortForm = course.name
        .split(" ")
        .map((word) => word[0].toUpperCase())
        .join("");
      course.name = shortForm;
    });
    // Pass the professor details and the assigned courses to the template
    res.render("profdashboard.ejs", {
      professor: req.session.user,
      courses,
    });
  } catch (error) {
    console.error("Error rendering professor dashboard:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const csvformSubmit = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.session.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if file and course selections are provided
    if (!req.file || !req.body.courseId || !Array.isArray(req.body.courseId)) {
      return res.status(400).json({ message: "No file or course selected" });
    }

    const professorId = req.session.user._id;
    const courseIds = req.body.courseId; // Array of selected course IDs from checkboxes
    const filePath = req.file.path; // Path to the uploaded CSV file (assumed from multer)

    // Validate that selected courses belong to the professor
    const courses = await Course.find({ _id: { $in: courseIds }, professor: professorId });
    if (courses.length !== courseIds.length) {
      return res.status(400).json({ message: "Invalid course selection" });
    }

    // Parse CSV and calculate grade distribution
    const gradeDistribution = new Map();
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => {
        // Updated to use 'grade' column from the CSV
        const mark = parseFloat(row.grade);
        if (!isNaN(mark) && mark >= 0 && mark <= 100) { // Validate mark range
          gradeDistribution.set(mark, (gradeDistribution.get(mark) || 0) + 1);
        }
      })
      .on("end", async () => {
        // Update gradeDistribution for each selected course
        const updatePromises = courses.map(async (course) => {
          course.gradeDistribution = new Map([...gradeDistribution]); // Copy the Map
          await course.save();
        });
        await Promise.all(updatePromises);

        // Clean up the file
        fs.unlink(filePath, (err) => {
          if (err) console.error("Error deleting file:", err);
        });

        res.status(200).json({ message: "Grade distribution updated successfully" });
      })
      .on("error", (err) => {
        console.error("Error parsing CSV:", err);
        res.status(500).json({ message: "Error processing CSV file" });
      });
  } catch (error) {
    console.error("Error in csvformSubmit:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
