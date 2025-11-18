import express from "express";
import { adminSignup, adminLogin } from "../controllers/authadminController.js";

const router = express.Router();

router.get("/auth/admin/signup", (req, res) => {
  res.render("otherauthsignup.ejs", { role: "admin" });
});

router.get("/auth/admin/login", (req, res) => {
  res.render("otherauthlogin.ejs", { role: "admin" });
});

router.post("/auth/admin/signup", adminSignup);
router.post("/auth/admin/login", adminLogin);

export default router;