import Question from '../models/Question.js';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Professor from '../models/Professor.js';
import { searchQuestions as esSearch } from '../config/elasticClient.js';

/**
 * Search forum questions using Elasticsearch with MongoDB fallback.
 * GET /api/search/questions?q=keyword&tags=tag1,tag2&sort=newest|votes|views&page=1&limit=20
 */
export const searchQuestions = async (req, res) => {
  try {
    const { q, tags, sort = 'newest', page = 1, limit = 20 } = req.query;
    const instituteId = req.user.instituteId;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const tagArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];

    // Try Elasticsearch first
    const esResult = await esSearch(q, {
      instituteId,
      tags: tagArray,
      sort,
      limit: parseInt(limit),
      offset
    });

    if (esResult) {
      // Elasticsearch succeeded — fetch full documents from MongoDB for the matched IDs
      const questionIds = esResult.results.map(r => r._id);
      const questions = await Question.find({ _id: { $in: questionIds } })
        .populate('answers')
        .lean();

      // Reorder by ES relevance score
      const questionMap = {};
      questions.forEach(q => { questionMap[q._id.toString()] = q; });
      const orderedQuestions = esResult.results
        .map(r => ({
          ...questionMap[r._id],
          _searchScore: r.score,
          _highlights: r.highlights
        }))
        .filter(q => q._id); // Filter out any missing docs

      return res.json({
        source: 'elasticsearch',
        total: esResult.total,
        page: parseInt(page),
        limit: parseInt(limit),
        questions: orderedQuestions
      });
    }

    // Fallback to MongoDB text search
    const mongoQuery = { instituteId };
    
    if (q) {
      mongoQuery.$text = { $search: q };
    }
    if (tagArray.length > 0) {
      mongoQuery.tags = { $in: tagArray };
    }

    let sortOption = {};
    switch (sort) {
      case 'votes': sortOption = { votes: -1 }; break;
      case 'views': sortOption = { views: -1 }; break;
      case 'oldest': sortOption = { createdAt: 1 }; break;
      default: sortOption = { createdAt: -1 };
    }

    // If text search, add text score for relevance
    let questionsQuery;
    if (q) {
      questionsQuery = Question.find(mongoQuery, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' }, ...sortOption });
    } else {
      questionsQuery = Question.find(mongoQuery).sort(sortOption);
    }

    const [questions, total] = await Promise.all([
      questionsQuery.skip(offset).limit(parseInt(limit)).populate('answers').lean(),
      Question.countDocuments(mongoQuery)
    ]);

    res.json({
      source: 'mongodb',
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      questions
    });
  } catch (error) {
    console.error('[Search] Questions search error:', error);
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
};

/**
 * Search users (students and professors) by name.
 * GET /api/search/users?q=keyword&role=student|faculty&page=1&limit=20
 */
export const searchUsers = async (req, res) => {
  try {
    const { q, role, page = 1, limit = 20 } = req.query;
    const instituteId = req.user.instituteId;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const nameRegex = new RegExp(q, 'i');
    const results = [];

    // Search users by name
    const userQuery = {
      name: nameRegex,
      ...(instituteId && { instituteId }),
      ...(role && { role })
    };

    const [users, total] = await Promise.all([
      User.find(userQuery)
        .select('name email role instituteId profileId')
        .skip(offset)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(userQuery)
    ]);

    // Enrich with profile data
    for (const user of users) {
      const enriched = { ...user };
      
      if (user.role === 'student' && user.profileId) {
        const student = await Student.findById(user.profileId)
          .select('rollnumber section branch ug')
          .lean();
        if (student) enriched.profile = student;
      } else if (user.role === 'faculty' && user.profileId) {
        const professor = await Professor.findById(user.profileId)
          .select('courses')
          .lean();
        if (professor) enriched.profile = professor;
      }
      
      results.push(enriched);
    }

    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      users: results
    });
  } catch (error) {
    console.error('[Search] Users search error:', error);
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
};
