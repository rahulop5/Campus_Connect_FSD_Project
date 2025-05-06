import express from "express";
import {
    studentDashboard,
} from "../controllers/studentController.js";

const router = express.Router();

router.get("/dashboard", studentDashboard);

export default router;