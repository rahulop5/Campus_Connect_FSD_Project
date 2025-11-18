import Question from "../models/Question.js";
import Answer from "../models/Answer.js";

// Renders the EJS shell
export const renderQuestionsPage = async (req, res) => {
  if (req.session.user) {
    try {
      res.render("Problemslvfrm.ejs");
    } catch (error) {
      console.error("Error rendering page:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.redirect("/");
  }
};

// Sends JSON data for AJAX
export const fetchQuestionsData = async (req, res) => {
  if (req.session.user) {
    try {
      const questions = await Question.find()
        .populate("asker")
        .sort({ createdAt: -1 });

      res.json({ questions });
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.redirect("/");
  }
};


// Renders the EJS shell (no data)
export const renderQuestionDetails = async (req, res) => {
  if (req.session.user) {
    try {
      res.render("Problemopen.ejs");
    } catch (error) {
      console.error("Error rendering question page:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.redirect("/");
  }
};

// Sends question JSON data for AJAX
export const fetchQuestionDetails = async (req, res) => {
  if (req.session.user) {
    try {
      const questionId = req.params.id;
      const question = await Question.findByIdAndUpdate(
        questionId,
        { $inc: { views: 1 } },
        { new: true }
      )
        .populate("answers")
        .populate("asker");

      if (!question) return res.status(404).json({ error: "Question not found" });

      res.json({ question });
    } catch (error) {
      console.error("Error fetching question details:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.redirect("/");
  }
};






export const upvoteQuestion = async (req, res) => {
  const questionId = req.body.id;
  const question = await Question.findByIdAndUpdate(
    questionId,
    { $inc: { votes: 1 } },
    { new: true }
  );
  if (question) {
    res.json({ votes: question.votes });
  } else {
    res.status(404).send("Question not found");
  }
};

export const downvoteQuestion = async (req, res) => {
  const questionId = req.body.id;
  const question = await Question.findByIdAndUpdate(
    questionId,
    { $inc: { votes: -1 } },
    { new: true }
  );
  if (question) {
    res.json({ votes: question.votes });
  } else {
    res.status(404).send("Question not found");
  }
};

export const upvoteAnswer = async (req, res) => {
  const { questionId, answerId } = req.body;
  const answer = await Answer.findByIdAndUpdate(
    answerId,
    { $inc: { votes: 1 } },
    { new: true }
  );
  if (answer) {
    res.json({ votes: answer.votes });
  } else {
    res.status(404).send("Answer not found");
  }
};

export const downvoteAnswer = async (req, res) => {
  const { questionId, answerId } = req.body;
  const answer = await Answer.findByIdAndUpdate(
    answerId,
    { $inc: { votes: -1 } },
    { new: true }
  );
  if (answer) {
    res.json({ votes: answer.votes });
  } else {
    res.status(404).send("Answer not found");
  }
};

export const submitAnswer = async (req, res) => {
  const { answerText, questionId } = req.body;
  const question = await Question.findById(questionId);
  if (!question) {
    return res.status(404).json({ success: false, message: "Question not found" });
  }
  const newAnswer = new Answer({
    desc: answerText,
    votes: 0,
    answerer: req.session.user._id,
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

export const renderAskQuestionPage = (req, res) => {
  if (req.session.user) {
    res.render("askquestion.ejs", { name: req.session.user.name });
  } else {
    res.redirect("/");
  }
};

export const askQuestion = async (req, res) => {
  if (req.session.user) {
    const { title, desc, tags } = req.body;
    const tagsArray = tags.split(",").map((tag) => tag.trim());
    const newQuestion = new Question({
      heading: title,
      desc: desc,
      votes: 0,
      tags: tagsArray,
      asker: req.session.user._id,
      wealth: 0,
      views: 0,
      answers: [],
    });
    await newQuestion.save();
    res.redirect("/problemslvfrm");
  } else {
    res.redirect("/");
  }
};