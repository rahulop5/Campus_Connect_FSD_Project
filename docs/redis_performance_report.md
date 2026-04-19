# Redis Caching — Performance Report

## Overview
Redis is employed as an in-memory caching layer to reduce MongoDB query load and improve API response times for frequently accessed, rarely mutated endpoints.

## Architecture

```
Client Request → Express Middleware → Redis Cache Check
                                        ↓ MISS           ↓ HIT
                                   Controller → MongoDB   Return Cached Data
                                        ↓
                                   Cache Response → Redis
                                        ↓
                                   Return Response
```

### Configuration
- **Redis Client**: `ioredis` library
- **Connection**: Configurable via `REDIS_HOST` and `REDIS_PORT` environment variables
- **Graceful Fallback**: If Redis is unavailable, the application continues normally (cache miss = direct DB query)
- **Cache Headers**: `X-Cache: HIT` or `X-Cache: MISS` for debugging

## Cached Endpoints

| Endpoint | Cache Key Pattern | TTL | Invalidation Trigger |
|----------|------------------|-----|---------------------|
| `GET /api/student/dashboard` | `student:dashboard:{userId}` | 5 min | Profile update, grade upload |
| `GET /api/student/profile` | `student:profile:{userId}` | 5 min | Profile update, pic upload/delete |
| `GET /api/student/attendance` | `student:attendance:{userId}` | 5 min | CSV attendance upload |
| `GET /api/student/bellgraph` | `student:bellgraph:{userId}` | 10 min | Grade upload |
| `GET /api/forum/questions` | `forum:questions:{instituteId}` | 2 min | New question, vote |
| `GET /api/forum/question/:id` | `forum:question:{questionId}` | 2 min | New answer, vote |
| `GET /api/election` | `election:{instituteId}` | 1 min | Vote, election start/stop |
| `GET /api/admin/dashboard` | `admin:dashboard:{instituteId}` | 3 min | Any admin CRUD |
| `GET /api/courses/:id` | `course:{courseId}` | 10 min | Course update |

## Cache Invalidation Strategy

**Pattern-based invalidation** using Redis `KEYS` command:
- Student mutations → `invalidateCache('student:*:{userId}')` 
- Forum mutations → `invalidateCache('forum:*')`
- Election mutations → `invalidateCache('election:*')`
- Admin mutations → `invalidateCache('admin:*')`

## Performance Benchmarking

### Methodology
- Used the `scripts/benchmark-redis.js` script
- 10 sequential requests per endpoint
- First request is a cache MISS (cold), subsequent requests are cache HITs (warm)
- Measured using high-resolution `process.hrtime.bigint()`

### How to Run
```bash
# 1. Start the server with Redis running
npm run dev

# 2. Get a JWT token by logging in
# 3. Set the token and run benchmark
TEST_TOKEN=your_jwt_token node scripts/benchmark-redis.js
```

### Expected Results

| Endpoint | Cache MISS (ms) | Cache HIT (ms) | Improvement |
|----------|----------------|----------------|-------------|
| Student Dashboard | ~150-300ms | ~5-15ms | **90-95%** |
| Student Profile | ~80-150ms | ~3-10ms | **90-93%** |
| Forum Questions | ~200-400ms | ~5-15ms | **95-97%** |
| Election Data | ~100-200ms | ~3-10ms | **93-95%** |

> **Note**: Actual numbers depend on network latency to MongoDB Atlas, server load, and data volume. Redis runs locally with sub-millisecond access times versus MongoDB Atlas which has network round-trip overhead.

### Why These Improvements?
1. **Network Elimination**: Redis is local (sub-ms) vs MongoDB Atlas (5-50ms network RTT)
2. **No Query Processing**: Redis returns serialized JSON directly vs MongoDB parsing queries, running through indexes, and serializing BSON
3. **No Populate Overhead**: Cached responses pre-include populated references

## Implementation Files
- `backend/config/redisClient.js` — Redis connection, get/set/invalidate utilities
- `backend/middleware/cacheMiddleware.js` — Express middleware + cache key generators
- Controller files — Cache invalidation calls in mutation functions
- `backend/scripts/benchmark-redis.js` — Performance benchmarking tool
