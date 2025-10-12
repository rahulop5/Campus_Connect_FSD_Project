import express from "express";
import {
    studentAttendance,
    studentAttendanceNew,
    studentDashboard,
    studentDashboardNew,
    studentGradebyId,
    studentGrades,
    studentGradesPartial,
    studentProfile,
    studentProfilePartial,
    updateStudentProfile
} from "../controllers/studentController.js";


const router = express.Router();

router.get("/dashboard", studentDashboard);
router.get("/profile", studentProfile);
router.get("/attendance", studentAttendance);
router.get("/bellgraph", studentGrades);

router.get("/bellgraph-data/:courseId", studentGradebyId);
router.post('/update', updateStudentProfile);

router.get("/student/dashboard/partial",studentDashboardNew);
router.get("/student/attendance/partial", studentAttendanceNew);
router.get("/profile/partial", studentProfilePartial);
router.get("/bellgraph/partial", studentGradesPartial);

export default router;