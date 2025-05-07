import Course from "../models/Course.js";

export const professorDashboard = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/auth/prof/login");
    }

    const professorId = req.session.user._id;

    // Fetch only the courses assigned to this professor
    const courses = await Course.find({ professor: professorId });

    // Pass the professor details and the assigned courses to the template
    res.render("profdashboard.ejs", {
      professor: req.session.user,
      courses,
    });
  } catch (error) {
    console.error("Error rendering professor dashboard:", error);
    res.status(500).send("Internal Server Error");
  }
};