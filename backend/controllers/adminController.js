import mongoose from "mongoose";
import Course from "../models/Course.js";
import Professor from "../models/Professor.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

// Helper to get instituteId from request
const getInstituteId = (req) => {
    return req.user.instituteId;
}

export const getDashboardData = async (req, res) => {
  try {
    const instituteId = getInstituteId(req);
    console.log(instituteId)
    if (!instituteId) return res.status(403).json({ message: "Institute ID missing" });

    const courses = await Course.find({ instituteId }).populate("professor");
    const professors = await Professor.find({ instituteId }).populate({ path: "courses.course", select: "name section" });
    const students = await Student.find({ instituteId }).populate({ path: "courses.course", select: "name section" });

    // We also need names/emails from the User model for students and professors
    // Since Student/Professor models don't store name/email anymore, we need to populate 'userId'
    
    // However, the current frontend expects a flat structure. Let's populate userId and flatten it.
    
    const enrichedProfessors = await Professor.find({ instituteId })
        .populate("userId", "name email phone")
        .populate({ path: "courses.course", select: "name section" });

    const formattedProfessors = enrichedProfessors.map(prof => ({
        _id: prof._id,
        name: prof.userId?.name,
        email: prof.userId?.email,
        phone: prof.userId?.phone,
        courses: prof.courses
    }));

    const enrichedStudents = await Student.find({ instituteId })
        .populate("userId", "name email phone")
        .populate({ path: "courses.course", select: "name section" });

    const formattedStudents = enrichedStudents.map(stud => ({
        _id: stud._id,
        name: stud.userId?.name,
        email: stud.userId?.email,
        phone: stud.userId?.phone,
        rollnumber: stud.rollnumber,
        section: stud.section,
        courses: stud.courses,
        ug: stud.ug,
        branch: stud.branch
    }));

    res.json({
      courses,
      professors: formattedProfessors,
      students: formattedStudents
    });
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const addCourse = async (req, res) => {
  try {
    const instituteId = getInstituteId(req);
    const { name, section, totalclasses, credits, professor } = req.body;

    if (!name || !section || !totalclasses || !credits || !professor) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const existingCourse = await Course.findOne({
      name: name.trim(),
      section: section.trim(),
      professor,
      instituteId
    });

    if (existingCourse) {
      return res.status(400).json({ message: "Course already exists in this institute" });
    }

    const newCourse = new Course({
      name: name.trim(),
      section: section.trim(),
      classeshpnd: 0,
      totalclasses: Number(totalclasses),
      credits: Number(credits),
      professor,
      instituteId
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
    const instituteId = getInstituteId(req);
    const { name, email, rollnumber, phone, section, password } = req.body;

    // Check if User exists globally
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User with this email already exists" });

    // Check rollnumber in current institute
    const existingRoll = await Student.findOne({ rollnumber, instituteId });
    if (existingRoll) return res.status(400).json({ message: "Roll number already exists in this institute" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Create User
    const newUser = new User({
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'Student',
        instituteId,
        verificationStatus: 'verified' // Auto-verified since admin created it
    });
    await newUser.save();

    // 2. Derive data
    let studentData = {
      userId: newUser._id,
      instituteId,
      rollnumber: rollnumber.trim(),
      section: section.trim(),
      courses: [],
    };

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

    // 3. Create Student
    const newStudent = new Student(studentData);
    await newStudent.save();

    // 4. Update User with profileId
    newUser.profileId = newStudent._id;
    await newUser.save();

    res.status(201).json({ message: "Student added successfully", student: newStudent });
  } catch (error) {
    console.error("Error adding student:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const addProfessor = async (req, res) => {
  try {
    const instituteId = getInstituteId(req);
    const { name, email, phone, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User with this email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Create User
    const newUser = new User({
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'faculty',
        instituteId,
        verificationStatus: 'verified'
    });
    await newUser.save();

    // 2. Create Professor
    const newProfessor = new Professor({
      userId: newUser._id,
      instituteId,
      courses: [],
    });
    await newProfessor.save();

    // 3. Update User
    newUser.profileId = newProfessor._id;
    await newUser.save();

    res.status(201).json({ message: "Professor added successfully", professor: newProfessor });
  } catch (error) {
    console.error("Error adding professor:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const assignCourseToProfessor = async (req, res) => {
  try {
    const { course, professor } = req.body;
    
    // Verify existence
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

        // Must also delete the User document
        const profDoc = await Professor.findById(professor);
        if (profDoc) {
            await User.findByIdAndDelete(profDoc.userId);
            await Professor.deleteOne({ _id: professor });
        }
        
        res.json({ message: "Professor removed" });
    } catch (error) {
        console.error("Error removing professor:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const removeStudent = async (req, res) => {
    try {
        // We might be receiving email or ID. Let's support ID which is safer
        // But the frontend might be sending email for now.
        // Wait, frontend sends delete via ID in `handleDeleteStudent`.
        // The old controller method `deleteStudent` used ID.
        // `removeStudent` in old controller used email.
        // Let's stick to the route definition.
        
        // Checking route definition (not visible here but assuming standard)
        // Let's implement generic remove by ID if possible, or support email
        
        const { email } = req.body;
        if (email) {
             const user = await User.findOne({ email });
             if (user) {
                 await Student.deleteOne({ userId: user._id });
                 await User.deleteOne({ _id: user._id });
             }
        }
        
        res.json({ message: "Student removed" });
    } catch (error) {
        console.error("Error removing student:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Also keep the RESTful delete by ID
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    
    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Delete associated User
    await User.findByIdAndDelete(student.userId);
    await Student.findByIdAndDelete(id);

    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteProfessor = async (req, res) => {
    // Same logic as removeProfessor but via params
     try {
        const { id } = req.params;
        
        const courses = await Course.find({ professor: id });
        
        // Remove professor reference
        await Course.updateMany(
          { professor: id },
          { $unset: { professor: "" } }
        );

        const professor = await Professor.findById(id);
        if (professor) {
            await User.findByIdAndDelete(professor.userId);
            await Professor.findByIdAndDelete(id);
        }

        res.json({ 
          message: "Professor deleted successfully",
          affectedCourses: courses.length 
        });
      } catch (error) {
        console.error("Error deleting professor:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
}

export const adminDetails = async (req, res) => {
    res.json({ admin: req.user });
}

// Update course
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, professor, section, totalclasses, credits } = req.body;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // If professor is being changed
    if (professor && course.professor && course.professor.toString() !== professor) {
      await Professor.findByIdAndUpdate(
        course.professor,
        { $pull: { courses: { course: id } } }
      );
      await Professor.findByIdAndUpdate(
        professor,
        { $addToSet: { courses: { course: id } } }
      );
    }

    if (name) course.name = name;
    if (professor) course.professor = professor;
    if (section) course.section = section;
    if (totalclasses) course.totalclasses = totalclasses;
    if (credits) course.credits = credits;

    await course.save();

    res.json({ message: "Course updated successfully", course });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update professor
export const updateProfessor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, password } = req.body;

    const professor = await Professor.findById(id);
    if (!professor) return res.status(404).json({ message: "Professor not found" });

    const user = await User.findById(professor.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }
    await user.save();

    // The Professor model mainly stores userId and courses, so usually no direct field updates unless specific prof fields exist.
    // However, if we added name/phone to Professor model in previous steps (which we didn't, we just removed them), 
    // we should resort to updating the User model which we just did.
    
    res.json({ message: "Professor updated successfully", professor });
  } catch (error) {
    console.error("Error updating professor:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update student
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, rollnumber, phone, section, courses } = req.body;

    const student = await Student.findById(id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const user = await User.findById(student.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (phone) user.phone = phone;
    await user.save();

    if (rollnumber) student.rollnumber = rollnumber;
    if (section) student.section = section;
    
    if (courses && Array.isArray(courses)) {
      student.courses = courses.map(courseId => ({
        course: courseId,
        attendance: student.courses.find(c => c.course.toString() === courseId)?.attendance || 0,
        grade: student.courses.find(c => c.course.toString() === courseId)?.grade || 0
      }));
    }

    await student.save();

    res.json({ message: "Student updated successfully", student });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};