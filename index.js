import express from "express";
import session from "express-session";
import env from "dotenv";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";


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
passport.use("google", new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    return cb(null, profile);
  }
));

//github strategy
passport.use("github", new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/github/callback"
}, (accessToken, refreshToken, profile, done)=>{
    // console.log(profile);
    return done(null, profile);
}));


app.get("/auth/google", passport.authenticate('google', { scope: ['profile'] }));

app.get("/auth/google/callback", passport.authenticate('google', { failureRedirect: '/' }), (req, res)=>{
    res.redirect("/problemslvfrm");
})

app.get("/logout", (req, res)=>{
    req.logout(function (err) {
        if (err) {
          return next(err);
        }
        res.redirect("/");
    });
});

app.get('/auth/github',passport.authenticate('github', { scope: [ 'user:email' ] }));

app.get("/auth/github/callback", passport.authenticate("github", {
    failureRedirect: "/",
}), (req, res)=>{
    res.redirect("/problemslvfrm");
});


//passport ends


app.get("/", (req, res)=>{
    res.render("home.ejs");
});

app.get("/problemslvfrm", (req, res)=>{
    if(req.isAuthenticated()){
        res.render("Problemslvfrm.ejs");
    }
    else{
        res.redirect("/");
    }
});

app.get("/temp", (req, res)=>{
    res.render("header.ejs");
})

app.listen(process.env.PORT);