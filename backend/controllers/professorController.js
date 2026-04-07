import Course from "../models/Course.js";
import Professor from "../models/Professor.js";
import Student from "../models/Student.js";
import fs from "fs";
import csv from "csv-parser";

// Helper function to convert numeric marks to letter grades
const convertMarksToGrade = (marks) => {
  if (marks === null || marks === undefined) return "NA";
  
  const numMarks = parseFloat(marks);
  if (isNaN(numMarks)) return "NA";
  
  if (numMarks >= 85) return "O";      // Outstanding (85-100)
  if (numMarks >= 75) return "A";      // Excellent (75-84)
  if (numMarks >= 65) return "B";      // Good (65-74)
  if (numMarks >= 55) return "C";      // Average (55-64)
  if (numMarks >= 45) return "D";      // Below Average (45-54)
  return "F";                           // Fail (0-44)
};

// Helper to get instituteId from request
const getInstituteId = (req) => {
  return req.user.instituteId;
};

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

    console.log("Professor ID:", professor._id);
    console.log("Institute ID:", professor.instituteId);

    // Find courses assigned to this professor in their institute
    const courses = await Course.find({ 
      professor: professor._id,
      instituteId: professor.instituteId
    });

    console.log("Courses found:", courses.length);
    courses.forEach(c => {
      console.log(`Course: ${c.name}, ID: ${c._id.toString()}`);
    });

    const formattedCourses = courses.map(course => ({
      id: course._id.toString(), // Always use the actual MongoDB ObjectId
      name: course.name,
      section: course.section,
      fullName: course.name
    }));

    console.log("Formatted courses for upload:", formattedCourses);

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

  let { courseId, uploadType } = req.body;
  console.log("=== UPLOAD CSV REQUEST ===");
  console.log("Received courseId:", courseId);
  console.log("CourseId type:", typeof courseId);
  console.log("CourseId length:", courseId?.length);
  
  if (!courseId) {
      return res.status(400).json({ message: "Course ID is required" });
  }

  // IMPORTANT FIX: If courseId looks like a display name (contains "-"), try to find the actual course
  if (courseId.includes("-") || !courseId.match(/^[a-f0-9]{24}$/i)) {
    console.log("CourseId looks like display name, attempting to find actual course");
    const nameParts = courseId.split("-").map(p => p.trim());
    const courseNameSearch = nameParts.slice(1).join(" ").trim();
    const foundCourse = await Course.findOne({
      name: courseNameSearch,
      instituteId: req.user.instituteId
    });
    if (foundCourse) {
      console.log(`Found course by name: ${foundCourse.name} -> ID: ${foundCourse._id.toString()}`);
      courseId = foundCourse._id.toString();
    } else {
      console.log(`Could not find course with name: "${courseNameSearch}"`);
    }
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
          const warnings = [];
          let detectedUploadType = uploadType;
          const gradesList = []; // For grade distribution calculation

          const instituteId = req.user.instituteId;

          // Helper to get value case-insensitively
          const getValue = (row, keyPattern) => {
            const key = Object.keys(row).find(k => k.toLowerCase().includes(keyPattern.toLowerCase()));
            return key ? row[key] : null;
          };

          // Auto-detect upload type from CSV columns if not specified
          if (results.length > 0 && !detectedUploadType) {
            const firstRow = results[0];
            const keys = Object.keys(firstRow).map(k => k.toLowerCase());
            
            if (keys.some(k => k.includes("marks") || k.includes("grade"))) {
              detectedUploadType = 'marks';
              console.log("Detected upload type: marks");
            } else if (keys.some(k => k.includes("attended") || k.includes("attendance"))) {
              detectedUploadType = 'attendance';
              console.log("Detected upload type: attendance");
            } else {
              return res.status(400).json({ 
                message: "Could not determine upload type. Please include 'Marks' or 'Attended' column in your CSV." 
              });
            }
          }

          // Debug: Log institute ID and first row
          console.log("=== CSV UPLOAD DEBUG ===");
          console.log("Institute ID:", instituteId);
          console.log("Course ID:", courseId);
          console.log("First row keys:", results.length > 0 ? Object.keys(results[0]) : "No rows");
          if (results.length > 0) {
            console.log("First row data:", results[0]);
          }

          // Debug: Log ALL students in this institute with their courses
          const allStudentsInInstitute = await Student.find({ instituteId });
          console.log("\n=== ALL STUDENTS IN INSTITUTE ===");
          console.log(`Total students: ${allStudentsInInstitute.length}`);
          allStudentsInInstitute.forEach(student => {
            console.log(`- ${student.rollnumber}: enrolled in courses [${student.courses.map(c => c.course.toString()).join(", ")}]`);
          });
          console.log("=== END STUDENT LIST ===\n");

          // Process each row
          for (let rowIndex = 0; rowIndex < results.length; rowIndex++) {
            const row = results[rowIndex];
            const rowNum = rowIndex + 2; // Add 2 because row 1 is header
            
            const rollNumber = getValue(row, "Roll Number") || getValue(row, "RollNumber");
            console.log(`Row ${rowNum}: rollNumber="${rollNumber}"`);
            
            if (!rollNumber) {
              warnings.push(`Row ${rowNum}: Missing roll number, skipped`);
              continue;
            }

            const student = await Student.findOne({ 
                rollnumber: rollNumber.toString().trim(),
                instituteId: instituteId 
            });
            
            console.log(`Row ${rowNum}: Found student?`, !!student);
            
            if (!student) {
              errors.push(`Row ${rowNum}: Student with roll number "${rollNumber}" not found in your institute`);
              continue;
            }

            // Debug: Log student's courses for this row
            console.log(`Row ${rowNum}: Student ${rollNumber} courses:`, student.courses.map(c => ({
              courseId: c.course.toString(),
              grade: c.grade,
              attendance: c.attendance
            })));
            console.log(`Row ${rowNum}: Looking for courseId: "${courseId}"`);

            // Check if student has the course
            const courseIndex = student.courses.findIndex(c => c.course.toString() === courseId);
            console.log(`Row ${rowNum}: Course found at index:`, courseIndex);
            console.log(`Row ${rowNum}: Comparison:`, student.courses.map(c => ({
              studentCourseId: c.course.toString(),
              matches: c.course.toString() === courseId
            })));
            
            if (courseIndex === -1) {
                errors.push(`Row ${rowNum}: Student ${rollNumber} is not enrolled in the selected course`);
                continue;
            }

            let updated = false;

            if (detectedUploadType === 'marks') {
                const marksVal = getValue(row, "Marks") || getValue(row, "Grade");
                
                if (!marksVal) {
                  warnings.push(`Row ${rowNum}: Student ${rollNumber} has no marks value, skipped`);
                  continue;
                }

                const marks = parseFloat(marksVal);
                
                if (isNaN(marks)) {
                    errors.push(`Row ${rowNum}: Student ${rollNumber} has invalid marks "${marksVal}" (must be numeric)`);
                    continue;
                }

                // Convert numeric marks to letter grade
                const letterGrade = convertMarksToGrade(marks);
                console.log(`Row ${rowNum}: Marks ${marks} -> Grade ${letterGrade}`);
                
                student.courses[courseIndex].grade = letterGrade;
                gradesList.push(marks); // Store numeric marks for distribution calculation
                updated = true;
                updatedCount++;
                
            } else if (detectedUploadType === 'attendance') {
                const attendedVal = getValue(row, "Attended") || getValue(row, "Attendance");
                
                if (!attendedVal) {
                  warnings.push(`Row ${rowNum}: Student ${rollNumber} has no attendance value, skipped`);
                  continue;
                }

                const attended = parseFloat(attendedVal);
                
                if (isNaN(attended)) {
                    errors.push(`Row ${rowNum}: Student ${rollNumber} has invalid attendance "${attendedVal}" (must be numeric)`);
                    continue;
                }

                student.courses[courseIndex].attendance = attended;
                updated = true;
                updatedCount++;
            }
            
            if (updated) {
              await student.save();
            }
          }

          // Update grade distribution if marks were uploaded
          if (detectedUploadType === 'marks' && gradesList.length > 0) {
            try {
              const course = await Course.findById(courseId);
              if (course) {
                // Create numeric marks distribution for bell curve visualization
                const gradeDistribution = gradesList.reduce((acc, marks) => {
                  const rounded = Math.round(marks).toString();
                  acc[rounded] = (acc[rounded] || 0) + 1;
                  return acc;
                }, {});
                course.gradeDistribution = gradeDistribution;
                await course.save();
                console.log("Numeric marks distribution updated:", gradeDistribution);
              }
            } catch (err) {
              console.error("Error updating grade distribution:", err);
              warnings.push("Grade distribution could not be updated (non-critical)");
            }
          }

          // Prepare response
          const response = {
              message: updatedCount > 0 
                ? `Successfully updated ${updatedCount} students with ${detectedUploadType}. Numeric marks have been converted to letter grades (O, A, B, C, D, F).`
                : "No students were updated. Please check errors below.",
              type: detectedUploadType,
              count: updatedCount,
              total: results.length,
              success: updatedCount > 0
          };

          if (errors.length > 0) {
            response.errors = errors;
            response.errorCount = errors.length;
          }

          if (warnings.length > 0) {
            response.warnings = warnings;
            response.warningCount = warnings.length;
          }

          res.json(response);

        } catch (err) {
          console.error("Error processing CSV data:", err);
          res.status(500).json({ message: "Error processing CSV data", error: err.message });
        }
      });
  } catch (error) {
    console.error("Error opening CSV file:", error);
    res.status(500).json({ message: "Error opening CSV file", error: error.message });
  }
};

