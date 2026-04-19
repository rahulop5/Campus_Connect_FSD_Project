# Database Optimization Report

## Overview
This report documents the MongoDB indexing strategy and query optimization applied to the Campus Connect application to improve database performance.

## Index Strategy

### Methodology
We analyzed all database query patterns across controllers and routes to identify:
1. **Frequent lookups** — fields used in `findOne()`, `findById()`, and `find()` filters
2. **Sort operations** — fields used in `.sort()` operations
3. **Join patterns** — fields used in `.populate()` and reference lookups
4. **Compound queries** — multi-field filters commonly used together

### Indexes Added

#### 1. User Model (`users` collection)
| Index | Type | Rationale |
|-------|------|-----------|
| `{ email: 1 }` | Unique (existing) | Login lookups by email |
| `{ role: 1, instituteId: 1 }` | Compound | Admin dashboard filters users by role within institute |
| `{ verificationStatus: 1, instituteId: 1 }` | Compound | Pending verification lookups for college admins |
| `{ 'subscription.status': 1 }` | Single | Active subscription queries |

#### 2. Student Model (`students` collection)
| Index | Type | Rationale |
|-------|------|-----------|
| `{ instituteId: 1, rollnumber: 1 }` | Compound Unique (existing) | Unique roll per institute |
| `{ userId: 1 }` | Single | Fast User→Student lookups (dashboard, profile) |
| `{ 'courses.course': 1 }` | Single | Find students enrolled in a course |
| `{ instituteId: 1 }` | Single | Filter students by institute |

#### 3. Course Model (`courses` collection)
| Index | Type | Rationale |
|-------|------|-----------|
| `{ instituteId: 1, section: 1, ug: 1 }` | Compound | Course filtering by institute/section/year |
| `{ professor: 1 }` | Single | Professor course lookups |
| `{ name: 1, instituteId: 1 }` | Compound | Course name search within institute |

#### 4. Question Model (`questions` collection)
| Index | Type | Rationale |
|-------|------|-----------|
| `{ instituteId: 1, createdAt: -1 }` | Compound | Forum listing sorted by date within institute |
| `{ heading: 'text', desc: 'text', tags: 'text' }` | Text | Full-text search on question content |
| `{ asker: 1 }` | Single | Find questions by a specific user |

#### 5. Answer Model (`answers` collection)
| Index | Type | Rationale |
|-------|------|-----------|
| `{ answerer: 1 }` | Single | Find answers by a specific user |
| `{ createdAt: -1 }` | Single | Sort answers by date |

#### 6. Election Model (`elections` collection)
| Index | Type | Rationale |
|-------|------|-----------|
| `{ instituteId: 1, status: 1 }` | Compound | Find active elections within an institute |

#### 7. Candidate Model (`candidates` collection)
| Index | Type | Rationale |
|-------|------|-----------|
| `{ electionId: 1, role: 1 }` | Compound | List candidates per election per role |
| `{ studentId: 1 }` | Single | Find candidate by student |

#### 8. Vote Model (`votes` collection)
| Index | Type | Rationale |
|-------|------|-----------|
| `{ electionId: 1, voterId: 1 }` | Compound Unique (existing) | Prevent duplicate votes |
| `{ electionId: 1, voterId: 1, role: 1 }` | Compound Unique (existing) | Prevent duplicate role votes |

#### 9. Payment Model (`payments` collection)
| Index | Type | Rationale |
|-------|------|-----------|
| `{ userId: 1, status: 1 }` | Compound | User payment lookups |
| `{ razorpayOrderId: 1 }` | Single | Payment verification by order ID |

## Query Optimization Techniques

### 1. Index-Covered Queries
Common queries like `Student.findOne({ userId })` are now fully covered by the `userId` index, avoiding collection scans.

### 2. Compound Index Ordering
Compound indexes were designed with **equality filters first, range/sort fields last** following MongoDB best practices.

### 3. Text Index for Search
The Question model uses a MongoDB text index enabling `$text` search with relevance scoring as a fallback when Elasticsearch is unavailable.

### 4. Selective Population
Controllers use `.populate('field', 'selected fields')` to limit populated data, reducing document transfer size.

## Expected Performance Impact
- **Login/Auth**: O(1) email lookups via unique index (was already indexed)
- **Student Dashboard**: Direct index hit on `userId` instead of collection scan
- **Forum Listing**: Compound index `{instituteId, createdAt}` covers both filter and sort
- **Election Queries**: Direct index hit on `{instituteId, status}` for active elections
- **Payment Verification**: Direct index hit on `razorpayOrderId`

## Verification
To verify indexes are created, run in MongoDB shell:
```javascript
db.students.getIndexes()
db.users.getIndexes()
db.courses.getIndexes()
db.questions.getIndexes()
```

Or check the **Atlas UI → Collections → Indexes** tab.
