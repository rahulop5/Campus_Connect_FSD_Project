import Question from "../models/Question.js";

export const studentDashboard = async (req, res) => {
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
    const questions = await Question.find().populate("asker").sort({ createdAt: -1 });

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
};