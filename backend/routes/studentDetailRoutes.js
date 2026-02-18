import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import Student from '../models/Student.js';
import Course from '../models/Course.js';
import User from '../models/User.js';

const router = express.Router();

// Get student details with courses (for admin and professor only)
router.get('/:studentId', verifyToken, async (req, res) => {
    try {
        const { studentId } = req.params;

        // Check if user is admin or professor
        if (req.user.role !== 'Admin' && req.user.role !== 'Professor') {
            return res.status(403).json({ message: 'Unauthorized. Only admin and professors can view student details.' });
        }

        // Fetch student details
        const student = await Student.findById(studentId)
            .populate('userId', 'name email phone')
            .populate('courses.course', 'name section credits')
            .lean();

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Format course data with attendance and grades
        const courses = student.courses.map(courseEntry => ({
            courseId: courseEntry.course?._id,
            courseName: courseEntry.course?.name || 'N/A',
            courseCode: courseEntry.course?.section || 'N/A',
            grade: courseEntry.grade || 0,
            attendance: courseEntry.attendance || 0
        }));

        // Calculate year of graduation (assume 4 years from enrollment)
        const currentYear = new Date().getFullYear();
        const yearOfGraduation = currentYear + 4; // This can be made dynamic

        res.json({
            student: {
                _id: student._id,
                name: student.userId?.name || 'N/A',
                email: student.userId?.email || 'N/A',
                phone: student.userId?.phone || 'N/A',
                rollnumber: student.rollnumber,
                section: student.section,
                branch: student.branch,
                ug: student.ug,
                profilePicture: student.profilePicture,
                yearOfGraduation: yearOfGraduation,
                courses: courses
            }
        });
    } catch (error) {
        console.error('Error fetching student details:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
