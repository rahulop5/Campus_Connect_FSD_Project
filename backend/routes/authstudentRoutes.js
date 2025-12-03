import express from "express";
import {
    handleStudentLogin,
    registerStudent,
    getMe
} from "../controllers/auth/authController.js";
import {
    googleAuth,
    googleAuthCallback,
    handleGoogleAuthCallback,
    githubAuth,
    githubAuthCallback,
    handleGithubAuthCallback
} from "../controllers/authstudentController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Auth Routes
router.post("/login", handleStudentLogin);
router.post("/register", registerStudent);
router.get("/me", verifyToken, getMe);

// OAuth Routes
router.get("/google", googleAuth);
router.get("/google/callback", googleAuthCallback, handleGoogleAuthCallback);
router.get("/github", githubAuth);
router.get("/github/callback", githubAuthCallback, handleGithubAuthCallback);

export default router;

