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
import bellgraph from "./models/bellgraph.js";
import questions from "./models/question.js";
import sqlite3 from 'sqlite3';
sqlite3.verbose();

const db = new sqlite3.Database('./bellgraph.db');

// // Create the bellgraph table (if it doesn't exist) and insert sample data
// db.serialize(() => {
//   db.run(`
//     CREATE TABLE IF NOT EXISTS bellgraph (
//       subject TEXT PRIMARY KEY,
//       range1 INTEGER,
//       range2 INTEGER,
//       range3 INTEGER,
//       range4 INTEGER,
//       range5 INTEGER,
//       range6 INTEGER,
//       range7 INTEGER,
//       range8 INTEGER
//     )
//   `);

//   db.run(`
//     INSERT OR IGNORE INTO bellgraph (subject, range1, range2, range3, range4, range5, range6, range7, range8) VALUES
//     ('AI', 5, 10, 15, 25, 35, 50, 60, 65),
//     ('CCN', 40, 35, 30, 25, 20, 15, 10, 5),
//     ('FFSD', 20, 30, 50, 70, 65, 40, 25, 15),
//     ('TOC', 10, 20, 40, 55, 50, 45, 30, 20),
//     ('ACS', 60, 55, 45, 35, 25, 15, 10, 5)
//   `);
// });

env.config();
const app = express();
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
    (accessToken, refreshToken, profile, done) => {
      // console.log(profile)
      let user = users.find((u) => u.email === profile.emails[0].value);
      if (user) {
        return done(null, user);
      } else {
        // If user doesn't exist, treat it as a signup
        const newUser = {
          id: users.length + 1,
          name: profile.displayName,
          email: profile.emails[0].value,
          password: null,
        };
        // console.log(users);
        return done(null, newUser);
      }
    }
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
    async (accessToken, refreshToken, profile, done) => {
      let email = null;
      if (profile.emails && profile.emails.length > 0) {
        email = profile.emails[0].value; // Get the first email
      } else {
        const response = await fetch("https://api.github.com/user/emails", {
          headers: {
            Authorization: `token ${accessToken}`,
            "User-Agent": "CampusConnect",
          },
        });
        const emails = await response.json();
        email = emails.find((email) => email.primary).email;
      }

      let user = users.find((u) => u.email === email);
      if (user) {
        return done(null, user);
      } else {
        const newUser = {
          id: users.length + 1,
          name: profile.displayName || profile.username,
          email: email || null,
          password: null,
        };
        return done(null, newUser);
      }
    }
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
  req.session.user = newUser;
  const payload = { id: newUser.id, email: newUser.email };
  const token = jwt.sign(payload, secretOrKey, { expiresIn: "1h" });

  res.redirect("/register");
});

app.post("/auth/register", (req, res) => {
  const { roll, section, phone } = req.body;
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
    courses: [
      {
          subject: "AI",
          attendance: {
              totalclasses: 40,
              classesheld: 36,
              classesattended: 32
          },
          grade: {
              allotedcredits: 4,
              marks: 88,
              predgrade: "O"
          }
      },
      {
          subject: "CCN",
          attendance: {
              totalclasses: 40,
              classesheld: 36,
              classesattended: 34
          },
          grade: {
              allotedcredits: 4,
              marks: 88,
              predgrade: "O"
          }
      },
      {
          subject: "FFSD",
          attendance: {
              totalclasses: 40,
              classesheld: 36,
              classesattended: 30
          },
          grade: {
              allotedcredits: 4,
              marks: 88,
              predgrade: "O"
          }
      },
      {
          subject: "TOC",
          attendance: {
              totalclasses: 40,
              classesheld: 36,
              classesattended: 35
          },
          grade: {
              allotedcredits: 4,
              marks: 88,
              predgrade: "O"
          }
      },
      {  
          subject: "ACS",
          attendance: {
              totalclasses: 40,
              classesheld: 36,
              classesattended: 31
          },
          grade: {
              allotedcredits: 4,
              marks: 88,
              predgrade: "O"
          }
      }
      ],
    notifications : ["Abhiram replied to ur question", "saitej is black"],
  };
  req.session.user = {
    ...req.session.user,
    ...newUser
  }

  users.push(req.session.user);
  res.redirect("/dashboard");
});

// Login route with JWT token generation
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email === email);
  if (!user) {
    return res.status(400).json({ message: "Invalid email or password" });
  }
  req.session.user = user;

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
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    const user = req.session.passport.user;
    req.session.user = user;
    if (user && user.details && user.details.roll) {
      res.redirect("/dashboard");
    } else {
      res.redirect("/register");
    }
  }
);

app.get("/auth/github", passport.authenticate("github", { scope: ["user:email"] }));

app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/" }),
  (req, res) => {
    const user = req.session.passport.user;
    req.session.user = user;
    if (user && user.details && user.details.roll) {
      res.redirect("/dashboard");
    } else {
      res.redirect("/register");
    }
  }
);

// Logout

// Other routes
app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/signup", (req, res) => {
  res.render("signup.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/dashboard", (req, res) => {
  if (req.session.user) {
    const courses = req.session.user.courses.map(course => {
      const attendancePercentage = Math.round((course.attendance.classesattended / course.attendance.classesheld) * 100);

      return {
        ...course,
        attendancePercentage
      };
    });

    const date = new Date();
    
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = daysOfWeek[date.getDay()];

    const day = date.getDate();

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    res.render("dashboard.ejs", {
      name: req.session.user.name,
      courses: courses,
      dayOfWeek: dayOfWeek,
      day: day,
      month: month,
      year: year,
      questions: questions
    });
  } else {
    res.redirect("/");
  }
});


app.get("/problemslvfrm", (req, res) => {
  if (req.session.user) {
    res.render("Problemslvfrm.ejs", {
      questions: questions
    });
  } else {
    res.redirect("/");
  }
});

app.get("/problemopen/:id", (req, res)=>{
  if(req.session.user){
    const questionId = req.params.id;
    const question = questions.find(q => q.id == questionId);
    if (question) {
      res.render("Problemopen.ejs", {
        question: question
      });
    } else {
      res.status(404).send("Question not found");
    }
  }
  else{
    res.redirect("/");
  }
});

app.post('/upvote-question', (req, res) => {
  const questionId = req.body.id;

  const question = questions.find(q => q.id === questionId);
  if (question) {
    question.votes += 1;
    res.json({ votes: question.votes });
  } else {
    res.status(404).send('Question not found');
  }
});

app.post('/downvote-question', (req, res) => {
  const questionId = req.body.id;

  const question = questions.find((q) => q.id === questionId);
  if (question) {
    question.votes -= 1;
    res.json({ votes: question.votes });
  } else {
    res.status(404).send('Question not found');
  }
});

app.post('/upvote-answer', (req, res) => {
  const { questionId, answerId } = req.body;

  const question = questions.find(q => q.id === questionId);
  const answer = question.answers.find(a => a.answerer === answerId);
  if (answer) {
    answer.votes += 1;
    res.json({ votes: answer.votes });
  } else {
    res.status(404).send('Answer not found');
  }
});


app.post('/downvote-answer', (req, res) => {
  const { questionId, answerId } = req.body;

  const question = questions.find(q => q.id === questionId);
  const answer = question.answers.find(a => a.answerer === answerId);
  if (answer) {
    answer.votes -= 1;
    res.json({ votes: answer.votes });
  } else {
    res.status(404).send('Answer not found');
  }
});

app.post('/submit-answer', (req, res) => {
  const { answerText } = req.body;
  const questionId=req.body.questionId.toString();

  // Find the question by id
  const question = questions.find(q => q.id === questionId);
  if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
  }

  // Create a new answer object
  const newAnswer = {
      desc: answerText,
      votes: 0,
      answerer: Date.now().toString()  // Temporary unique ID for the answerer (you could use the logged-in user's ID)
  };

  // Add the new answer to the question
  question.answers.push(newAnswer);

  // Respond with success and return the new answer details
  res.json({
      success: true,
      questionId: question.id,
      answerId: newAnswer.answerer,  // Assuming answerer is unique
      answerText: newAnswer.desc
  });
});


app.get("/attendance", (req, res) => {
  if(req.session.user){
    const courses = req.session.user.courses.map(course => {
      const percentage = ((course.attendance.classesattended / course.attendance.classesheld) * 100).toFixed(2);
      let status = '';
      let color = '';
  
      if (percentage >= 90) {
        status = 'Good';
        color = 'green';
      } else if (percentage >= 80) {
        status = 'Average';
        color = 'yellow';
      } else {
        status = 'Poor';
        color = 'red';
      }
      return {
        ...course,
        attendancePercentage: percentage,
        attendanceStatus: status,
        attendanceColor: color
      };
    });
    res.render("attendance.ejs", {
      name: req.session.user.name,
      courses: courses,
    });
  }
  else{
    res.redirect("/");
  }
});

app.get("/bellgraph", (req, res) => {
  if (req.session.user) {
    const defaultSubject = "AI";

    // Query to fetch all bellgraph data
    db.all("SELECT * FROM bellgraph", (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Database error");
      }

      // Construct the bellgraph object dynamically from the database rows
      const bellgraph = {};
      rows.forEach(row => {
        bellgraph[row.subject] = [
          row.range1, row.range2, row.range3, row.range4,
          row.range5, row.range6, row.range7, row.range8
        ];
      });

      // Prepare the bellgraph data for the default subject
      const bellgraphData = bellgraph[defaultSubject];

      res.render("bellgraph.ejs", {
        subject: defaultSubject,
        bellgraphData: JSON.stringify(bellgraph), // Stringify bellgraph for frontend
        bellgraphSubjects: Object.keys(bellgraph), // All subjects
        userinfo: req.session.user.courses[0].grade.predgrade
      });
    });
  } else {
    res.redirect("/");
  }
});


app.get("/ask", (req, res)=>{
  if(req.session.user){
    res.render("askquestion.ejs", {
      name: req.session.user.name, 
    });
  }
  else{
    res.redirect("/");
  }
})

app.post("/ask", (req, res) => {
  if (req.session.user) {
    const { title, desc, tags } = req.body;
    const newId = (questions.length + 1).toString();
    const date = new Date();
    const formattedDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;

    const tagsArray = tags.split(",").map(tag => tag.trim());
    const newQuestion = {
      id: newId,
      heading: title,
      desc: desc,
      votes: 0,
      tags: tagsArray,
      asker: req.session.user.id, 
      time: formattedDate,
      wealth: 0,
      views: 0,
      answers: []
    };
    questions.push(newQuestion);
    res.redirect("/problemslvfrm"); 
  } else {
    res.redirect("/");
  }
});

app.get("/profile", (req, res)=>{
  res.render("profile.ejs");
});

app.get("/admindash", (req, res)=>{
  if(req.session.user){
    res.render("admindashboard.ejs");
  }
  else{
    res.redirect("/");
  }
});

app.listen(process.env.PORT);
