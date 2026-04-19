# Testing Report — Campus Connect

## Overview
Campus Connect employs **Jest** for unit testing of backend controllers, middleware, and core business logic. Tests focus on verifying correctness of authentication, authorization, data processing, and edge cases.

## Test Configuration
- **Framework**: Jest 30.x
- **Environment**: Node.js with ES Modules (`--experimental-vm-modules`)
- **Config File**: `backend/jest.config.js`
- **Coverage**: HTML + text reports in `backend/coverage/`

## How to Run Tests

### Run All Tests
```bash
cd backend
npm test
```

### Run with Coverage Report
```bash
npm run test:coverage
```

### Generate Report File
```bash
npm run test:report
# Output saved to backend/test-results.txt
# Coverage HTML report in backend/coverage/lcov-report/index.html
```

### Run Specific Test File
```bash
npx jest tests/auth.test.js --verbose
```

## Test Suites

### 1. Auth Controller (`tests/auth.test.js`)
Tests the authentication system.

| Test | Description | Status |
|------|-------------|--------|
| Register — missing fields | Should return 400 if required fields missing | ✅ |
| Register — duplicate email | Should return 400 if user exists | ✅ |
| Register — success | Should register and return JWT token | ✅ |
| Role normalization | `professor` → `faculty`, `admin` → `college_admin` | ✅ |
| Role normalization — edge cases | null, empty, UPPERCASE, whitespace | ✅ |
| Login — user not found | Should return 404 | ✅ |
| Login — wrong password | Should return 400 | ✅ |
| Login — success | Should return token and user object | ✅ |
| getMe — user not found | Should return 404 | ✅ |
| getMe — success | Should return user without password | ✅ |

### 2. Middleware (`tests/middleware.test.js`)
Tests JWT verification and role-based access control.

| Test | Description | Status |
|------|-------------|--------|
| verifyToken — no token | Should return 403 | ✅ |
| verifyToken — invalid token | Should return 401 | ✅ |
| verifyToken — valid token | Should call next() with decoded user | ✅ |
| verifyToken — token extraction | Should correctly split Bearer scheme | ✅ |
| checkRole — no role | Should return 403 | ✅ |
| checkRole — wrong role | Should deny unauthorized role | ✅ |
| checkRole — correct role | Should call next() | ✅ |
| checkRole — multiple roles | Should accept any allowed role | ✅ |
| checkRole — null user | Should return 403 | ✅ |

### 3. Student Controller (`tests/student.test.js`)
Tests student data processing and formatting.

| Test | Description | Status |
|------|-------------|--------|
| Attendance — percentage calculation | `(32/40)*100 = 80%` | ✅ |
| Attendance — reverse calculation | `75% of 40 = 30 classes` | ✅ |
| Attendance — Good status (≥80%) | Green status | ✅ |
| Attendance — At Risk (75-79%) | Yellow status | ✅ |
| Attendance — Critical (<75%) | Red status | ✅ |
| Attendance — 0% edge case | 0 attended classes | ✅ |
| Attendance — 100% edge case | All classes attended | ✅ |
| Dashboard — course formatting | Correct structure with grade fallback | ✅ |
| Dashboard — default grade NA | Handle null grades | ✅ |
| Dashboard — missing attendance | Default to 0 | ✅ |
| Date formatting | Correct day/month/year | ✅ |
| Profile — field routing | name/phone → User, branch/section → Student | ✅ |
| Grade distribution | Frequency calculation | ✅ |
| Grade distribution — sorting | Sorted by grade value | ✅ |

### 4. Forum Controller (`tests/forum.test.js`)
Tests Q&A forum functionality.

| Test | Description | Status |
|------|-------------|--------|
| askQuestion — success | Creates question with correct structure | ✅ |
| askQuestion — unauthorized | Returns 403 for invalid role | ✅ |
| askQuestion — tag parsing | Comma-separated tags trimmed correctly | ✅ |
| Upvote — new vote | +1 votes | ✅ |
| Upvote — toggle off | -1 votes (remove existing upvote) | ✅ |
| Upvote — switch from downvote | +2 votes | ✅ |
| Downvote — new vote | -1 votes | ✅ |
| Downvote — switch from upvote | -2 votes | ✅ |

### 5. Election Controller (`tests/election.test.js`)
Tests election and voting logic.

| Test | Description | Status |
|------|-------------|--------|
| No active election | Prevents voting | ✅ |
| Duplicate vote prevention | Same student, same role blocked | ✅ |
| Cross-role voting | Allows voting for different roles | ✅ |
| Different student voting | Allows different students to vote | ✅ |
| Vote count increment | Correctly increments | ✅ |
| Active election detection | Checks status + time range | ✅ |
| Ended election detection | Detects ended elections | ✅ |
| Election roles validation | All 6 valid roles | ✅ |

### 6. Payment Controller (`tests/payment.test.js`)
Tests payment and subscription logic.

| Test | Description | Status |
|------|-------------|--------|
| Plan pricing — student_core | ₹299 (29900 paise) | ✅ |
| Plan pricing — student_collective | ₹499 (49900 paise) | ✅ |
| Invalid plan rejection | Returns undefined | ✅ |
| Amount conversion | Rupees to paise | ✅ |
| Payment verification | Signature fields present | ✅ |
| Status update on verification | Created → Paid | ✅ |
| Subscription update | Plan + status + timestamp | ✅ |
| Free plan default | Inactive subscription | ✅ |
| Active subscription check | Correctly identifies | ✅ |

### 7. Admin Controller (`tests/admin.test.js`)
Tests administrative operations.

| Test | Description | Status |
|------|-------------|--------|
| Dashboard aggregation | Correct counts | ✅ |
| Course validation | Required fields check | ✅ |
| Course update | Partial field update | ✅ |
| Negative credits | Rejected | ✅ |
| Email validation | Pattern matching | ✅ |
| Roll number uniqueness | Duplicate detection | ✅ |
| Professor validation | Required fields | ✅ |
| Course-professor assignment | Duplicate check | ✅ |
| Student enrollment | Duplicate prevention | ✅ |
| Course removal | Filter-based removal | ✅ |
| Role-based access | Admin-only enforcement | ✅ |

## Coverage Summary

| Module | Statements | Branches | Functions | Lines |
|--------|-----------|----------|-----------|-------|
| Auth | High | High | High | High |
| Middleware | High | High | High | High |
| Student Logic | High | High | High | High |
| Forum Logic | High | High | High | High |
| Election Logic | High | Medium | High | High |
| Payment Logic | High | Medium | High | High |
| Admin Logic | High | High | High | High |

> Run `npm run test:coverage` for exact percentages and the full HTML report.

## Test Architecture

### Mocking Strategy
- **Models**: Mocked using `jest.unstable_mockModule()` for ES module support
- **External Services**: Redis and Elasticsearch are mocked as no-ops in tests
- **bcryptjs/JWT**: Mocked to control authentication flow
- **Pure Logic Tests**: Core business logic (attendance, voting, pricing) tested as pure functions without mocks

### File Structure
```
backend/
├── jest.config.js           # Jest configuration
├── tests/
│   ├── auth.test.js         # Authentication tests
│   ├── middleware.test.js   # JWT/role middleware tests
│   ├── student.test.js      # Student logic tests
│   ├── forum.test.js        # Forum Q&A tests
│   ├── election.test.js     # Election/voting tests
│   ├── payment.test.js      # Payment/subscription tests
│   └── admin.test.js        # Admin CRUD tests
├── coverage/                # Generated coverage reports
│   └── lcov-report/
│       └── index.html       # HTML coverage report
└── test-results.txt         # Test output log
```
