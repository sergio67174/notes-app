# API Reference

Complete API documentation for the Notes App (Kanban Board) backend.

---

## Base Configuration

**Base URL**: `http://localhost:4000`

**Content Type**: `application/json`

**Authentication**: Bearer token in Authorization header

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Expiry**: 24 hours

---

## Authentication Endpoints

### Register User

Create a new user account with email and password.

**Endpoint**: `POST /auth/register`

**Authentication**: Not required

#### Request

```http
POST /auth/register HTTP/1.1
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User's email address (must be unique) |
| `password` | string | Yes | User's password (will be hashed with bcrypt) |
| `name` | string | Yes | User's display name |

#### Response

**Success** (201 Created):

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "created_at": "2025-01-15T12:00:00.000Z",
  "updated_at": "2025-01-15T12:00:00.000Z"
}
```

**Note**: Password hash is never returned in responses.

**Side Effects**:
- Creates user account
- Auto-creates a board for the user
- Auto-creates 3 default columns (TODO, IN_PROGRESS, DONE)

#### Error Responses

**Duplicate Email** (409 Conflict):

```json
{
  "error": "User with this email already exists"
}
```

**Missing Fields** (400 Bad Request):

```json
{
  "error": "Email, password, and name are required"
}
```

---

### Login User

Authenticate user and receive JWT token.

**Endpoint**: `POST /auth/login`

**Authentication**: Not required

#### Request

```http
POST /auth/login HTTP/1.1
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User's email address |
| `password` | string | Yes | User's password (plaintext) |

#### Response

**Success** (200 OK):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJpYXQiOjE3MzY5NDcyMDAsImV4cCI6MTczNzAzMzYwMH0.abc123...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Token Payload**:
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "iat": 1736947200,
  "exp": 1737033600
}
```

**Usage**: Store token in localStorage and include in subsequent requests:

```javascript
localStorage.setItem('token', data.token);

// For API calls
fetch('/me/board', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

#### Error Responses

**Invalid Credentials** (401 Unauthorized):

```json
{
  "error": "Invalid email or password"
}
```

**Note**: Response is intentionally generic to prevent email enumeration.

**Missing Fields** (400 Bad Request):

```json
{
  "error": "Email and password are required"
}
```

---

## Board Endpoints

All board endpoints require authentication.

### Get User's Board

Retrieve the authenticated user's board with all columns and active tasks.

**Endpoint**: `GET /me/board`

**Authentication**: Required (JWT Bearer token)

#### Request

```http
GET /me/board HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**No request body required.**

#### Response

**Success** (200 OK):

```json
{
  "board": {
    "id": "b1234567-1234-1234-1234-123456789abc",
    "owner_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Personal board",
    "columns": [
      {
        "id": "c1111111-1111-1111-1111-111111111111",
        "board_id": "b1234567-1234-1234-1234-123456789abc",
        "name": "To Do",
        "slug": "TODO",
        "position": 1,
        "created_at": "2025-01-15T12:00:00.000Z",
        "updated_at": "2025-01-15T12:00:00.000Z"
      },
      {
        "id": "c2222222-2222-2222-2222-222222222222",
        "board_id": "b1234567-1234-1234-1234-123456789abc",
        "name": "In Progress",
        "slug": "IN_PROGRESS",
        "position": 2,
        "created_at": "2025-01-15T12:00:00.000Z",
        "updated_at": "2025-01-15T12:00:00.000Z"
      },
      {
        "id": "c3333333-3333-3333-3333-333333333333",
        "board_id": "b1234567-1234-1234-1234-123456789abc",
        "name": "Done",
        "slug": "DONE",
        "position": 3,
        "created_at": "2025-01-15T12:00:00.000Z",
        "updated_at": "2025-01-15T12:00:00.000Z"
      }
    ],
    "tasks": [
      {
        "id": "t1111111-1111-1111-1111-111111111111",
        "board_id": "b1234567-1234-1234-1234-123456789abc",
        "column_id": "c1111111-1111-1111-1111-111111111111",
        "title": "Implement user authentication",
        "description": "Add JWT-based authentication system",
        "position": 1,
        "color": "pastel-yellow",
        "created_at": "2025-01-15T12:05:00.000Z",
        "updated_at": "2025-01-15T12:05:00.000Z"
      },
      {
        "id": "t2222222-2222-2222-2222-222222222222",
        "board_id": "b1234567-1234-1234-1234-123456789abc",
        "column_id": "c2222222-2222-2222-2222-222222222222",
        "title": "Design database schema",
        "description": null,
        "position": 1,
        "color": "pastel-pink",
        "created_at": "2025-01-15T12:10:00.000Z",
        "updated_at": "2025-01-15T12:15:00.000Z"
      }
    ]
  }
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `board.id` | UUID | Board unique identifier |
| `board.owner_id` | UUID | User who owns the board |
| `board.name` | string | Board name |
| `board.columns` | array | Array of column objects |
| `board.tasks` | array | Array of task objects (excludes soft-deleted tasks) |

**Column Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Column unique identifier |
| `board_id` | UUID | Parent board ID |
| `name` | string | Display name (e.g., "To Do") |
| `slug` | string | Identifier (TODO, IN_PROGRESS, DONE) |
| `position` | integer | Display order (1, 2, 3) |

**Task Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Task unique identifier |
| `board_id` | UUID | Parent board ID |
| `column_id` | UUID | Current column ID |
| `title` | string | Task title |
| `description` | string\|null | Task description (optional) |
| `position` | integer | Order within column |
| `color` | string | Pastel color (pastel-yellow, pastel-pink, pastel-green, pastel-blue) |

**Note**: Soft-deleted tasks (`is_deleted = true`) are excluded from the response.

#### Error Responses

**Unauthorized** (401):

```json
{
  "error": "Unauthorized. Please provide a valid token."
}
```

**Board Not Found** (404):

```json
{
  "error": "Board not found"
}
```

---

### Delete All DONE Tasks

Soft-delete all tasks in the DONE column (sets `is_deleted = true` and `deleted_at = NOW()`).

**Endpoint**: `POST /me/board/remove-done-tasks`

**Authentication**: Required (JWT Bearer token)

#### Request

```http
POST /me/board/remove-done-tasks HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**No request body required.**

#### Response

**Success** (200 OK):

```json
{
  "removedCount": 5
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `removedCount` | integer | Number of tasks soft-deleted |

**Behavior**:
- Only affects tasks in the DONE column
- Tasks are soft-deleted (not permanently removed)
- Deleted tasks will not appear in subsequent `GET /me/board` responses
- Can be called multiple times (idempotent)

#### Error Responses

**Unauthorized** (401):

```json
{
  "error": "Unauthorized. Please provide a valid token."
}
```

**Board Not Found** (404):

```json
{
  "error": "Board not found"
}
```

**DONE Column Not Found** (404):

```json
{
  "error": "DONE column not found"
}
```

---

## Task Endpoints

All task endpoints require authentication.

### Create Task

Create a new task in the user's TODO column.

**Endpoint**: `POST /tasks`

**Authentication**: Required (JWT Bearer token)

#### Request

```http
POST /tasks HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "Fix navigation bug",
  "description": "Menu not closing on mobile devices"
}
```

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Task title (must not be empty) |
| `description` | string | No | Task description (can be empty/null) |

#### Response

**Success** (201 Created):

```json
{
  "id": "t9999999-9999-9999-9999-999999999999",
  "board_id": "b1234567-1234-1234-1234-123456789abc",
  "column_id": "c1111111-1111-1111-1111-111111111111",
  "title": "Fix navigation bug",
  "description": "Menu not closing on mobile devices",
  "position": 3,
  "color": "pastel-green",
  "is_deleted": false,
  "deleted_at": null,
  "created_at": "2025-01-15T14:30:00.000Z",
  "updated_at": "2025-01-15T14:30:00.000Z"
}
```

**Automatic Behaviors**:
- Task is created in TODO column
- Random pastel color is assigned (yellow, pink, green, blue)
- Position is auto-incremented (appended to end of TODO column)

#### Error Responses

**Missing Title** (400):

```json
{
  "error": "Title is required"
}
```

**Unauthorized** (401):

```json
{
  "error": "Unauthorized. Please provide a valid token."
}
```

**TODO Column Not Found** (404):

```json
{
  "error": "TODO column not found for user"
}
```

---

### Update Task

Update a task's title and/or description.

**Endpoint**: `PATCH /tasks/:id`

**Authentication**: Required (JWT Bearer token)

**URL Parameters**:

| Parameter | Description |
|-----------|-------------|
| `:id` | Task UUID to update |

#### Request

```http
PATCH /tasks/t9999999-9999-9999-9999-999999999999 HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "Fix navigation bug on mobile",
  "description": "Menu not closing properly on iOS Safari"
}
```

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | No* | Updated task title |
| `description` | string | No* | Updated task description |

**Note**: At least one field must be provided.

**Partial Updates Supported**: You can update just title, just description, or both.

#### Response

**Success** (200 OK):

```json
{
  "id": "t9999999-9999-9999-9999-999999999999",
  "board_id": "b1234567-1234-1234-1234-123456789abc",
  "column_id": "c1111111-1111-1111-1111-111111111111",
  "title": "Fix navigation bug on mobile",
  "description": "Menu not closing properly on iOS Safari",
  "position": 3,
  "color": "pastel-green",
  "is_deleted": false,
  "deleted_at": null,
  "created_at": "2025-01-15T14:30:00.000Z",
  "updated_at": "2025-01-15T14:45:00.000Z"
}
```

**Fields Not Updated**:
- `column_id` (use `/tasks/:id/move` instead)
- `position` (use `/tasks/:id/move` instead)
- `color` (immutable)
- `is_deleted` (use `DELETE /tasks/:id` instead)

#### Error Responses

**No Fields Provided** (400):

```json
{
  "error": "No fields to update"
}
```

**Task Not Found or Unauthorized** (404):

```json
{
  "error": "Task not found"
}
```

**Note**: Returns 404 if task belongs to another user (prevents information disclosure).

**Unauthorized** (401):

```json
{
  "error": "Unauthorized. Please provide a valid token."
}
```

---

### Move Task Between Columns

Move a task to a different column with optional position.

**Endpoint**: `PATCH /tasks/:id/move`

**Authentication**: Required (JWT Bearer token)

**URL Parameters**:

| Parameter | Description |
|-----------|-------------|
| `:id` | Task UUID to move |

#### Request

```http
PATCH /tasks/t9999999-9999-9999-9999-999999999999/move HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "target_column_id": "c2222222-2222-2222-2222-222222222222",
  "new_position": 2
}
```

**Request Body**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `target_column_id` | UUID | Yes | Destination column ID |
| `new_position` | integer | No | Position in destination column (defaults to end) |

#### Response

**Success** (200 OK):

```json
{
  "id": "t9999999-9999-9999-9999-999999999999",
  "board_id": "b1234567-1234-1234-1234-123456789abc",
  "column_id": "c2222222-2222-2222-2222-222222222222",
  "title": "Fix navigation bug on mobile",
  "description": "Menu not closing properly on iOS Safari",
  "position": 2,
  "color": "pastel-green",
  "is_deleted": false,
  "deleted_at": null,
  "created_at": "2025-01-15T14:30:00.000Z",
  "updated_at": "2025-01-15T15:00:00.000Z"
}
```

**Validation**:
- Task and column must belong to the same board
- Column must exist
- Position is optional (defaults to appending at end)

#### Error Responses

**Missing Target Column** (400):

```json
{
  "error": "target_column_id is required"
}
```

**Task Not Found** (404):

```json
{
  "error": "Task not found"
}
```

**Column Not Found** (404):

```json
{
  "error": "Target column not found"
}
```

**Cross-Board Move Attempted** (403):

```json
{
  "error": "Cannot move task to a column on a different board"
}
```

**Unauthorized** (401):

```json
{
  "error": "Unauthorized. Please provide a valid token."
}
```

---

### Delete Task

Soft-delete a task (sets `is_deleted = true` and `deleted_at = NOW()`).

**Endpoint**: `DELETE /tasks/:id`

**Authentication**: Required (JWT Bearer token)

**URL Parameters**:

| Parameter | Description |
|-----------|-------------|
| `:id` | Task UUID to delete |

#### Request

```http
DELETE /tasks/t9999999-9999-9999-9999-999999999999 HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**No request body required.**

#### Response

**Success** (200 OK):

```json
{
  "message": "Task deleted successfully",
  "task": {
    "id": "t9999999-9999-9999-9999-999999999999",
    "board_id": "b1234567-1234-1234-1234-123456789abc",
    "column_id": "c1111111-1111-1111-1111-111111111111",
    "title": "Fix navigation bug",
    "description": "Menu not closing on mobile devices",
    "position": 3,
    "color": "pastel-green",
    "is_deleted": true,
    "deleted_at": "2025-01-15T16:00:00.000Z",
    "created_at": "2025-01-15T14:30:00.000Z",
    "updated_at": "2025-01-15T14:30:00.000Z"
  }
}
```

**Behavior**:
- Task is soft-deleted (not permanently removed from database)
- `is_deleted` flag is set to `true` and `deleted_at` timestamp is recorded
- Task can be deleted from any column (TODO, IN_PROGRESS, or DONE)
- Deleted task will not appear in subsequent `GET /me/board` responses
- Can potentially be recovered (requires manual database query)

#### Error Responses

**Task Not Found or Unauthorized** (404):

```json
{
  "error": "Task not found"
}
```

**Unauthorized** (401):

```json
{
  "error": "Unauthorized. Please provide a valid token."
}
```

---

## Health Check

### System Health

Check if the API server is running.

**Endpoint**: `GET /health`

**Authentication**: Not required

#### Request

```http
GET /health HTTP/1.1
```

**No request body or headers required.**

#### Response

**Success** (200 OK):

```json
{
  "status": "ok"
}
```

---

## Error Responses

### Standard Error Format

All API errors return JSON with an `error` field:

```json
{
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| `200` | OK | Request successful |
| `201` | Created | Resource created successfully |
| `400` | Bad Request | Missing required fields, invalid data |
| `401` | Unauthorized | Missing or invalid token |
| `403` | Forbidden | Action not allowed (e.g., cross-board move) |
| `404` | Not Found | Resource doesn't exist or unauthorized |
| `409` | Conflict | Resource already exists (e.g., duplicate email) |
| `500` | Internal Server Error | Unexpected server error |

### Common Error Scenarios

#### Invalid Token

```json
{
  "error": "Unauthorized. Please provide a valid token."
}
```

**Causes**:
- Token expired (24 hours)
- Token malformed
- Token signed with wrong secret
- No Authorization header

**Solution**: Re-authenticate with `POST /auth/login`

#### Token Expired

```json
{
  "error": "Token expired"
}
```

**Solution**: Re-authenticate to get a new token

#### Resource Not Found

```json
{
  "error": "Task not found"
}
```

**Causes**:
- Resource doesn't exist
- Resource belongs to another user
- Resource was soft-deleted

---

## API Usage Examples

### Complete Authentication Flow

```javascript
// 1. Register
const registerResponse = await fetch('http://localhost:4000/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!',
    name: 'John Doe'
  })
});
const user = await registerResponse.json();
// Auto-creates board + 3 columns

// 2. Login
const loginResponse = await fetch('http://localhost:4000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!'
  })
});
const { token, user: userData } = await loginResponse.json();

// 3. Store token
localStorage.setItem('token', token);
```

### Task Management Flow

```javascript
const token = localStorage.getItem('token');
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};

// Get board
const boardResponse = await fetch('http://localhost:4000/me/board', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { board } = await boardResponse.json();
console.log('Columns:', board.columns);
console.log('Tasks:', board.tasks);

// Create task
const createResponse = await fetch('http://localhost:4000/tasks', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    title: 'Implement dark mode',
    description: 'Add theme toggle to settings'
  })
});
const newTask = await createResponse.json();

// Move task to IN_PROGRESS
const inProgressColumn = board.columns.find(c => c.slug === 'IN_PROGRESS');
const moveResponse = await fetch(`http://localhost:4000/tasks/${newTask.id}/move`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({
    target_column_id: inProgressColumn.id,
    new_position: 1
  })
});
const movedTask = await moveResponse.json();

// Update task
const updateResponse = await fetch(`http://localhost:4000/tasks/${newTask.id}`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify({
    title: 'Implement dark mode toggle'
  })
});
const updatedTask = await updateResponse.json();

// Delete task
const deleteResponse = await fetch(`http://localhost:4000/tasks/${newTask.id}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
});
const { message } = await deleteResponse.json();

// Delete all DONE tasks
const removeDoneResponse = await fetch('http://localhost:4000/me/board/remove-done-tasks', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
const { removedCount } = await removeDoneResponse.json();
console.log(`Removed ${removedCount} completed tasks`);
```

---

## Rate Limiting

**Current Status**: No rate limiting implemented

**Recommended**: Implement rate limiting in production:
- Authentication endpoints: 5 requests/minute
- Task operations: 60 requests/minute
- Board operations: 30 requests/minute

---

## CORS Configuration

**Allowed Origins**: Configured via CORS middleware

**Development**: `http://localhost:5173` (Vite dev server)

**Production**: Configure in environment variables

---

## API Versioning

**Current Version**: No versioning (initial release)

**Future**: Consider `/v1/` prefix for breaking changes

---

## Summary

The Notes App API provides 8 endpoints for complete Kanban board management:

- **Authentication**: Register and login with JWT tokens
- **Board Management**: Retrieve board with columns and tasks
- **Task Operations**: Create, read, update, move, and delete tasks
- **Bulk Actions**: Remove all completed tasks

All endpoints return JSON responses and use standard HTTP status codes for error handling.
