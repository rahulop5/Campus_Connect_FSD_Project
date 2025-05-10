import express from "express";
import session from "express-session";
import env from "dotenv";
import passport from "passport";
import connectDB from './config/db.js';
import "./config/passportConfig.js";
import authstudentRoutes from "./routes/authstudentRoutes.js";
import authprofessorRoutes from "./routes/authprofessorRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import qandaforumRoutes from "./routes/qandaforumRoutes.js";
import professorRoutes from "./routes/professorRoutes.js";
import Course from "./models/Course.js";
import Student from "./models/Student.js";
import multer from "multer";
import fs from "fs";
import csvParser from "csv-parser";
import mongoose from "mongoose";
import profileRoutes from './routes/studentRoutes.js';


const app=express();
env.config();
connectDB();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/", authstudentRoutes);
app.use("/", authprofessorRoutes);
app.use("/", studentRoutes);
app.use("/", qandaforumRoutes);
app.use("/", professorRoutes);

app.get("/", (req, res) => {
  res.render("home.ejs");
});

const courses = [
  {
    name: "Mathematics for Computer Science",
    section: "1",
    ug: "2",
    classeshpnd: 20,
    totalclasses: 40,
    credits: 3,
    professor: "681a606c07dc5eb482cbf2de"
  },
  {
    name: "Introduction to Artificial Intelligence",
    section: "2",
    ug: "2",
    classeshpnd: 15,
    totalclasses: 30,
    credits: 4,
    professor: "681a606c07dc5eb482cbf2de"
  },
  {
    name: "Software Engineering",
    section: "3",
    ug: "1",
    classeshpnd: 25,
    totalclasses: 50,
    credits: 3,
    professor: "681a606c07dc5eb482cbf2de"
  },
  {
    name: "Algorithms and Data Structures",
    section: "4",
    ug: "2",
    classeshpnd: 18,
    totalclasses: 36,
    credits: 3,
    professor: "681a606c07dc5eb482cbf2de"
  },
  {
    name: "Theory of Computation",
    section: "1",
    ug: "3",
    classeshpnd: 12,
    totalclasses: 24,
    credits: 3,
    professor: "681a606c07dc5eb482cbf2de"
  },
  {
    name: "Database Management Systems",
    section: "2",
    ug: "2",
    classeshpnd: 20,
    totalclasses: 40,
    credits: 4,
    professor: "681a606c07dc5eb482cbf2de"
  }
];

async function insertCourses() {
  try {
    await Course.insertMany(courses);
    console.log("Courses added successfully!");
  } catch (error) {
    console.error("Error inserting courses:", error);
  }
}

// insertCourses();

async function addCoursesToStudents() {
  try {

    // Fetch all students from the database
    const students = await Student.find();

    for (const student of students) {
      if (student.ug && student.section) {
        // Find matching courses based on ug and section
        const matchingCourses = await Course.find({
          ug: student.ug,
          section: student.section,
        });

        // Add matching courses to the student's courses field
        for (const course of matchingCourses) {
          // Check if the course is already added to avoid duplicates
          const alreadyAdded = student.courses.some(
            (c) => c.course.toString() === course._id.toString()
          );

          if (!alreadyAdded) {
            student.courses.push({ course: course._id, attendance: 0, grade: 0 });
          }
        }

        // Save the updated student document
        await student.save();
      }
    }

    console.log("Courses successfully added to students!");
  } catch (error) {
    console.error("Error adding courses to students:", error);
  }
}

// addCoursesToStudents();



if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads", { recursive: true });
}

const storage = multer.diskStorage({
  destination: "./uploads",
  filename: function (req, file, cb) {
    cb(null, "marksheet.csv");
  },
});

const upload = multer({ storage: storage });

app.post("/prof/submit", upload.single("marksheet"), async (req, res) => {
  try {
    const courseId = req.body.courseId; // Get the course ID
    if (!courseId) {
      return res.status(400).send("Course ID is required.");
    }

    const filePath = "./uploads/marksheet.csv"; // Path to the uploaded CSV file
    const updates = [];
    const grades = []; // Array to store grades for frequency calculation

    // Read the CSV file and process the data
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => {
        if (row.email && row.grade && row.attendance) {
          updates.push({
            email: row.email.trim(),
            grade: parseInt(row.grade.trim(), 10),
            attendance: parseInt(row.attendance.trim(), 10),
          });
          grades.push(parseInt(row.grade.trim(), 10)); // Collect grades for distribution
        }
      })
      .on("end", async () => {
        // Update students' grades and attendance
        for (const update of updates) {
          const student = await Student.findOne({ email: update.email });
          if (student) {
            const courseIndex = student.courses.findIndex(
              (c) => c.course.toString() === courseId
            );
            if (courseIndex !== -1) {
              student.courses[courseIndex].grade = update.grade;
              student.courses[courseIndex].attendance = update.attendance;
            }
            await student.save();
          }
        }

        // Calculate grade distribution
        const gradeDistribution = grades.reduce((acc, grade) => {
          acc[grade] = (acc[grade] || 0) + 1; // Increment frequency for the grade
          return acc;
        }, {});

        // Update the course with the grade distribution
        const course = await Course.findById(courseId);
        if (course) {
          course.gradeDistribution = gradeDistribution;
          await course.save();
        }

        res.status(200).send("Student grades and attendance updated successfully.");
      })
      .on("error", (error) => {
        console.error("Error reading CSV file:", error);
        res.status(500).send("Error processing the file.");
      });
  } catch (error) {
    console.error("Error updating student data:", error);
    res.status(500).send("Internal Server Error.");
  }
});

app.use('/profile', profileRoutes);

app.get("/profileprof", (req, res) => {
  res.render("profileprof.ejs",{
      student: req.session.user,
    } );
});

app.listen(3000);
