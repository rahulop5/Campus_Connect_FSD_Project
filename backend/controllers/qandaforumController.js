import Question from "../models/Question.js";
import Answer from "../models/Answer.js";

const resolveUserId = async (req) => {
  if (req.user?.role && req.user.role !== "Student") {
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
        .populate("answers")
        .populate({
            path: "asker",
            populate: { path: "userId", select: "name" }
        })
        .populate({
             path: "answers",
             populate: {
                 path: "answerer",
                 populate: { path: "userId", select: "name" }
             }
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
    console.log("Student ID", studentId)
    
    if (!studentId) {
      return res.status(403).json({ message: "Only students can vote" });
    }

    const question = await Question.findById(questionId);
// ... existing code ...
    // Check if user has already voted
    const existingVote = question.voters.find(
      (v) => v.userId && v.userId.toString() === studentId.toString()
    );

    if (existingVote) {
      if (existingVote.voteType === 'upvote') {
        return res.json({ votes: question.votes, userVote: 'upvote' });
      }

      const updated = await Question.findOneAndUpdate(
        { _id: questionId, "voters.userId": studentId, "voters.voteType": "downvote" },
        { $pull: { voters: { userId: studentId } }, $inc: { votes: 1 } },
        { new: true }
      );

      return res.json({ votes: updated?.votes ?? question.votes, userVote: null });
    }

    const updated = await Question.findOneAndUpdate(
      { _id: questionId, "voters.userId": { $ne: studentId } },
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
// ... existing code ...
    // Check if user has already voted
    const existingVote = question.voters.find(
      (v) => v.userId && v.userId.toString() === studentId.toString()
    );

    if (existingVote) {
      if (existingVote.voteType === 'downvote') {
        return res.json({ votes: question.votes, userVote: 'downvote' });
      }

      const updated = await Question.findOneAndUpdate(
        { _id: questionId, "voters.userId": studentId, "voters.voteType": "upvote" },
        { $pull: { voters: { userId: studentId } }, $inc: { votes: -1 } },
        { new: true }
      );

      return res.json({ votes: updated?.votes ?? question.votes, userVote: null });
    }

    const updated = await Question.findOneAndUpdate(
      { _id: questionId, "voters.userId": { $ne: studentId } },
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
    const studentId = await resolveUserId(req);

    if (!studentId) {
      return res.status(403).json({ message: "Only students can vote" });
    }

    const answer = await Answer.findById(answerId);
// ... existing code ...
    // Check if user has already voted
    const existingVote = answer.voters.find(
      (v) => v.userId && v.userId.toString() === studentId.toString()
    );

    if (existingVote) {
      if (existingVote.voteType === 'upvote') {
        return res.json({ votes: answer.votes, userVote: 'upvote' });
      }

      const updated = await Answer.findOneAndUpdate(
        { _id: answerId, "voters.userId": studentId, "voters.voteType": "downvote" },
        { $pull: { voters: { userId: studentId } }, $inc: { votes: 1 } },
        { new: true }
      );

      return res.json({ votes: updated?.votes ?? answer.votes, userVote: null });
    }

    const updated = await Answer.findOneAndUpdate(
      { _id: answerId, "voters.userId": { $ne: studentId } },
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
    const studentId = await resolveUserId(req);

    if (!studentId) {
      return res.status(403).json({ message: "Only students can vote" });
    }

    const answer = await Answer.findById(answerId);
// ... existing code ...
    // Check if user has already voted
    const existingVote = answer.voters.find(
      (v) => v.userId && v.userId.toString() === studentId.toString()
    );

    if (existingVote) {
      if (existingVote.voteType === 'downvote') {
        return res.json({ votes: answer.votes, userVote: 'downvote' });
      }

      const updated = await Answer.findOneAndUpdate(
        { _id: answerId, "voters.userId": studentId, "voters.voteType": "upvote" },
        { $pull: { voters: { userId: studentId } }, $inc: { votes: -1 } },
        { new: true }
      );

      return res.json({ votes: updated?.votes ?? answer.votes, userVote: null });
    }

    const updated = await Answer.findOneAndUpdate(
      { _id: answerId, "voters.userId": { $ne: studentId } },
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