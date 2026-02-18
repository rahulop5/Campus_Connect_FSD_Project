import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import Course from '../models/Course.js';
import Student from '../models/Student.js';
import Professor from '../models/Professor.js';
import User from '../models/User.js';

const router = express.Router();

// Get course details with students and faculty
router.get('/:courseId', verifyToken, async (req, res) => {
    try {
        const { courseId } = req.params;

        // Fetch course details
        const course = await Course.findById(courseId)
            .populate('professor', 'name email phone')
            .populate('instituteId', 'name');

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Fetch all students enrolled in this course
        const students = await Student.find({
            'courses.course': courseId
        })
            .populate('userId', 'name email')
            .lean();

        // Format student data
        const formattedStudents = students.map(student => ({
            _id: student._id,
            name: student.userId?.name || 'N/A',
            email: student.userId?.email || 'N/A',
            rollnumber: student.rollnumber,
            phone: student.userId?.phone || 'N/A',
            section: student.section
        }));

        // Get faculty (professors) teaching this course
        const faculty = [course.professor].filter(Boolean);

        res.json({
            course: {
                _id: course._id,
                name: course.name,
                section: course.section,
                credits: course.credits,
                totalclasses: course.totalclasses,
                classeshpnd: course.classeshpnd,
                ug: course.ug
            },
            students: formattedStudents,
            faculty: faculty
        });
    } catch (error) {
        console.error('Error fetching course details:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update course details (for faculty/admin)
router.put('/:courseId', verifyToken, async (req, res) => {
    try {
        const { courseId } = req.params;
        const { name, credits, totalclasses, section } = req.body;

        // Check if user is admin or professor
        if (req.user.role !== 'Admin' && req.user.role !== 'Professor') {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const course = await Course.findByIdAndUpdate(
            courseId,
            { name, credits, totalclasses, section },
            { new: true }
        );

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.json({ message: 'Course updated successfully', course });
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
