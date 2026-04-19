# Campus Connect — API Documentation

## Overview
Campus Connect exposes two API interfaces:
1. **REST API** — Traditional RESTful endpoints (documented via Swagger/OpenAPI at `/api-docs`)
2. **GraphQL API** — Flexible query language (available at `/graphql` with built-in Playground)

Both APIs use **JWT Bearer token** authentication.

---

## Authentication

### Obtaining a Token
```bash
# Register
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "student"
}

# Login
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

Both return: `{ "token": "eyJhbGci...", "user": { ... } }`

### Using the Token
Include in all subsequent requests:
```
Authorization: Bearer eyJhbGci...
```

---

## REST API Reference

### Base URL
```
http://localhost:3000
```

### Interactive Documentation
Swagger UI is available at: **`http://localhost:3000/api-docs`**

### Endpoints Summary

#### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login | ❌ |
| GET | `/api/auth/me` | Get current user | ✅ |
| GET | `/api/auth/google` | Google OAuth flow | ❌ |
| GET | `/api/auth/github` | GitHub OAuth flow | ❌ |

#### Student (`/api/student`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/student/dashboard` | Dashboard data | ✅ |
| GET | `/api/student/profile` | Student profile | ✅ |
| GET | `/api/student/attendance` | Attendance data | ✅ |
| GET | `/api/student/bellgraph` | Grade analytics | ✅ |
| GET | `/api/student/bellgraph-data/:courseId` | Course grade distribution | ✅ |
| POST | `/api/student/update` | Update profile field | ✅ |
| POST | `/api/student/upload-profile-pic` | Upload profile picture | ✅ |
| POST | `/api/student/delete-profile-pic` | Delete profile picture | ✅ |

#### Forum (`/api/forum`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/forum/questions` | List all questions | ✅ |
| GET | `/api/forum/question/:id` | Question details | ✅ |
| POST | `/api/forum/ask` | Ask new question | ✅ |
| POST | `/api/forum/submit-answer` | Submit answer | ✅ |
| POST | `/api/forum/upvote-question` | Upvote question | ✅ |
| POST | `/api/forum/downvote-question` | Downvote question | ✅ |
| POST | `/api/forum/upvote-answer` | Upvote answer | ✅ |
| POST | `/api/forum/downvote-answer` | Downvote answer | ✅ |

#### Professor (`/api/professor`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/professor/dashboard` | Professor dashboard | ✅ |
| GET | `/api/professor/courses` | Teaching courses | ✅ |
| POST | `/api/professor/upload-csv` | Upload grades/attendance CSV | ✅ |

#### Admin (`/api/admin`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/admin/dashboard` | Admin dashboard stats | ✅ Admin |
| POST | `/api/admin/course/add` | Add course | ✅ Admin |
| POST | `/api/admin/student/add` | Add student | ✅ Admin |
| POST | `/api/admin/professor/add` | Add professor | ✅ Admin |
| POST | `/api/admin/assign/course-professor` | Assign course to professor | ✅ Admin |
| POST | `/api/admin/assign/course-student` | Assign course to student | ✅ Admin |
| PUT | `/api/admin/course/:id` | Update course | ✅ Admin |
| PUT | `/api/admin/student/:id` | Update student | ✅ Admin |
| PUT | `/api/admin/professor/:id` | Update professor | ✅ Admin |
| DELETE | `/api/admin/student/:id` | Delete student | ✅ Admin |
| DELETE | `/api/admin/professor/:id` | Delete professor | ✅ Admin |

#### Elections (`/api/election`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/election` | Get current election | ✅ |
| POST | `/api/election/vote` | Cast vote | ✅ Student |
| POST | `/api/election/start` | Start election | ✅ Admin |
| POST | `/api/election/stop` | Stop election | ✅ Admin |
| POST | `/api/election/nominate` | Nominate candidate | ✅ Admin |
| DELETE | `/api/election/nominate/:id` | Remove candidate | ✅ Admin |

#### Institutes (`/api/institutes`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/institutes` | List all institutes | ❌ |
| POST | `/api/institutes/create` | Create institute | ✅ |
| POST | `/api/institutes/join` | Join institute | ✅ |
| GET | `/api/institutes/pending` | Get pending verifications | ✅ Admin |
| POST | `/api/institutes/verify` | Verify user | ✅ Admin |

#### Payment (`/api/payment`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/payment/create-order` | Create Razorpay order | ✅ |
| POST | `/api/payment/verify` | Verify payment | ✅ |
| GET | `/api/payment/subscription` | Get subscription status | ✅ |

#### Search (`/api/search`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/search/questions?q=&tags=&sort=` | Search forum (ES-powered) | ✅ |
| GET | `/api/search/users?q=&role=` | Search users by name | ✅ |

---

## GraphQL API Reference

### Endpoint
```
http://localhost:3000/graphql
```

GraphQL Playground is available at the same URL in the browser for interactive query building and documentation.

### Example Queries

#### Get Current User
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

#### Get Student Dashboard
```graphql
query {
  studentDashboard {
    id
    rollnumber
    section
    branch
    courses {
      course {
        name
        credits
      }
      attendance
      grade
    }
  }
}
```

#### List Courses
```graphql
query {
  courses {
    id
    name
    section
    credits
    professor {
      userId {
        name
      }
    }
  }
}
```

#### Search Questions
```graphql
query {
  searchQuestions(q: "javascript", tags: ["programming"], sort: "votes", page: 1, limit: 10) {
    total
    source
    questions {
      id
      heading
      desc
      votes
      tags
      answersCount
    }
  }
}
```

#### Get Election Data
```graphql
query {
  election {
    id
    title
    status
    startTime
    endTime
    candidates {
      name
      role
      department
      voteCount
    }
  }
}
```

### Example Mutations

#### Register User
```graphql
mutation {
  register(name: "John", email: "john@test.com", password: "pass123", role: "student") {
    token
    user {
      id
      name
      role
    }
  }
}
```

#### Ask a Question
```graphql
mutation {
  askQuestion(heading: "How does indexing work?", desc: "Explain MongoDB indexing", tags: ["mongodb", "database"]) {
    id
    heading
    createdAt
  }
}
```

#### Vote in Election
```graphql
mutation {
  vote(candidateId: "candidate_id_here", role: "SDC President")
}
```

---

## B2B vs B2C API Patterns

### B2C (Business-to-Consumer) — Student/Faculty Facing
These endpoints serve the frontend application:
- Authentication (login, register, OAuth)
- Student dashboard, profile, attendance
- Forum Q&A (ask, answer, vote)
- Election voting
- Payment/subscription

### B2B (Business-to-Admin/Integration) — Admin/System Facing
These endpoints serve administrative operations and system integrations:
- Admin CRUD operations (courses, students, professors)
- Dashboard analytics and aggregations
- User verification and management
- Institute management
- Search APIs (can be consumed by external systems)
- GraphQL introspection (schema documentation built-in)

### Key Difference
- **B2C** endpoints are scoped to the authenticated user (e.g., "my dashboard", "my profile")
- **B2B** endpoints accept resource IDs and operate across users (e.g., "get student by ID", "add course")

---

## Rate Limiting & Caching

### Response Caching (Redis)
Cacheable GET endpoints include `X-Cache` header:
- `X-Cache: HIT` — Response served from Redis cache
- `X-Cache: MISS` — Response freshly computed from MongoDB

### Cache TTLs
| Resource | TTL |
|----------|-----|
| Student data | 5 minutes |
| Forum questions | 2 minutes |
| Election data | 1 minute |
| Admin dashboard | 3 minutes |
| Course details | 10 minutes |
