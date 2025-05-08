import express from "express";
import {
    studentDashboard,
    studentProfile,
} from "../controllers/studentController.js";

const router = express.Router();

router.get("/dashboard", studentDashboard);
router.get("/profile", studentProfile);

export default router;