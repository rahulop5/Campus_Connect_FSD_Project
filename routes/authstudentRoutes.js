import express from "express";
import {
    googleAuth,
    googleAuthCallback,
    handleGoogleAuthCallback,
    githubAuth,
    githubAuthCallback,
    handleGithubAuthCallback,
    signupStudent,
    registerStudent,
    loginStudent
} from "../controllers/authstudentController.js";

const router = express.Router();

// Google Authentication Routes
router.get("/auth/google", googleAuth);
router.get("/auth/google/callback", googleAuthCallback, handleGoogleAuthCallback);

// GitHub Authentication Routes
router.get("/auth/github", githubAuth);
router.get("/auth/github/callback", githubAuthCallback, handleGithubAuthCallback);

//normal auth
router.post("/auth/signup", signupStudent);
router.post("/auth/register", registerStudent);
router.post("/auth/login", loginStudent);

router.get("/signup", (req, res) => {
    res.render("signup.ejs");
  });
  
router.get("/login", (req, res) => {
  res.render("login.ejs");
});

router.get("/register", (req, res) => {
  res.render("register.ejs");
});

router.get("/rolechooselogin", (req, res) => {
  res.render("verifylogin.ejs");
});

router.get("/rolechoosesignup", (req, res) => {
  res.render("verifysignup.ejs");
});

router.get("/pricing", (req, res) => {
  res.render("pricing.ejs");
});

export default router;

