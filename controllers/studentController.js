import Question from "../models/Question.js";
import Student from "../models/Student.js";
import Course from "../models/Course.js";

export const studentDashboard = async (req, res) => {
  if (req.session.user) {
    try {
      // Fetch the current student from the database (populate the courses)
      const student = await Student.findById(req.session.user._id).populate("courses.course");

      const courses = student.courses.map((courseObj) => {
        const course = courseObj.course; // Populated course document

        const attendancePercentage = courseObj.attendance
          ? courseObj.attendance
          : 0;

        return {
          subject: course.name,
          attendancePercentage,
          grade: {
            predgrade: courseObj.grade || "NA", // Default to "NA" if grade is not present
          },
        };
      });
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

export const studentAttendance = async (req, res) => {
  if (req.session.user) {
    try {
      // Fetch the student from the database and populate the courses
      const student = await Student.findById(req.session.user._id).populate("courses.course");

      // Map over the student's courses to calculate attendance details
      const courses = student.courses.map((courseObj) => {
        const course = courseObj.course; // Populated course document
        console.log(courseObj);
        const percentage = courseObj.attendance
          ? courseObj.attendance
          : "0.00";

        let status = "";
        let color = "";

        if (percentage >= 90) {
          status = "Good";
          color = "green";
        } else if (percentage >= 80) {
          status = "Average";
          color = "yellow";
        } else {
          status = "Poor";
          color = "red";
        }

        return {
          subject: course.name, // Course name
          attendancePercentage: percentage,
          attendanceStatus: status,
          attendanceColor: color,
        };
      });

      res.render("attendance.ejs", {
        name: student.name,
        courses: courses,
      });
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.redirect("/");
  }
};

export const studentGrades = async (req, res) => {
  if (req.session.user) {
    try {
      const courseId = req.query.courseId; // Get the course ID from the query string
      console.log(req.query);
      const course = await Course.findById(courseId);

      if (!course || !course.gradeDistribution) {
        return res.status(404).send("No grade distribution data available for this course.");
      }

      const gradeDistribution = Array.from(course.gradeDistribution.entries())
        .sort((a, b) => a[0] - b[0]) // Sort grades in ascending order
        .reduce((acc, [grade, frequency]) => {
          acc.grades.push(grade);
          acc.frequencies.push(frequency);
          return acc;
        }, { grades: [], frequencies: [] });

      res.render("bellgraph.ejs", {
        subject: course.name,
        bellgraphData: JSON.stringify(gradeDistribution.frequencies),
        bellgraphSubjects: [course.name],
        userinfo: req.session.user.courses.find(
          (c) => c.course.toString() === courseId
        )?.grade || "N/A",
      });
    } catch (error) {
      console.error("Error fetching grade distribution:", error);
      res.status(500).send("Internal Server Error.");
    }
  } else {
    res.redirect("/");
  }
};