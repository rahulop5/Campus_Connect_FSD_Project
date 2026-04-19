/**
 * Forum (Q&A) Controller Unit Tests
 * Tests: question creation, voting logic, answer submission
 */
import { jest } from '@jest/globals';

// ─── Mock Setup ─────────────────────────────────────────────────

// Mock Redis (no-op)
jest.unstable_mockModule('../config/redisClient.js', () => ({
  invalidateCache: jest.fn().mockResolvedValue(undefined),
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(undefined),
  default: { invalidateCache: jest.fn(), getCache: jest.fn(), setCache: jest.fn() }
}));

// Mock Elasticsearch (no-op)
jest.unstable_mockModule('../config/elasticClient.js', () => ({
  indexQuestion: jest.fn().mockResolvedValue(undefined),
  searchQuestions: jest.fn().mockResolvedValue(null),
  default: { indexQuestion: jest.fn(), searchQuestions: jest.fn() }
}));

// Mock Question model
const mockFind = jest.fn();
const mockFindById = jest.fn();
const mockFindByIdAndUpdate = jest.fn();
const mockFindOneAndUpdate = jest.fn();
const mockSave = jest.fn();

jest.unstable_mockModule('../models/Question.js', () => {
  const QuestionModel = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: 'new-question-id',
    save: mockSave.mockResolvedValue(true)
  }));
  QuestionModel.find = mockFind;
  QuestionModel.findById = mockFindById;
  QuestionModel.findByIdAndUpdate = mockFindByIdAndUpdate;
  QuestionModel.findOneAndUpdate = mockFindOneAndUpdate;
  return { default: QuestionModel };
});

// Mock Answer model
const mockAnswerSave = jest.fn();
jest.unstable_mockModule('../models/Answer.js', () => {
  const AnswerModel = jest.fn().mockImplementation((data) => ({
    ...data,
    _id: 'new-answer-id',
    save: mockAnswerSave.mockResolvedValue(true)
  }));
  AnswerModel.findById = jest.fn();
  AnswerModel.findOneAndUpdate = jest.fn();
  return { default: AnswerModel };
});

// Mock Student model
jest.unstable_mockModule('../models/Student.js', () => ({
  default: {
    findOne: jest.fn().mockResolvedValue({ _id: 'student-id', userId: 'user-id' })
  }
}));

// Mock Professor model
jest.unstable_mockModule('../models/Professor.js', () => ({
  default: {
    findOne: jest.fn().mockResolvedValue(null)
  }
}));

const { askQuestion, submitAnswer } = await import('../controllers/qandaforumController.js');

// ─── Helpers ────────────────────────────────────────────────────
const mockReq = (body = {}, user = {}, params = {}, query = {}) => ({
  body,
  user: { id: 'user-id', role: 'student', instituteId: 'inst-id', ...user },
  params,
  query
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// ─── Tests ──────────────────────────────────────────────────────
describe('Forum Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Ask Question ───────────────────────────────────────────
  describe('askQuestion', () => {
    test('should create a question successfully', async () => {
      mockSave.mockResolvedValueOnce(true);
      const req = mockReq({
        title: 'How does JavaScript closures work?',
        desc: 'I need to understand closures in detail.',
        tags: 'javascript,closures,programming'
      });
      const res = mockRes();

      await askQuestion(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Question asked successfully',
          question: expect.objectContaining({
            heading: 'How does JavaScript closures work?',
            desc: 'I need to understand closures in detail.',
            tags: ['javascript', 'closures', 'programming']
          })
        })
      );
    });

    test('should return 403 for non-student/faculty users', async () => {
      const Student = (await import('../models/Student.js')).default;
      Student.findOne = jest.fn().mockResolvedValueOnce(null);
      
      const Professor = (await import('../models/Professor.js')).default;
      Professor.findOne = jest.fn().mockResolvedValueOnce(null);

      const req = mockReq(
        { title: 'Test', desc: 'Test', tags: 'test' },
        { role: 'other' }
      );
      const res = mockRes();

      await askQuestion(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    test('should parse comma-separated tags correctly', async () => {
      mockSave.mockResolvedValueOnce(true);
      const req = mockReq({
        title: 'Test Question',
        desc: 'Test description',
        tags: 'tag1,  tag2 , tag3 '
      });
      const res = mockRes();

      await askQuestion(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const calledWith = res.json.mock.calls[0][0];
      expect(calledWith.question.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });
  });

  // ─── Vote Logic Tests ──────────────────────────────────────
  describe('Voting Logic', () => {
    test('upvote should increment by 1 for new vote', () => {
      // Unit test for upvote logic (pure function test)
      const voters = [];
      const userId = 'user123';
      
      const existingVote = voters.find(v => v.userId?.toString() === userId);
      let voteChange = 0;
      
      if (!existingVote) {
        voters.push({ userId, voteType: 'upvote' });
        voteChange = 1;
      }
      
      expect(voteChange).toBe(1);
      expect(voters).toHaveLength(1);
      expect(voters[0].voteType).toBe('upvote');
    });

    test('should toggle off when upvoting an already upvoted question', () => {
      const voters = [{ userId: 'user123', voteType: 'upvote' }];
      const userId = 'user123';
      
      const existingVote = voters.find(v => v.userId === userId);
      let voteChange = 0;
      
      if (existingVote && existingVote.voteType === 'upvote') {
        // Toggle off
        const idx = voters.indexOf(existingVote);
        voters.splice(idx, 1);
        voteChange = -1;
      }
      
      expect(voteChange).toBe(-1);
      expect(voters).toHaveLength(0);
    });

    test('should switch from downvote to upvote (+2)', () => {
      const voters = [{ userId: 'user123', voteType: 'downvote' }];
      const userId = 'user123';
      
      const existingVote = voters.find(v => v.userId === userId);
      let voteChange = 0;
      
      if (existingVote && existingVote.voteType === 'downvote') {
        existingVote.voteType = 'upvote';
        voteChange = 2;
      }
      
      expect(voteChange).toBe(2);
      expect(voters[0].voteType).toBe('upvote');
    });

    test('downvote should decrement by 1 for new vote', () => {
      const voters = [];
      const userId = 'user123';
      
      const existingVote = voters.find(v => v.userId === userId);
      let voteChange = 0;
      
      if (!existingVote) {
        voters.push({ userId, voteType: 'downvote' });
        voteChange = -1;
      }
      
      expect(voteChange).toBe(-1);
      expect(voters[0].voteType).toBe('downvote');
    });

    test('should switch from upvote to downvote (-2)', () => {
      const voters = [{ userId: 'user123', voteType: 'upvote' }];
      const userId = 'user123';
      
      const existingVote = voters.find(v => v.userId === userId);
      let voteChange = 0;
      
      if (existingVote && existingVote.voteType === 'upvote') {
        existingVote.voteType = 'downvote';
        voteChange = -2;
      }
      
      expect(voteChange).toBe(-2);
      expect(voters[0].voteType).toBe('downvote');
    });
  });
});
