import express from "express";
import {
  renderQuestionsPage,
  renderQuestionDetails,
  upvoteQuestion,
  downvoteQuestion,
  upvoteAnswer,
  downvoteAnswer,
  submitAnswer,
  fetchQuestionsData,
  fetchQuestionDetails,
  renderAskQuestionPage,
  askQuestion,
} from "../controllers/qandaforumController.js";

const router = express.Router();

router.get("/problemslvfrm", renderQuestionsPage);
router.get("/questions/partial", fetchQuestionsData);



router.get("/problemopen/:id", renderQuestionDetails);
router.get("/problemopen/:id/partial", fetchQuestionDetails);




router.post("/upvote-question", upvoteQuestion);
router.post("/downvote-question", downvoteQuestion);
router.post("/upvote-answer", upvoteAnswer);
router.post("/downvote-answer", downvoteAnswer);
router.post("/submit-answer", submitAnswer);
router.get("/ask", renderAskQuestionPage);
router.post("/ask", askQuestion);





export default router;