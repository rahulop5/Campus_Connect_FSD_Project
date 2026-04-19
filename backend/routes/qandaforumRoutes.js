import express from "express";
import {
  getQuestions,
  getQuestionDetails,
  upvoteQuestion,
  downvoteQuestion,
  upvoteAnswer,
  downvoteAnswer,
  submitAnswer,
  askQuestion,
} from "../controllers/qandaforumController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { cacheMiddleware, CacheKeys } from "../middleware/cacheMiddleware.js";

const router = express.Router();

router.use(verifyToken);

// GET routes with Redis caching
router.get("/questions", cacheMiddleware(CacheKeys.forumQuestions, 120), getQuestions);
router.get("/question/:id", cacheMiddleware(CacheKeys.forumQuestion, 120), getQuestionDetails);

// POST routes (mutations — no caching)
router.post("/upvote-question", upvoteQuestion);
router.post("/downvote-question", downvoteQuestion);
router.post("/upvote-answer", upvoteAnswer);
router.post("/downvote-answer", downvoteAnswer);
router.post("/submit-answer", submitAnswer);
router.post("/ask", askQuestion);

export default router;