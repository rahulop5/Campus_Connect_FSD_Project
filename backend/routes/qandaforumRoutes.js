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

const router = express.Router();

router.use(verifyToken);

router.get("/questions", getQuestions);
router.get("/question/:id", getQuestionDetails);

router.post("/upvote-question", upvoteQuestion);
router.post("/downvote-question", downvoteQuestion);
router.post("/upvote-answer", upvoteAnswer);
router.post("/downvote-answer", downvoteAnswer);
router.post("/submit-answer", submitAnswer);
router.post("/ask", askQuestion);

export default router;