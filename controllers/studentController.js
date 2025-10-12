import Question from "../models/Question.js";
import Student from "../models/Student.js";
import Course from "../models/Course.js";
import ejs from "ejs";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
// const _dirname = path.dirname(_filename);

 
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
    const student = await Student.findById(req.session.user._id).populate("courses.course");
    console.log("yoyo")
    console.log(student.courses);
    console.log("yoyo")
    res.render("profile.ejs", {
      student: student,
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
      const studentCourses = req.session.user.courses.map((course) => course.course);

      // Fetch all courses the student is enrolled in
      const courses = await Course.find({ _id: { $in: studentCourses } });

      if (!courses || courses.length === 0) {
        return res.status(404).send("No courses found for the student.");
      }

      // Prepare the list of subjects for rendering
      const bellgraphSubjects = courses.map((course) => ({
        courseId: course._id.toString(),
        name: course.name,
      }));
      console.log(bellgraphSubjects);

      // Render the initial page with the first course selected
      res.render("bellgraph.ejs", {
        subject: bellgraphSubjects[0].name,
        bellgraphSubjects: bellgraphSubjects,
        defaultCourseId: bellgraphSubjects[0].courseId,
        userinfo: req.session.user.courses[0]?.grade || "N/A", // Predicted Grade
      });
    } catch (error) {
      console.error("Error fetching student grades:", error);
      res.status(500).send("Internal Server Error.");
    }
  } else {
    res.redirect("/");
  }
};

export const studentGradebyId = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);

    if (!course || !course.gradeDistribution) {
      return res.status(404).json({ error: "No grade distribution data available for this course." });
    }

    // Prepare x (grades) and y (frequencies) data for the graph
    const gradeDistribution = Array.from(course.gradeDistribution.entries()).sort((a, b) => a[0] - b[0]);
    const x = gradeDistribution.map(([grade]) => grade);
    const y = gradeDistribution.map(([, frequency]) => frequency);

    res.json({ x, y });
  } catch (error) {
    console.error("Error fetching bell graph data:", error);
    res.status(500).json({ error: "Internal Server Error." });
  }
};
// Controller function to handle updating the student's profile
export const updateStudentProfile = async (req, res) => {
  if (req.session.user) {
    try {
      const { field, value } = req.body;

      // Update the student's profile in the database using the field and value provided
      const updatedStudent = await Student.findByIdAndUpdate(
        req.session.user._id, 
        { [field]: value }, 
        { new: true } 
      );

      // Update the session user object with the updated student data
      req.session.user = updatedStudent;

      // Send a success response to the client
      res.status(200).send("Profile updated successfully");
    } catch (error) {
      console.error("Error updating student profile:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.status(401).send("Unauthorized");
  }
};



export const studentDashboardPartial = async (req, res) => {
  if (!req.session.user) return res.status(401).send("Unauthorized");

  try {
    const student = await Student.findById(req.session.user._id).populate("courses.course");

    const courses = student.courses.map((courseObj) => {
      const course = courseObj.course;
      const shortform = course.name
        .split(" ")
        .map(w => w[0].toUpperCase())
        .join("");
      return {
        subject: shortform,
        attendancePercentage: courseObj.attendance || 0,
        grade: courseObj.grade || "NA",
      };
    });

    const date = new Date();
    const daysOfWeek = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const months = [
      "January","February","March","April","May","June","July","August","September","October","November","December"
    ];

    const data = {
      name: student.name,
      courses,
      dayOfWeek: daysOfWeek[date.getDay()],
      day: date.getDate(),
      month: months[date.getMonth()],
      year: date.getFullYear(),
      questions: await Question.find().populate("asker").sort({ createdAt: -1 }).limit(3),
    };

      const fullHtml = await ejs.renderFile(
        path.join(__dirname, "../views/dashboard.ejs"),
        data
      );

      const match = fullHtml.match(/<div id="dashboard-container">([\s\S])<\/div>\s<\/body>/);
      const partialHtml = match ? match[1] : fullHtml;

      res.send(partialHtml);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

export const studentAttendancePartial = async (req, res) => {
  if (!req.session.user) return res.status(401).send("Unauthorized");

  try {
    const student = await Student.findById(req.session.user._id).populate("courses.course");

    const courses = student.courses.map((courseObj) => {
      const course = courseObj.course;
      const percentage = courseObj.attendance || 0;

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
        subject: course.name,
        attendancePercentage: percentage,
        attendanceStatus: status,
        attendanceColor: color,
      };
    });

    const html = await ejs.renderFile(
      path.join(__dirname, "../views/attendance.ejs"),
      { name: student.name, courses }
    );

    // Extract only the div content inside <div class="at_mainpage"> ... </div>
    const match = html.match(/<div class="at_mainpage">([\s\S])<\/div>\s<\/body>/);
    const partialHtml = match ? match[0] : html;

    res.send(partialHtml);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

export const studentProfilePartial = async (req, res) => {
  if (!req.session.user) return res.status(401).send("Unauthorized");

  try {
    const student = await Student.findById(req.session.user._id).populate("courses.course");

    const html = await ejs.renderFile(
      path.join(__dirname, "../views/profile.ejs"),
      { student }
    );

    // Extract only the main content (inside <form id="bodbod"> ... </form>)
    const match = html.match(/<form id="bodbod">([\s\S]*?)<\/form>/);
    const partialHtml = match ? match[0] : html;

    res.send(partialHtml);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

export const studentGradesPartial = async (req, res) => {
  if (!req.session.user) return res.status(401).send("Unauthorized");

  try {
    const studentCourses = req.session.user.courses.map(c => c.course);
    const courses = await Course.find({ _id: { $in: studentCourses } });

    const bellgraphSubjects = courses.map(c => ({
      courseId: c._id.toString(),
      name: c.name,
    }));

    const html = await ejs.renderFile(
      path.join(__dirname, "../views/bellgraph.ejs"),
      {
        subject: bellgraphSubjects[0].name,
        bellgraphSubjects,
        defaultCourseId: bellgraphSubjects[0].courseId,
        userinfo: req.session.user.courses[0]?.grade || "N/A",
      }
    );

    // Extract main content container for partial refresh
    const match = html.match(/<div class="bg_mainpage">([\s\S]?)<\/div>\s<\/body>/);
    const partialHtml = match ? match[0] : html;

    res.send(partialHtml);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};






export const changepass = async (req, res) => {
  res.render("changepassword.ejs")
}