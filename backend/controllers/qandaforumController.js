import Question from "../models/Question.js";
import Answer from "../models/Answer.js";

const resolveUserId = async (req) => {
  if (req.user?.role && req.user.role !== "Student") {
    return null;
  }

  let userId = req.user?.id || req.user?._id;

  if (!userId && req.user?.email) {
    const Student = (await import("../models/Student.js")).default;
    const student = await Student.findOne({ email: req.user.email });
    if (student) userId = student._id;
  }

  return userId;
};

// GET /api/forum/questions
export const getQuestions = async (req, res) => {
  try {
    const instituteId = req.user.instituteId;
    const questions = await Question.find({ instituteId })
      .populate("asker")
      .sort({ createdAt: -1 });

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
    
    // We can add a check here to ensure the question belongs to the user's institute
    // But since IDs are unique, and users can't easily guess IDs of other institutes' questions (and they won't see them in feed),
    // strict enforcement is good but maybe secondary to fixing the crash.
    // Let's add the check if we can easily get instituteId from the question.
    
    let query = Question.findById(questionId);
    if (shouldIncrement) {
        query = Question.findByIdAndUpdate(questionId, { $inc: { views: 1 } }, { new: true });
    }
    
    const question = await query.populate("answers").populate("asker");

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
    const questionId = req.body.id;
    const userId = await resolveUserId(req);

    if (!userId) {
      return res.status(403).json({ message: "Only students can vote" });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    
    if (req.user.instituteId && question.instituteId && req.user.instituteId.toString() !== question.instituteId.toString()) {
        return res.status(403).json({ message: "Access denied" });
    }

    // Check if user has already voted
    const existingVote = question.voters.find(
      (v) => v.userId && v.userId.toString() === userId.toString()
    );

    if (existingVote) {
      if (existingVote.voteType === 'upvote') {
        return res.json({ votes: question.votes, userVote: 'upvote' });
      }

      const updated = await Question.findOneAndUpdate(
        { _id: questionId, "voters.userId": userId, "voters.voteType": "downvote" },
        { $pull: { voters: { userId } }, $inc: { votes: 1 } },
        { new: true }
      );

      return res.json({ votes: updated?.votes ?? question.votes, userVote: null });
    }

    const updated = await Question.findOneAndUpdate(
      { _id: questionId, "voters.userId": { $ne: userId } },
      { $push: { voters: { userId, voteType: 'upvote' } }, $inc: { votes: 1 } },
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
    const userId = await resolveUserId(req);

    if (!userId) {
      return res.status(403).json({ message: "Only students can vote" });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }
    
    if (req.user.instituteId && question.instituteId && req.user.instituteId.toString() !== question.instituteId.toString()) {
        return res.status(403).json({ message: "Access denied" });
    }

    // Check if user has already voted
    const existingVote = question.voters.find(
      (v) => v.userId && v.userId.toString() === userId.toString()
    );

    if (existingVote) {
      if (existingVote.voteType === 'downvote') {
        return res.json({ votes: question.votes, userVote: 'downvote' });
      }

      const updated = await Question.findOneAndUpdate(
        { _id: questionId, "voters.userId": userId, "voters.voteType": "upvote" },
        { $pull: { voters: { userId } }, $inc: { votes: -1 } },
        { new: true }
      );

      return res.json({ votes: updated?.votes ?? question.votes, userVote: null });
    }

    const updated = await Question.findOneAndUpdate(
      { _id: questionId, "voters.userId": { $ne: userId } },
      { $push: { voters: { userId, voteType: 'downvote' } }, $inc: { votes: -1 } },
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
    const userId = await resolveUserId(req);

    if (!userId) {
      return res.status(403).json({ message: "Only students can vote" });
    }

    const answer = await Answer.findById(answerId);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    // Check if user has already voted
    const existingVote = answer.voters.find(
      (v) => v.userId && v.userId.toString() === userId.toString()
    );

    if (existingVote) {
      if (existingVote.voteType === 'upvote') {
        return res.json({ votes: answer.votes, userVote: 'upvote' });
      }

      const updated = await Answer.findOneAndUpdate(
        { _id: answerId, "voters.userId": userId, "voters.voteType": "downvote" },
        { $pull: { voters: { userId } }, $inc: { votes: 1 } },
        { new: true }
      );

      return res.json({ votes: updated?.votes ?? answer.votes, userVote: null });
    }

    const updated = await Answer.findOneAndUpdate(
      { _id: answerId, "voters.userId": { $ne: userId } },
      { $push: { voters: { userId, voteType: 'upvote' } }, $inc: { votes: 1 } },
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
    const userId = await resolveUserId(req);

    if (!userId) {
      return res.status(403).json({ message: "Only students can vote" });
    }

    const answer = await Answer.findById(answerId);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found" });
    }

    // Check if user has already voted
    const existingVote = answer.voters.find(
      (v) => v.userId && v.userId.toString() === userId.toString()
    );

    if (existingVote) {
      if (existingVote.voteType === 'downvote') {
        return res.json({ votes: answer.votes, userVote: 'downvote' });
      }

      const updated = await Answer.findOneAndUpdate(
        { _id: answerId, "voters.userId": userId, "voters.voteType": "upvote" },
        { $pull: { voters: { userId } }, $inc: { votes: -1 } },
        { new: true }
      );

      return res.json({ votes: updated?.votes ?? answer.votes, userVote: null });
    }

    const updated = await Answer.findOneAndUpdate(
      { _id: answerId, "voters.userId": { $ne: userId } },
      { $push: { voters: { userId, voteType: 'downvote' } }, $inc: { votes: -1 } },
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
  
  let userId = req.user._id;
  if (!userId) {
      // Try to find student
      const Student = (await import("../models/Student.js")).default;
      const student = await Student.findOne({ email: req.user.email });
      if (student) userId = student._id;
  }
  
  if (!userId) {
       return res.status(401).json({ message: "User not found" });
  }
  
  const newAnswer = new Answer({
    desc: answerText,
    votes: 0,
    answerer: userId,
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
        
        let userId = req.user._id;
        if (!userId) {
            const Student = (await import("../models/Student.js")).default;
            const student = await Student.findOne({ email: req.user.email });
            if (student) userId = student._id;
        }

        if (!userId) {
            return res.status(401).json({ message: "User not found" });
        }

        const newQuestion = new Question({
          heading: title,
          desc: desc,
          votes: 0,
          tags: tagsArray,
          asker: userId,
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