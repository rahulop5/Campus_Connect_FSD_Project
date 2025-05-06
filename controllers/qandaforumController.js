import Question from "../models/Question.js";
import Answer from "../models/Answer.js";

export const renderQuestionsPage = async (req, res) => {
  if (req.session.user) {
    const questions = await Question.find().populate("asker").sort({ createdAt: -1 });
    res.render("Problemslvfrm.ejs", { questions });
  } else {
    res.redirect("/");
  }
};

export const renderQuestionDetails = async (req, res) => {
  if (req.session.user) {
    const questionId = req.params.id;
    const question = await Question.findByIdAndUpdate(
        questionId,
        { $inc: { views: 1 } }, // Increment the views field by 1
        { new: true } // Return the updated document
      ).populate("answers").populate("asker");
    if (question) {
       //here write the logic to increase the views by one 
      res.render("Problemopen.ejs", { question });
    } else {
      res.status(404).send("Question not found");
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