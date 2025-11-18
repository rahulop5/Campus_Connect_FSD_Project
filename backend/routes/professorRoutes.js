import express from "express";
import {
    professorDashboard,
    getProfessorCourses
} from "../controllers/professorController.js";

const router = express.Router();

router.get("/prof/dashboard", professorDashboard);
router.get("/api/prof/courses", getProfessorCourses);

export default router;