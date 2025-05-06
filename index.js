import express from "express";
import session from "express-session";
import env from "dotenv";
import passport from "passport";
import connectDB from './config/db.js';
import "./config/passportConfig.js"
import authRoutes from "./routes/authRoutes.js"

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

app.use("/", authRoutes);

app.get("/", (req, res) => {
  res.render("home.ejs");
});


app.listen(3000);
