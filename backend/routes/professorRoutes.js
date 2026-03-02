import express from "express";
import {
    professorDashboard,
    getProfessorCourses,
    uploadCSV
} from "../controllers/professorController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import multer from "multer";

const upload = multer({ dest: "uploads/" });

const router = express.Router();

router.use(verifyToken);

router.get("/dashboard", professorDashboard);
router.get("/courses", getProfessorCourses);
router.post("/upload-csv", upload.single("csvFile"), uploadCSV);

export default router;