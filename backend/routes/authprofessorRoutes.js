import express from "express";
import {
    professorLogin,
    professorSignup
} from "../controllers/authprofessorController.js"

const router = express.Router();

router.get("/auth/prof/signup", (req, res)=>{
    res.render("otherauthsignup.ejs", {
        role: "prof",
    });
});

router.get("/auth/prof/login", (req, res)=>{
    res.render("otherauthlogin.ejs", {
        role: "prof",
    });
});

router.post("/auth/prof/signup", professorSignup);
router.post("/auth/prof/login", professorLogin);

export default router;