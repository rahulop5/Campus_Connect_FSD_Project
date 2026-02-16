import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { 
  getAllInstitutes, 
  createInstitute, 
  joinInstitute, 
  getPendingVerifications, 
  verifyUser 
} from "../controllers/instituteController.js";

const router = express.Router();

// Public route
router.get("/", getAllInstitutes);

// Protected routes
router.post("/create", verifyToken, createInstitute);
router.post("/join", verifyToken, joinInstitute);
router.get("/pending", verifyToken, getPendingVerifications);
router.post("/verify", verifyToken, verifyUser);

export default router;
