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
    classeshpnd: 20,
    totalclasses: 40,
    credits: 3,
    professor: "681a606c07dc5eb482cbf2de"
  },
  {
    name: "Introduction to Artificial Intelligence",
    section: "2",
    classeshpnd: 15,
    totalclasses: 30,
    credits: 4,
    professor: "681a606c07dc5eb482cbf2de"
  },
  {
    name: "Software Engineering",
    section: "3",
    classeshpnd: 25,
    totalclasses: 50,
    credits: 3,
    professor: "681a606c07dc5eb482cbf2de"
  },
  {
    name: "Algorithms and Data Structures",
    section: "4",
    classeshpnd: 18,
    totalclasses: 36,
    credits: 3,
    professor: "681a606c07dc5eb482cbf2de"
  },
  {
    name: "Theory of Computation",
    section: "1",
    classeshpnd: 12,
    totalclasses: 24,
    credits: 3,
    professor: "681a606c07dc5eb482cbf2de"
  },
  {
    name: "Database Management Systems",
    section: "2",
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

addCoursesToStudents();

app.listen(3000);
