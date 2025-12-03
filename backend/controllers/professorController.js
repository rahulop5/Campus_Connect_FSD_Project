import Course from "../models/Course.js";
import Professor from "../models/Professor.js";

// GET /prof/dashboard
export const professorDashboard = async (req, res) => {
  try {
    const professor = await Professor.findOne({ email: req.user.email });
    if (!professor) {
      return res.status(404).json({ message: "Professor not found" });
    }

    // Fetch only the courses assigned to this professor
    const courses = await Course.find({ professor: professor._id });
    
    const formattedCourses = courses.map(course => ({
      id: course._id,
      name: course.name
        .split(" ")
        .map(word => word[0].toUpperCase())
        .join(""),
      fullName: course.name,
      section: course.section,
      totalclasses: course.totalclasses,
      classeshpnd: course.classeshpnd
    }));

    res.json({
      professor: {
        name: professor.name,
        email: professor.email,
        phone: professor.phone
      },
      courses: formattedCourses
    });
  } catch (error) {
    console.error("Error in professor dashboard:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// GET /api/prof/courses
export const getProfessorCourses = async (req, res) => {
  try {
    const professor = await Professor.findOne({ email: req.user.email });
    if (!professor) {
      return res.status(404).json({ message: "Professor not found" });
    }

    const courses = await Course.find({ professor: professor._id });

    const formattedCourses = courses.map(course => ({
      id: course._id,
      name: course.name
        .split(" ")
        .map(word => word[0].toUpperCase())
        .join(""),
      section: course.section
    }));

    res.json({ courses: formattedCourses });
  } catch (error) {
    console.error("Error fetching professor courses:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

