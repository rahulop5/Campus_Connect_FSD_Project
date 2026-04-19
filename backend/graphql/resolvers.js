import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Professor from '../models/Professor.js';
import Course from '../models/Course.js';
import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import Election from '../models/Election.js';
import Candidate from '../models/Candidate.js';
import Vote from '../models/Vote.js';
import Institute from '../models/Institute.js';
import Payment from '../models/Payment.js';
import { GraphQLError } from 'graphql';

/**
 * Helper: Authenticate user from context
 */
const authenticate = (context) => {
  if (!context.user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' }
    });
  }
  return context.user;
};

/**
 * Helper: Check role authorization
 */
const authorize = (context, allowedRoles) => {
  const user = authenticate(context);
  if (!allowedRoles.includes(user.role)) {
    throw new GraphQLError('Insufficient permissions', {
      extensions: { code: 'FORBIDDEN' }
    });
  }
  return user;
};

/**
 * Helper: Normalize role
 */
const normalizeRole = (rawRole) => {
  const role = String(rawRole || 'user').trim().toLowerCase();
  if (role === 'professor') return 'faculty';
  if (role === 'admin') return 'college_admin';
  const allowed = ['super_admin', 'college_admin', 'student', 'faculty', 'user'];
  return allowed.includes(role) ? role : 'user';
};

export const resolvers = {
  // ─── QUERY RESOLVERS ──────────────────────────────────────────

  Query: {
    /**
     * Get current authenticated user
     */
    me: async (_, __, context) => {
      const user = authenticate(context);
      return await User.findById(user.id).select('-password').lean();
    },

    /**
     * Get student profile for current user
     */
    studentProfile: async (_, __, context) => {
      const user = authenticate(context);
      const student = await Student.findOne({ userId: user.id })
        .populate('userId', 'name email phone')
        .populate('courses.course')
        .lean();
      return student;
    },

    /**
     * Get student dashboard data
     */
    studentDashboard: async (_, __, context) => {
      const user = authenticate(context);
      return await Student.findOne({ userId: user.id })
        .populate('userId', 'name email phone')
        .populate('courses.course')
        .lean();
    },

    /**
     * Get student by ID (admin/faculty)
     */
    student: async (_, { id }, context) => {
      authorize(context, ['college_admin', 'faculty', 'super_admin']);
      return await Student.findById(id)
        .populate('userId', 'name email phone')
        .populate('courses.course')
        .lean();
    },

    /**
     * List students in the institute
     */
    students: async (_, { page = 1, limit = 20 }, context) => {
      const user = authorize(context, ['college_admin', 'faculty', 'super_admin']);
      const skip = (page - 1) * limit;
      return await Student.find({ instituteId: user.instituteId })
        .populate('userId', 'name email phone')
        .skip(skip)
        .limit(limit)
        .lean();
    },

    /**
     * Get course details
     */
    course: async (_, { id }, context) => {
      authenticate(context);
      return await Course.findById(id)
        .populate({
          path: 'professor',
          populate: { path: 'userId', select: 'name email' }
        })
        .lean();
    },

    /**
     * List all courses
     */
    courses: async (_, __, context) => {
      const user = authenticate(context);
      return await Course.find(user.instituteId ? { instituteId: user.instituteId } : {})
        .populate({
          path: 'professor',
          populate: { path: 'userId', select: 'name email' }
        })
        .lean();
    },

    /**
     * Get forum questions
     */
    questions: async (_, { page = 1, limit = 20, sort = 'newest' }, context) => {
      const user = authenticate(context);
      const skip = (page - 1) * limit;
      
      let sortOption = {};
      switch (sort) {
        case 'votes': sortOption = { votes: -1 }; break;
        case 'views': sortOption = { views: -1 }; break;
        case 'oldest': sortOption = { createdAt: 1 }; break;
        default: sortOption = { createdAt: -1 };
      }

      return await Question.find({ instituteId: user.instituteId })
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .populate('answers')
        .lean();
    },

    /**
     * Get single question
     */
    question: async (_, { id }, context) => {
      authenticate(context);
      return await Question.findById(id).populate('answers').lean();
    },

    /**
     * Search questions
     */
    searchQuestions: async (_, { q, tags, sort, page = 1, limit = 20 }, context) => {
      const user = authenticate(context);
      const skip = (page - 1) * limit;

      const query = { instituteId: user.instituteId };
      if (q) query.$text = { $search: q };
      if (tags && tags.length > 0) query.tags = { $in: tags };

      let sortOption = {};
      switch (sort) {
        case 'votes': sortOption = { votes: -1 }; break;
        case 'views': sortOption = { views: -1 }; break;
        default: sortOption = { createdAt: -1 };
      }

      const [questions, total] = await Promise.all([
        Question.find(query).sort(sortOption).skip(skip).limit(limit).populate('answers').lean(),
        Question.countDocuments(query)
      ]);

      return { total, page, limit, source: 'mongodb', questions };
    },

    /**
     * Search users
     */
    searchUsers: async (_, { q, role, page = 1, limit = 20 }, context) => {
      const user = authenticate(context);
      const skip = (page - 1) * limit;
      const nameRegex = new RegExp(q, 'i');

      const query = {
        name: nameRegex,
        ...(user.instituteId && { instituteId: user.instituteId }),
        ...(role && { role })
      };

      const [users, total] = await Promise.all([
        User.find(query).select('-password').skip(skip).limit(limit).lean(),
        User.countDocuments(query)
      ]);

      return { total, page, limit, users };
    },

    /**
     * Get current election
     */
    election: async (_, __, context) => {
      const user = authenticate(context);
      const election = await Election.findOne({
        instituteId: user.instituteId,
        status: 'active'
      }).lean();

      if (election) {
        const candidates = await Candidate.find({ electionId: election._id }).lean();
        election.candidates = candidates;
      }

      return election;
    },

    /**
     * List institutes
     */
    institutes: async () => {
      return await Institute.find().lean();
    },

    /**
     * Get subscription status
     */
    subscription: async (_, __, context) => {
      const user = authenticate(context);
      const userData = await User.findById(user.id).lean();
      if (userData?.subscription?.paymentId) {
        return await Payment.findById(userData.subscription.paymentId).lean();
      }
      return null;
    },

    /**
     * Admin dashboard data
     */
    adminDashboard: async (_, __, context) => {
      const user = authorize(context, ['college_admin', 'super_admin']);
      
      const [students, professors, courses] = await Promise.all([
        Student.find({ instituteId: user.instituteId }).populate('userId', 'name email').lean(),
        Professor.find({ instituteId: user.instituteId }).populate('userId', 'name email').lean(),
        Course.find({ instituteId: user.instituteId }).lean()
      ]);

      return {
        totalStudents: students.length,
        totalProfessors: professors.length,
        totalCourses: courses.length,
        students,
        professors,
        courses
      };
    }
  },

  // ─── MUTATION RESOLVERS ───────────────────────────────────────

  Mutation: {
    /**
     * Register a new user
     */
    register: async (_, { name, email, password, phone, role }) => {
      const normalizedRole = normalizeRole(role);

      if (!name || !email || !password) {
        throw new GraphQLError('Name, email, and password are required', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      const existing = await User.findOne({ email });
      if (existing) {
        throw new GraphQLError('User already exists', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ name, email, password: hashedPassword, phone, role: normalizedRole });
      await newUser.save();

      const token = jwt.sign(
        { id: newUser._id, role: newUser.role, instituteId: newUser.instituteId },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      return { token, user: newUser };
    },

    /**
     * Login
     */
    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        throw new GraphQLError('Invalid credentials', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }

      const token = jwt.sign(
        { id: user._id, role: normalizeRole(user.role), instituteId: user.instituteId },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      return { token, user };
    },

    /**
     * Update student profile
     */
    updateProfile: async (_, args, context) => {
      const user = authenticate(context);
      const { name, phone, branch, section, ug } = args;

      if (name || phone) {
        await User.findByIdAndUpdate(user.id, {
          ...(name && { name }),
          ...(phone && { phone })
        });
      }

      const student = await Student.findOneAndUpdate(
        { userId: user.id },
        { ...(branch && { branch }), ...(section && { section }), ...(ug && { ug }) },
        { new: true }
      ).populate('userId', 'name email phone').populate('courses.course');

      return student;
    },

    /**
     * Ask a question
     */
    askQuestion: async (_, { heading, desc, tags, wealth }, context) => {
      const user = authenticate(context);
      
      const student = await Student.findOne({ userId: user.id });
      const professor = await Professor.findOne({ userId: user.id });
      const asker = student || professor;
      const askerModel = student ? 'Student' : 'Professor';

      if (!asker) {
        throw new GraphQLError('Profile not found', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const question = new Question({
        heading,
        desc,
        tags: tags || [],
        wealth: wealth || 0,
        asker: asker._id,
        askerModel,
        instituteId: user.instituteId
      });

      await question.save();
      return question;
    },

    /**
     * Submit an answer
     */
    submitAnswer: async (_, { questionId, desc }, context) => {
      const user = authenticate(context);

      const student = await Student.findOne({ userId: user.id });
      const professor = await Professor.findOne({ userId: user.id });
      const answerer = student || professor;
      const answererModel = student ? 'Student' : 'Professor';

      if (!answerer) {
        throw new GraphQLError('Profile not found', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const answer = new Answer({
        desc,
        answerer: answerer._id,
        answererModel
      });
      await answer.save();

      await Question.findByIdAndUpdate(questionId, {
        $push: { answers: answer._id }
      });

      return answer;
    },

    /**
     * Upvote a question
     */
    upvoteQuestion: async (_, { questionId }, context) => {
      const user = authenticate(context);
      const question = await Question.findById(questionId);
      if (!question) throw new GraphQLError('Question not found');

      const existingVote = question.voters.find(
        v => v.userId?.toString() === user.id
      );

      if (existingVote) {
        if (existingVote.voteType === 'upvote') {
          question.votes -= 1;
          question.voters = question.voters.filter(v => v.userId?.toString() !== user.id);
        } else {
          question.votes += 2;
          existingVote.voteType = 'upvote';
        }
      } else {
        question.votes += 1;
        question.voters.push({ userId: user.id, voteType: 'upvote' });
      }

      await question.save();
      return question;
    },

    /**
     * Downvote a question
     */
    downvoteQuestion: async (_, { questionId }, context) => {
      const user = authenticate(context);
      const question = await Question.findById(questionId);
      if (!question) throw new GraphQLError('Question not found');

      const existingVote = question.voters.find(
        v => v.userId?.toString() === user.id
      );

      if (existingVote) {
        if (existingVote.voteType === 'downvote') {
          question.votes += 1;
          question.voters = question.voters.filter(v => v.userId?.toString() !== user.id);
        } else {
          question.votes -= 2;
          existingVote.voteType = 'downvote';
        }
      } else {
        question.votes -= 1;
        question.voters.push({ userId: user.id, voteType: 'downvote' });
      }

      await question.save();
      return question;
    },

    /**
     * Upvote an answer
     */
    upvoteAnswer: async (_, { answerId }, context) => {
      const user = authenticate(context);
      const answer = await Answer.findById(answerId);
      if (!answer) throw new GraphQLError('Answer not found');

      const existingVote = answer.voters.find(v => v.userId?.toString() === user.id);
      if (existingVote) {
        if (existingVote.voteType === 'upvote') {
          answer.votes -= 1;
          answer.voters = answer.voters.filter(v => v.userId?.toString() !== user.id);
        } else {
          answer.votes += 2;
          existingVote.voteType = 'upvote';
        }
      } else {
        answer.votes += 1;
        answer.voters.push({ userId: user.id, voteType: 'upvote' });
      }

      await answer.save();
      return answer;
    },

    /**
     * Downvote an answer
     */
    downvoteAnswer: async (_, { answerId }, context) => {
      const user = authenticate(context);
      const answer = await Answer.findById(answerId);
      if (!answer) throw new GraphQLError('Answer not found');

      const existingVote = answer.voters.find(v => v.userId?.toString() === user.id);
      if (existingVote) {
        if (existingVote.voteType === 'downvote') {
          answer.votes += 1;
          answer.voters = answer.voters.filter(v => v.userId?.toString() !== user.id);
        } else {
          answer.votes -= 2;
          existingVote.voteType = 'downvote';
        }
      } else {
        answer.votes -= 1;
        answer.voters.push({ userId: user.id, voteType: 'downvote' });
      }

      await answer.save();
      return answer;
    },

    /**
     * Cast vote in election
     */
    vote: async (_, { candidateId, role }, context) => {
      const user = authorize(context, ['student']);
      
      const student = await Student.findOne({ userId: user.id });
      if (!student) throw new GraphQLError('Student profile not found');

      const election = await Election.findOne({
        instituteId: user.instituteId,
        status: 'active'
      });
      if (!election) throw new GraphQLError('No active election');

      const existingVote = await Vote.findOne({
        electionId: election._id,
        voterId: student._id,
        role
      });
      if (existingVote) throw new GraphQLError('Already voted for this role');

      const candidate = await Candidate.findById(candidateId);
      if (!candidate || candidate.electionId.toString() !== election._id.toString()) {
        throw new GraphQLError('Invalid candidate');
      }

      const vote = new Vote({
        electionId: election._id,
        voterId: student._id,
        candidateId,
        role
      });
      await vote.save();

      await Candidate.findByIdAndUpdate(candidateId, { $inc: { voteCount: 1 } });
      return true;
    },

    /**
     * Add course (admin)
     */
    addCourse: async (_, args, context) => {
      const user = authorize(context, ['college_admin', 'super_admin']);
      const course = new Course({
        ...args,
        instituteId: user.instituteId
      });
      await course.save();
      return course;
    },

    /**
     * Add student (admin)
     */
    addStudent: async (_, { name, email, rollnumber, section, branch, ug }, context) => {
      const user = authorize(context, ['college_admin', 'super_admin']);

      let studentUser = await User.findOne({ email });
      if (!studentUser) {
        const hashedPassword = await bcrypt.hash('defaultPassword123', 10);
        studentUser = new User({
          name, email, password: hashedPassword, role: 'student',
          instituteId: user.instituteId, verificationStatus: 'verified'
        });
        await studentUser.save();
      }

      const student = new Student({
        userId: studentUser._id,
        instituteId: user.instituteId,
        rollnumber, section, branch, ug
      });
      await student.save();

      studentUser.profileId = student._id;
      await studentUser.save();

      return student;
    },

    /**
     * Add professor (admin)
     */
    addProfessor: async (_, { name, email }, context) => {
      const user = authorize(context, ['college_admin', 'super_admin']);

      let profUser = await User.findOne({ email });
      if (!profUser) {
        const hashedPassword = await bcrypt.hash('defaultPassword123', 10);
        profUser = new User({
          name, email, password: hashedPassword, role: 'faculty',
          instituteId: user.instituteId, verificationStatus: 'verified'
        });
        await profUser.save();
      }

      const professor = new Professor({
        userId: profUser._id,
        instituteId: user.instituteId,
        courses: []
      });
      await professor.save();

      profUser.profileId = professor._id;
      await profUser.save();

      return professor;
    }
  },

  // ─── FIELD RESOLVERS ──────────────────────────────────────────

  Question: {
    answersCount: (parent) => parent.answers?.length || 0,
    id: (parent) => parent._id || parent.id
  },

  Answer: {
    id: (parent) => parent._id || parent.id
  },

  Student: {
    id: (parent) => parent._id || parent.id
  },

  Professor: {
    id: (parent) => parent._id || parent.id
  },

  Course: {
    id: (parent) => parent._id || parent.id,
    gradeDistribution: (parent) => {
      if (parent.gradeDistribution) {
        return JSON.stringify(Object.fromEntries(parent.gradeDistribution));
      }
      return null;
    }
  },

  User: {
    id: (parent) => parent._id || parent.id
  },

  Election: {
    id: (parent) => parent._id || parent.id
  },

  Candidate: {
    id: (parent) => parent._id || parent.id
  },

  Institute: {
    id: (parent) => parent._id || parent.id
  },

  Payment: {
    id: (parent) => parent._id || parent.id
  }
};

export default resolvers;
