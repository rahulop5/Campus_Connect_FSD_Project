import Question from "../models/Question.js";
import Answer from "../models/Answer.js";
import { invalidateCache } from '../config/redisClient.js';
import { indexQuestion } from '../config/elasticClient.js';

const resolveUserId = async (req) => {
  const userId = req.user?.id || req.user?._id;
  const userRole = req.user?.role?.toLowerCase();

  if (!userId) return { profileId: null, model: null };

  if (userRole === "student") {
    const Student = (await import("../models/Student.js")).default;
    const student = await Student.findOne({ userId });
    if (student) return { profileId: student._id, model: 'Student' };
  } else if (userRole === "faculty") {
    const Professor = (await import("../models/Professor.js")).default;
    const professor = await Professor.findOne({ userId });
    if (professor) return { profileId: professor._id, model: 'Professor' };
  }

  return { profileId: null, model: null };
};

// GET /api/forum/questions
export const getQuestions = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    const questions = await Question.find({ instituteId }).sort({ createdAt: -1 });

    const Student = (await import("../models/Student.js")).default;
    const Professor = (await import("../models/Professor.js")).default;

    // Populate askers with proper user info based on askerModel
    const populatedQuestions = [];
    for (const question of questions) {
      const questionObj = question.toObject();
      const askerModel = questionObj.askerModel || 'Student';
      
      try {
        if (askerModel === 'Professor') {
          const prof = await Professor.findById(questionObj.asker).populate('userId', 'name');
          questionObj.asker = prof?.toObject?.() || prof;
        } else {
          const student = await Student.findById(questionObj.asker).populate('userId', 'name');
          questionObj.asker = student?.toObject?.() || student;
        }
      } catch (err) {
        console.error("Error populating asker:", err);
      }
      
      populatedQuestions.push(questionObj);
    }

    res.json({ questions: populatedQuestions });
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

    const question = await query.populate("answers");

    if (!question) return res.status(404).json({ error: "Question not found" });

    // Institute Check
    if (req.user.instituteId && question.instituteId && req.user.instituteId.toString() !== question.instituteId.toString()) {
      return res.status(403).json({ message: "Access denied: Question belongs to another institute" });
    }

    // Convert to plain object
    const questionObj = question.toObject();
    
    const Student = (await import("../models/Student.js")).default;
    const Professor = (await import("../models/Professor.js")).default;

    // Populate asker based on askerModel
    const askerModel = questionObj.askerModel || 'Student';
    try {
      if (askerModel === 'Professor') {
        const prof = await Professor.findById(questionObj.asker).populate('userId', 'name');
        questionObj.asker = prof?.toObject?.() || prof;
      } else {
        const student = await Student.findById(questionObj.asker).populate('userId', 'name');
        questionObj.asker = student?.toObject?.() || student;
      }
    } catch (err) {
      console.error("Error populating asker:", err);
    }

    // Process answers to populate answerer info
    if (Array.isArray(questionObj.answers)) {
      const processedAnswers = [];
      
      for (let i = 0; i < questionObj.answers.length; i++) {
        const answer = questionObj.answers[i];
        
        if (!answer || !answer._id) {
          console.warn("Skipping answer without ID at index", i);
          continue;
        }
        
        // Populate answerer based on answererModel
        const answererModel = answer.answererModel || 'Student';
        try {
          if (answererModel === 'Professor') {
            const prof = await Professor.findById(answer.answerer).populate('userId', 'name');
            answer.answerer = prof?.toObject?.() || prof;
          } else {
            const student = await Student.findById(answer.answerer).populate('userId', 'name');
            answer.answerer = student?.toObject?.() || student;
          }
        } catch (err) {
          console.error(`Error populating answerer for answer ${i}:`, err);
        }
        
        processedAnswers.push(answer);
      }
      
      questionObj.answers = processedAnswers;
    }

    res.json({ question: questionObj });
  } catch (error) {
    console.error("Error fetching question details:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

export const upvoteQuestion = async (req, res) => {
  try {
    console.log("User", req.user)
    const questionId = req.body.id;

    const { profileId, model } = await resolveUserId(req);

    if (!profileId) {
      return res.status(403).json({ message: "You must be logged in to vote" });
    }

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: "Question not found" });

    const existingVoteIndex = question.voters.findIndex(
      (v) => v.userId && v.userId.toString() === profileId.toString()
    );

    if (existingVoteIndex !== -1) {
      const existingVote = question.voters[existingVoteIndex];

      // Case 1: Already upvoted -> toggle off (remove vote)
      if (existingVote.voteType === 'upvote') {
        const updated = await Question.findOneAndUpdate(
          { _id: questionId },
          { $pull: { voters: { userId: profileId } }, $inc: { votes: -1 } },
          { new: true }
        );
        return res.json({ votes: updated?.votes ?? question.votes, userVote: null });
      }

      // Case 2: Currently downvoted -> switch to upvote (remove downvote, add upvote -> +2)
      if (existingVote.voteType === 'downvote') {
        const updated = await Question.findOneAndUpdate(
          { _id: questionId, "voters.userId": profileId },
          { $set: { "voters.$.voteType": "upvote", "voters.$.userModel": model }, $inc: { votes: 2 } },
          { new: true }
        );
        return res.json({ votes: updated?.votes ?? question.votes, userVote: 'upvote' });
      }
    }

    // Case 3: No existing vote -> add upvote (+1)
    const updated = await Question.findOneAndUpdate(
      { _id: questionId },
      { $push: { voters: { userId: profileId, userModel: model, voteType: 'upvote' } }, $inc: { votes: 1 } },
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
    const { profileId, model } = await resolveUserId(req);

    if (!profileId) {
      return res.status(403).json({ message: "You must be logged in to vote" });
    }

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: "Question not found" });

    const existingVoteIndex = question.voters.findIndex(
      (v) => v.userId && v.userId.toString() === profileId.toString()
    );

    if (existingVoteIndex !== -1) {
      const existingVote = question.voters[existingVoteIndex];

      // Case 1: Already downvoted -> toggle off (remove vote)
      if (existingVote.voteType === 'downvote') {
        const updated = await Question.findOneAndUpdate(
          { _id: questionId },
          { $pull: { voters: { userId: profileId } }, $inc: { votes: 1 } },
          { new: true }
        );
        return res.json({ votes: updated?.votes ?? question.votes, userVote: null });
      }

      // Case 2: Currently upvoted -> switch to downvote (remove upvote, pull downvote -> -2)
      if (existingVote.voteType === 'upvote') {
        const updated = await Question.findOneAndUpdate(
          { _id: questionId, "voters.userId": profileId },
          { $set: { "voters.$.voteType": "downvote", "voters.$.userModel": model }, $inc: { votes: -2 } },
          { new: true }
        );
        return res.json({ votes: updated?.votes ?? question.votes, userVote: 'downvote' });
      }
    }

    // Case 3: No existing vote -> add downvote (-1)
    const updated = await Question.findOneAndUpdate(
      { _id: questionId },
      { $push: { voters: { userId: profileId, userModel: model, voteType: 'downvote' } }, $inc: { votes: -1 } },
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
    const { profileId, model } = await resolveUserId(req);

    if (!profileId) {
      console.log("Failed: not logged in");
      return res.status(403).json({ message: "You must be logged in to vote" });
    }

    const answer = await Answer.findById(answerId);
    if (!answer) {
      console.log("Failed: answer not found");
      return res.status(404).json({ message: "Answer not found" });
    }

    const existingVoteIndex = answer.voters.findIndex(
      (v) => v.userId && v.userId.toString() === profileId.toString()
    );

    if (existingVoteIndex !== -1) {
      const existingVote = answer.voters[existingVoteIndex];

      if (existingVote.voteType === 'upvote') {
        const updated = await Answer.findOneAndUpdate(
          { _id: answerId },
          { $pull: { voters: { userId: profileId } }, $inc: { votes: -1 } },
          { new: true }
        );
        return res.json({ votes: updated?.votes ?? answer.votes, userVote: null });
      }

      if (existingVote.voteType === 'downvote') {
        const updated = await Answer.findOneAndUpdate(
          { _id: answerId, "voters.userId": profileId },
          { $set: { "voters.$.voteType": "upvote", "voters.$.userModel": model }, $inc: { votes: 2 } },
          { new: true }
        );
        return res.json({ votes: updated?.votes ?? answer.votes, userVote: 'upvote' });
      }
    }

    const updated = await Answer.findOneAndUpdate(
      { _id: answerId },
      { $push: { voters: { userId: profileId, userModel: model, voteType: 'upvote' } }, $inc: { votes: 1 } },
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
    const { profileId, model } = await resolveUserId(req);

    if (!profileId) {
      console.log("Failed: not logged in");
      return res.status(403).json({ message: "You must be logged in to vote" });
    }

    const answer = await Answer.findById(answerId);
    if (!answer) {
      console.log("Failed: answer not found");
      return res.status(404).json({ message: "Answer not found" });
    }

    const existingVoteIndex = answer.voters.findIndex(
      (v) => v.userId && v.userId.toString() === profileId.toString()
    );

    if (existingVoteIndex !== -1) {
      const existingVote = answer.voters[existingVoteIndex];

      if (existingVote.voteType === 'downvote') {
        const updated = await Answer.findOneAndUpdate(
          { _id: answerId },
          { $pull: { voters: { userId: profileId } }, $inc: { votes: 1 } },
          { new: true }
        );
        return res.json({ votes: updated?.votes ?? answer.votes, userVote: null });
      }

      if (existingVote.voteType === 'upvote') {
        const updated = await Answer.findOneAndUpdate(
          { _id: answerId, "voters.userId": profileId },
          { $set: { "voters.$.voteType": "downvote", "voters.$.userModel": model }, $inc: { votes: -2 } },
          { new: true }
        );
        return res.json({ votes: updated?.votes ?? answer.votes, userVote: 'downvote' });
      }
    }

    const updated = await Answer.findOneAndUpdate(
      { _id: answerId },
      { $push: { voters: { userId: profileId, userModel: model, voteType: 'downvote' } }, $inc: { votes: -1 } },
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

  const userRole = req.user?.role?.toLowerCase();
  const userId = req.user.id || req.user._id;
  
  let answerer = null;
  let answererModel = null;
  
  if (userRole === "student") {
    const Student = (await import("../models/Student.js")).default;
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(401).json({ message: "User not found" });
    }
    answerer = student._id;
    answererModel = 'Student';
  } else if (userRole === "faculty") {
    const Professor = (await import("../models/Professor.js")).default;
    const professor = await Professor.findOne({ userId });
    if (!professor) {
      return res.status(401).json({ message: "User not found" });
    }
    answerer = professor._id;
    answererModel = 'Professor';
  } else {
    return res.status(403).json({ message: "Only students and faculty can answer questions" });
  }

  const newAnswer = new Answer({
    desc: answerText,
    votes: 0,
    answerer: answerer,
    answererModel: answererModel,
  });

  await newAnswer.save();
  question.answers.push(newAnswer._id);
  await question.save();

  // Invalidate forum cache
  await invalidateCache('forum:*');

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
    const userId = req.user.id || req.user._id;
    const userRole = req.user?.role?.toLowerCase();

    let asker = null;
    let askerModel = null;

    // Find Student or Professor Profile
    if (userRole === "student") {
      const Student = (await import("../models/Student.js")).default;
      const student = await Student.findOne({ userId });
      if (!student) {
        return res.status(401).json({ message: "User not found" });
      }
      asker = student._id;
      askerModel = 'Student';
    } else if (userRole === "faculty") {
      const Professor = (await import("../models/Professor.js")).default;
      const professor = await Professor.findOne({ userId });
      if (!professor) {
        return res.status(401).json({ message: "User not found" });
      }
      asker = professor._id;
      askerModel = 'Professor';
    } else {
      return res.status(403).json({ message: "Only students and faculty can ask questions" });
    }

    const newQuestion = new Question({
      heading: title,
      desc: desc,
      votes: 0,
      tags: tagsArray,
      asker: asker,
      askerModel: askerModel,
      instituteId,
      wealth: 0,
      views: 0,
      answers: [],
    });
    await newQuestion.save();

    // Invalidate forum cache and index in Elasticsearch
    await invalidateCache('forum:*');
    await indexQuestion(newQuestion);

    res.status(201).json({ message: "Question asked successfully", question: newQuestion });
  } catch (error) {
    console.error("Error asking question:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};