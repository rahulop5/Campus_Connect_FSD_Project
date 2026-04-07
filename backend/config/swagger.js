const success200 = {
    description: "Successful operation",
    content: {
        "application/json": {
            schema: { $ref: "#/components/schemas/SuccessResponse" }
        }
    }
};

const badRequest400 = {
    description: "Bad request",
    content: {
        "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
        }
    }
};

const unauthorized401 = {
    description: "Unauthorized",
    content: {
        "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
        }
    }
};

const serverError500 = {
    description: "Internal server error",
    content: {
        "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" }
        }
    }
};

const secure = [{ bearerAuth: [] }];

const swaggerSpec = {
    openapi: "3.0.0",
    info: {
        title: "Campus Connect API",
        version: "1.0.0",
        description:
            "Centralized OpenAPI documentation for Campus Connect backend routes, including current and legacy endpoints."
    },
    servers: [
        {
            url: "http://localhost:3000",
            description: "Local development"
        },
        {
            url: "https://api.campus-connect.example.com",
            description: "Production"
        }
    ],
    tags: [
        { name: "Auth", description: "Authentication and OAuth endpoints" },
        { name: "Student", description: "Student profile, dashboard, and analytics" },
        { name: "Forum", description: "Q&A forum endpoints" },
        { name: "Professor", description: "Professor dashboard and CSV operations" },
        { name: "Admin", description: "Administrative course, student, and professor management" },
        { name: "Election", description: "Election lifecycle and voting" },
        { name: "Institutes", description: "Institute discovery and verification" },
        { name: "Courses", description: "Course details and updates" },
        { name: "Students", description: "Student detail lookup" },
        { name: "Payment", description: "Razorpay payment and subscription endpoints" },
        { name: "Legacy", description: "Legacy or backward compatibility routes" }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT"
            }
        },
        schemas: {
            SuccessResponse: {
                type: "object",
                properties: {
                    message: { type: "string", example: "Operation completed successfully" },
                    data: { type: "object", additionalProperties: true }
                }
            },
            ErrorResponse: {
                type: "object",
                properties: {
                    message: { type: "string", example: "Request failed" },
                    error: { type: "string", example: "ValidationError" }
                }
            },
            LoginRequest: {
                type: "object",
                required: ["email", "password"],
                properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", format: "password" }
                }
            },
            RegisterRequest: {
                type: "object",
                required: ["name", "email", "password", "role"],
                properties: {
                    name: { type: "string" },
                    email: { type: "string", format: "email" },
                    password: { type: "string", format: "password" },
                    role: { type: "string", example: "student" }
                }
            },
            StudentProfileUpdateRequest: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    phone: { type: "string" },
                    branch: { type: "string" },
                    section: { type: "string" },
                    ug: { type: "string" }
                }
            },
            ForumVoteRequest: {
                type: "object",
                properties: {
                    questionId: { type: "string" },
                    answerId: { type: "string" }
                }
            },
            SubmitAnswerRequest: {
                type: "object",
                required: ["questionId", "content"],
                properties: {
                    questionId: { type: "string" },
                    content: { type: "string" }
                }
            },
            AskQuestionRequest: {
                type: "object",
                required: ["title", "body"],
                properties: {
                    title: { type: "string" },
                    body: { type: "string" },
                    tags: {
                        type: "array",
                        items: { type: "string" }
                    }
                }
            },
            UploadProfilePictureRequest: {
                type: "object",
                required: ["profilePicture"],
                properties: {
                    profilePicture: {
                        type: "string",
                        format: "binary"
                    }
                }
            },
            UploadCsvRequest: {
                type: "object",
                required: ["csvFile"],
                properties: {
                    csvFile: {
                        type: "string",
                        format: "binary"
                    }
                }
            },
            ProfessorSubmitCsvRequest: {
                type: "object",
                required: ["marksheet", "courseId"],
                properties: {
                    marksheet: {
                        type: "string",
                        format: "binary"
                    },
                    courseId: {
                        type: "string"
                    }
                }
            },
            ElectionVoteRequest: {
                type: "object",
                required: ["candidateId"],
                properties: {
                    candidateId: { type: "string" }
                }
            },
            ManifestoRequest: {
                type: "object",
                required: ["manifesto"],
                properties: {
                    manifesto: { type: "string" }
                }
            },
            InstituteCreateRequest: {
                type: "object",
                required: ["name"],
                properties: {
                    name: { type: "string" },
                    domain: { type: "string" },
                    description: { type: "string" }
                }
            },
            InstituteJoinRequest: {
                type: "object",
                required: ["instituteId"],
                properties: {
                    instituteId: { type: "string" }
                }
            },
            InstituteVerifyRequest: {
                type: "object",
                required: ["userId", "approved"],
                properties: {
                    userId: { type: "string" },
                    approved: { type: "boolean" }
                }
            },
            CourseUpdateRequest: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    credits: { type: "number" },
                    totalclasses: { type: "number" },
                    section: { type: "string" }
                }
            },
            AdminAddCourseRequest: {
                type: "object",
                required: ["name", "section", "ug", "credits"],
                properties: {
                    name: { type: "string" },
                    section: { type: "string" },
                    ug: { type: "string" },
                    credits: { type: "number" },
                    professorId: { type: "string" }
                }
            },
            AdminAddStudentRequest: {
                type: "object",
                required: ["name", "email", "rollnumber"],
                properties: {
                    name: { type: "string" },
                    email: { type: "string", format: "email" },
                    rollnumber: { type: "string" },
                    section: { type: "string" },
                    branch: { type: "string" },
                    ug: { type: "string" }
                }
            },
            AdminAddProfessorRequest: {
                type: "object",
                required: ["name", "email"],
                properties: {
                    name: { type: "string" },
                    email: { type: "string", format: "email" },
                    department: { type: "string" }
                }
            },
            AssignmentRequest: {
                type: "object",
                required: ["courseId"],
                properties: {
                    courseId: { type: "string" },
                    professorId: { type: "string" },
                    studentId: { type: "string" }
                }
            },
            RemoveRequest: {
                type: "object",
                properties: {
                    courseId: { type: "string" },
                    professorId: { type: "string" },
                    studentId: { type: "string" }
                }
            },
            CreateOrderRequest: {
                type: "object",
                required: ["planId"],
                properties: {
                    planId: { type: "string" }
                }
            },
            VerifyPaymentRequest: {
                type: "object",
                required: ["razorpay_order_id", "razorpay_payment_id", "razorpay_signature"],
                properties: {
                    razorpay_order_id: { type: "string" },
                    razorpay_payment_id: { type: "string" },
                    razorpay_signature: { type: "string" }
                }
            }
        }
    },
    paths: {
        "/api/auth/register": {
            post: {
                tags: ["Auth"],
                summary: "Register a new user",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/RegisterRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/auth/login": {
            post: {
                tags: ["Auth"],
                summary: "Login with email and password",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/LoginRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/auth/me": {
            get: {
                tags: ["Auth"],
                summary: "Get current authenticated user",
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/auth/google": {
            get: {
                tags: ["Auth"],
                summary: "Start Google OAuth flow",
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/auth/google/callback": {
            get: {
                tags: ["Auth"],
                summary: "Google OAuth callback",
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/auth/github": {
            get: {
                tags: ["Auth"],
                summary: "Start GitHub OAuth flow",
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/auth/github/callback": {
            get: {
                tags: ["Auth"],
                summary: "GitHub OAuth callback",
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },

        "/api/student/dashboard": {
            get: {
                tags: ["Student"],
                summary: "Get student dashboard data",
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/student/profile": {
            get: {
                tags: ["Student"],
                summary: "Get student profile",
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/student/attendance": {
            get: {
                tags: ["Student"],
                summary: "Get student attendance",
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/student/bellgraph": {
            get: {
                tags: ["Student"],
                summary: "Get student bell graph data",
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/student/bellgraph-data/{courseId}": {
            get: {
                tags: ["Student"],
                summary: "Get student bell graph by course",
                security: secure,
                parameters: [
                    {
                        name: "courseId",
                        in: "path",
                        required: true,
                        schema: { type: "string" }
                    }
                ],
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/student/update": {
            post: {
                tags: ["Student"],
                summary: "Update student profile",
                security: secure,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/StudentProfileUpdateRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/student/upload-profile-pic": {
            post: {
                tags: ["Student"],
                summary: "Upload student profile picture",
                security: secure,
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: { $ref: "#/components/schemas/UploadProfilePictureRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/student/delete-profile-pic": {
            post: {
                tags: ["Student"],
                summary: "Delete student profile picture",
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/student/changepassword": {
            get: {
                tags: ["Student"],
                summary: "Get change password data",
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },

        "/api/profile/dashboard": {
            get: {
                tags: ["Student"],
                summary: "Alias route: get student dashboard data",
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/profile/profile": {
            get: {
                tags: ["Student"],
                summary: "Alias route: get student profile",
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/profile/attendance": {
            get: {
                tags: ["Student"],
                summary: "Alias route: get student attendance",
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/profile/bellgraph": {
            get: {
                tags: ["Student"],
                summary: "Alias route: get student bell graph",
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/profile/bellgraph-data/{courseId}": {
            get: {
                tags: ["Student"],
                summary: "Alias route: get student bell graph by course",
                security: secure,
                parameters: [
                    {
                        name: "courseId",
                        in: "path",
                        required: true,
                        schema: { type: "string" }
                    }
                ],
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/profile/update": {
            post: {
                tags: ["Student"],
                summary: "Alias route: update student profile",
                security: secure,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/StudentProfileUpdateRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/profile/upload-profile-pic": {
            post: {
                tags: ["Student"],
                summary: "Alias route: upload student profile picture",
                security: secure,
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: { $ref: "#/components/schemas/UploadProfilePictureRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/profile/delete-profile-pic": {
            post: {
                tags: ["Student"],
                summary: "Alias route: delete student profile picture",
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/profile/changepassword": {
            get: {
                tags: ["Student"],
                summary: "Alias route: get change password data",
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },

        "/api/forum/questions": {
            get: {
                tags: ["Forum"],
                summary: "Get all forum questions",
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/forum/question/{id}": {
            get: {
                tags: ["Forum"],
                summary: "Get question details",
                security: secure,
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" }
                    }
                ],
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/forum/upvote-question": {
            post: {
                tags: ["Forum"],
                summary: "Upvote a question",
                security: secure,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ForumVoteRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/forum/downvote-question": {
            post: {
                tags: ["Forum"],
                summary: "Downvote a question",
                security: secure,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ForumVoteRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/forum/upvote-answer": {
            post: {
                tags: ["Forum"],
                summary: "Upvote an answer",
                security: secure,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ForumVoteRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/forum/downvote-answer": {
            post: {
                tags: ["Forum"],
                summary: "Downvote an answer",
                security: secure,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ForumVoteRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/forum/submit-answer": {
            post: {
                tags: ["Forum"],
                summary: "Submit an answer",
                security: secure,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/SubmitAnswerRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/forum/ask": {
            post: {
                tags: ["Forum"],
                summary: "Ask a new question",
                security: secure,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/AskQuestionRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },

        "/api/professor/dashboard": {
            get: {
                tags: ["Professor"],
                summary: "Get professor dashboard",
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/professor/courses": {
            get: {
                tags: ["Professor"],
                summary: "Get professor courses",
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/professor/upload-csv": {
            post: {
                tags: ["Professor"],
                summary: "Upload CSV for professor grade updates",
                security: secure,
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: { $ref: "#/components/schemas/UploadCsvRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },

        "/api/admin/dashboard": {
            get: {
                tags: ["Admin"],
                summary: "Get admin dashboard data",
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/admin/course/add": {
            post: {
                tags: ["Admin"],
                summary: "Add course",
                security: secure,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/AdminAddCourseRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/admin/student/add": {
            post: {
                tags: ["Admin"],
                summary: "Add student",
                security: secure,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/AdminAddStudentRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/admin/professor/add": {
            post: {
                tags: ["Admin"],
                summary: "Add professor",
                security: secure,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/AdminAddProfessorRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/admin/assign/course-professor": {
            post: {
                tags: ["Admin"],
                summary: "Assign course to professor",
                security: secure,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/AssignmentRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/admin/assign/course-student": {
            post: {
                tags: ["Admin"],
                summary: "Assign course to student",
                security: secure,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/AssignmentRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/admin/remove/course": {
            post: {
                tags: ["Admin"],
                summary: "Remove a course",
                security: secure,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/RemoveRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/admin/remove/professor": {
            post: {
                tags: ["Admin"],
                summary: "Remove a professor",
                security: secure,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/RemoveRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/admin/remove/student": {
            post: {
                tags: ["Admin"],
                summary: "Remove a student",
                security: secure,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/RemoveRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/admin/details": {
            get: {
                tags: ["Admin"],
                summary: "Get admin details",
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/admin/course/{id}": {
            get: {
                tags: ["Admin"],
                summary: "Get course by id",
                security: secure,
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" }
                    }
                ],
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            },
            put: {
                tags: ["Admin"],
                summary: "Update course by id",
                security: secure,
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" }
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CourseUpdateRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/admin/student/{id}": {
            get: {
                tags: ["Admin"],
                summary: "Get student by id",
                security: secure,
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" }
                    }
                ],
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            },
            put: {
                tags: ["Admin"],
                summary: "Update student by id",
                security: secure,
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" }
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/StudentProfileUpdateRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            },
            delete: {
                tags: ["Admin"],
                summary: "Delete student by id",
                security: secure,
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" }
                    }
                ],
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/admin/professor/{id}": {
            put: {
                tags: ["Admin"],
                summary: "Update professor by id",
                security: secure,
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" }
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/AdminAddProfessorRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            },
            delete: {
                tags: ["Admin"],
                summary: "Delete professor by id",
                security: secure,
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" }
                    }
                ],
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },

        "/api/election": {
            get: {
                tags: ["Election"],
                summary: "Get current election",
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/election/vote": {
            post: {
                tags: ["Election"],
                summary: "Vote in election",
                security: secure,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ElectionVoteRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/election/manifesto": {
            post: {
                tags: ["Election"],
                summary: "Update candidate manifesto",
                security: secure,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/ManifestoRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/election/start": {
            post: {
                tags: ["Election"],
                summary: "Start election",
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/election/stop": {
            post: {
                tags: ["Election"],
                summary: "Stop election",
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/election/nominate": {
            post: {
                tags: ["Election"],
                summary: "Nominate candidate",
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/election/nominate/{candidateId}": {
            delete: {
                tags: ["Election"],
                summary: "Remove nominated candidate",
                security: secure,
                parameters: [
                    {
                        name: "candidateId",
                        in: "path",
                        required: true,
                        schema: { type: "string" }
                    }
                ],
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },

        "/api/institutes": {
            get: {
                tags: ["Institutes"],
                summary: "Get all institutes",
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/institutes/create": {
            post: {
                tags: ["Institutes"],
                summary: "Create institute",
                security: secure,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/InstituteCreateRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/institutes/join": {
            post: {
                tags: ["Institutes"],
                summary: "Join institute",
                security: secure,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/InstituteJoinRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/institutes/pending": {
            get: {
                tags: ["Institutes"],
                summary: "Get pending institute verifications",
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/institutes/verify": {
            post: {
                tags: ["Institutes"],
                summary: "Verify institute user",
                security: secure,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/InstituteVerifyRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },

        "/api/courses/{courseId}": {
            get: {
                tags: ["Courses"],
                summary: "Get course details",
                security: secure,
                parameters: [
                    {
                        name: "courseId",
                        in: "path",
                        required: true,
                        schema: { type: "string" }
                    }
                ],
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            },
            put: {
                tags: ["Courses"],
                summary: "Update course details",
                security: secure,
                parameters: [
                    {
                        name: "courseId",
                        in: "path",
                        required: true,
                        schema: { type: "string" }
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CourseUpdateRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },

        "/api/students/{studentId}": {
            get: {
                tags: ["Students"],
                summary: "Get student details",
                security: secure,
                parameters: [
                    {
                        name: "studentId",
                        in: "path",
                        required: true,
                        schema: { type: "string" }
                    }
                ],
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },

        "/api/payment/create-order": {
            post: {
                tags: ["Payment"],
                summary: "Create a Razorpay order for a plan",
                security: secure,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/CreateOrderRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/payment/verify": {
            post: {
                tags: ["Payment"],
                summary: "Verify payment after Razorpay checkout",
                security: secure,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/VerifyPaymentRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/payment/subscription": {
            get: {
                tags: ["Payment"],
                summary: "Get current user's subscription status",
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },

        "/prof/submit": {
            post: {
                tags: ["Professor"],
                summary: "Direct CSV submission for marks and attendance",
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: { $ref: "#/components/schemas/ProfessorSubmitCsvRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },

        "/api/auth/student/login": {
            post: {
                tags: ["Legacy"],
                summary: "Legacy student login",
                deprecated: true,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/LoginRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/auth/student/register": {
            post: {
                tags: ["Legacy"],
                summary: "Legacy student register",
                deprecated: true,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/RegisterRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/auth/student/me": {
            get: {
                tags: ["Legacy"],
                summary: "Legacy student me",
                deprecated: true,
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/auth/student/google": {
            get: {
                tags: ["Legacy"],
                summary: "Legacy student Google OAuth",
                deprecated: true,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/auth/student/google/callback": {
            get: {
                tags: ["Legacy"],
                summary: "Legacy student Google callback",
                deprecated: true,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/auth/student/github": {
            get: {
                tags: ["Legacy"],
                summary: "Legacy student GitHub OAuth",
                deprecated: true,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/auth/student/github/callback": {
            get: {
                tags: ["Legacy"],
                summary: "Legacy student GitHub callback",
                deprecated: true,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },

        "/api/auth/professor/login": {
            post: {
                tags: ["Legacy"],
                summary: "Legacy professor login",
                deprecated: true,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/LoginRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/auth/professor/register": {
            post: {
                tags: ["Legacy"],
                summary: "Legacy professor register",
                deprecated: true,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/RegisterRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/auth/professor/me": {
            get: {
                tags: ["Legacy"],
                summary: "Legacy professor me",
                deprecated: true,
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },

        "/api/auth/admin/login": {
            post: {
                tags: ["Legacy"],
                summary: "Legacy admin login",
                deprecated: true,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/LoginRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/auth/admin/register": {
            post: {
                tags: ["Legacy"],
                summary: "Legacy admin register",
                deprecated: true,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/RegisterRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/api/auth/admin/me": {
            get: {
                tags: ["Legacy"],
                summary: "Legacy admin me",
                deprecated: true,
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },

        "/profile/dashboard": {
            get: {
                tags: ["Legacy"],
                summary: "Legacy profile alias: get student dashboard",
                deprecated: true,
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/profile/profile": {
            get: {
                tags: ["Legacy"],
                summary: "Legacy profile alias: get student profile",
                deprecated: true,
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/profile/attendance": {
            get: {
                tags: ["Legacy"],
                summary: "Legacy profile alias: get attendance",
                deprecated: true,
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/profile/bellgraph": {
            get: {
                tags: ["Legacy"],
                summary: "Legacy profile alias: get bell graph",
                deprecated: true,
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/profile/bellgraph-data/{courseId}": {
            get: {
                tags: ["Legacy"],
                summary: "Legacy profile alias: get bell graph by course",
                deprecated: true,
                security: secure,
                parameters: [
                    {
                        name: "courseId",
                        in: "path",
                        required: true,
                        schema: { type: "string" }
                    }
                ],
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/profile/update": {
            post: {
                tags: ["Legacy"],
                summary: "Legacy profile alias: update profile",
                deprecated: true,
                security: secure,
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/StudentProfileUpdateRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/profile/upload-profile-pic": {
            post: {
                tags: ["Legacy"],
                summary: "Legacy profile alias: upload profile picture",
                deprecated: true,
                security: secure,
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: { $ref: "#/components/schemas/UploadProfilePictureRequest" }
                        }
                    }
                },
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/profile/delete-profile-pic": {
            post: {
                tags: ["Legacy"],
                summary: "Legacy profile alias: delete profile picture",
                deprecated: true,
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        },
        "/profile/changepassword": {
            get: {
                tags: ["Legacy"],
                summary: "Legacy profile alias: change password",
                deprecated: true,
                security: secure,
                responses: {
                    200: success200,
                    400: badRequest400,
                    401: unauthorized401,
                    500: serverError500
                }
            }
        }
    }
};

export default swaggerSpec;
