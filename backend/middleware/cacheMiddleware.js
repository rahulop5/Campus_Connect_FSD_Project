import { getCache, setCache, isConnected } from '../config/redisClient.js';

/**
 * Cache middleware factory.
 * Checks Redis for cached response before hitting the controller.
 * Logs every cache HIT / MISS with timing to the console (visible in Render logs).
 * 
 * @param {Function} keyGenerator - Function that takes (req) and returns cache key string
 * @param {number} ttl - Time to live in seconds
 * @returns {Function} Express middleware
 */
export const cacheMiddleware = (keyGenerator, ttl = 300) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    try {
      const key = keyGenerator(req);

      // If Redis isn't connected, skip cache entirely
      if (!isConnected()) {
        console.log(`[Cache] SKIP  | ${req.method} ${req.originalUrl} | Redis not connected — going direct to DB`);
        res.set('X-Cache', 'SKIP');
        return next();
      }

      const cachedData = await getCache(key);
      const cacheCheckTime = Date.now() - startTime;
      
      if (cachedData) {
        // Cache HIT — serve from Redis
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', key);
        console.log(`[Cache] ✅ HIT  | ${req.method} ${req.originalUrl} | key: ${key} | ${cacheCheckTime}ms`);
        return res.json(cachedData);
      }

      // Cache MISS — intercept res.json to cache the response and log timing
      console.log(`[Cache] ❌ MISS | ${req.method} ${req.originalUrl} | key: ${key} | cache-check: ${cacheCheckTime}ms`);
      res.set('X-Cache', 'MISS');
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        const totalTime = Date.now() - startTime;
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setCache(key, data, ttl).catch(() => {});
          console.log(`[Cache] 💾 SET  | ${req.method} ${req.originalUrl} | key: ${key} | TTL: ${ttl}s | total: ${totalTime}ms`);
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.warn(`[Cache] ⚠️ ERR  | ${req.method} ${req.originalUrl} | ${error.message} | ${elapsed}ms`);
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
