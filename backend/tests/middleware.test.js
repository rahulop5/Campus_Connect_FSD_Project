/**
 * Auth Middleware Unit Tests
 * Tests: verifyToken, checkRole
 */
import { jest } from '@jest/globals';

// Mock jsonwebtoken
const mockVerify = jest.fn();
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    verify: mockVerify
  }
}));

process.env.JWT_SECRET = 'test-secret';

const { verifyToken, checkRole } = await import('../middleware/authMiddleware.js');

// ─── Helpers ────────────────────────────────────────────────────
const mockReq = (headers = {}, user = null) => ({
  headers,
  user
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

// ─── Tests ──────────────────────────────────────────────────────
describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── verifyToken ──────────────────────────────────────────
  describe('verifyToken', () => {
    test('should return 403 if no token provided', () => {
      const req = mockReq({});
      const res = mockRes();

      verifyToken(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 403 if authorization header has no Bearer token', () => {
      const req = mockReq({ authorization: 'Basic abc123' });
      const res = mockRes();

      verifyToken(req, res, mockNext);

      // split(' ')[1] would return 'abc123' from 'Basic abc123'
      // jwt.verify will be called with 'abc123'
      expect(mockVerify).toHaveBeenCalled();
    });

    test('should return 401 if token is invalid', () => {
      mockVerify.mockImplementation((token, secret, cb) => {
        cb(new Error('Invalid token'), null);
      });
      const req = mockReq({ authorization: 'Bearer invalid-token' });
      const res = mockRes();

      verifyToken(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should call next() with decoded user on valid token', () => {
      const decoded = { id: 'user123', role: 'student' };
      mockVerify.mockImplementation((token, secret, cb) => {
        cb(null, decoded);
      });
      const req = mockReq({ authorization: 'Bearer valid-token' });
      const res = mockRes();

      verifyToken(req, res, mockNext);

      expect(req.user).toEqual(decoded);
      expect(mockNext).toHaveBeenCalled();
    });

    test('should extract token correctly from Bearer scheme', () => {
      const decoded = { id: 'user123', role: 'admin' };
      mockVerify.mockImplementation((token, secret, cb) => {
        expect(token).toBe('my-jwt-token');
        cb(null, decoded);
      });
      const req = mockReq({ authorization: 'Bearer my-jwt-token' });
      const res = mockRes();

      verifyToken(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  // ─── checkRole ────────────────────────────────────────────
  describe('checkRole', () => {
    test('should return 403 if user has no role', () => {
      const middleware = checkRole(['admin']);
      const req = mockReq({}, {});
      const res = mockRes();

      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Access denied' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should return 403 if user role is not in allowed roles', () => {
      const middleware = checkRole(['admin', 'super_admin']);
      const req = mockReq({}, { role: 'student' });
      const res = mockRes();

      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should call next() if user role is in allowed roles', () => {
      const middleware = checkRole(['student', 'faculty']);
      const req = mockReq({}, { role: 'student' });
      const res = mockRes();

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('should handle multiple allowed roles correctly', () => {
      const middleware = checkRole(['college_admin', 'super_admin', 'faculty']);
      const req = mockReq({}, { role: 'faculty' });
      const res = mockRes();

      middleware(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('should return 403 if req.user is null', () => {
      const middleware = checkRole(['admin']);
      const req = { user: null };
      const res = mockRes();

      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
