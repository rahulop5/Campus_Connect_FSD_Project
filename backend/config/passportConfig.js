import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import env from "dotenv";
import User from "../models/User.js";

env.config();
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch(err) {
        done(err, null);
    }
});

const secretOrKey = process.env.JWT_SECRET;

// Setup JWT Strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey,
    },
    (jwtPayload, done) => {
       // Check expiration etc if needed, but passport-jwt handles basic verification
       // We can just pass the payload
      return done(null, jwtPayload);
    }
  )
);

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if the user exists
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
            // User exists, log them in
            return done(null, user);
        } else {
            // New user - Create basic User account
            // They will need to select/join an institute later
            user = new User({
                name: profile.displayName,
                email: profile.emails[0].value,
                password: "", // No password for OAuth users (or set a random one)
                role: 'user', // Default role until they join an institute
                verificationStatus: 'none'
            });
            await user.save();
            return done(null, user);
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
      callbackURL: "/api/auth/github/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let email = null;

        if (profile.emails && profile.emails.length > 0) {
          email = profile.emails[0].value;
        } else {
          try {
              const response = await fetch("https://api.github.com/user/emails", {
                headers: {
                  Authorization: `token ${accessToken}`,
                  "User-Agent": "CampusConnect",
                },
              });
              const emails = await response.json();
              const primary = emails.find((email) => email.primary);
              email = primary ? primary.email : null;
          } catch (e) {
              console.error("Error fetching GitHub emails:", e);
          }
        }

        if (!email) {
            return done(new Error("No email found for GitHub user"), null);
        }

        let user = await User.findOne({ email });

        if (user) {
            return done(null, user);
        } else {
            user = new User({
                name: profile.displayName || profile.username,
                email: email,
                password: "",
                role: 'user',
                verificationStatus: 'none'
            });
            await user.save();
            return done(null, user);
        }
      } catch (error) {
        console.error("Error during GitHub authentication:", error);
        return done(error, null);
      }
    }
  )
);