# System Architecture

This document provides a detailed overview of the Notes App (Kanban Board) architecture, including system layers, component structure, and key design decisions.

---

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│           React 19 + React Router + Context API              │
│                                                              │
│  ┌──────────┐  ┌───────────┐  ┌────────┐  ┌──────────┐   │
│  │Auth Pages│  │Board Page │  │Kanban  │  │ Modals   │   │
│  │          │  │           │  │Components│ │          │   │
│  └──────────┘  └───────────┘  └────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                    HTTP/JSON + JWT
                            │
┌─────────────────────────────────────────────────────────────┐
│                     API LAYER (Express)                      │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │   CORS   │  │   Auth   │  │  Error   │                │
│  │Middleware│  │Middleware│  │ Handler  │                │
│  └──────────┘  └──────────┘  └──────────┘                │
│                                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │              ROUTE LAYER                      │          │
│  │  /auth  │  /me  │  /tasks  │  /health        │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                  BUSINESS LOGIC LAYER                        │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Controllers  │  │  Services    │  │Repositories  │    │
│  │  (Handlers)  │→ │(Business     │→ │(Data Access) │    │
│  │              │  │  Logic)      │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                         pg Pool
                            │
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                          │
│                       PostgreSQL                             │
│                                                              │
│  ┌───────┐  ┌────────┐  ┌─────────┐  ┌───────────┐       │
│  │ users │  │ boards │  │ columns │  │   tasks   │       │
│  └───────┘  └────────┘  └─────────┘  └───────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Backend Architecture

### Layered Architecture Pattern

The backend follows a **3-tier layered architecture**:

1. **Controllers** - Handle HTTP requests/responses
2. **Services** - Contain business logic
3. **Repositories** - Interact with database

**Benefits**:
- Clear separation of concerns
- Easy to test (mock dependencies)
- Maintainable and scalable
- Follows SOLID principles

### Layer Responsibilities

#### 1. Controllers Layer
**Location**: `backend/src/controllers/`

**Responsibility**: HTTP request handling and response formatting

**Files**:
- `auth.controller.js` - Registration and login handlers
- `task.controller.js` - Task CRUD handlers
- `board.controller.js` - Board operations handlers

**Example**:
```javascript
// auth.controller.js
export async function registerController(req, res, next) {
  try {
    const { email, password, name } = req.body;
    const user = await registerUser(email, password, name);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}
```

#### 2. Services Layer
**Location**: `backend/src/services/`

**Responsibility**: Business logic, validation, orchestration

**Files**:
- `auth.service.js` - User registration, authentication, password hashing
- `task.service.js` - Task creation, updates, movement, color assignment
- `board.service.js` - Board retrieval, DONE task removal

**Example**:
```javascript
// task.service.js
export async function createTaskForUser(userId, title, description) {
  // 1. Find user's TODO column
  const { board, column } = await findTodoColumnForUser(userId);

  // 2. Generate random pastel color
  const color = getRandomPastelColor();

  // 3. Calculate next position
  const position = await getNextPositionForColumn(column.id);

  // 4. Create task
  return await createTask({
    boardId: board.id,
    columnId: column.id,
    title,
    description,
    position,
    color
  });
}
```

#### 3. Repositories Layer
**Location**: `backend/src/repositories/`

**Responsibility**: Database queries and data access

**Files**:
- `user.repository.js` - User CRUD operations
- `task.repository.js` - Task CRUD operations
- `board.repository.js` - Board and column queries
- `column.repository.js` - Column setup and lookup

**Example**:
```javascript
// task.repository.js
export async function createTask({ boardId, columnId, title, description, position, color }) {
  const res = await query(
    `INSERT INTO tasks (board_id, column_id, title, description, position, color)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [boardId, columnId, title, description, position, color]
  );
  return res.rows[0];
}
```

### Middleware

#### Auth Middleware
**File**: `backend/src/middleware/authMiddleware.js`

**Purpose**: Validate JWT tokens and protect routes

**Flow**:
1. Extract token from `Authorization: Bearer <token>` header
2. Verify token using JWT secret
3. Decode payload → `req.user.id`
4. Return 401 if invalid or expired

#### Error Handler
**File**: `backend/src/middleware/errorHandler.js`

**Purpose**: Global error handling

**Flow**:
1. Catch all errors from routes
2. Log error to console
3. Return appropriate status code and message
4. Default 500 for unhandled errors

---

## 🎨 Frontend Architecture

### Component Hierarchy

```
App (BrowserRouter + AuthProvider + Routes)
│
├── AuthPage (Login)
│   └── Form: email, password, submit
│
├── RegisterPage (Sign Up)
│   └── Form: name, email, password, submit
│
└── ProtectedRoute (Auth Guard)
    │
    └── BoardPage (Main Kanban Board)
        │
        ├── BoardHeader
        │   ├── Greeting: "Hello {userName}"
        │   ├── Button: Create New Task → opens modal
        │   ├── Button: Delete Done Tasks → opens confirmation
        │   └── Button: Logout → clears auth
        │
        ├── KanbanBoard (Drag-Drop Context)
        │   │
        │   ├── DndContext (manages drag state)
        │   │
        │   ├── KanbanColumn (TODO)
        │   │   └── TaskCard[] (Draggable)
        │   │       ├── Title + Description
        │   │       ├── Edit Button (✎) → inline edit
        │   │       ├── Delete Button (🗑) → confirmation modal
        │   │       └── Inline Edit Form
        │   │
        │   ├── KanbanColumn (IN_PROGRESS)
        │   │   └── TaskCard[]
        │   │
        │   └── KanbanColumn (DONE)
        │       └── TaskCard[] (with transparency)
        │
        ├── CreateTaskModal
        │   ├── Title Input (required)
        │   ├── Description Textarea (optional)
        │   └── Actions: Cancel | Create
        │
        └── ConfirmationModal (Generic)
            ├── Title + Message
            └── Actions: Cancel | Confirm
```

### Context Providers

#### AuthContext
**File**: `frontend/src/context/AuthContext.jsx`

**Purpose**: Global authentication state management

**State**:
```javascript
{
  user: { id, email, name } | null,
  token: string | null,
  loading: boolean,
  isAuthenticated: boolean
}
```

**Methods**:
- `login(authData)` - Store token/user, navigate to board
- `logout()` - Clear localStorage, navigate to login

**Persistence**: Saves to localStorage for session resumption

**Usage**:
```javascript
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  // ...
}
```

### Routing

**Setup**: `frontend/src/App.jsx`

```javascript
<Routes>
  <Route path="/login" element={<AuthPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route
    path="/me/board"
    element={
      <ProtectedRoute>
        <BoardPage />
      </ProtectedRoute>
    }
  />
  <Route path="/" element={<Navigate to="/login" replace />} />
</Routes>
```

**Route Protection**: `ProtectedRoute` wrapper checks authentication state
- Shows loading while checking auth
- Redirects to `/login` if not authenticated
- Renders children if authenticated

### State Management

**BoardPage State**:
```javascript
{
  board: { id, owner_id, name, columns[], tasks[] },
  loading: boolean,
  error: string,

  // Modal states
  showCreateModal: boolean,
  showDeleteModal: boolean,
  showDeleteTaskModal: boolean,
  taskToDelete: string | null
}
```

**Data Flow**:
1. User action → Handler function
2. API call → Backend endpoint
3. Response → Update state
4. Re-fetch board → Update UI

---

## 🎭 Drag-and-Drop Architecture

### Library: @dnd-kit

**Why @dnd-kit?**
- Modern, performant, accessible
- Built for React
- Supports touch and keyboard
- Customizable sensors

### Implementation

#### DndContext (KanbanBoard)
```javascript
<DndContext
  sensors={sensors}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
  onDragCancel={handleDragCancel}
>
  {/* Droppable columns */}
  <DragOverlay>
    {/* Task preview during drag */}
  </DragOverlay>
</DndContext>
```

#### Draggable (TaskCard)
```javascript
const { attributes, listeners, setNodeRef, transform } = useDraggable({
  id: task.id,
  disabled: isEditing  // Can't drag while editing
});
```

#### Droppable (KanbanColumn)
```javascript
const { setNodeRef, isOver } = useDroppable({
  id: column.id
});
```

### Drag Flow

1. **Drag Start**: User grabs task → `handleDragStart` sets `activeTask`
2. **Dragging**: Task follows cursor, DragOverlay shows preview
3. **Hover**: Column highlights when task hovers over it (`isOver` state)
4. **Drop**: User releases → `handleDragEnd` calculates new position
5. **API Call**: `PATCH /tasks/:id/move` with `target_column_id` and `new_position`
6. **Refresh**: Board refetches, UI updates

---

## 🎨 Styling Architecture

### CSS Organization

- **Global Styles**: `frontend/src/index.css` (theme variables, auth pages)
- **Component Styles**: Co-located CSS files (e.g., `TaskCard.css`)
- **Approach**: Component-scoped CSS (no CSS-in-JS)

### Design System

**Color Variables** (dark theme):
```css
:root {
  --color-bg: #0f172a;              /* Page background */
  --color-card-bg: #0b1220;         /* Card background */
  --color-primary: #4f46e5;         /* Primary action */
  --color-primary-hover: #4338ca;   /* Hover state */
  --color-border: #1f2937;          /* Borders */
  --color-text: #e5e7eb;            /* Primary text */
  --color-text-muted: #9ca3af;      /* Secondary text */
  --color-error: #f97373;           /* Error/delete */

  /* Task pastel colors */
  --pastel-yellow: #fef9c3;
  --pastel-pink: #fce7f3;
  --pastel-green: #d1fae5;
  --pastel-blue: #dbeafe;
}
```

**Layout Features**:
- Flexbox for header and modals
- CSS Grid for kanban columns (3-column layout)
- Radial gradients for depth
- Box shadows for elevation
- Smooth transitions (0.15s ease)

---

## 🔐 Authentication Architecture

### Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ 1. POST /auth/login
       │    { email, password }
       ▼
┌─────────────┐
│ Controller  │
└──────┬──────┘
       │ 2. Call loginUser()
       ▼
┌─────────────┐
│  Service    │
└──────┬──────┘
       │ 3. Verify credentials
       │ 4. Generate JWT
       ▼
┌─────────────┐
│   Client    │ 5. Store token in localStorage
└──────┬──────┘
       │ 6. All API calls include:
       │    Authorization: Bearer <token>
       ▼
┌─────────────┐
│ Middleware  │ 7. Verify token → req.user.id
└──────┬──────┘
       │ 8. Allow/Deny request
       ▼
┌─────────────┐
│ Controller  │
└─────────────┘
```

### Token Details

- **Algorithm**: HMAC SHA256 (HS256)
- **Expiry**: 24 hours
- **Payload**: `{ userId: string }`
- **Secret**: Configured via `JWT_SECRET` environment variable

### Password Security

- **Hashing**: Bcrypt
- **Salt Rounds**: 10
- **Storage**: Only hash stored in database
- **Validation**: Compare plaintext with hash

---

## 🗄️ Data Flow

### Task Creation Flow

```
1. User clicks "Create New Task"
2. Modal opens → User enters title, description
3. User clicks "Create"
4. Frontend: POST /tasks { title, description }
5. Controller: taskController.createTaskController()
6. Service: taskService.createTaskForUser()
   - Find TODO column for user
   - Generate random pastel color
   - Calculate next position
7. Repository: taskRepository.createTask()
   - INSERT INTO tasks
8. Response: New task object returned
9. Frontend: Re-fetch board (GET /me/board)
10. UI updates → Task appears in TODO column
```

### Task Movement Flow

```
1. User drags task from TODO to IN_PROGRESS
2. Frontend: handleDragEnd() calculates target column
3. Frontend: PATCH /tasks/:id/move { target_column_id, new_position }
4. Controller: taskController.moveTaskController()
5. Service: taskService.moveTaskForUser()
   - Validate column belongs to same board
   - Update task's column_id and position
6. Repository: taskRepository.moveTaskToColumn()
   - UPDATE tasks SET column_id, position
7. Response: Updated task object
8. Frontend: Re-fetch board
9. UI updates → Task appears in new column
```

---

## 🧩 Key Design Decisions

### 1. Soft Delete for Tasks
**Decision**: Mark tasks as `is_deleted = true` instead of hard delete

**Rationale**:
- Data recovery if user makes mistake
- Audit trail for debugging
- Potential for "undo" feature

### 2. One Board Per User
**Decision**: Unique constraint on `boards.owner_id`

**Rationale**:
- Simplifies MVP
- Clear data ownership
- Easy to extend to multiple boards later

### 3. Auto-create Board on Registration
**Decision**: Create board + 3 columns immediately when user registers

**Rationale**:
- User can start using app immediately
- No "empty state" confusion
- Consistent user experience

### 4. Random Pastel Colors
**Decision**: Assign random color to each new task

**Rationale**:
- Visual variety without user effort
- Easy to distinguish tasks at a glance
- Permanent color (stored in DB)

### 5. JWT over Sessions
**Decision**: Stateless authentication with JWT

**Rationale**:
- Scales horizontally (no session store)
- Works across subdomains
- Mobile-friendly

### 6. Context API over Redux
**Decision**: React Context for global state

**Rationale**:
- Simple authentication state only
- Avoid Redux boilerplate
- Native React solution

### 7. Inline Editing over Modal
**Decision**: TaskCard has inline edit mode

**Rationale**:
- Faster editing workflow
- Less UI disruption
- Modern UX pattern

---

## 🔄 Request/Response Flow

### Authenticated Request Example

```
┌─────────────┐
│   Client    │ 1. GET /me/board
│             │    Headers: Authorization: Bearer eyJhbGc...
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Auth Middleware│ 2. Verify token → req.user.id = "uuid"
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Controller   │ 3. boardController.getMyBoardController(req, res)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Service      │ 4. boardService.getMyBoard(userId)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Repository   │ 5. Query DB for board + columns + tasks
└──────┬──────┘
       │
       ▼
┌─────────────┐
│Client       │ 6. Response: { board: {...} }
└─────────────┘
```

---

## 📦 Dependency Injection

**Pattern**: Constructor injection (implicit via imports)

**Example**:
```javascript
// Service imports repository
import { createTask } from '../repositories/task.repository.js';

// Controller imports service
import { createTaskForUser } from '../services/task.service.js';
```

**Benefits**:
- Loose coupling
- Easy to mock for tests
- Clear dependencies

---

## 🧪 Testability

### Backend Testing

**Unit Tests** (Jest):
- Mock repository layer
- Test service logic
- Verify business rules

**Example**:
```javascript
// Mock repository
vi.mock('../repositories/task.repository.js');

// Test service
test('creates task with random color', async () => {
  const task = await createTaskForUser(userId, 'Task', 'Desc');
  expect(['pastel-yellow', 'pastel-pink', 'pastel-green', 'pastel-blue'])
    .toContain(task.color);
});
```

### Frontend Testing

**Component Tests** (Vitest + RTL):
- Mock API client
- Test user interactions
- Verify UI updates

**Example**:
```javascript
test('opens modal on create button click', () => {
  render(<BoardPage />);
  fireEvent.click(screen.getByTestId('btn-create-task'));
  expect(screen.getByTestId('create-task-modal')).toBeInTheDocument();
});
```

---

## 📖 Summary

The Notes App follows clean architecture principles with clear separation of concerns:

- **Layered Backend**: Controllers → Services → Repositories → Database
- **Component-Based Frontend**: Reusable React components with Context API
- **Stateless Authentication**: JWT tokens with Bearer scheme
- **Soft Delete Strategy**: Data preservation for recovery
- **Drag-and-Drop UX**: Smooth task movement with @dnd-kit
- **Test-Driven**: Comprehensive unit, component, and E2E tests

This architecture supports maintainability, scalability, and testability while keeping the codebase simple and understandable.
