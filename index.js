import express from "express";
import session from "express-session";
import env from "dotenv";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";


env.config();
const app=express();
app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(session({
    secret: process.env.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000*60*60
    }
}));

//passport auth
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((user, done)=>{
    return done(null, user);
});
passport.deserializeUser((user, done)=>{
    return done(null, user);
});

//google strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    return cb(null, profile);
  }
));

app.get("/auth/google", passport.authenticate('google', { scope: ['profile'] }));

app.get("/auth/google/callback", passport.authenticate('google', { failureRedirect: '/auth/google' }), (req, res)=>{
    res.redirect("/problemslvfrm");
})

app.get("/auth/google/logout", (req, res)=>{
    req.logout(function (err) {
        if (err) {
          return next(err);
        }
        res.redirect("/");
    });
});


//passport ends


app.get("/", (req, res)=>{
    res.render("index.ejs");
});

app.get("/problemslvfrm", (req, res)=>{
    if(req.isAuthenticated()){
        res.render("Problemslvfrm.ejs");
    }
    else{
        res.redirect("/");
    }
});

app.listen(process.env.PORT);