import express from "express";
import { registerAdmin, handleAdminLogin, getMe } from "../controllers/auth/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", handleAdminLogin);
router.post("/register", registerAdmin);
router.get("/me", verifyToken, getMe);

export default router;