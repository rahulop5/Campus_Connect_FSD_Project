import express from "express";
import {
    studentAttendance,
    studentDashboard,
    studentGradebyId,
    studentGrades,
    studentProfile,
} from "../controllers/studentController.js";
import Course from "../models/Course.js";

const router = express.Router();

router.get("/dashboard", studentDashboard);
router.get("/profile", studentProfile);
router.get("/attendance", studentAttendance);
router.get("/bellgraph", studentGrades);
router.get("/bellgraph-data/:courseId", studentGradebyId);

export default router;