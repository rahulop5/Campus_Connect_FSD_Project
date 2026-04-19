import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { searchQuestions, searchUsers } from '../controllers/searchController.js';

const router = express.Router();

router.use(verifyToken);

/**
 * @route   GET /api/search/questions
 * @desc    Search forum questions (Elasticsearch with MongoDB fallback)
 * @query   q (search text), tags (comma-separated), sort (newest|votes|views|oldest), page, limit
 * @access  Private
 */
router.get('/questions', searchQuestions);

/**
 * @route   GET /api/search/users
 * @desc    Search users by name
 * @query   q (search text), role (student|faculty), page, limit
 * @access  Private
 */
router.get('/users', searchUsers);

export default router;
