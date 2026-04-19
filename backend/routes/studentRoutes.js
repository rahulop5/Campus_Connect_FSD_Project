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
import { cacheMiddleware, CacheKeys } from "../middleware/cacheMiddleware.js";


const router = express.Router();

router.use(verifyToken); // Protect all routes

// GET routes with Redis caching
router.get("/dashboard", cacheMiddleware(CacheKeys.studentDashboard, 300), studentDashboard);
router.get("/profile", cacheMiddleware(CacheKeys.studentProfile, 300), studentProfile);
router.get("/attendance", cacheMiddleware(CacheKeys.studentAttendance, 300), studentAttendance);
router.get("/bellgraph", cacheMiddleware(CacheKeys.studentBellgraph, 600), studentGrades);
router.get("/bellgraph-data/:courseId", studentGradebyId);

// POST routes (mutations — no caching)
router.post('/update', updateStudentProfile);
router.post('/upload-profile-pic', uploadProfilePicture.single('profilePicture'), uploadProfilePic);
router.post('/delete-profile-pic', deleteProfilePic);
router.get("/changepassword", changepass);

export default router;