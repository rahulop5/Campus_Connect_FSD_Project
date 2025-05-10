import express from "express";
import {
    studentAttendance,
    studentDashboard,
    studentGradebyId,
    studentGrades,
    studentProfile,
    updateStudentProfile
} from "../controllers/studentController.js";
import Course from "../models/Course.js";


const router = express.Router();

router.get("/dashboard", studentDashboard);
router.get("/profile", studentProfile);
router.get("/attendance", studentAttendance);
router.get("/bellgraph", studentGrades);
router.get("/bellgraph-data/:courseId", studentGradebyId);
router.post('/update', updateStudentProfile);

export default router;