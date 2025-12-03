import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import env from "dotenv";
import Student from "../models/Student.js";

env.config();
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
      // JWT strategy logic (if needed in your app)
      done(null, jwtPayload);
    }
  )
);

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/api/auth/student/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if the user exists in the database
        const existingStudent = await Student.findOne({ email: profile.emails[0].value });

        if (existingStudent) {
          // User exists -> Login case
          console.log(existingStudent);
          return done(null, existingStudent);
        } else {
          // User doesn't exist -> Signup case
          const user = {
            name: profile.displayName,
            email: profile.emails[0].value,
          };
          return done(null, user); // Store in session for /register
        }
      } catch (error) {
        console.error("Error during Google authentication:", error);
        return done(error, null);
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
      callbackURL: "http://localhost:3000/api/auth/student/github/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let email = null;

        // Check if the email is available in the profile
        if (profile.emails && profile.emails.length > 0) {
          email = profile.emails[0].value; // Get the first email
        } else {
          // If email is not directly available, fetch it from GitHub API
          const response = await fetch("https://api.github.com/user/emails", {
            headers: {
              Authorization: `token ${accessToken}`,
              "User-Agent": "CampusConnect",
            },
          });
          const emails = await response.json();
          email = emails.find((email) => email.primary).email;
        }

        // Check if the user exists in the database
        const existingStudent = await Student.findOne({ email });

        if (existingStudent) {
          // User exists -> Login case
          return done(null, existingStudent);
        } else {
          // User doesn't exist -> Signup case
          const user = {
            name: profile.displayName || profile.username,
            email: email || null,
          };
          return done(null, user); // Store in session for /register
        }
      } catch (error) {
        console.error("Error during GitHub authentication:", error);
        return done(error, null);
      }
    }
  )
);