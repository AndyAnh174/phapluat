# HCMUTE Exam System - API Documentation

## Base URL

- **Development**: `http://localhost:3001`
- **Production**: `https://phapluat.hcmutertic.com/api`

## Authentication

Hệ thống sử dụng JWT (JSON Web Tokens) cho authentication. Có 2 loại token:
- **Admin Token**: Dùng cho các endpoints quản trị
- **Student Token**: Dùng cho các endpoints học sinh

### Lấy Admin Token

```http
POST /auth/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "username": "admin",
    "role": "ADMIN"
  }
}
```

### Sử dụng Token

Thêm token vào header của mọi request:

```http
Authorization: Bearer <accessToken>
```

### Lấy Student Token (Google OAuth)

1. Redirect user đến: `GET /auth/google`
2. User đăng nhập với Google (chỉ email @student.hcmute.edu.vn hoặc @hcmute.edu.vn)
3. Callback sẽ redirect về frontend với token trong query string: `?token=<accessToken>`

---

## API Endpoints

### Authentication

#### Admin Login
```http
POST /auth/admin/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "username": "admin",
    "role": "ADMIN"
  }
}
```

**Rate Limit:** 5 requests per minute

---

#### Get Admin Profile
```http
GET /auth/admin/me
Authorization: Bearer <adminToken>
```

**Response:**
```json
{
  "username": "admin",
  "role": "ADMIN"
}
```

---

#### Get Student Profile
```http
GET /auth/student/me
Authorization: Bearer <studentToken>
```

**Response:**
```json
{
  "userId": "690d234a9ce6dd768e552b80",
  "email": "student@student.hcmute.edu.vn",
  "name": "Nguyen Van A",
  "role": "STUDENT"
}
```

---

#### Google OAuth Login
```http
GET /auth/google
```

Redirects to Google OAuth login page.

---

#### Google OAuth Callback
```http
GET /auth/google/callback
```

Internal endpoint, redirects to frontend with token.

---

### Exam Sets (Admin)

#### Create Exam Set
```http
POST /admin/exam-sets
Authorization: Bearer <adminToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Midterm Exam 2024",
  "description": "This is a midterm exam",
  "durationMinutes": 60
}
```

**Response:**
```json
{
  "_id": "690d234a9ce6dd768e552b6d",
  "name": "Midterm Exam 2024",
  "description": "This is a midterm exam",
  "durationMinutes": 60,
  "createdBy": "690d234a9ce6dd768e552b6c",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

---

#### Get All Exam Sets
```http
GET /admin/exam-sets?page=1&limit=10
Authorization: Bearer <adminToken>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "data": [
    {
      "_id": "690d234a9ce6dd768e552b6d",
      "name": "Midterm Exam 2024",
      "description": "This is a midterm exam",
      "durationMinutes": 60,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

#### Get Exam Set by ID
```http
GET /admin/exam-sets/:id
Authorization: Bearer <adminToken>
```

**Response:**
```json
{
  "_id": "690d234a9ce6dd768e552b6d",
  "name": "Midterm Exam 2024",
  "description": "This is a midterm exam",
  "durationMinutes": 60,
  "createdBy": "690d234a9ce6dd768e552b6c",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

---

#### Update Exam Set
```http
PATCH /admin/exam-sets/:id
Authorization: Bearer <adminToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Exam Name",
  "description": "Updated description",
  "durationMinutes": 90
}
```

**Response:** Updated exam set object

---

#### Delete Exam Set
```http
DELETE /admin/exam-sets/:id
Authorization: Bearer <adminToken>
```

**Response:**
```json
{
  "message": "Exam set deleted successfully"
}
```

---

#### Duplicate Exam Set
```http
POST /admin/exam-sets/:id/duplicate
Authorization: Bearer <adminToken>
```

**Response:** New exam set object (duplicated)

---

### Questions (Admin)

#### Create Question
```http
POST /admin/exam-sets/:examSetId/questions
Authorization: Bearer <adminToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "What is 2 + 2?",
  "options": {
    "A": "3",
    "B": "4",
    "C": "5",
    "D": "6"
  },
  "correctAnswer": "B",
  "order": 1
}
```

**Response:**
```json
{
  "_id": "690d234a9ce6dd768e552b73",
  "examSetId": "690d234a9ce6dd768e552b6d",
  "content": "What is 2 + 2?",
  "options": {
    "A": "3",
    "B": "4",
    "C": "5",
    "D": "6"
  },
  "correctAnswer": "B",
  "order": 1,
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

---

#### Bulk Create Questions
```http
POST /admin/exam-sets/:examSetId/questions/bulk
Authorization: Bearer <adminToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "questions": [
    {
      "content": "What is 2 + 2?",
      "options": {
        "A": "3",
        "B": "4",
        "C": "5",
        "D": "6"
      },
      "correctAnswer": "B",
      "order": 1
    },
    {
      "content": "What is the capital of Vietnam?",
      "options": {
        "A": "Ho Chi Minh City",
        "B": "Hanoi",
        "C": "Da Nang",
        "D": "Hue"
      },
      "correctAnswer": "B",
      "order": 2
    }
  ]
}
```

**Response:** Array of created question objects

---

#### Get All Questions for Exam Set
```http
GET /admin/exam-sets/:examSetId/questions
Authorization: Bearer <adminToken>
```

**Response:**
```json
[
  {
    "_id": "690d234a9ce6dd768e552b73",
    "examSetId": "690d234a9ce6dd768e552b6d",
    "content": "What is 2 + 2?",
    "options": {
      "A": "3",
      "B": "4",
      "C": "5",
      "D": "6"
    },
    "correctAnswer": "B",
    "order": 1
  }
]
```

---

#### Get Question by ID
```http
GET /admin/questions/:id
Authorization: Bearer <adminToken>
```

**Response:** Question object

---

#### Update Question
```http
PATCH /admin/questions/:id
Authorization: Bearer <adminToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Updated question content",
  "options": {
    "A": "Updated A",
    "B": "Updated B",
    "C": "Updated C",
    "D": "Updated D"
  },
  "correctAnswer": "A",
  "order": 2
}
```

**Response:** Updated question object

---

#### Delete Question
```http
DELETE /admin/questions/:id
Authorization: Bearer <adminToken>
```

**Response:**
```json
{
  "message": "Question deleted successfully"
}
```

---

### Exam Activation (Admin)

#### Activate Exam
```http
POST /admin/exam/activate
Authorization: Bearer <adminToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "examSetId": "690d234a9ce6dd768e552b6d"
}
```

**Response:**
```json
{
  "message": "Exam activated successfully",
  "activeExam": {
    "examSetId": "690d234a9ce6dd768e552b6d",
    "activatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Error:** Returns 400 if exam set has no questions

---

#### Deactivate Exam
```http
POST /admin/exam/deactivate
Authorization: Bearer <adminToken>
```

**Response:**
```json
{
  "message": "Exam deactivated successfully"
}
```

---

#### Get Exam Status
```http
GET /admin/exam/status
Authorization: Bearer <adminToken>
```

**Response:**
```json
{
  "isActive": true,
  "activeExam": {
    "examSetId": "690d234a9ce6dd768e552b6d",
    "examSet": {
      "_id": "690d234a9ce6dd768e552b6d",
      "name": "Midterm Exam 2024",
      "durationMinutes": 60
    },
    "activatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

### Student Exam

#### Get Exam Status (Student)
```http
GET /student/exam/status
Authorization: Bearer <studentToken>
```

**Response:**
```json
{
  "isActive": true,
  "exam": {
    "examSetId": "690d234a9ce6dd768e552b6d",
    "name": "Midterm Exam 2024",
    "durationMinutes": 60,
    "activatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

#### Start Exam
```http
POST /student/exam/start
Authorization: Bearer <studentToken>
```

**Response:**
```json
{
  "sessionId": "690d234a9ce6dd768e552b80",
  "examSetId": "690d234a9ce6dd768e552b6d",
  "questions": [
    {
      "_id": "690d234a9ce6dd768e552b73",
      "content": "What is 2 + 2?",
      "options": {
        "A": "3",
        "B": "4",
        "C": "5",
        "D": "6"
      },
      "order": 1
    }
  ],
  "startedAt": "2024-01-15T10:00:00.000Z",
  "durationMinutes": 60
}
```

**Note:** Questions returned do NOT include `correctAnswer` field

---

#### Submit Exam
```http
POST /student/exam/submit
Authorization: Bearer <studentToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "sessionId": "690d234a9ce6dd768e552b80",
  "answers": [
    {
      "questionId": "690d234a9ce6dd768e552b73",
      "selectedAnswer": "B"
    },
    {
      "questionId": "690d234a9ce6dd768e552b74",
      "selectedAnswer": "A"
    }
  ]
}
```

**Response:**
```json
{
  "sessionId": "690d234a9ce6dd768e552b80",
  "score": 8,
  "totalQuestions": 10,
  "percentage": 80,
  "submittedAt": "2024-01-15T10:30:00.000Z"
}
```

---

#### Get Exam Result
```http
GET /student/exam/result/:sessionId
Authorization: Bearer <studentToken>
```

**Response:**
```json
{
  "sessionId": "690d234a9ce6dd768e552b80",
  "examSetId": "690d234a9ce6dd768e552b6d",
  "examSet": {
    "_id": "690d234a9ce6dd768e552b6d",
    "name": "Midterm Exam 2024"
  },
  "score": 8,
  "totalQuestions": 10,
  "percentage": 80,
  "startedAt": "2024-01-15T10:00:00.000Z",
  "submittedAt": "2024-01-15T10:30:00.000Z",
  "answers": [
    {
      "questionId": "690d234a9ce6dd768e552b73",
      "question": {
        "content": "What is 2 + 2?",
        "options": {
          "A": "3",
          "B": "4",
          "C": "5",
          "D": "6"
        },
        "correctAnswer": "B"
      },
      "selectedAnswer": "B",
      "isCorrect": true
    }
  ]
}
```

---

### Results (Admin)

#### Get All Results
```http
GET /admin/results?examSetId=690d234a9ce6dd768e552b6d&page=1&limit=10
Authorization: Bearer <adminToken>
```

**Query Parameters:**
- `examSetId` (optional): Filter by exam set ID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "data": [
    {
      "sessionId": "690d234a9ce6dd768e552b80",
      "userId": "690d234a9ce6dd768e552b7f",
      "user": {
        "email": "student@student.hcmute.edu.vn",
        "name": "Nguyen Van A"
      },
      "examSet": {
        "_id": "690d234a9ce6dd768e552b6d",
        "name": "Midterm Exam 2024"
      },
      "score": 8,
      "totalQuestions": 10,
      "percentage": 80,
      "submittedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

#### Get Result by Session ID
```http
GET /admin/results/:sessionId
Authorization: Bearer <adminToken>
```

**Response:** Detailed result object (same format as student result)

---

#### Reset Exam Session
```http
POST /admin/results/:sessionId/reset
Authorization: Bearer <adminToken>
```

**Response:**
```json
{
  "message": "Session reset successfully. Student can retake the exam."
}
```

---

#### Export Results as JSON
```http
GET /admin/results/export/json?examSetId=690d234a9ce6dd768e552b6d
Authorization: Bearer <adminToken>
```

**Query Parameters:**
- `examSetId` (optional): Filter by exam set ID

**Response:** JSON array of results

---

#### Export Results as CSV
```http
GET /admin/results/export/csv?examSetId=690d234a9ce6dd768e552b6d
Authorization: Bearer <adminToken>
```

**Query Parameters:**
- `examSetId` (optional): Filter by exam set ID

**Response:** CSV file download

**Headers:**
- `Content-Type: text/csv`
- `Content-Disposition: attachment; filename=results.csv`

---

### Books (Admin)

#### Create Book
```http
POST /admin/books
Authorization: Bearer <adminToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "The Great Book",
  "subtitle": "A Subtitle",
  "description": "This is a great book...",
  "coverImageUrl": "https://example.com/cover.jpg",
  "quote": "A memorable quote from the book",
  "author": "John Doe",
  "publishedAt": "2024-01-01T00:00:00.000Z",
  "isPublic": true
}
```

**Response:** Created book object

---

#### Get All Books (Admin)
```http
GET /admin/books?author=John Doe&year=2024&isPublic=true&page=1&limit=10
Authorization: Bearer <adminToken>
```

**Query Parameters:**
- `author` (optional): Filter by author name
- `year` (optional): Filter by publication year
- `isPublic` (optional): Filter by public status (true/false)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "data": [...],
  "total": 10,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

#### Get Book by ID (Admin)
```http
GET /admin/books/:id
Authorization: Bearer <adminToken>
```

**Response:** Book object

---

#### Update Book
```http
PATCH /admin/books/:id
Authorization: Bearer <adminToken>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "isPublic": false
}
```

**Response:** Updated book object

---

#### Delete Book
```http
DELETE /admin/books/:id
Authorization: Bearer <adminToken>
```

**Response:**
```json
{
  "message": "Book deleted successfully"
}
```

---

### Books (Public)

#### Get All Public Books
```http
GET /books?page=1&limit=10
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "data": [
    {
      "_id": "690d234a9ce6dd768e552bac",
      "title": "The Great Book",
      "subtitle": "A Subtitle",
      "description": "This is a great book...",
      "coverImageUrl": "https://example.com/cover.jpg",
      "quote": "A memorable quote from the book",
      "author": "John Doe",
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "isPublic": true
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

**Note:** Only returns books where `isPublic: true`

---

#### Get Public Book by ID
```http
GET /books/:id
```

**Response:** Book object (only if `isPublic: true`)

**Error:** Returns 404 if book is not public or not found

---

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "timestamp": "2024-01-15T10:00:00.000Z",
  "path": "/admin/exam-sets",
  "message": ["property name should not exist"]
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "timestamp": "2024-01-15T10:00:00.000Z",
  "path": "/admin/exam-sets",
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "timestamp": "2024-01-15T10:00:00.000Z",
  "path": "/student/exam/result/690d234a9ce6dd768e552b80",
  "message": "You don't have permission to access this result"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "timestamp": "2024-01-15T10:00:00.000Z",
  "path": "/admin/exam-sets/690d234a9ce6dd768e552b6d",
  "message": "Exam set not found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "timestamp": "2024-01-15T10:00:00.000Z",
  "path": "/admin/exam-sets",
  "message": "Internal server error"
}
```

---

## Rate Limiting

- **Admin Login**: 5 requests per minute
- **Other endpoints**: Default rate limit applies

---

## Swagger Documentation

Interactive API documentation available at:
- **Development**: `http://localhost:3001/api`
- **Production**: `https://phapluat.hcmutertic.com/api`

---

## Notes

1. All timestamps are in ISO 8601 format (UTC)
2. All IDs are MongoDB ObjectIds (24 character hex strings)
3. Questions in exam sessions do NOT include `correctAnswer` until after submission
4. Student can only view their own exam results
5. Admin can view and manage all results
6. Books with `isPublic: false` are only accessible via admin endpoints

