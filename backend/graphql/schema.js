export const typeDefs = `#graphql
  """
  Campus Connect GraphQL API
  Provides both B2C (student/faculty facing) and B2B (admin/integration) access patterns.
  """

  # ─── TYPES ────────────────────────────────────────────────────

  type User {
    id: ID!
    name: String!
    email: String!
    phone: String
    role: String!
    instituteId: ID
    verificationStatus: String
    subscription: Subscription
    profileId: ID
  }

  type Subscription {
    plan: String
    status: String
    subscribedAt: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Student {
    id: ID!
    userId: User
    instituteId: ID
    rollnumber: String
    section: String
    branch: String
    ug: String
    profilePicture: String
    courses: [CourseEnrollment]
  }

  type CourseEnrollment {
    course: Course
    attendance: Int
    grade: String
  }

  type Professor {
    id: ID!
    userId: User
    instituteId: ID
    courses: [ProfessorCourse]
  }

  type ProfessorCourse {
    course: Course
  }

  type Course {
    id: ID!
    name: String!
    section: String!
    ug: String
    classeshpnd: Int!
    totalclasses: Int!
    credits: Int!
    professor: Professor
    instituteId: ID
    gradeDistribution: String  # JSON stringified map
  }

  type Institute {
    id: ID!
    name: String!
    code: String!
    address: String!
    adminId: ID
    createdAt: String
  }

  type Question {
    id: ID!
    heading: String!
    desc: String!
    votes: Int
    tags: [String]
    asker: ID
    askerModel: String
    instituteId: ID
    createdAt: String
    wealth: Int
    views: Int
    answers: [Answer]
    answersCount: Int
  }

  type Answer {
    id: ID!
    desc: String!
    votes: Int
    answerer: ID
    answererModel: String
    createdAt: String
  }

  type Election {
    id: ID!
    title: String!
    description: String
    status: String!
    startTime: String!
    endTime: String!
    instituteId: ID
    candidates: [Candidate]
  }

  type Candidate {
    id: ID!
    electionId: ID
    studentId: ID
    name: String!
    role: String!
    department: String!
    year: String!
    profileImage: String
    manifesto: String
    voteCount: Int
  }

  type Payment {
    id: ID!
    userId: ID
    planId: String
    planName: String
    amount: Int
    currency: String
    razorpayOrderId: String
    status: String
    createdAt: String
  }

  type DashboardData {
    totalStudents: Int
    totalProfessors: Int
    totalCourses: Int
    students: [Student]
    professors: [Professor]
    courses: [Course]
  }

  type SearchResult {
    total: Int
    page: Int
    limit: Int
    source: String
    questions: [Question]
  }

  type UserSearchResult {
    total: Int
    page: Int
    limit: Int
    users: [User]
  }

  # ─── QUERIES ──────────────────────────────────────────────────

  type Query {
    """B2C: Get current authenticated user"""
    me: User

    """B2C: Get student profile for current user"""
    studentProfile: Student

    """B2C: Get student dashboard data"""
    studentDashboard: Student

    """B2B: Get student by ID (admin/faculty only)"""
    student(id: ID!): Student

    """B2B: List all students in the institute"""
    students(page: Int, limit: Int): [Student]

    """B2C: Get course details"""
    course(id: ID!): Course

    """B2B: List all courses in the institute"""
    courses: [Course]

    """B2C: Get forum questions"""
    questions(page: Int, limit: Int, sort: String): [Question]

    """B2C: Get question details"""
    question(id: ID!): Question

    """B2C: Search questions"""
    searchQuestions(q: String!, tags: [String], sort: String, page: Int, limit: Int): SearchResult

    """B2B: Search users"""
    searchUsers(q: String!, role: String, page: Int, limit: Int): UserSearchResult

    """B2C: Get current election"""
    election: Election

    """B2B: List all institutes"""
    institutes: [Institute]

    """B2C: Get subscription status"""
    subscription: Payment

    """B2B: Get admin dashboard data (admin only)"""
    adminDashboard: DashboardData
  }

  # ─── MUTATIONS ────────────────────────────────────────────────

  type Mutation {
    """B2C: Register a new user"""
    register(name: String!, email: String!, password: String!, phone: String, role: String): AuthPayload

    """B2C: Login"""
    login(email: String!, password: String!): AuthPayload

    """B2C: Update student profile"""
    updateProfile(name: String, phone: String, branch: String, section: String, ug: String): Student

    """B2C: Ask a new question"""
    askQuestion(heading: String!, desc: String!, tags: [String], wealth: Int): Question

    """B2C: Submit an answer"""
    submitAnswer(questionId: ID!, desc: String!): Answer

    """B2C: Upvote a question"""
    upvoteQuestion(questionId: ID!): Question

    """B2C: Downvote a question"""
    downvoteQuestion(questionId: ID!): Question

    """B2C: Upvote an answer"""
    upvoteAnswer(answerId: ID!): Answer

    """B2C: Downvote an answer"""
    downvoteAnswer(answerId: ID!): Answer

    """B2C: Cast a vote in election"""
    vote(candidateId: ID!, role: String!): Boolean

    """B2B: Add a course (admin only)"""
    addCourse(name: String!, section: String!, ug: String!, credits: Int!, totalclasses: Int!, classeshpnd: Int!): Course

    """B2B: Add a student (admin only)"""
    addStudent(name: String!, email: String!, rollnumber: String!, section: String, branch: String, ug: String): Student

    """B2B: Add a professor (admin only)"""
    addProfessor(name: String!, email: String!): Professor
  }
`;

export default typeDefs;
