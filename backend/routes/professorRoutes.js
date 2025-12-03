import express from "express";
import {
    professorDashboard,
    getProfessorCourses
} from "../controllers/professorController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verifyToken);

router.get("/dashboard", professorDashboard);
router.get("/courses", getProfessorCourses);

export default router;