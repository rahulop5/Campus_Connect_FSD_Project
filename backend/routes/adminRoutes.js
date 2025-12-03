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
    adminDetails
} from "../controllers/adminController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verifyToken);

router.get("/dashboard", getDashboardData);
router.post("/course/add", addCourse);
router.post("/student/add", addStudent);
router.post("/professor/add", addProfessor);
router.post("/assign/course-professor", assignCourseToProfessor);
router.post("/assign/course-student", assignCourseToStudent);
router.post("/remove/course", removeCourse);
router.post("/remove/professor", removeProfessor);
router.post("/remove/student", removeStudent);
router.get("/details", adminDetails);

export default router;