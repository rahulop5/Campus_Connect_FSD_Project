import { getCache, setCache } from '../config/redisClient.js';

/**
 * Cache middleware factory.
 * Checks Redis for cached response before hitting the controller.
 * 
 * @param {Function} keyGenerator - Function that takes (req) and returns cache key string
 * @param {number} ttl - Time to live in seconds
 * @returns {Function} Express middleware
 * 
 * Usage:
 *   router.get('/dashboard', cacheMiddleware((req) => `student:dashboard:${req.user.id}`, 300), controller);
 */
export const cacheMiddleware = (keyGenerator, ttl = 300) => {
  return async (req, res, next) => {
    try {
      const key = keyGenerator(req);
      const cachedData = await getCache(key);
      
      if (cachedData) {
        // Add header to indicate cache hit
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', key);
        return res.json(cachedData);
      }

      // Cache miss — intercept res.json to cache the response
      res.set('X-Cache', 'MISS');
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setCache(key, data, ttl).catch(() => {}); // Fire-and-forget
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      // On any cache error, just proceed without caching
      next();
    }
  };
};

/**
 * Cache key generators for common patterns
 */
export const CacheKeys = {
  studentDashboard: (req) => `student:dashboard:${req.user.id}`,
  studentProfile: (req) => `student:profile:${req.user.id}`,
  studentAttendance: (req) => `student:attendance:${req.user.id}`,
  studentBellgraph: (req) => `student:bellgraph:${req.user.id}`,
  forumQuestions: (req) => `forum:questions:${req.user.instituteId || 'all'}`,
  forumQuestion: (req) => `forum:question:${req.params.id}`,
  election: (req) => `election:${req.user.instituteId || 'all'}`,
  adminDashboard: (req) => `admin:dashboard:${req.user.instituteId || req.user.id}`,
  courseDetail: (req) => `course:${req.params.courseId}`,
  paymentSubscription: (req) => `payment:subscription:${req.user.id}`,
};

export default cacheMiddleware;
