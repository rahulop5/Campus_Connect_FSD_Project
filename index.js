import express from "express";
import env from "dotenv";

env.config();
const app=express();

app.get("/", (req, res)=>{
    res.render("index.ejs");
});

app.listen(process.env.PORT);