import express from "express";
import {
    handleProfLogin,
    registerProfessor,
    getMe
} from "../controllers/auth/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", handleProfLogin);
router.post("/register", registerProfessor);
router.get("/me", verifyToken, getMe);

export default router;