import express from "express";
import session from "express-session";
import env from "dotenv";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import users from "./models/user.js";


env.config();
const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

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

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Serialize and Deserialize User
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

const secretOrKey = process.env.JWT_SECRET;

// Setup JWT Strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey,
    },
    (jwtPayload, done) => {
      const user = users.find((user) => user.id === jwtPayload.id);
      if (user) return done(null, user);
      else return done(null, false);
    }
  )
);

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    (accessToken, refreshToken, profile, cb) => cb(null, profile)
  )
);

// GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/github/callback",
    },
    (accessToken, refreshToken, profile, done) => done(null, profile)
  )
);

// Signup route with password hashing and JWT creation
app.post("/auth/signup", async (req, res) => {
  const { name, email, password, confirm_password } = req.body;

  if (password !== confirm_password) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  const existingUser = users.find((user) => user.email === email);
  if (existingUser) {
    return res.status(400).json({ message: "Email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: users.length + 1,
    name,
    email,
    password: hashedPassword,
  };
  req.session.user=newUser;
  const payload = { id: newUser.id, email: newUser.email };
  const token = jwt.sign(payload, secretOrKey, { expiresIn: "1h" });

  res.redirect("/register");
});

app.post("/auth/register", (req, res) => {
    const { roll, section, phone } = req.body;
    
    // Extract year and branch from roll number
    const year = parseInt(roll.substring(1, 5)); // Extract year part from the roll number
    const currentYear = new Date().getFullYear();
    const ugYear = currentYear - year; // Derive UG year (assuming a 4-year course)

    // Extract branch code from roll number
    const branchCode = roll.charAt(7);
    let branch;
    switch (branchCode) {
        case '1':
            branch = "CSE";
            break;
        case '2':
            branch = "ECE";
            break;
        case '3':
            branch = "AIDS";
            break;
        default:
            branch = "Unknown";
    }

    // Create user object
    const newUser = {
        phone,
        details: {
            roll,
            section,
            branch,
            ug: ugYear.toString()
        },
        courses: {},
        notifications: []
    };
    req.session.user={
        ...req.session.user,
        ...newUser
    }

    users.push(req.session.user);
    console.log(users);
    res.redirect("/dashboard");
});

// Login route with JWT token generation
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find((u) => u.email === email);
  req.session.user=user;
  if (!user) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  // Create JWT token
  const payload = { id: user.id, email: user.email };
  const token = jwt.sign(payload, secretOrKey, { expiresIn: "1h" });

    res.redirect("/dashboard");
});

// Protected route with JWT verification
app.get(
  "/protected",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json({ message: "This is a protected route", user: req.user });
  }
);

// Google and GitHub Auth routes
app.get("/auth/google", passport.authenticate("google", { scope: ["profile"] }));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/problemslvfrm");
  }
);

app.get("/auth/github", passport.authenticate("github", { scope: ["user:email"] }));

app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/problemslvfrm");
  }
);

// Logout
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

// Other routes
app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/signup", (req, res)=>{
    res.render("signup.ejs");
});

app.get("/login", (req, res)=>{
    res.render("login.ejs");
});

app.get("/register", (req, res)=>{
    res.render("register.ejs");
});

app.get("/dashboard", (req, res)=>{
    res.render("dashboard.ejs", {
        name: req.session.user.name,
    });
});

app.get("/problemslvfrm", (req, res) => {
  if (req.isAuthenticated() || true) {
    res.render("Problemslvfrm.ejs");
  } else {
    res.redirect("/");
  }
});

app.listen(process.env.PORT);
