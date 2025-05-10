import express from "express";
import {
    studentAttendance,
    studentDashboard,
    studentGrades,
    studentProfile,
} from "../controllers/studentController.js";
import Course from "../models/Course.js";

const router = express.Router();

router.get("/dashboard", studentDashboard);
router.get("/profile", studentProfile);
router.get("/attendance", studentAttendance);
router.get("/bellgraph", studentGrades);

router.get("/bellgraph-data/:courseId", async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);

    if (!course || !course.gradeDistribution) {
      return res.status(404).json({ error: "No grade distribution data available for this course." });
    }

    // Prepare x (grades) and y (frequencies) data for the graph
    const gradeDistribution = Array.from(course.gradeDistribution.entries()).sort((a, b) => a[0] - b[0]);
    const x = gradeDistribution.map(([grade]) => grade);
    const y = gradeDistribution.map(([, frequency]) => frequency);

    res.json({ x, y });
  } catch (error) {
    console.error("Error fetching bell graph data:", error);
    res.status(500).json({ error: "Internal Server Error." });
  }
});

export default router;