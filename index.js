import express from "express";
import env from "dotenv";

env.config();
const app=express();
app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res)=>{
    res.render("index.ejs");
});

app.get("/problemslvfrm", (req, res)=>{
    res.render("Problemslvfrm.ejs");
})

app.listen(process.env.PORT);