import Question from "../models/Question.js";
import Student from "../models/Student.js";

export const studentDashboard = async (req, res) => {
  if (req.session.user) {
    try {
      // Fetch the current student from the database (populate the courses)
      const student = await Student.findById(req.session.user._id).populate("courses.course");

      // Map over the student's courses to include course details, attendance percentage, and predicted grade
      const courses = student.courses.map((courseObj) => {
        const course = courseObj.course; // Populated course document

        // Calculate attendance percentage
        const attendancePercentage = courseObj.attendance
          ? Math.round((courseObj.attendance / course.totalclasses) * 100)
          : 0;

        // Return the mapped course object
        return {
          subject: course.name,
          attendancePercentage,
          grade: {
            predgrade: courseObj.grade || "NA", // Default to "NA" if grade is not present
          },
        };
      });
      console.log(courses);
      courses.forEach((course)=>{
        const shortform=course.subject
          .split(" ")
          .map(word => word[0].toUpperCase())
          .join("");
        course.subject=shortform;
      });
      // Get the current date details
      const date = new Date();
      const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayOfWeek = daysOfWeek[date.getDay()];
      const day = date.getDate();
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const month = months[date.getMonth()];
      const year = date.getFullYear();

      // Fetch the latest questions for the dashboard
      const questions = await Question.find().populate("asker").sort({ createdAt: -1 });

      // Render the dashboard with the required data
      res.render("dashboard.ejs", {
        name: student.name,
        courses,
        dayOfWeek,
        day,
        month,
        year,
        questions,
      });
    } catch (error) {
      console.error("Error rendering student dashboard:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.redirect("/");
  }
};

export const studentProfile = async (req, res) => {
  if(req.session.user){
    res.render("profile.ejs", {
      student: req.session.user,
    });
  }
  else{
    res.redirect("/login");
  }
};