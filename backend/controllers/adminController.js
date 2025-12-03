import mongoose from "mongoose";
import Course from "../models/Course.js";
import Professor from "../models/Professor.js";
import Student from "../models/Student.js";
import bcrypt from "bcryptjs";

export const getDashboardData = async (req, res) => {
  try {
    const courses = await Course.find().populate("professor");
    const professors = await Professor.find().populate({ path: "courses.course", select: "name section" });
    const students = await Student.find().populate({ path: "courses.course", select: "name section" }).select(
      "name email rollnumber phone section courses"
    );

    res.json({
      courses,
      professors,
      students
    });
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const addCourse = async (req, res) => {
  try {
    const { name, section, totalclasses, credits, professor } = req.body;

    if (!name || !section || !totalclasses || !credits || !professor) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const existingCourse = await Course.findOne({
      name: name.trim(),
      section: section.trim(),
      professor,
    });

    if (existingCourse) {
      return res.status(400).json({ message: "Course already exists" });
    }

    const newCourse = new Course({
      name: name.trim(),
      section: section.trim(),
      classeshpnd: 0,
      totalclasses: Number(totalclasses),
      credits: Number(credits),
      professor,
    });

    await newCourse.save();

    await Professor.findByIdAndUpdate(
      professor,
      { $push: { courses: { course: newCourse._id } } },
      { new: true }
    );

    res.status(201).json({ message: "Course added successfully", course: newCourse });
  } catch (error) {
    console.error("Error adding course:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const addStudent = async (req, res) => {
  try {
    const { name, email, rollnumber, phone, section, password } = req.body;

    const existingEmail = await Student.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: "Email already exists" });

    const existingRoll = await Student.findOne({ rollnumber });
    if (existingRoll) return res.status(400).json({ message: "Roll number already exists" });

    const studentData = {
      name: name.trim(),
      email,
      rollnumber: rollnumber.trim(),
      phone,
      section: section.trim(),
      courses: [],
    };

    if (password) {
      studentData.password = await bcrypt.hash(password, 10);
      studentData.isOAuth = false;
    }

    // Derive branch & UG year
    try {
      const year = parseInt(rollnumber.substring(1, 5));
      const currentYear = new Date().getFullYear();
      if (!isNaN(year)) {
        studentData.ug = (currentYear - year).toString();
      }
      const branchCode = rollnumber.charAt(7);
      if(branchCode === "1") studentData.branch = "CSE";
      else if(branchCode === "2") studentData.branch = "ECE";
      else if(branchCode === "3") studentData.branch = "AIDS";
      else studentData.branch = "Unknown";
    } catch (err) {}

    const newStudent = new Student(studentData);
    await newStudent.save();

    res.status(201).json({ message: "Student added successfully", student: newStudent });
  } catch (error) {
    console.error("Error adding student:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const addProfessor = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    const existingProfessor = await Professor.findOne({ email });
    if (existingProfessor) return res.status(400).json({ message: "Professor already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newProfessor = new Professor({
      name: name.trim(),
      email,
      password: hashedPassword,
      phone,
      courses: [],
    });

    await newProfessor.save();
    res.status(201).json({ message: "Professor added successfully", professor: newProfessor });
  } catch (error) {
    console.error("Error adding professor:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const assignCourseToProfessor = async (req, res) => {
  try {
    const { course, professor } = req.body;
    
    const courseDoc = await Course.findById(course);
    const profDoc = await Professor.findById(professor);

    if (!courseDoc || !profDoc) return res.status(404).json({ message: "Course or Professor not found" });

    // Remove from old professor
    if (courseDoc.professor && courseDoc.professor.toString() !== professor) {
      await Professor.findByIdAndUpdate(
        courseDoc.professor,
        { $pull: { courses: { course: courseDoc._id } } }
      );
    }

    courseDoc.professor = professor;
    await courseDoc.save();

    await Professor.findByIdAndUpdate(professor, { $addToSet: { courses: { course } } });

    res.json({ message: "Course assigned to professor" });
  } catch (error) {
    console.error("Error assigning course to professor:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const assignCourseToStudent = async (req, res) => {
  try {
    const { course, student } = req.body;

    const courseDoc = await Course.findById(course);
    const studDoc = await Student.findById(student);

    if (!courseDoc || !studDoc) return res.status(404).json({ message: "Course or Student not found" });

    await Student.findByIdAndUpdate(
      student,
      { $addToSet: { courses: { course } } }
    );

    res.json({ message: "Course assigned to student" });
  } catch (error) {
    console.error("Error assigning course to student:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const removeCourse = async (req, res) => {
    // This handles removing course from prof/student or deleting entirely
    // Splitting logic based on query or body param
    try {
        const { course, removeType, professor, student, unassign_action, new_professor } = req.body;

        if (removeType === 'entire-course') {
             await Professor.updateMany(
              { "courses.course": course },
              { $pull: { courses: { course } } }
            );
            await Student.updateMany(
              { "courses.course": course },
              { $pull: { courses: { course } } }
            );
            await Course.deleteOne({ _id: course });
            return res.json({ message: "Course deleted entirely" });
        }

        if (removeType === 'professor') {
             await Professor.findByIdAndUpdate(
                professor,
                { $pull: { courses: { course } } }
              );
              
              const courseDoc = await Course.findById(course);
              if (courseDoc && courseDoc.professor.toString() === professor) {
                  if (unassign_action === 'remove') {
                      await Student.updateMany(
                        { "courses.course": course },
                        { $pull: { courses: { course } } }
                      );
                      await Course.deleteOne({ _id: course });
                  } else if (unassign_action === 'reassign') {
                      courseDoc.professor = new_professor;
                      await courseDoc.save();
                      await Professor.findByIdAndUpdate(
                        new_professor,
                        { $addToSet: { courses: { course } } }
                      );
                  }
              }
              return res.json({ message: "Course removed from professor" });
        }

        if (removeType === 'student') {
            await Student.findByIdAndUpdate(
                student,
                { $pull: { courses: { course } } }
            );
            return res.json({ message: "Course removed from student" });
        }

        res.status(400).json({ message: "Invalid removeType" });

    } catch (error) {
        console.error("Error removing course:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const removeProfessor = async (req, res) => {
    try {
        const { professor, course_action, new_professor } = req.body;
        
        const professorCourses = await Course.find({ professor });
        
        if (course_action === 'remove') {
            for (const course of professorCourses) {
                await Student.updateMany(
                    { "courses.course": course._id },
                    { $pull: { courses: { course: course._id } } }
                );
                await Course.deleteOne({ _id: course._id });
            }
        } else if (course_action === 'reassign') {
             for (const course of professorCourses) {
                course.professor = new_professor;
                await course.save();
                await Professor.findByIdAndUpdate(
                    new_professor,
                    { $addToSet: { courses: { course: course._id } } }
                );
            }
        }

        await Professor.deleteOne({ _id: professor });
        res.json({ message: "Professor removed" });
    } catch (error) {
        console.error("Error removing professor:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const removeStudent = async (req, res) => {
    try {
        const { email } = req.body;
        await Student.deleteOne({ email });
        res.json({ message: "Student removed" });
    } catch (error) {
        console.error("Error removing student:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const adminDetails = async (req, res) => {
    // Just return admin info if needed
    res.json({ admin: req.user });
}