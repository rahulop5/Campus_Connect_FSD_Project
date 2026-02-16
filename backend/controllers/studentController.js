import Question from "../models/Question.js";
import Student from "../models/Student.js";
import Course from "../models/Course.js";
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const studentDashboard = async (req, res) => {
  try {
    const studentId = req.user.email ? (await Student.findOne({email: req.user.email}))._id : req.user._id;
    // Or better, if JWT has ID, use that. Assuming JWT has email, let's find user.
    // Actually, getMe or middleware could attach full user, but middleware attaches payload.
    // Let's assume payload has email.
    
    const student = await Student.findOne({ email: req.user.email }).populate("courses.course");
    if (!student) return res.status(404).json({ message: "Student not found" });

    const courses = student.courses.map((courseObj) => {
      const course = courseObj.course;
      const attendancePercentage = courseObj.attendance ? courseObj.attendance : 0;

      return {
        subject: course.name,
        attendancePercentage,
        grade: {
          predgrade: courseObj.grade || "NA",
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

    const date = new Date();
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayOfWeek = daysOfWeek[date.getDay()];
    const day = date.getDate();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    const questions = await Question.find({ instituteId: req.user.instituteId }).populate("asker").sort({ createdAt: -1 });

    res.json({
      name: student.name,
      courses,
      dayOfWeek,
      day,
      month,
      year,
      questions,
    });
    
  } catch (error) {
    console.error("Error in student dashboard:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const studentProfile = async (req, res) => {
    try {
        const student = await Student.findOne({ email: req.user.email }).populate("courses.course");
        if (!student) return res.status(404).json({ message: "Student not found" });
        res.json({ student });
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const studentAttendance = async (req, res) => {
    try {
      const student = await Student.findOne({ email: req.user.email }).populate("courses.course");
      if (!student) return res.status(404).json({ message: "Student not found" });

      const courses = student.courses.map((courseObj) => {
        const course = courseObj.course;
        const percentage = courseObj.attendance ? courseObj.attendance : 0;
        
        // Calculate attended and total classes from percentage
        // Assuming each course has approximately 30 total classes per semester
        const totalClasses = courseObj.totalClasses || 30;
        const attendedClasses = Math.round((percentage / 100) * totalClasses);

        let status = "";
        let color = "";

        if (percentage >= 80) {
          status = "Good";
          color = "green";
        } else if (percentage >= 75) {
          status = "At Risk";
          color = "yellow";
        } else {
          status = "Critical";
          color = "red";
        }

        return {
          subject: course.name,
          attendancePercentage: percentage,
          attendanceStatus: status,
          attendanceColor: color,
          attendedClasses: attendedClasses,
          totalClasses: totalClasses,
        };
      });
      res.json({
        name: student.name,
        courses: courses,
      });
      
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
};

export const studentGrades = async (req, res) => {
  try {
    const student = await Student.findOne({ email: req.user.email });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const studentCourses = student.courses.map((c) => c.course);
    const courses = await Course.find({ _id: { $in: studentCourses } });

    if (!courses || courses.length === 0)
      return res.status(404).json({ message: "No courses found" });

    const bellgraphSubjects = courses.map((course) => ({
      courseId: course._id.toString(),
      name: course.name,
      totalclasses: course.totalclasses,
      credits: course.credits,
      classescompleted: course.classeshpnd
    }));

    res.json({
      bellgraphSubjects,
      defaultCourseId: bellgraphSubjects[0].courseId,
      userinfo: student.courses[0]?.grade || "N/A",
    });
  } catch (error) {
    console.error("Error loading grades:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const studentGradebyId = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);

    if (!course || !course.gradeDistribution)
      return res.status(404).json({ error: "No grade distribution data" });

    const gradeDistribution = Array.from(course.gradeDistribution.entries()).sort(
      (a, b) => a[0] - b[0]
    );

    const x = gradeDistribution.map(([grade]) => grade);
    const y = gradeDistribution.map(([, freq]) => freq);

    res.json({ x, y });
  } catch (error) {
    console.error("Error fetching bell graph data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateStudentProfile = async (req, res) => {
    try {
      const { field, value } = req.body;
      const student = await Student.findOne({ email: req.user.email });
      if (!student) return res.status(404).json({ message: "Student not found" });

      const updatedStudent = await Student.findByIdAndUpdate(
        student._id, 
        { [field]: value }, 
        { new: true } 
      );

      res.status(200).json({ message: "Profile updated successfully", user: updatedStudent });
    } catch (error) {
      console.error("Error updating student profile:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
};

export const changepass = async (req, res) => {
    // This should probably be a POST request to update password, not GET
    // But keeping it as is for now, just returning message
    return res.json({ message: "Use POST /update-password to change password" });
}

export const uploadProfilePic = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const student = await Student.findOne({ email: req.user.email });
      if (!student) return res.status(404).json({ message: "Student not found" });

      // Update student's profile picture path in database
      const profilePicPath = `/assets/profiles/${req.file.filename}`;
      student.profilePicture = profilePicPath;
      await student.save();

      res.status(200).json({ 
        message: "Profile picture uploaded successfully", 
        profilePicture: profilePicPath 
      });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
};

export const deleteProfilePic = async (req, res) => {
    try {
      const student = await Student.findOne({ email: req.user.email });
      if (!student) return res.status(404).json({ message: "Student not found" });

      // Delete the file if it exists
      if (student.profilePicture && student.profilePicture !== "") {
        const email = req.user.email;
        const safeEmail = email.replace(/[@.]/g, '_');
        const profilesDir = path.join(__dirname, '../public/assets/profiles');
        
        // Find and delete any file that starts with the user's email
        const files = fs.readdirSync(profilesDir);
        files.forEach(file => {
          if (file.startsWith(safeEmail)) {
            fs.unlinkSync(path.join(profilesDir, file));
          }
        });
      }

      // Reset to default profile picture
      student.profilePicture = "";
      await student.save();

      res.status(200).json({ message: "Profile picture deleted successfully" });
    } catch (error) {
      console.error("Error deleting profile picture:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
};
