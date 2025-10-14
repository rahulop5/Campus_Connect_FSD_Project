import express from "express";
import { adminDashboard, adminDetails } from "../controllers/adminController.js";

const router = express.Router();

router.get("/admin/dashboard", adminDashboard);
router.post("/admin/dashboard", adminDashboard);
router.get("/admin/details", adminDetails);

export default router;