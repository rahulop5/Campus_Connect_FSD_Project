import express from "express";
import {
    studentAttendance,
    studentDashboard,
    studentGrades,
    studentProfile,
} from "../controllers/studentController.js";

const router = express.Router();

router.get("/dashboard", studentDashboard);
router.get("/profile", studentProfile);
router.get("/attendance", studentAttendance);
router.get("/bellgraph", studentGrades);

export default router;