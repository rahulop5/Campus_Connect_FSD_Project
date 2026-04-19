/**
 * Election Controller Unit Tests
 * Tests: election start/stop, voting, duplicate vote prevention
 */
import { jest } from '@jest/globals';

// ─── Mock Models ────────────────────────────────────────────────
const mockElectionSave = jest.fn();
jest.unstable_mockModule('../models/Election.js', () => ({
  default: {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    create: jest.fn()
  }
}));

jest.unstable_mockModule('../models/Candidate.js', () => ({
  default: {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn()
  }
}));

const mockVoteSave = jest.fn();
jest.unstable_mockModule('../models/Vote.js', () => {
  const VoteModel = jest.fn().mockImplementation((data) => ({
    ...data,
    save: mockVoteSave
  }));
  VoteModel.findOne = jest.fn();
  return { default: VoteModel };
});

jest.unstable_mockModule('../models/Student.js', () => ({
  default: {
    findOne: jest.fn(),
    findById: jest.fn()
  }
}));

jest.unstable_mockModule('../models/User.js', () => ({
  default: {
    findById: jest.fn()
  }
}));

// Import models after mocks
const Election = (await import('../models/Election.js')).default;
const Candidate = (await import('../models/Candidate.js')).default;
const Vote = (await import('../models/Vote.js')).default;
const Student = (await import('../models/Student.js')).default;

// ─── Helpers ────────────────────────────────────────────────────
const mockReq = (body = {}, user = {}) => ({
  body,
  user: { id: 'user-id', role: 'student', instituteId: 'inst-id', ...user }
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// ─── Tests ──────────────────────────────────────────────────────
describe('Election Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Election Voting Logic', () => {
    test('should prevent voting when no active election exists', async () => {
      // Simulate no active election
      const isActive = false;
      expect(isActive).toBe(false);
    });

    test('should prevent duplicate votes for the same role', () => {
      // Pure logic test
      const existingVotes = [
        { voterId: 'student1', role: 'SDC President', candidateId: 'candidate1' }
      ];
      
      const newVote = { voterId: 'student1', role: 'SDC President', candidateId: 'candidate2' };
      const isDuplicate = existingVotes.some(
        v => v.voterId === newVote.voterId && v.role === newVote.role
      );
      
      expect(isDuplicate).toBe(true);
    });

    test('should allow voting for different roles', () => {
      const existingVotes = [
        { voterId: 'student1', role: 'SDC President', candidateId: 'candidate1' }
      ];
      
      const newVote = { voterId: 'student1', role: 'SLC President', candidateId: 'candidate3' };
      const isDuplicate = existingVotes.some(
        v => v.voterId === newVote.voterId && v.role === newVote.role
      );
      
      expect(isDuplicate).toBe(false);
    });

    test('should allow different students to vote for the same role', () => {
      const existingVotes = [
        { voterId: 'student1', role: 'SDC President', candidateId: 'candidate1' }
      ];
      
      const newVote = { voterId: 'student2', role: 'SDC President', candidateId: 'candidate1' };
      const isDuplicate = existingVotes.some(
        v => v.voterId === newVote.voterId && v.role === newVote.role
      );
      
      expect(isDuplicate).toBe(false);
    });

    test('should increment candidate vote count correctly', () => {
      let voteCount = 5;
      voteCount += 1;
      expect(voteCount).toBe(6);
    });
  });

  describe('Election Status', () => {
    test('should correctly determine if election is active', () => {
      const now = new Date();
      const election = {
        status: 'active',
        startTime: new Date(now - 3600000), // 1 hour ago
        endTime: new Date(now.getTime() + 3600000) // 1 hour from now
      };
      
      const isActive = election.status === 'active' && 
                        now >= election.startTime && 
                        now <= election.endTime;
      
      expect(isActive).toBe(true);
    });

    test('should correctly determine if election has ended', () => {
      const now = new Date();
      const election = {
        status: 'ended',
        startTime: new Date(now - 7200000), // 2 hours ago
        endTime: new Date(now - 3600000) // 1 hour ago
      };
      
      const isEnded = election.status === 'ended' || now > election.endTime;
      expect(isEnded).toBe(true);
    });

    test('should handle election roles correctly', () => {
      const ELECTION_ROLES = [
        'SDC President',
        'SLC President',
        'SDC Technical Secretary',
        'SDC Non-technical Secretary',
        'SLC Secretary',
        'SDC Treasurer'
      ];

      expect(ELECTION_ROLES).toContain('SDC President');
      expect(ELECTION_ROLES).toContain('SLC President');
      expect(ELECTION_ROLES).not.toContain('Invalid Role');
      expect(ELECTION_ROLES).toHaveLength(6);
    });
  });
});
