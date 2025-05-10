import express from "express";
import { adminDashboard } from "../controllers/adminController.js";

const router = express.Router();

router.get("/admin/dashboard", adminDashboard);
router.post("/admin/dashboard", adminDashboard);

export default router;