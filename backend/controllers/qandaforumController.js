import Question from "../models/Question.js";
import Answer from "../models/Answer.js";

const resolveUserId = async (req) => {
  if (req.user?.role && req.user.role.toLowerCase() !== "student") {
    return null;
  }

  // req.user.id is the User ID
  let userId = req.user?.id || req.user?._id;

  // We need the Student ID (profile ID), not the User ID, because Question.asker refs Student.
  if (userId) {
    const Student = (await import("../models/Student.js")).default;
    const student = await Student.findOne({ userId });
    if (student) return student._id;
  }

  return null;
};

// GET /api/forum/questions
export const getQuestions = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    console.log(instituteId)
    const questions = await Question.find({ instituteId })
      .populate({
        path: "asker",
        populate: { path: "userId", select: "name" } // Nested populate to get name from User
      })
      .sort({ createdAt: -1 });

    console.log(questions)

    res.json({ questions });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// GET /api/forum/question/:id
export const getQuestionDetails = async (req, res) => {
  try {
    const questionId = req.params.id;
    const shouldIncrement = req.query.increment === "1";

    let query = Question.findById(questionId);
    if (shouldIncrement) {
      query = Question.findByIdAndUpdate(questionId, { $inc: { views: 1 } }, { new: true });
    }

    const question = await query
      .populate({
        path: "asker",
        populate: { path: "userId", select: "name" }
      })
      .populate({
        path: "answers",
        populate: [
          { path: "answerer", populate: { path: "userId", select: "name" } },
          { path: "voters.userId", select: "userId" }
        ]
      })
      .populate({
        path: "voters.userId",
        select: "userId"
      });

    if (!question) return res.status(404).json({ error: "Question not found" });

    // Institute Check
    if (req.user.instituteId && question.instituteId && req.user.instituteId.toString() !== question.instituteId.toString()) {
      return res.status(403).json({ message: "Access denied: Question belongs to another institute" });
    }

    res.json({ question });
  } catch (error) {
    console.error("Error fetching question details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const upvoteQuestion = async (req, res) => {
  try {
    console.log("User", req.user)
    const questionId = req.body.id;

    // User ID for voting logic -> Question.voters.userId refs Student
    const studentId = await resolveUserId(req);

    if (!studentId) {
      return res.status(403).json({ message: "Only students can vote" });
    }

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: "Question not found" });

    const existingVoteIndex = question.voters.findIndex(
      (v) => v.userId && v.userId.toString() === studentId.toString()
    );

    if (existingVoteIndex !== -1) {
      const existingVote = question.voters[existingVoteIndex];

      // Case 1: Already upvoted -> toggle off (remove vote)
      if (existingVote.voteType === 'upvote') {
        const updated = await Question.findOneAndUpdate(
          { _id: questionId },
          { $pull: { voters: { userId: studentId } }, $inc: { votes: -1 } },
          { new: true }
        );
        return res.json({ votes: updated?.votes ?? question.votes, userVote: null });
      }

      // Case 2: Currently downvoted -> switch to upvote (remove downvote, add upvote -> +2)
      if (existingVote.voteType === 'downvote') {
        const updated = await Question.findOneAndUpdate(
          { _id: questionId, "voters.userId": studentId },
          { $set: { "voters.$.voteType": "upvote" }, $inc: { votes: 2 } },
          { new: true }
        );
        return res.json({ votes: updated?.votes ?? question.votes, userVote: 'upvote' });
      }
    }

    // Case 3: No existing vote -> add upvote (+1)
    const updated = await Question.findOneAndUpdate(
      { _id: questionId },
      { $push: { voters: { userId: studentId, voteType: 'upvote' } }, $inc: { votes: 1 } },
      { new: true }
    );

    return res.json({ votes: updated?.votes ?? question.votes, userVote: 'upvote' });
  } catch (error) {
    console.error("Upvote error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const downvoteQuestion = async (req, res) => {
  try {
    const questionId = req.body.id;
    const studentId = await resolveUserId(req);

    if (!studentId) {
      return res.status(403).json({ message: "Only students can vote" });
    }

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: "Question not found" });

    const existingVoteIndex = question.voters.findIndex(
      (v) => v.userId && v.userId.toString() === studentId.toString()
    );

    if (existingVoteIndex !== -1) {
      const existingVote = question.voters[existingVoteIndex];

      // Case 1: Already downvoted -> toggle off (remove vote)
      if (existingVote.voteType === 'downvote') {
        const updated = await Question.findOneAndUpdate(
          { _id: questionId },
          { $pull: { voters: { userId: studentId } }, $inc: { votes: 1 } },
          { new: true }
        );
        return res.json({ votes: updated?.votes ?? question.votes, userVote: null });
      }

      // Case 2: Currently upvoted -> switch to downvote (remove upvote, pull downvote -> -2)
      if (existingVote.voteType === 'upvote') {
        const updated = await Question.findOneAndUpdate(
          { _id: questionId, "voters.userId": studentId },
          { $set: { "voters.$.voteType": "downvote" }, $inc: { votes: -2 } },
          { new: true }
        );
        return res.json({ votes: updated?.votes ?? question.votes, userVote: 'downvote' });
      }
    }

    // Case 3: No existing vote -> add downvote (-1)
    const updated = await Question.findOneAndUpdate(
      { _id: questionId },
      { $push: { voters: { userId: studentId, voteType: 'downvote' } }, $inc: { votes: -1 } },
      { new: true }
    );

    return res.json({ votes: updated?.votes ?? question.votes, userVote: 'downvote' });
  } catch (error) {
    console.error("Downvote error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const upvoteAnswer = async (req, res) => {
  try {
    const { questionId, answerId } = req.body;
    console.log("UPVOTING ANSWER:", answerId);
    const studentId = await resolveUserId(req);

    if (!studentId) {
      console.log("Failed: not student");
      return res.status(403).json({ message: "Only students can vote" });
    }

    const answer = await Answer.findById(answerId);
    if (!answer) {
      console.log("Failed: answer not found");
      return res.status(404).json({ message: "Answer not found" });
    }

    const existingVoteIndex = answer.voters.findIndex(
      (v) => v.userId && v.userId.toString() === studentId.toString()
    );

    if (existingVoteIndex !== -1) {
      const existingVote = answer.voters[existingVoteIndex];

      if (existingVote.voteType === 'upvote') {
        const updated = await Answer.findOneAndUpdate(
          { _id: answerId },
          { $pull: { voters: { userId: studentId } }, $inc: { votes: -1 } },
          { new: true }
        );
        return res.json({ votes: updated?.votes ?? answer.votes, userVote: null });
      }

      if (existingVote.voteType === 'downvote') {
        const updated = await Answer.findOneAndUpdate(
          { _id: answerId, "voters.userId": studentId },
          { $set: { "voters.$.voteType": "upvote" }, $inc: { votes: 2 } },
          { new: true }
        );
        return res.json({ votes: updated?.votes ?? answer.votes, userVote: 'upvote' });
      }
    }

    const updated = await Answer.findOneAndUpdate(
      { _id: answerId },
      { $push: { voters: { userId: studentId, voteType: 'upvote' } }, $inc: { votes: 1 } },
      { new: true }
    );

    return res.json({ votes: updated?.votes ?? answer.votes, userVote: 'upvote' });
  } catch (error) {
    console.error("Upvote error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const downvoteAnswer = async (req, res) => {
  try {
    const { questionId, answerId } = req.body;
    console.log("DOWNVOTING ANSWER:", answerId);
    const studentId = await resolveUserId(req);

    if (!studentId) {
      console.log("Failed: not student");
      return res.status(403).json({ message: "Only students can vote" });
    }

    const answer = await Answer.findById(answerId);
    if (!answer) {
      console.log("Failed: answer not found");
      return res.status(404).json({ message: "Answer not found" });
    }

    const existingVoteIndex = answer.voters.findIndex(
      (v) => v.userId && v.userId.toString() === studentId.toString()
    );

    if (existingVoteIndex !== -1) {
      const existingVote = answer.voters[existingVoteIndex];

      if (existingVote.voteType === 'downvote') {
        const updated = await Answer.findOneAndUpdate(
          { _id: answerId },
          { $pull: { voters: { userId: studentId } }, $inc: { votes: 1 } },
          { new: true }
        );
        return res.json({ votes: updated?.votes ?? answer.votes, userVote: null });
      }

      if (existingVote.voteType === 'upvote') {
        const updated = await Answer.findOneAndUpdate(
          { _id: answerId, "voters.userId": studentId },
          { $set: { "voters.$.voteType": "downvote" }, $inc: { votes: -2 } },
          { new: true }
        );
        return res.json({ votes: updated?.votes ?? answer.votes, userVote: 'downvote' });
      }
    }

    const updated = await Answer.findOneAndUpdate(
      { _id: answerId },
      { $push: { voters: { userId: studentId, voteType: 'downvote' } }, $inc: { votes: -1 } },
      { new: true }
    );

    return res.json({ votes: updated?.votes ?? answer.votes, userVote: 'downvote' });
  } catch (error) {
    console.error("Downvote error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const submitAnswer = async (req, res) => {
  const { answerText, questionId } = req.body;
  const question = await Question.findById(questionId);
  if (!question) {
    return res.status(404).json({ success: false, message: "Question not found" });
  }

  if (req.user.instituteId && question.instituteId && req.user.instituteId.toString() !== question.instituteId.toString()) {
    return res.status(403).json({ message: "Access denied" });
  }

  // Find Student Profile
  const Student = (await import("../models/Student.js")).default;
  const student = await Student.findOne({ userId: req.user.id });

  if (!student) {
    return res.status(401).json({ message: "User not found" });
  }

  const newAnswer = new Answer({
    desc: answerText,
    votes: 0,
    answerer: student._id,
  });

  await newAnswer.save();
  question.answers.push(newAnswer._id);
  await question.save();
  res.json({
    success: true,
    questionId: question._id,
    answerId: newAnswer._id,
    answerText: newAnswer.desc,
  });
};

export const askQuestion = async (req, res) => {
  try {
    const { title, desc, tags } = req.body;
    const tagsArray = tags.split(",").map((tag) => tag.trim());
    const instituteId = req.user.instituteId;

    // Find Student Profile
    const Student = (await import("../models/Student.js")).default;
    const student = await Student.findOne({ userId: req.user.id });

    if (!student) {
      return res.status(401).json({ message: "User not found" });
    }

    const newQuestion = new Question({
      heading: title,
      desc: desc,
      votes: 0,
      tags: tagsArray,
      asker: student._id,
      instituteId,
      wealth: 0,
      views: 0,
      answers: [],
    });
    await newQuestion.save();
    res.status(201).json({ message: "Question asked successfully", question: newQuestion });
  } catch (error) {
    console.error("Error asking question:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};