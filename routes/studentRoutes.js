import express from "express";
import {
    changepass,
    studentAttendance,
    studentAttendancePartial,
    studentDashboard,
    studentDashboardPartial,
    studentGradebyId,
    studentGrades,
    studentGradesPartial,
    studentProfile,
    studentProfilePartial,
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

router.get("/dashboard/partial",studentDashboardPartial)
router.get("/attendance/partial", studentAttendancePartial);
router.get("/profile/partial", studentProfilePartial);
router.get("/bellgraph/partial", studentGradesPartial);

router.get("/changepassword", changepass);

export default router;