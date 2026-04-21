# Campus Connect — Evaluator Guide

> This document covers four key areas: **Running Tests**, **Redis Caching**, **Dockerfile Explanation**, and **Elasticsearch**.

---

## Table of Contents

1. [How to Run Tests and Show Results](#1-how-to-run-tests-and-show-results)
2. [Redis — How It Works and Where to Demonstrate](#2-redis--how-it-works-and-where-to-demonstrate)
3. [Dockerfile Explanation (Line-by-Line)](#3-dockerfile-explanation-line-by-line)
4. [Elasticsearch — Full-Text Search Engine](#4-elasticsearch--full-text-search-engine)

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

#### Method A: Show via Browser DevTools (Response Headers) — EASIEST

1. Open the deployed app (or local app) in Chrome/Firefox
2. Open **DevTools → Network** tab
3. Login as a student and navigate to the Dashboard
4. Click on the `/api/student/dashboard` request in the Network tab
5. Check the **Response Headers**:
   - First load: `X-Cache: MISS` (data fetched from MongoDB)
   - Refresh the page → `X-Cache: HIT` (data served from Redis cache — much faster!)
6. You can also compare the response **time** — cache HITs will be noticeably faster

> This method works whether running locally or on Render. No redis-cli needed.

#### Method B: Show Redis Working via Terminal (redis-cli)

> **Note**: If you don't have `redis-cli` installed locally, that's fine — skip to Method A or C. Redis still works on Render deployment even without local tools.

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

### 2.6 Redis on Render (No redis-cli Locally)

> **You don't need `redis-cli` installed on your laptop to prove Redis is working.**

Here's why and how it works on Render:

#### Why It Works on Render Without Local Redis

- When the backend is **deployed on Render**, Render provides its own infrastructure. If you've set the `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` environment variables in Render's dashboard (pointing to a Redis provider like **Render Redis**, **Upstash**, **Redis Cloud**, or **Railway**), then Redis is running in the cloud — your laptop has nothing to do with it.
- The backend code in `config/redisClient.js` reads these env vars at startup:
  ```js
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  ```
- If no Redis env vars are set on Render, Redis simply won't connect and the app runs without caching (graceful fallback). The app **never crashes** due to missing Redis.

#### How to Prove Redis is Working on Render

1. **Check Render logs**: Go to your Render dashboard → your backend service → **Logs** tab. Look for these startup messages:
   ```
   [Redis] Attempting connection to <host>:<port> (password: yes)...
   [Redis] ✅ Connected successfully to <host>:<port>
   [Redis] Caching is ACTIVE — cache HIT/MISS logs will appear below
   ```
   If you see this, Redis is connected and caching is active.

2. **Look for cache HIT/MISS logs**: Once a user makes requests, you'll see logs like:
   ```
   [Cache] ❌ MISS | GET /api/student/dashboard | key: student:dashboard:abc123 | cache-check: 2ms
   [Cache] 💾 SET  | GET /api/student/dashboard | key: student:dashboard:abc123 | TTL: 300s | total: 145ms
   [Cache] ✅ HIT  | GET /api/student/dashboard | key: student:dashboard:abc123 | 3ms
   ```
   The first request is a MISS (goes to MongoDB: ~145ms), the second is a HIT (from Redis: ~3ms). **This proves Redis caching is working.**

3. **If you see this instead**:
   ```
   [Redis] Attempting connection to localhost:6379 (password: no)...
   [Redis] ❌ Initial connection failed. Running WITHOUT cache.
   [Cache] SKIP  | GET /api/student/dashboard | Redis not connected — going direct to DB
   ```
   It means Redis is NOT connected on Render. You'd need to add a Redis service and set the env vars.

4. **Browser DevTools method works on deployed app too**: Open your deployed Vercel frontend, go to DevTools → Network, and check for `X-Cache: HIT`/`MISS`/`SKIP` headers on API responses.

#### If You Want a Free Redis for Render

If Redis isn't set up on Render yet, the easiest free options:
- **Upstash** (https://upstash.com) — Free tier, serverless Redis, just copy the host/port/password into Render env vars
- **Redis Cloud** (https://redis.com/try-free/) — Free 30MB plan
- **Render Redis** — Render's own Redis add-on (check if free tier is available)

#### Does Render Use Your Dockerfile?

When you deploy by connecting a GitHub repo to Render, it depends on what you selected:

| Render Environment Setting | What Happens | Uses Dockerfile? |
|---|---|---|
| **Node** (default) | Render detects `package.json`, runs `npm install`, then your start command (`node index.js`) | ❌ No |
| **Docker** | Render builds using your `Dockerfile` | ✅ Yes |

**How to check**: Go to Render dashboard → your service → **Settings** → look for **Environment** (it will say `Node` or `Docker`).

Most likely you're on the **Node environment** (Render's default), which means:
- Your `Dockerfile` exists in the repo but is **not being used** by Render
- Render runs `npm install` + `node index.js` directly
- This is totally fine — the Dockerfile is there as an **option** for containerized deployment elsewhere (or you can switch Render to Docker mode)

### 2.7 Graceful Degradation

If Redis is **not running** (locally or on Render), the app still works perfectly — it just doesn't cache. The console/Render logs will show:
```
[Redis] Attempting connection to localhost:6379 (password: no)...
[Redis] ❌ Connection error: connect ECONNREFUSED 127.0.0.1:6379
[Redis] ❌ Max retries reached. Running WITHOUT cache.
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

## 4. Elasticsearch — Full-Text Search Engine

### 4.1 What Elasticsearch Does in This Project

Elasticsearch is used as a **full-text search engine** for the Q&A Forum module. It provides fast, relevance-ranked, fuzzy searches across forum questions — much more powerful than MongoDB's basic `$text` search.

The app uses **`@elastic/elasticsearch`** (v9.3.4) as the client library.

### 4.2 Architecture Overview

```
User types search query
    │
    ▼
GET /api/search/questions?q=react&tags=javascript&sort=votes
    │
    ▼
searchController.js
    │
    ├── Try Elasticsearch first
    │       │
    │       ├── ES Connected? YES → Run ES multi_match query
    │       │                        → Get matched question IDs + relevance scores
    │       │                        → Fetch full docs from MongoDB by those IDs
    │       │                        → Return results (source: 'elasticsearch')
    │       │
    │       └── ES Connected? NO or Error → Fall through ↓
    │
    └── Fallback to MongoDB text search ($text operator)
            → Return results (source: 'mongodb')
```

**Key point**: Elasticsearch is the **primary** search engine, with MongoDB as the **automatic fallback**. The API response includes a `source` field (`"elasticsearch"` or `"mongodb"`) so you can tell which one handled the search.

### 4.3 Key Files

#### `config/elasticClient.js` — Elasticsearch Client Setup

This file handles everything related to Elasticsearch:

- **Connection**: Connects to `process.env.ELASTICSEARCH_URL` or defaults to `http://localhost:9200`
- **Graceful fallback**: If Elasticsearch is unavailable, the app falls back to MongoDB text search (no crash)
- **Index management**: Creates a `campus_connect_questions` index with custom mappings

**Exported functions**:

| Function | Purpose |
|---|---|
| `indexQuestion(question)` | Adds a single question to the ES index (called when a new question is asked) |
| `searchQuestions(query, filters)` | Searches the ES index with fuzzy matching, filtering, sorting, and pagination |
| `bulkIndexQuestions(questions)` | Bulk-indexes all questions at once (for initial sync/migration) |
| `deleteQuestion(questionId)` | Removes a question from the ES index |
| `isConnected()` | Returns `true`/`false` for ES connection status |

#### Index Schema (`campus_connect_questions`)

The Elasticsearch index has a custom schema optimized for forum search:

```
Settings:
  - 1 shard, 0 replicas (single-node setup)
  - Custom analyzer: standard tokenizer + lowercase + stop words + snowball stemming

Mappings:
  heading      → text (custom_analyzer, boost: 2.0)  ← Titles weigh 2x more in relevance
  desc         → text (custom_analyzer)
  tags         → keyword (exact match, for filtering)
  asker        → keyword
  instituteId  → keyword (for institute-level access control)
  createdAt    → date
  votes        → integer
  views        → integer
  wealth       → integer
  answersCount → integer
```

**Why `boost: 2.0` on `heading`?** If a user searches for "react hooks", a question with "React Hooks" in the title should rank higher than one that only mentions it in the description.

**Why `snowball` stemming?** So searching "programming" also matches "programs", "programmed", etc.

#### `controllers/searchController.js` — Search Logic

Two search endpoints:

1. **`GET /api/search/questions`** — Search forum questions
   - Query params: `q` (search text), `tags` (comma-separated), `sort` (newest|votes|views|oldest), `page`, `limit`
   - First tries Elasticsearch with `multi_match` query (fuzzy matching across heading, desc, tags)
   - Falls back to MongoDB `$text` search if ES is unavailable
   - Returns `source: 'elasticsearch'` or `source: 'mongodb'` in the response

2. **`GET /api/search/users`** — Search users by name
   - Uses MongoDB regex search (not ES)
   - Enriches results with student/professor profile data

#### `controllers/qandaforumController.js` — ES Indexing on Write

When a new question is asked (`askQuestion` function, line 470):
```js
await indexQuestion(newQuestion);
```
This adds the question to both MongoDB AND Elasticsearch simultaneously, keeping the index in sync.

#### `routes/searchRoutes.js` — Search API Routes

```
GET /api/search/questions   → searchController.searchQuestions
GET /api/search/users       → searchController.searchUsers
```

Both routes require authentication (`verifyToken` middleware).

### 4.4 How Elasticsearch Search Works Internally

When a user searches for `"react hooks"` on the forum:

1. **ES `multi_match` query** is built:
   ```json
   {
     "multi_match": {
       "query": "react hooks",
       "fields": ["heading^2", "desc", "tags"],
       "type": "best_fields",
       "fuzziness": "AUTO"
     }
   }
   ```
   - `heading^2` — title matches score 2x higher
   - `fuzziness: AUTO` — handles typos (e.g., "recat" still matches "react")
   - `best_fields` — uses the highest-scoring field for the relevance score

2. **Filters** are applied (institute-level access, tag filtering)

3. **Results** come back with:
   - Relevance scores
   - Highlighted matching text (e.g., `<em>React</em> <em>Hooks</em> explained`)
   - Pagination support

4. **MongoDB enrichment**: ES results only contain IDs + basic fields, so the controller fetches the full documents from MongoDB using those IDs, then reorders them by ES relevance score.

### 4.5 How to Demonstrate Elasticsearch to the Evaluator

#### Method A: Show the Search API Response

Use the browser or Postman to call the search endpoint:

```bash
# Search for questions (replace TOKEN with a valid JWT)
curl -H "Authorization: Bearer TOKEN" \
  "https://your-render-url.onrender.com/api/search/questions?q=react&sort=votes"
```

The response will include a `source` field:
```json
{
  "source": "elasticsearch",   // ← Proves ES is handling the search
  "total": 5,
  "page": 1,
  "limit": 20,
  "questions": [ ... ]
}
```

If ES is not connected, it will say:
```json
{
  "source": "mongodb",   // ← Fallback is working
  ...
}
```

#### Method B: Show in Code

Walk the evaluator through these files:
1. **`config/elasticClient.js`** — Full ES setup: connection, index creation, search, indexing, bulk operations
2. **`controllers/searchController.js`** — Search logic with ES-first, MongoDB-fallback pattern
3. **`controllers/qandaforumController.js`** (line 470) — New questions are indexed into ES
4. **`routes/searchRoutes.js`** — API routes for search
5. **`index.js`** (line 40) — ES initialized on server startup

#### Method C: Show the Index Schema

Explain the custom analyzer and field mappings in `elasticClient.js` (lines 44-69):
- Custom analyzer with snowball stemming for better text matching
- Boosted `heading` field for title-priority relevance
- Keyword fields for exact-match filtering (tags, instituteId)

### 4.6 Elasticsearch vs MongoDB Text Search — Comparison

| Feature | MongoDB `$text` | Elasticsearch |
|---|---|---|
| Speed | Good for small datasets | Optimized for large-scale search |
| Fuzzy matching | ❌ No (exact word match) | ✅ Yes (handles typos) |
| Relevance scoring | Basic text score | Advanced TF-IDF / BM25 scoring |
| Field boosting | ❌ No | ✅ Yes (title weighs 2x) |
| Stemming | Basic | Full snowball stemming |
| Highlighting | ❌ No | ✅ Yes (highlighted matches) |
| Autocomplete | ❌ No | ✅ Possible |
| Fallback | N/A (always available) | Falls back to MongoDB when down |

### 4.7 Graceful Degradation (Same Pattern as Redis)

If Elasticsearch is **not running**, the app still works — searches fall back to MongoDB `$text` search. The console will show:
```
[Elasticsearch] Connection failed. Falling back to MongoDB text search.
[Elasticsearch] Error: connect ECONNREFUSED 127.0.0.1:9200
```

The `searchQuestions()` function returns `null` when ES is unavailable, which signals the controller to use the MongoDB fallback path. The user gets search results either way — they just won't have fuzzy matching or relevance scoring without ES.

### 4.8 Elasticsearch on Render

Similar to Redis, Elasticsearch on Render depends on whether you've set the `ELASTICSEARCH_URL` environment variable in Render's dashboard:

- **If set** (pointing to a cloud ES provider like **Elastic Cloud**, **Bonsai**, or **SearchBox**): ES connects and powers the search
- **If not set**: Falls back to `http://localhost:9200`, which won't be available on Render → the app uses MongoDB text search instead

Free Elasticsearch hosting options:
- **Bonsai** (https://bonsai.io) — Free tier with shared cluster
- **Elastic Cloud** (https://cloud.elastic.co) — 14-day free trial
- **SearchBox** (https://www.searchbox.io) — Free sandbox plan

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
| Redis on Render | Check Render logs for `[Redis] Connected successfully` |
| Elasticsearch client | `backend/config/elasticClient.js` |
| Search controller | `backend/controllers/searchController.js` |
| Search routes | `GET /api/search/questions`, `GET /api/search/users` |
| ES indexing on write | `backend/controllers/qandaforumController.js` (line 470) |
| Dockerfile | `backend/Dockerfile` (multi-stage build, 43 lines) |
| Build Docker image | `docker build -t campus-connect-backend .` |
