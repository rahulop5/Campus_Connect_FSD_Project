import Redis from 'ioredis';

let redisClient = null;
let isRedisConnected = false;

/**
 * Initialize Redis connection with graceful fallback.
 * If Redis is unavailable, the app continues without caching.
 */
const initRedis = () => {
  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT) || 6379;
  const hasPassword = !!process.env.REDIS_PASSWORD;

  console.log(`[Redis] Attempting connection to ${host}:${port} (password: ${hasPassword ? 'yes' : 'no'})...`);

  try {
    redisClient = new Redis({
      host,
      port,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          console.warn('[Redis] ❌ Max retries reached. Running WITHOUT cache.');
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true
    });

    redisClient.on('connect', () => {
      isRedisConnected = true;
      console.log(`[Redis] ✅ Connected successfully to ${host}:${port}`);
      console.log('[Redis] Caching is ACTIVE — cache HIT/MISS logs will appear below');
    });

    redisClient.on('error', (err) => {
      isRedisConnected = false;
      console.warn('[Redis] ❌ Connection error:', err.message);
    });

    redisClient.on('close', () => {
      isRedisConnected = false;
      console.warn('[Redis] Connection closed');
    });

    // Attempt connection
    redisClient.connect().catch(() => {
      console.warn('[Redis] ❌ Initial connection failed. Running WITHOUT cache.');
    });

  } catch (error) {
    console.warn('[Redis] ❌ Initialization failed:', error.message);
  }
};

/**
 * Get cached data by key
 * @param {string} key - Cache key
 * @returns {Object|null} - Parsed cached data or null
 */
export const getCache = async (key) => {
  if (!isRedisConnected || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn('[Redis] Get error:', error.message);
    return null;
  }
};

/**
 * Set cache with TTL
 * @param {string} key - Cache key
 * @param {Object} data - Data to cache
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 min)
 */
export const setCache = async (key, data, ttl = 300) => {
  if (!isRedisConnected || !redisClient) return;
  try {
    await redisClient.setex(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.warn('[Redis] Set error:', error.message);
  }
};

/**
 * Invalidate cache by pattern (e.g., "student:*")
 * @param {string} pattern - Key pattern to invalidate
 */
export const invalidateCache = async (pattern) => {
  if (!isRedisConnected || !redisClient) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
      console.log(`[Redis] Invalidated ${keys.length} keys matching: ${pattern}`);
    }
  } catch (error) {
    console.warn('[Redis] Invalidation error:', error.message);
  }
};

/**
 * Invalidate specific cache key
 * @param {string} key - Exact cache key
 */
export const invalidateKey = async (key) => {
  if (!isRedisConnected || !redisClient) return;
  try {
    await redisClient.del(key);
  } catch (error) {
    console.warn('[Redis] Delete error:', error.message);
  }
};

/**
 * Check if Redis is connected
 */
export const isConnected = () => isRedisConnected;

/**
 * Get Redis client instance (for advanced usage)
 */
export const getClient = () => redisClient;

// Initialize on import
initRedis();

export default { getCache, setCache, invalidateCache, invalidateKey, isConnected, getClient };
