import express from "express";
import session from "express-session";
import env from "dotenv";
import passport from "passport";
import connectDB from './config/db.js';
import "./config/passportConfig.js"
import authstudentRoutes from "./routes/authstudentRoutes.js";
import authprofessorRoutes from "./routes/authprofessorRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import qandaforumRoutes from "./routes/qandaforumRoutes.js"

const app=express();
env.config();
connectDB();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/", authstudentRoutes);
app.use("/", authprofessorRoutes);
app.use("/", studentRoutes);
app.use("/", qandaforumRoutes);

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/temp", (req, res)=>{
  res.render("otherauth.ejs");
})

app.get("/temp2", (req, res)=>{
  res.render("otherauthsignup.ejs");
})

app.listen(3000);
