import Course from "../models/Course.js";
import Professor from "../models/Professor.js";
import Student from "../models/Student.js";
import fs from "fs";
import csv from "csv-parser";

// GET /prof/dashboard
export const professorDashboard = async (req, res) => {
  try {
    const professor = await Professor.findOne({ userId: req.user.id }).populate("userId", "name email phone");
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
        name: professor.userId?.name,
        email: professor.userId?.email,
        phone: professor.userId?.phone
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
    const professor = await Professor.findOne({ userId: req.user.id });
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

export const uploadCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const { courseId, uploadType } = req.body;
  
  if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
  }

  const results = [];
  const filePath = req.file.path;

  try {
      fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          fs.unlinkSync(filePath); // Delete file after processing
          
          let updatedCount = 0;
          const errors = [];

          const instituteId = req.user.instituteId;

          // Helper to get value case-insensitively
          const getValue = (row, keyPattern) => {
            const key = Object.keys(row).find(k => k.toLowerCase().includes(keyPattern.toLowerCase()));
            return key ? row[key] : null;
          };

          for (const row of results) {
            const rollNumber = getValue(row, "Roll Number") || getValue(row, "RollNumber");
            
            if (!rollNumber) continue;

            const student = await Student.findOne({ 
                rollnumber: rollNumber,
                instituteId: instituteId 
            });

            if (!student) {
                errors.push(`Student with roll number ${rollNumber} not found`);
                continue;
            }

            // Check if student has the course
            const courseIndex = student.courses.findIndex(c => c.course.toString() === courseId);
            
            if (courseIndex === -1) {
                errors.push(`Student ${rollNumber} is not enrolled in this course`);
                continue;
            }

            if (uploadType === 'marks') {
                const marksVal = getValue(row, "Marks");
                if (marksVal) {
                    const marks = parseFloat(marksVal);
                    if (!isNaN(marks)) {
                        student.courses[courseIndex].grade = marks;
                        updatedCount++;
                    }
                }
            } else if (uploadType === 'attendance') {
                const attendedVal = getValue(row, "Attended");
                 if (attendedVal) {
                    const attended = parseFloat(attendedVal);
                     if (!isNaN(attended)) {
                        student.courses[courseIndex].attendance = attended;
                        updatedCount++;
                    }
                }
            }
            
            await student.save();
          }

          if (updatedCount === 0 && errors.length > 0) {
              return res.status(400).json({ message: "Failed to update any records", errors });
          }

          res.json({ 
              message: `Successfully updated ${updatedCount} students.`,
              errors: errors.length > 0 ? errors : undefined
          });

        } catch (err) {
          console.error("Error processing CSV data:", err);
          res.status(500).json({ message: "Error processing CSV data" });
        }
      });
  } catch (error) {
    console.error("Error opening CSV file:", error);
    res.status(500).json({ message: "Error opening CSV file" });
  }
};

