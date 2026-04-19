# Campus Connect — Enhancement User Manual

> **Author**: Auto-generated from implementation  
> **Last Updated**: April 2026  
> **Audience**: Developers, teammates, and evaluators

---

## Table of Contents
1. [What Was Done (Overview)](#1-what-was-done-overview)
2. [Project Structure (New Files)](#2-project-structure-new-files)
3. [DB Optimization — How It Works](#3-db-optimization)
4. [Redis Caching — How It Works](#4-redis-caching)
5. [Elasticsearch Search — How It Works](#5-elasticsearch-search)
6. [GraphQL API — How It Works](#6-graphql-api)
7. [Unit Testing — How to Run](#7-unit-testing)
8. [Docker — How to Deploy](#8-docker-deployment)
9. [How to Start the App (Development)](#9-how-to-start-the-app-development)
10. [Quick Reference & Commands](#10-quick-reference)

---

## 1. What Was Done (Overview)

We implemented **6 major enhancements** to make Campus Connect production-ready:

| # | Enhancement | What It Does | Why We Need It |
|---|------------|--------------|----------------|
| 1 | **DB Optimization** | Added MongoDB indexes to 8 models | Speeds up queries — no more full collection scans |
| 2 | **Redis Caching** | Added in-memory caching on API responses | Reduces DB load, makes repeated requests 90%+ faster |
| 3 | **Elasticsearch** | Added full-text search for forum questions | Better search with typo tolerance, ranking, and highlighting |
| 4 | **GraphQL API** | Added GraphQL endpoint alongside REST | Flexible querying, supports B2B/B2C patterns |
| 5 | **Unit Testing** | Added Jest test suite (7 files, 105 tests) | Verifies business logic correctness |
| 6 | **Docker** | Added Dockerfiles + docker-compose | One-command deployment of entire stack |

> **Important**: Redis and Elasticsearch are **optional** — if they're not running, the app gracefully falls back to working without them. The app still works exactly as before even without these services.

---

## 2. Project Structure (New Files)

Here's every new file that was added, organized by purpose:

```
Campus_Connect_FSD_Project/
│
├── docker-compose.yml                    ← Docker: runs all 4 services
│
├── backend/
│   ├── Dockerfile                        ← Docker: backend container
│   ├── .dockerignore                     ← Docker: excludes dev files
│   ├── jest.config.js                    ← Testing: Jest configuration
│   ├── package.json                      ← Updated: new deps + test scripts
│   │
│   ├── config/
│   │   ├── redisClient.js                ← Redis: connection + get/set/invalidate
│   │   └── elasticClient.js              ← Elasticsearch: connection + search
│   │
│   ├── middleware/
│   │   └── cacheMiddleware.js            ← Redis: auto-caching middleware
│   │
│   ├── controllers/
│   │   └── searchController.js           ← Search: ES-powered question/user search
│   │
│   ├── routes/
│   │   └── searchRoutes.js               ← Search: API route definitions
│   │
│   ├── graphql/
│   │   ├── schema.js                     ← GraphQL: type definitions
│   │   └── resolvers.js                  ← GraphQL: query/mutation handlers
│   │
│   ├── scripts/
│   │   └── benchmark-redis.js            ← Tool: measures cache performance
│   │
│   └── tests/
│       ├── auth.test.js                  ← Tests: authentication logic
│       ├── middleware.test.js             ← Tests: JWT & role middleware
│       ├── student.test.js               ← Tests: attendance, grades, dashboard
│       ├── forum.test.js                 ← Tests: voting, Q&A logic
│       ├── election.test.js              ← Tests: voting, duplicate prevention
│       ├── payment.test.js               ← Tests: pricing, subscriptions
│       └── admin.test.js                 ← Tests: CRUD, assignments
│
├── frontend/
│   ├── Dockerfile                        ← Docker: frontend container
│   ├── .dockerignore                     ← Docker: excludes dev files
│   └── nginx.conf                        ← Docker: Nginx reverse proxy config
│
└── docs/
    ├── db_optimization_report.md         ← Report: indexes added & why
    ├── redis_performance_report.md       ← Report: caching architecture & benchmarks
    ├── search_optimization_report.md     ← Report: Elasticsearch features
    ├── api_documentation.md              ← Report: REST + GraphQL API reference
    ├── testing_report.md                 ← Report: all test cases & results
    └── docker_guide.md                   ← Report: Docker setup instructions
```

### Files That Were Modified (Not New)

These existing files were modified to integrate the new features:

| File | What Changed |
|------|-------------|
| `models/Student.js` | Added 3 indexes (`userId`, `courses.course`, `instituteId`) |
| `models/User.js` | Added 3 indexes (role+institute, verification, subscription) |
| `models/Course.js` | Added 3 indexes (institute+section, professor, name) |
| `models/Question.js` | Added 3 indexes (institute+date, text search, asker) |
| `models/Answer.js` | Added 2 indexes (answerer, createdAt) |
| `models/Election.js` | Added 1 index (institute+status) |
| `models/Candidate.js` | Added 2 indexes (election+role, studentId) |
| `models/Payment.js` | Added 2 indexes (user+status, razorpayOrderId) |
| `routes/studentRoutes.js` | Added cache middleware to GET routes |
| `routes/qandaforumRoutes.js` | Added cache middleware to GET routes |
| `routes/electionRoutes.js` | Added cache middleware to GET route |
| `routes/adminRoutes.js` | Added cache middleware to dashboard GET |
| `routes/courseRoutes.js` | Added cache middleware to course GET |
| `controllers/studentController.js` | Added cache invalidation on profile updates |
| `controllers/qandaforumController.js` | Added cache invalidation + ES indexing on new questions |
| `index.js` | Mounted GraphQL, search routes, imported Redis/ES clients |
| `package.json` | Added new dependencies + test scripts |

---

## 3. DB Optimization

### What Are Indexes?
Indexes are like a book's table-of-contents for MongoDB. Without an index, MongoDB scans every document to find matches (slow). With an index, it jumps directly to matching documents (fast).

### What We Did
Added indexes to all models based on how our controllers query data. For example:
- **Student Dashboard** queries by `userId` → we added an index on `userId`
- **Forum listing** queries by `instituteId` and sorts by `createdAt` → we added a compound index `{instituteId, createdAt}`
- **Forum search** uses text search → we added a text index on `{heading, desc, tags}`

### How to Verify
You don't need to do anything — indexes are created automatically when the server starts and Mongoose connects to MongoDB. To verify in MongoDB Atlas:
1. Go to Atlas → Collections
2. Click on any collection (e.g., `students`)
3. Go to the **Indexes** tab
4. You'll see the new indexes listed

---

## 4. Redis Caching

### What Is Redis?
Redis is an in-memory database. It's much faster than MongoDB because data lives in RAM instead of disk. We use it to cache (temporarily store) API responses so repeated requests don't hit MongoDB.

### How It Works

```
1. User requests GET /api/student/dashboard
2. Cache middleware checks Redis for key "student:dashboard:userId123"
   → If found (HIT): returns cached response immediately (5ms)
   → If not found (MISS): 
     a. Lets the request go to the controller
     b. Controller queries MongoDB (~150ms)
     c. Middleware caches the response in Redis with a TTL (5 min)
     d. Returns response to user
3. Next request for same data → served from Redis (5ms instead of 150ms)
4. When user updates profile → cache is invalidated (deleted)
5. Next request after update → fresh data from MongoDB, cached again
```

### Which Endpoints Are Cached?
| Endpoint | Cache Duration | 
|----------|---------------|
| Student dashboard | 5 minutes |
| Student profile | 5 minutes |
| Student attendance | 5 minutes |
| Student bellgraph | 10 minutes |
| Forum questions list | 2 minutes |
| Forum question detail | 2 minutes |
| Election data | 1 minute |
| Admin dashboard | 3 minutes |
| Course details | 10 minutes |

### How to Debug Cache
Check the response headers:
- `X-Cache: HIT` → response came from Redis
- `X-Cache: MISS` → response came from MongoDB (and was cached for next time)

### Do I Need Redis Running?
**No!** The app works fine without Redis. If Redis isn't running:
- You'll see `[Redis] Initial connection failed. Running without cache.` in the console
- All requests go directly to MongoDB (same as before)
- No errors, no crashes

### How to Start Redis (If You Want Caching)
```bash
# Option 1: Docker (easiest)
docker run -d -p 6379:6379 redis:7-alpine

# Option 2: Install locally
sudo apt install redis-server
sudo systemctl start redis
```

### How to Run the Benchmark
```bash
# 1. Make sure the backend is running
npm run dev

# 2. Login to get a JWT token, then:
TEST_TOKEN=your_jwt_token node scripts/benchmark-redis.js
```

---

## 5. Elasticsearch Search

### What Is Elasticsearch?
Elasticsearch is a search engine. Unlike MongoDB's basic text search, it supports:
- **Fuzzy matching**: searching "javscript" still finds "javascript"
- **Relevance ranking**: more relevant results appear first
- **Highlighting**: matched terms are highlighted in results
- **Field boosting**: title matches rank higher than description matches

### How It Works
```
1. User searches "javascript closures"
2. Search controller checks if Elasticsearch is connected
   → If YES: sends query to ES, gets ranked results with highlights
   → If NO: falls back to MongoDB $text search (basic but functional)
3. Results are returned with source indicator ("elasticsearch" or "mongodb")
```

### Using the Search API

**Search Questions:**
```
GET /api/search/questions?q=javascript&tags=programming&sort=votes&page=1&limit=20
```

**Search Users:**
```
GET /api/search/users?q=Rahul&role=student&page=1&limit=20
```

### Do I Need Elasticsearch Running?
**No!** Same as Redis — if ES isn't running, search falls back to MongoDB text search automatically. You'll see `[Elasticsearch] Connection failed. Falling back to MongoDB text search.` in console.

### How to Start Elasticsearch (If You Want Advanced Search)
```bash
# Docker (easiest)
docker run -d -p 9200:9200 -e "discovery.type=single-node" -e "xpack.security.enabled=false" docker.elastic.co/elasticsearch/elasticsearch:8.12.0
```

---

## 6. GraphQL API

### What Is GraphQL?
GraphQL is an alternative to REST. Instead of hitting different endpoints for different data, you send a single query specifying exactly what fields you need.

**REST way** (multiple requests):
```
GET /api/student/profile   → { name, email, rollnumber, ... }
GET /api/student/attendance → { courses: [...] }
```

**GraphQL way** (single request):
```graphql
query {
  studentProfile {
    rollnumber
    section
    courses {
      course { name }
      attendance
    }
  }
}
```

### Where Is It?
- **Endpoint**: `http://localhost:3000/graphql`
- **Playground**: Open the same URL in your browser — you get an interactive query editor!

### How to Use (with Authorization)
Add this header to your GraphQL requests:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Example Queries You Can Try

**Login:**
```graphql
mutation {
  login(email: "test@example.com", password: "password123") {
    token
    user { id name role }
  }
}
```

**Get My Profile:**
```graphql
query {
  me {
    id
    name
    email
    role
    verificationStatus
  }
}
```

**Get Student Dashboard:**
```graphql
query {
  studentDashboard {
    rollnumber
    section
    branch
    courses {
      course { name credits }
      attendance
      grade
    }
  }
}
```

**Search Forum:**
```graphql
query {
  searchQuestions(q: "database", sort: "votes", page: 1) {
    total
    questions {
      id
      heading
      votes
      tags
      answersCount
    }
  }
}
```

**Ask a Question:**
```graphql
mutation {
  askQuestion(heading: "How to use GraphQL?", desc: "I want to learn", tags: ["graphql", "api"]) {
    id
    heading
    createdAt
  }
}
```

### B2B vs B2C Queries
- **B2C** (student/faculty): `me`, `studentDashboard`, `questions`, `vote` — scoped to the logged-in user
- **B2B** (admin/integration): `students(page, limit)`, `adminDashboard`, `addStudent`, `addCourse` — operates across users, requires admin role

---

## 7. Unit Testing

### What Was Tested?
We test the **business logic** of each controller without actually connecting to MongoDB:

| Test File | What It Tests | # Tests |
|-----------|---------------|---------|
| `auth.test.js` | Role normalization, input validation, JWT payload structure | 16 |
| `middleware.test.js` | Token extraction from headers, role-based access control | 15 |
| `student.test.js` | Attendance %, status colors, dashboard formatting, grade distribution | 14 |
| `forum.test.js` | Upvote/downvote toggle logic, tag parsing, access control | 15 |
| `election.test.js` | Duplicate vote prevention, election status, result calculation | 12 |
| `payment.test.js` | Plan pricing, Razorpay verification, subscription management | 14 |
| `admin.test.js` | Course/student/professor CRUD validation, assignment logic | 19 |

### How to Run

```bash
cd backend

# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run a specific test file
npx jest tests/auth.test.js --verbose

# Save output to a file
npm run test:report
```

### Expected Output
```
Test Suites: 7 passed, 7 total
Tests:       105 passed, 105 total
Snapshots:   0 total
Time:        ~0.5s
```

---

## 8. Docker Deployment

### What Does Docker-Compose Start?
4 services in one command:

| Service | Container Name | Port | What It Does |
|---------|---------------|------|-------------|
| Frontend | `campus-connect-frontend` | 80 | Nginx serving React app |
| Backend | `campus-connect-backend` | 3000 | Express.js API + GraphQL |
| Redis | `campus-connect-redis` | 6379 | Caching layer |
| Elasticsearch | `campus-connect-elasticsearch` | 9200 | Search engine |

### How to Use

```bash
# 1. Make sure Docker and Docker Compose are installed
docker --version
docker-compose --version

# 2. From the project root, build and start everything
docker-compose up --build

# 3. Access the app
#    Frontend:  http://localhost
#    Backend:   http://localhost:3000
#    Swagger:   http://localhost:3000/api-docs
#    GraphQL:   http://localhost:3000/graphql

# 4. Stop everything
docker-compose down

# 5. Stop and delete all data (clean reset)
docker-compose down -v
```

### Important Notes
- MongoDB is **not** in Docker — we still use **MongoDB Atlas** (cloud). The connection URI is in `backend/.env`
- Redis and Elasticsearch data is persisted in Docker volumes, so it survives restarts
- The frontend Nginx config automatically proxies `/api/*` and `/graphql` requests to the backend

---

## 9. How to Start the App (Development)

### Without Docker (same as before, but now with optional services)
```bash
# Terminal 1: Backend
cd backend
npm install    # first time only
npm run dev    # starts on port 3000

# Terminal 2: Frontend
cd frontend
npm install    # first time only
npm run dev    # starts on port 5173
```

The app works exactly as before. Redis/Elasticsearch are optional.

### With Docker (full stack)
```bash
docker-compose up --build
```

---

## 10. Quick Reference

### New NPM Scripts (backend)
| Command | What It Does |
|---------|-------------|
| `npm test` | Runs all 105 unit tests |
| `npm run test:coverage` | Runs tests + generates coverage report |
| `npm run test:report` | Runs tests + saves output to `test-results.txt` |
| `npm run dev` | Starts dev server (same as before) |

### New API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search/questions?q=...` | Search forum (Elasticsearch-powered) |
| GET | `/api/search/users?q=...` | Search users by name |
| POST | `/graphql` | GraphQL API (queries + mutations) |
| GET | `/graphql` | GraphQL Playground (browser) |

### New Dependencies Added
| Package | Purpose |
|---------|---------|
| `ioredis` | Redis client |
| `@elastic/elasticsearch` | Elasticsearch client |
| `@apollo/server` | GraphQL server |
| `graphql` | GraphQL core |
| `graphql-tag` | GraphQL template literals |
| `jest` (dev) | Test framework |
| `@jest/globals` (dev) | Jest ESM support |

### Environment Variables (New/Optional)
| Variable | Default | Purpose |
|----------|---------|---------|
| `REDIS_HOST` | `localhost` | Redis server hostname |
| `REDIS_PORT` | `6379` | Redis server port |
| `REDIS_PASSWORD` | none | Redis password (if any) |
| `ELASTICSEARCH_URL` | `http://localhost:9200` | Elasticsearch URL |

---

## FAQ

**Q: Will the app break if Redis/Elasticsearch aren't running?**  
A: No. Both services have graceful fallback. The app works exactly as before without them.

**Q: Do I need to create indexes manually in MongoDB?**  
A: No. Mongoose creates indexes automatically when the app starts and connects to MongoDB.

**Q: How do I know if Redis caching is working?**  
A: Check the `X-Cache` response header. `HIT` = served from Redis, `MISS` = served from MongoDB.

**Q: Can I use GraphQL and REST at the same time?**  
A: Yes. REST endpoints are unchanged at `/api/*`. GraphQL is available at `/graphql`. Both use the same JWT token.

**Q: Where are the test reports?**  
A: Run `npm run test:coverage` and open `backend/coverage/lcov-report/index.html` in your browser.

**Q: How do I run just the Docker services (Redis + ES) without containerizing the app?**  
A: Run only the services you need:
```bash
docker run -d -p 6379:6379 redis:7-alpine
docker run -d -p 9200:9200 -e "discovery.type=single-node" -e "xpack.security.enabled=false" docker.elastic.co/elasticsearch/elasticsearch:8.12.0
```
Then start your backend normally with `npm run dev`.
