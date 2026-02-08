import express from "express";
import {
    changepass,
    studentAttendance,
    studentDashboard,
    studentGradebyId,
    studentGrades,
    studentProfile,
    updateStudentProfile,
    uploadProfilePic,
    deleteProfilePic
} from "../controllers/studentController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { uploadProfilePicture } from "../config/multer.js";


const router = express.Router();

router.use(verifyToken); // Protect all routes

router.get("/dashboard", studentDashboard);
router.get("/profile", studentProfile);
router.get("/attendance", studentAttendance);
router.get("/bellgraph", studentGrades);
router.get("/bellgraph-data/:courseId", studentGradebyId);
router.post('/update', updateStudentProfile);
router.post('/upload-profile-pic', uploadProfilePicture.single('profilePicture'), uploadProfilePic);
router.post('/delete-profile-pic', deleteProfilePic);
router.get("/changepassword", changepass);

export default router;