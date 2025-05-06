import express from "express";
import {
  renderQuestionsPage,
  renderQuestionDetails,
  upvoteQuestion,
  downvoteQuestion,
  upvoteAnswer,
  downvoteAnswer,
  submitAnswer,
  renderAskQuestionPage,
  askQuestion,
} from "../controllers/qandaforumController.js";

const router = express.Router();

router.get("/problemslvfrm", renderQuestionsPage);
router.get("/problemopen/:id", renderQuestionDetails);
router.post("/upvote-question", upvoteQuestion);
router.post("/downvote-question", downvoteQuestion);
router.post("/upvote-answer", upvoteAnswer);
router.post("/downvote-answer", downvoteAnswer);
router.post("/submit-answer", submitAnswer);
router.get("/ask", renderAskQuestionPage);
router.post("/ask", askQuestion);

export default router;