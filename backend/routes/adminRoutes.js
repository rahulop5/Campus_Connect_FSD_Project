import express from "express";
import { 
    getDashboardData,
    addCourse,
    addStudent,
    addProfessor,
    assignCourseToProfessor,
    assignCourseToStudent,
    removeCourse,
    removeProfessor,
    removeStudent,
    adminDetails,
    updateCourse,
    updateProfessor,
    updateStudent,
    deleteStudent,
    deleteProfessor,
    getCourseById,
    getStudentById
} from "../controllers/adminController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { cacheMiddleware, CacheKeys } from "../middleware/cacheMiddleware.js";

const router = express.Router();

router.use(verifyToken);

// GET routes with Redis caching
router.get("/dashboard", cacheMiddleware(CacheKeys.adminDashboard, 180), getDashboardData);
router.post("/course/add", addCourse);
router.post("/student/add", addStudent);
router.post("/professor/add", addProfessor);
router.post("/assign/course-professor", assignCourseToProfessor);
router.post("/assign/course-student", assignCourseToStudent);
router.post("/remove/course", removeCourse);
router.post("/remove/professor", removeProfessor);
router.post("/remove/student", removeStudent);
router.get("/details", adminDetails);

// GET routes for individual resources
router.get("/course/:id", getCourseById);
router.get("/student/:id", getStudentById);

// PUT routes for updates
router.put("/course/:id", updateCourse);
router.put("/professor/:id", updateProfessor);
router.put("/student/:id", updateStudent);

// DELETE routes
router.delete("/student/:id", deleteStudent);
router.delete("/professor/:id", deleteProfessor);

export default router;