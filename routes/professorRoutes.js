import express from "express";
import {
    professorDashboard,
    csvformSubmit
} from "../controllers/professorController.js";

const router = express.Router();

router.get("/prof/dashboard", professorDashboard);

export default router;