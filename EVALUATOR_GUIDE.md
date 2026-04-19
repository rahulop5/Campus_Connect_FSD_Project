# Campus Connect — Evaluator Guide

> This document covers three key areas: **Running Tests**, **Redis Caching**, and **Dockerfile Explanation**.

---

## Table of Contents

1. [How to Run Tests and Show Results](#1-how-to-run-tests-and-show-results)
2. [Redis — How It Works and Where to Demonstrate](#2-redis--how-it-works-and-where-to-demonstrate)
3. [Dockerfile Explanation (Line-by-Line)](#3-dockerfile-explanation-line-by-line)

---

## 1. How to Run Tests and Show Results

### Test Suite Overview

The project uses **Jest** (v30) as the testing framework. All tests are **pure logic / unit tests** — they don't require a running database or server. There are **7 test files** covering different modules:

| Test File | What It Tests |
|---|---|
| `tests/auth.test.js` | Role normalization, registration validation, JWT payload structure, login response format |
| `tests/student.test.js` | Attendance calculation & status, dashboard data formatting, date formatting, profile field validation, grade distribution |
| `tests/admin.test.js` | Dashboard aggregation, course CRUD validation, student/professor management, course assignment logic |
| `tests/forum.test.js` | Question validation, tag parsing, upvote/downvote logic, vote counting, answer submission, institute access control |
| `tests/election.test.js` | Voting logic, duplicate vote prevention, election status checks, candidate management, result calculation |
| `tests/payment.test.js` | Plan pricing, Razorpay order creation, payment signature verification, subscription management |
| `tests/middleware.test.js` | Token extraction from Bearer scheme, role-based access control (checkRole logic), JWT decoded user context |

### Commands to Run

All commands should be run from the **`backend/`** directory.

#### ① Run All Tests (basic)
```bash
npm test
```
This runs: `node --experimental-vm-modules node_modules/.bin/jest --verbose`

You'll see each test suite and every individual test case listed with ✓ (pass) or ✕ (fail) marks.

#### ② Run Tests with Coverage Report
```bash
npm run test:coverage
```
This runs: `node --experimental-vm-modules node_modules/.bin/jest --coverage --verbose`

This produces:
- A **text summary table** printed in the terminal showing line/branch/function/statement coverage percentages
- A detailed HTML report in `backend/coverage/` folder (open `coverage/index.html` in browser)
- The coverage threshold is set at **50%** minimum for branches, functions, lines, and statements

#### ③ Run Tests and Save Output to a File
```bash
npm run test:report
```
This runs: `node --experimental-vm-modules node_modules/.bin/jest --coverage --verbose 2>&1 | tee test-results.txt`

This does the same as `test:coverage` but **also saves** the full output to `backend/test-results.txt` — useful if you need to submit the results as proof.

#### ④ Run a Single Test File
```bash
npx jest tests/auth.test.js --verbose
```
Replace `auth.test.js` with any other test file name.

### What the Output Looks Like

```
 PASS  tests/auth.test.js
  Auth Controller
    normalizeRole
      ✓ should normalize "professor" to "faculty" (2 ms)
      ✓ should normalize "admin" to "college_admin" (1 ms)
      ✓ should keep valid roles unchanged (1 ms)
      ✓ should default invalid roles to "user" (1 ms)
      ...
    Registration Validation Logic
      ✓ should reject missing name (1 ms)
      ...

Test Suites: 7 passed, 7 total
Tests:       XX passed, XX total
Snapshots:   0 total
Time:        X.XXX s
```

### Coverage Report Table (sample)

```
-----------------------|---------|----------|---------|---------|
File                   | % Stmts | % Branch | % Funcs | % Lines |
-----------------------|---------|----------|---------|---------|
All files              |   XX.XX |    XX.XX |   XX.XX |   XX.XX |
 controllers/          |   XX.XX |    XX.XX |   XX.XX |   XX.XX |
 middleware/           |   XX.XX |    XX.XX |   XX.XX |   XX.XX |
 config/redisClient.js |   XX.XX |    XX.XX |   XX.XX |   XX.XX |
-----------------------|---------|----------|---------|---------|
```

### Jest Configuration (`jest.config.js`)

| Setting | Value | Purpose |
|---|---|---|
| `testEnvironment` | `node` | Tests run in Node.js (not browser) |
| `testMatch` | `**/tests/**/*.test.js` | Only picks up `.test.js` files inside `tests/` folder |
| `collectCoverageFrom` | controllers, middleware, redisClient, graphql | Measures coverage for business logic files |
| `coverageThreshold` | 50% for all metrics | Build fails if coverage drops below 50% |
| `verbose` | `true` | Shows individual test names |
| `forceExit` | `true` | Forces Jest to exit after tests complete |
| `testTimeout` | `10000` (10s) | Maximum time per test case |

---

## 2. Redis — How It Works and Where to Demonstrate

### 2.1 What Redis Does in This Project

Redis is used as an **in-memory caching layer** to speed up frequently-accessed GET API responses. Instead of hitting MongoDB on every request, the backend first checks Redis for a cached version. This results in significantly faster response times (typically 5-10x faster on cache hits).

The app uses **`ioredis`** (v5.10.1) as the Redis client library.

### 2.2 Architecture Overview

```
Client Request
    │
    ▼
Express Route (e.g. /api/student/dashboard)
    │
    ▼
cacheMiddleware ──── Redis Cache HIT? ──── YES ──→ Return cached JSON
    │                                              (X-Cache: HIT header)
    NO (Cache MISS)
    │
    ▼
Controller (query MongoDB)
    │
    ▼
Response intercepted → stored in Redis with TTL
    │
    ▼
Return JSON to client (X-Cache: MISS header)
```

### 2.3 Key Files

#### `config/redisClient.js` — Redis Client Setup
- **Connects** to Redis using environment variables (`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`) or defaults to `localhost:6379`
- **Graceful fallback**: If Redis is down, the app continues working without caching (no crash)
- **Exported functions**:
  - `getCache(key)` — retrieves cached data by key
  - `setCache(key, data, ttl)` — stores data with Time-To-Live (default 300s = 5 min)
  - `invalidateCache(pattern)` — deletes keys matching a pattern (e.g., `student:*`)
  - `invalidateKey(key)` — deletes a specific key
  - `isConnected()` — returns true/false for Redis connection status

#### `middleware/cacheMiddleware.js` — Express Middleware
- **Factory function**: `cacheMiddleware(keyGenerator, ttl)` creates route-specific caching
- On each request, it generates a cache key using the provided function (e.g., `student:dashboard:userId123`)
- Sets `X-Cache: HIT` or `X-Cache: MISS` response headers so you can verify caching in browser DevTools
- Only caches **successful responses** (HTTP 2xx)

#### Pre-defined Cache Keys (`CacheKeys` object):
| Key Pattern | Route | TTL |
|---|---|---|
| `student:dashboard:{userId}` | `/api/student/dashboard` | 300s (5 min) |
| `student:profile:{userId}` | `/api/student/profile` | 300s |
| `student:attendance:{userId}` | `/api/student/attendance` | 300s |
| `student:bellgraph:{userId}` | `/api/student/bellgraph` | 600s (10 min) |
| `forum:questions:{instituteId}` | `/api/forum/questions` | 120s (2 min) |
| `forum:question:{questionId}` | `/api/forum/question/:id` | 120s |
| `election:{instituteId}` | `/api/election/` | 60s (1 min) |
| `admin:dashboard:{userId}` | `/api/admin/dashboard` | 180s (3 min) |

### 2.4 Cache Invalidation (Write-Through)

When data **changes** (POST/PUT/DELETE operations), the relevant cache is **invalidated** automatically:

| Controller | When | Invalidation Pattern |
|---|---|---|
| `studentController.js` | Profile update | `student:*:{userId}` |
| `studentController.js` | Profile pic upload | `student:*:{userId}` |
| `studentController.js` | Profile pic delete | `student:*:{userId}` |
| `qandaforumController.js` | Ask question | `forum:*` |
| `qandaforumController.js` | Submit answer | `forum:*` |

### 2.5 How to Demonstrate Redis to the Evaluator

#### Method A: Show Redis Working via Terminal (redis-cli)

1. **Start Redis server** (if not already running):
   ```bash
   sudo systemctl start redis
   # or
   redis-server
   ```

2. **Check Redis is running**:
   ```bash
   redis-cli ping
   # Expected output: PONG
   ```

3. **Start the backend server**:
   ```bash
   cd backend
   nodemon index.js
   ```
   Look for the log message: `[Redis] Connected successfully`

4. **Make an API request** (e.g., login as a student, then hit dashboard). You can use the browser or curl.

5. **Check cached keys in Redis**:
   ```bash
   redis-cli KEYS '*'
   ```
   You should see keys like:
   ```
   1) "student:dashboard:681a606c07dc5eb482cbf2de"
   2) "student:profile:681a606c07dc5eb482cbf2de"
   ```

6. **Inspect a cached value**:
   ```bash
   redis-cli GET "student:dashboard:681a606c07dc5eb482cbf2de"
   ```
   This shows the JSON data that was cached.

7. **Check TTL (time remaining)**:
   ```bash
   redis-cli TTL "student:dashboard:681a606c07dc5eb482cbf2de"
   ```
   Shows remaining seconds before the key expires (e.g., `(integer) 287` means 287 seconds left).

8. **Demonstrate cache invalidation**: Update the student profile in the app, then run `KEYS '*'` again — the old `student:*` keys will be gone.

#### Method B: Show via Browser DevTools (Response Headers)

1. Open the app in Chrome/Firefox
2. Open **DevTools → Network** tab
3. Login as a student and navigate to the Dashboard
4. Click on the `/api/student/dashboard` request in the Network tab
5. Check the **Response Headers**:
   - First load: `X-Cache: MISS` (data fetched from MongoDB)
   - Refresh the page → `X-Cache: HIT` (data served from Redis cache — much faster!)

#### Method C: Run the Benchmark Script

There is a built-in benchmarking script at `scripts/benchmark-redis.js`:

```bash
# Set your JWT token first (get it from login)
export TEST_TOKEN="your-jwt-token-here"

# Run the benchmark
node scripts/benchmark-redis.js
```

This script:
- Hits multiple endpoints 10 times each
- Measures response time for cache HITs vs MISSes
- Shows a performance improvement percentage
- Produces a formatted summary table

#### Method D: Show in Code

Point the evaluator to these files:
1. **`config/redisClient.js`** — Redis client with connection, get/set/invalidate functions
2. **`middleware/cacheMiddleware.js`** — The middleware that checks cache before controller
3. **`routes/studentRoutes.js`** (line 23-26) — Example of `cacheMiddleware()` being applied to routes
4. **`controllers/studentController.js`** (line 269, 299, 335) — Cache invalidation on writes
5. **`index.js`** (line 39) — Redis initialized on server startup

### 2.6 Graceful Degradation

If Redis is **not running**, the app still works perfectly — it just doesn't cache. The console will show:
```
[Redis] Connection error: connect ECONNREFUSED 127.0.0.1:6379
[Redis] Max retries reached. Running without cache.
```

This is by design — every `getCache()` and `setCache()` call checks `isRedisConnected` before attempting any Redis operation.

---

## 3. Dockerfile Explanation (Line-by-Line)

The Dockerfile uses a **multi-stage build** pattern for a smaller, more secure production image.

### Full Dockerfile

```dockerfile
# ─── Build Stage ─────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# ─── Production Stage ────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

# Copy dependencies from build stage
COPY --from=build /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p logs uploads public/assets/profiles && \
    chown -R backend:nodejs /app

# Switch to non-root user
USER backend

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the application
CMD ["node", "index.js"]
```

### Stage 1: Build Stage (Lines 1–10)

```dockerfile
FROM node:20-alpine AS build
```
- **What**: Uses `node:20-alpine` as the base image — a lightweight Linux (Alpine) image with Node.js v20 pre-installed
- **Why Alpine**: Alpine is ~5MB vs ~100MB for regular Ubuntu-based images. Much smaller final image
- **`AS build`**: Names this stage "build" so we can reference it later in the multi-stage build

```dockerfile
WORKDIR /app
```
- Sets `/app` as the working directory inside the container. All subsequent commands run from here

```dockerfile
COPY package*.json ./
```
- Copies `package.json` and `package-lock.json` into the container **before** copying the rest of the code
- **Why separately?** Docker caches each layer. If your code changes but `package.json` doesn't, Docker reuses the cached `node_modules` layer — this makes rebuilds **much faster**

```dockerfile
RUN npm ci --only=production
```
- **`npm ci`**: Clean install — installs exact versions from `package-lock.json` (more reliable and faster than `npm install`)
- **`--only=production`**: Skips devDependencies (Jest, etc.) — we don't need testing tools in production. This makes the image smaller

### Stage 2: Production Stage (Lines 12–42)

```dockerfile
FROM node:20-alpine
```
- Starts a **fresh** image. This is the actual image that will run in production
- The build stage's intermediate layers are discarded — only what we explicitly `COPY --from=build` carries over

```dockerfile
WORKDIR /app
```
- Sets the working directory again (this is a new image)

```dockerfile
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001
```
- **Security best practice**: Creates a non-root user (`backend`) and group (`nodejs`)
- `-S` = system user/group (no home directory, no login shell)
- `-g 1001` / `-u 1001` = explicit user/group IDs for consistency
- **Why?** Running as root inside a container is a security risk. If the container is compromised, the attacker only has limited `backend` user permissions, not root access

```dockerfile
COPY --from=build /app/node_modules ./node_modules
```
- Copies **only** the `node_modules` from the build stage into this production image
- This is the key benefit of multi-stage builds: the build stage's tools and cache aren't in the final image

```dockerfile
COPY . .
```
- Copies all application source code into the container
- The `.dockerignore` file ensures that `node_modules`, `tests`, `.env`, `coverage`, `logs`, etc. are **not** copied (keeps image clean)

```dockerfile
RUN mkdir -p logs uploads public/assets/profiles && \
    chown -R backend:nodejs /app
```
- Creates directories that the app needs at runtime:
  - `logs/` — for Morgan access logs (rotating file stream)
  - `uploads/` — for file uploads (CSV marksheets, etc.)
  - `public/assets/profiles/` — for profile pictures
- `chown -R backend:nodejs /app` — gives ownership of all files to the `backend` user so it can read/write

```dockerfile
USER backend
```
- Switches to the non-root `backend` user. All subsequent commands (including `CMD`) run as this user

```dockerfile
EXPOSE 3000
```
- **Documentation**: Tells Docker (and developers) that the app listens on port 3000
- This doesn't actually publish the port — you still need `-p 3000:3000` when running the container

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1
```
- **Health check**: Docker periodically checks if the app is alive
  - **`--interval=30s`**: Check every 30 seconds
  - **`--timeout=10s`**: Each check must respond within 10 seconds
  - **`--start-period=5s`**: Wait 5 seconds after container start before first check (gives app time to boot)
  - **`--retries=3`**: Mark unhealthy after 3 consecutive failures
- `wget --spider` makes a lightweight HEAD request to `http://localhost:3000/` (the root route returns "API is running")
- If the health check fails, Docker marks the container as **unhealthy** (useful for orchestrators like Docker Compose or Kubernetes to restart it)

```dockerfile
CMD ["node", "index.js"]
```
- **Starts the application** using Node.js directly (not `nodemon` — nodemon is for development only)
- Uses JSON array syntax (`["node", "index.js"]`) instead of shell form — this ensures proper signal handling (SIGTERM, SIGINT) for graceful shutdown

### `.dockerignore` File

```
node_modules
npm-debug.log
coverage
test-results.txt
.env
logs
uploads
.git
.gitignore
*.md
jest.config.js
tests
```

This prevents unnecessary files from being copied into the Docker image:
- `node_modules` — we install fresh ones with `npm ci`
- `.env` — secrets should be injected via environment variables at runtime, not baked into the image
- `tests/`, `jest.config.js`, `coverage/` — testing files aren't needed in production
- `logs/`, `uploads/` — runtime data, not part of the image
- `.git/` — version control history isn't needed

### How to Build and Run the Docker Image

```bash
# Build the image
cd backend
docker build -t campus-connect-backend .

# Run the container
docker run -d \
  --name campus-backend \
  -p 3000:3000 \
  -e MONGO_URI="your_mongodb_connection_string" \
  -e JWT_SECRET="your_jwt_secret" \
  -e REDIS_HOST="host.docker.internal" \
  campus-connect-backend

# Check health status
docker ps   # Shows STATUS column with (healthy) or (unhealthy)

# View logs
docker logs campus-backend
```

### Why Multi-Stage Build?

| Aspect | Single Stage | Multi-Stage (Our Approach) |
|---|---|---|
| Image Size | Larger (includes devDependencies, build tools) | Smaller (only production dependencies) |
| Security | More attack surface | Minimal attack surface |
| Build Cache | Less efficient | Layer caching optimized |
| Dev tools in prod? | Yes (Jest, etc.) | No — stripped out |

---

## Quick Reference Summary

| Topic | Key Command / Location |
|---|---|
| Run tests | `cd backend && npm test` |
| Run tests + coverage | `cd backend && npm run test:coverage` |
| Save test report | `cd backend && npm run test:report` |
| Test files location | `backend/tests/*.test.js` (7 files) |
| Redis client code | `backend/config/redisClient.js` |
| Cache middleware code | `backend/middleware/cacheMiddleware.js` |
| Redis in routes | `backend/routes/studentRoutes.js`, `adminRoutes.js`, `qandaforumRoutes.js`, `electionRoutes.js` |
| Cache invalidation | `backend/controllers/studentController.js`, `qandaforumController.js` |
| Redis benchmark | `node backend/scripts/benchmark-redis.js` |
| Check Redis status | `redis-cli ping` → should return `PONG` |
| Check cached keys | `redis-cli KEYS '*'` |
| Dockerfile | `backend/Dockerfile` (multi-stage build, 43 lines) |
| Build Docker image | `docker build -t campus-connect-backend .` |
