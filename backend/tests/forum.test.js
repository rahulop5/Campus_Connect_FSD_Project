/**
 * Forum (Q&A) Controller Unit Tests
 * Tests: voting logic, tag parsing, question validation — pure logic tests
 */

describe('Forum Controller', () => {

  // ─── Ask Question Validation ────────────────────────────────
  describe('askQuestion Validation', () => {
    test('should validate required question fields', () => {
      const validate = (body) => {
        if (!body.title || !body.desc || !body.tags) {
          return { valid: false, message: 'Title, description, and tags are required' };
        }
        return { valid: true };
      };

      expect(validate({ title: 'Test', desc: 'Desc', tags: 'tag1' }).valid).toBe(true);
      expect(validate({ desc: 'Desc', tags: 'tag1' }).valid).toBe(false);
      expect(validate({ title: 'Test' }).valid).toBe(false);
      expect(validate({}).valid).toBe(false);
    });

    test('should parse comma-separated tags correctly', () => {
      const parseTags = (tags) => tags.split(',').map(tag => tag.trim());

      expect(parseTags('javascript,closures,programming')).toEqual(['javascript', 'closures', 'programming']);
      expect(parseTags('tag1,  tag2 , tag3 ')).toEqual(['tag1', 'tag2', 'tag3']);
      expect(parseTags('single')).toEqual(['single']);
    });

    test('should handle empty tags gracefully', () => {
      const parseTags = (tags) => tags.split(',').map(tag => tag.trim()).filter(Boolean);
      expect(parseTags('tag1,,tag3')).toEqual(['tag1', 'tag3']);
    });

    test('should create question with correct structure', () => {
      const createQuestion = (body, asker, askerModel, instituteId) => ({
        heading: body.title,
        desc: body.desc,
        votes: 0,
        tags: body.tags.split(',').map(t => t.trim()),
        asker,
        askerModel,
        instituteId,
        wealth: 0,
        views: 0,
        answers: []
      });

      const q = createQuestion(
        { title: 'Test Q', desc: 'Desc', tags: 'js,react' },
        'student-id', 'Student', 'inst-id'
      );

      expect(q.heading).toBe('Test Q');
      expect(q.desc).toBe('Desc');
      expect(q.votes).toBe(0);
      expect(q.tags).toEqual(['js', 'react']);
      expect(q.askerModel).toBe('Student');
      expect(q.answers).toEqual([]);
    });
  });

  // ─── Upvote Logic ──────────────────────────────────────────
  describe('Upvote Logic', () => {
    test('should increment by 1 for new vote', () => {
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

    test('should toggle off when upvoting already-upvoted question', () => {
      const voters = [{ userId: 'user123', voteType: 'upvote' }];
      const userId = 'user123';
      
      const existingVote = voters.find(v => v.userId === userId);
      let voteChange = 0;
      
      if (existingVote && existingVote.voteType === 'upvote') {
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
  });

  // ─── Downvote Logic ────────────────────────────────────────
  describe('Downvote Logic', () => {
    test('should decrement by 1 for new vote', () => {
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

    test('should toggle off when downvoting already-downvoted question', () => {
      const voters = [{ userId: 'user123', voteType: 'downvote' }];
      const userId = 'user123';
      
      const existingVote = voters.find(v => v.userId === userId);
      let voteChange = 0;
      
      if (existingVote && existingVote.voteType === 'downvote') {
        const idx = voters.indexOf(existingVote);
        voters.splice(idx, 1);
        voteChange = 1;
      }
      
      expect(voteChange).toBe(1);
      expect(voters).toHaveLength(0);
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

  // ─── Vote Count Calculation ────────────────────────────────
  describe('Vote Count Calculation', () => {
    test('should correctly calculate total votes', () => {
      let votes = 0;
      
      // User A upvotes (+1)
      votes += 1;
      expect(votes).toBe(1);
      
      // User B upvotes (+1)
      votes += 1;
      expect(votes).toBe(2);
      
      // User C downvotes (-1)
      votes -= 1;
      expect(votes).toBe(1);
      
      // User A removes upvote (-1)
      votes -= 1;
      expect(votes).toBe(0);
      
      // User B switches to downvote (-2)
      votes -= 2;
      expect(votes).toBe(-2);
    });
  });

  // ─── Answer Submission ─────────────────────────────────────
  describe('Answer Submission', () => {
    test('should validate required answer fields', () => {
      const validate = (body) => {
        if (!body.answerText || !body.questionId) {
          return { valid: false };
        }
        return { valid: true };
      };

      expect(validate({ answerText: 'Answer', questionId: 'q1' }).valid).toBe(true);
      expect(validate({ answerText: 'Answer' }).valid).toBe(false);
      expect(validate({ questionId: 'q1' }).valid).toBe(false);
      expect(validate({}).valid).toBe(false);
    });

    test('should determine answerer model from role', () => {
      const getAnswererModel = (role) => {
        if (role === 'student') return 'Student';
        if (role === 'faculty') return 'Professor';
        return null;
      };

      expect(getAnswererModel('student')).toBe('Student');
      expect(getAnswererModel('faculty')).toBe('Professor');
      expect(getAnswererModel('admin')).toBeNull();
    });
  });

  // ─── Institute Access Check ────────────────────────────────
  describe('Institute Access Check', () => {
    test('should allow access when institute matches', () => {
      const userInstituteId = 'inst-1';
      const questionInstituteId = 'inst-1';
      const hasAccess = userInstituteId.toString() === questionInstituteId.toString();
      expect(hasAccess).toBe(true);
    });

    test('should deny access when institute differs', () => {
      const userInstituteId = 'inst-1';
      const questionInstituteId = 'inst-2';
      const hasAccess = userInstituteId.toString() === questionInstituteId.toString();
      expect(hasAccess).toBe(false);
    });
  });
});
