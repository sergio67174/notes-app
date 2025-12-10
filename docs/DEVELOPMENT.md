# Development Guide

Complete guide for setting up, developing, and contributing to the Notes App (Kanban Board) project.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Development Workflow](#development-workflow)
- [Available Scripts](#available-scripts)
- [Project Configuration](#project-configuration)
- [Code Style](#code-style)
- [Adding New Features](#adding-new-features)
- [Debugging](#debugging)
- [Troubleshooting](#troubleshooting)
- [Git Workflow](#git-workflow)

---

## Prerequisites

### Required Software

| Software | Minimum Version | Download |
|----------|----------------|----------|
| **Node.js** | v18.0+ | https://nodejs.org/ |
| **npm** | v9.0+ | (included with Node.js) |
| **PostgreSQL** | v14.0+ | https://www.postgresql.org/ |
| **Git** | v2.0+ | https://git-scm.com/ |

### Optional Tools

- **pgAdmin** - PostgreSQL GUI (https://www.pgadmin.org/)
- **Postman** - API testing (https://www.postman.com/)
- **VS Code** - Recommended IDE (https://code.visualstudio.com/)

### VS Code Extensions

Recommended extensions for development:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "PostgreSQL.pgsql"
  ]
}
```

---

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd notes_app
```

### 2. Database Setup

#### Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE notes_db;

# Exit psql
\q
```

#### Create Tables

Run the following SQL in order (respects foreign key constraints):

```sql
-- 1. Users table
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- 2. Boards table
CREATE TABLE boards (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID UNIQUE NOT NULL REFERENCES users(id),
    name            VARCHAR(255) DEFAULT 'Personal board',
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- 3. Columns table
CREATE TABLE columns (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id        UUID NOT NULL REFERENCES boards(id),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(50) NOT NULL,
    position        INTEGER NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- 4. Tasks table
CREATE TABLE tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id        UUID NOT NULL REFERENCES boards(id),
    column_id       UUID NOT NULL REFERENCES columns(id),
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    position        INTEGER NOT NULL,
    color           VARCHAR(50) NOT NULL,
    is_deleted      BOOLEAN DEFAULT FALSE,
    deleted_at      TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- 5. Indexes (optional but recommended for performance)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_boards_owner ON boards(owner_id);
CREATE INDEX idx_columns_board ON columns(board_id);
CREATE INDEX idx_tasks_board_active ON tasks(board_id, is_deleted) WHERE is_deleted = FALSE;
CREATE INDEX idx_tasks_column ON tasks(column_id);
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

**Edit `.env`** with your database credentials:

```env
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=notes_db
DB_USER=postgres
DB_PASSWORD=your_password_here
JWT_SECRET=your_secret_key_change_in_production
```

**Test database connection**:

```bash
npm run test:db
```

**Start backend**:

```bash
npm run dev
```

Backend should now be running on `http://localhost:4000`

### 4. Frontend Setup

**Open new terminal** (keep backend running):

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

**Edit `.env`**:

```env
VITE_API_BASE_URL=http://localhost:4000
```

**Start frontend**:

```bash
npm run dev
```

Frontend should now be running on `http://localhost:5173`

### 5. Verify Installation

1. Open browser: `http://localhost:5173`
2. Click "Register here"
3. Create account with:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "Test1234!"
4. Login with credentials
5. Create a task
6. Drag task to different column
7. Edit task inline
8. Delete task

If all steps work, setup is complete! 🎉

---

## Development Workflow

### Daily Development Flow

```bash
# 1. Pull latest changes
git pull origin main

# 2. Create feature branch
git checkout -b feature/my-feature

# 3. Start backend (terminal 1)
cd backend
npm run dev

# 4. Start frontend (terminal 2)
cd frontend
npm run dev

# 5. Make changes, test frequently

# 6. Run tests
cd backend && npm test
cd frontend && npm test

# 7. Commit changes
git add .
git commit -m "feat: add my feature"

# 8. Push branch
git push origin feature/my-feature

# 9. Create pull request on GitHub
```

### Hot Reload

**Backend** (Nodemon):
- Watches `src/` directory
- Auto-restarts on `.js` file changes
- Configuration: `nodemon.json`

**Frontend** (Vite):
- Hot Module Replacement (HMR)
- Instant feedback on changes
- No page refresh needed for most changes

---

## Available Scripts

### Backend Scripts

```bash
# Development
npm run dev              # Start with nodemon (auto-reload)
npm start                # Production start (no reload)

# Testing
npm test                 # Run all tests
npm run test:unit        # Run unit tests only
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Database
npm run test:db          # Test database connection

# Linting (if configured)
npm run lint             # Run ESLint
```

### Frontend Scripts

```bash
# Development
npm run dev              # Start Vite dev server
npm run preview          # Preview production build

# Building
npm run build            # Build for production
npm run build:analyze    # Build with bundle analysis

# Testing
npm test                 # Run Vitest tests
npm run test:ui          # Run tests with UI
npm run test:coverage    # Generate coverage report

# Linting
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix linting issues
```

### Root Scripts

```bash
# E2E Testing
npx playwright test              # Run all E2E tests
npx playwright test --headed     # Run with browser visible
npx playwright test --debug      # Debug mode
npx playwright test --ui         # Playwright UI mode
npx playwright show-report       # Show test report

# Install Playwright browsers (first time only)
npx playwright install
```

---

## Project Configuration

### Backend Configuration

#### Environment Variables

**File**: `backend/.env`

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 4000 | No |
| `DB_HOST` | PostgreSQL host | localhost | Yes |
| `DB_PORT` | PostgreSQL port | 5432 | Yes |
| `DB_NAME` | Database name | notes_db | Yes |
| `DB_USER` | Database user | postgres | Yes |
| `DB_PASSWORD` | Database password | - | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |

**Security Note**: Never commit `.env` to Git! Use `.env.example` as template.

#### Jest Configuration

**File**: `backend/package.json`

```json
{
  "jest": {
    "testEnvironment": "node",
    "transform": {},
    "extensionsToTreatAsEsm": [".js"],
    "testTimeout": 10000
  }
}
```

### Frontend Configuration

#### Environment Variables

**File**: `frontend/.env`

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_BASE_URL` | Backend API URL | http://localhost:4000 | Yes |

#### Vite Configuration

**File**: `frontend/vite.config.js`

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true  // Auto-open browser
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setupTests.js'
  }
});
```

---

## Code Style

### JavaScript/React Style Guide

**General Rules**:
- Use ES6+ syntax (arrow functions, destructuring, etc.)
- Prefer `const` over `let`, avoid `var`
- Use async/await over promises
- Use template literals for string interpolation

**Example**:

```javascript
// Good ✓
const user = await findUserByEmail(email);
const greeting = `Hello, ${user.name}!`;

// Avoid ✗
var user;
findUserByEmail(email).then(function(result) {
  user = result;
});
const greeting = "Hello, " + user.name + "!";
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Variables** | camelCase | `userName`, `taskList` |
| **Functions** | camelCase (verb) | `createTask`, `handleSubmit` |
| **Components** | PascalCase | `TaskCard`, `BoardPage` |
| **Constants** | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_RETRIES` |
| **Files** | Component name | `TaskCard.jsx`, `auth.service.js` |

### File Organization

**Backend**:
```
├── controllers/    # HTTP handlers (postfix: .controller.js)
├── services/       # Business logic (postfix: .service.js)
├── repositories/   # Data access (postfix: .repository.js)
├── middleware/     # Express middleware (postfix: Middleware.js)
├── routes/         # API routes (postfix: .routes.js)
└── utils/          # Helper functions (descriptive names)
```

**Frontend**:
```
├── pages/          # Page components (postfix: Page.jsx)
├── components/     # UI components (PascalCase.jsx)
├── context/        # Context providers (postfix: Context.jsx)
├── api/            # API client (client.js)
└── tests/          # Component tests (postfix: .test.jsx)
```

### JSDoc Comments

**Use JSDoc for all exported functions**:

```javascript
/**
 * Creates a new task in the user's TODO column
 *
 * @param {string} userId - User UUID
 * @param {string} title - Task title (required)
 * @param {string} description - Task description (optional)
 * @returns {Promise<Object>} Created task object
 * @throws {Error} If TODO column not found
 */
export async function createTaskForUser(userId, title, description) {
  // Implementation...
}
```

### React Component Style

**Functional components with hooks**:

```javascript
export default function TaskCard({ task, onUpdateTask, onDeleteTask }) {
  const [isEditing, setIsEditing] = useState(false);

  function handleSave() {
    // Handler logic
  }

  return (
    <div className="task-card" data-testid={`task-card-${task.id}`}>
      {/* Component JSX */}
    </div>
  );
}
```

**Key principles**:
- Use `data-testid` attributes for testing
- Extract complex logic into helper functions
- Keep components focused (single responsibility)
- Use descriptive prop names

---

## Adding New Features

### Backend Feature Checklist

1. **Design**: Plan data model and API endpoints
2. **Database**: Add/modify tables if needed
3. **Repository**: Add data access functions
4. **Service**: Implement business logic
5. **Controller**: Add HTTP handlers
6. **Routes**: Register endpoints
7. **Tests**: Write unit tests for service layer
8. **Documentation**: Update API.md

### Example: Add Task Priority

#### 1. Database Migration

```sql
ALTER TABLE tasks ADD COLUMN priority VARCHAR(20) DEFAULT 'medium';
-- Valid values: 'low', 'medium', 'high'
```

#### 2. Repository Function

**File**: `backend/src/repositories/task.repository.js`

```javascript
export async function updateTaskPriority(taskId, priority) {
  const res = await query(
    `UPDATE tasks SET priority = $1, updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [priority, taskId]
  );
  return res.rows[0];
}
```

#### 3. Service Function

**File**: `backend/src/services/task.service.js`

```javascript
export async function setTaskPriority(userId, taskId, priority) {
  const validPriorities = ['low', 'medium', 'high'];
  if (!validPriorities.includes(priority)) {
    throw new Error('Invalid priority');
  }

  const task = await findTaskByIdForUser({ taskId, userId });
  if (!task) throw new Error('Task not found');

  return await updateTaskPriority(taskId, priority);
}
```

#### 4. Controller

**File**: `backend/src/controllers/task.controller.js`

```javascript
export async function setTaskPriorityController(req, res, next) {
  try {
    const { id } = req.params;
    const { priority } = req.body;
    const userId = req.user.id;

    const task = await setTaskPriority(userId, id, priority);
    res.json(task);
  } catch (error) {
    next(error);
  }
}
```

#### 5. Route

**File**: `backend/src/routes/task.routes.js`

```javascript
taskRouter.patch('/:id/priority', setTaskPriorityController);
```

#### 6. Tests

**File**: `backend/tests/unit/task.service.test.js`

```javascript
test('sets task priority to high', async () => {
  const user = await registerUser('user@example.com', 'Pass123!', 'User');
  const task = await createTaskForUser(user.id, 'Task', '');

  const updated = await setTaskPriority(user.id, task.id, 'high');

  expect(updated.priority).toBe('high');
});
```

### Frontend Feature Checklist

1. **Design**: Plan component structure and state
2. **API Client**: Add API call function if needed
3. **Component**: Create/modify React component
4. **Styling**: Add CSS for new component
5. **Integration**: Wire up to parent components
6. **Tests**: Write component tests
7. **Documentation**: Update ARCHITECTURE.md if significant

---

## Debugging

### Backend Debugging

#### Using console.log

```javascript
// Temporary debugging
console.log('User:', user);
console.log('Task created:', task);

// Better: Use descriptive labels
console.log('[DEBUG] Task before update:', task);
console.log('[DEBUG] Task after update:', updatedTask);
```

#### Node Inspector

```bash
# Start with debugger
node --inspect-brk src/server.js

# Then open Chrome DevTools:
# chrome://inspect
```

#### VS Code Debugger

**File**: `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "program": "${workspaceFolder}/backend/src/server.js",
      "envFile": "${workspaceFolder}/backend/.env"
    }
  ]
}
```

Set breakpoints in VS Code, then press F5 to start debugging.

### Frontend Debugging

#### React DevTools

Install browser extension:
- Chrome: https://chrome.google.com/webstore (search "React DevTools")
- Firefox: https://addons.mozilla.org/firefox/ (search "React DevTools")

**Features**:
- Inspect component tree
- View props and state
- Track re-renders

#### Browser DevTools

```javascript
// Log component renders
useEffect(() => {
  console.log('[BoardPage] Rendered with board:', board);
}, [board]);

// Debug drag-drop
function handleDragEnd(event) {
  console.log('[Drag] Start:', event.active.id);
  console.log('[Drag] End:', event.over?.id);
}
```

#### VS Code Debugger

**File**: `.vscode/launch.json`

```json
{
  "type": "chrome",
  "request": "launch",
  "name": "Debug Frontend",
  "url": "http://localhost:5173",
  "webRoot": "${workspaceFolder}/frontend/src"
}
```

---

## Troubleshooting

### Common Issues

#### "Cannot connect to database"

**Symptom**: Backend crashes with database connection error

**Solutions**:
1. Check PostgreSQL is running: `pg_isready`
2. Verify credentials in `backend/.env`
3. Test connection: `npm run test:db`
4. Check database exists: `psql -U postgres -l`

---

#### "Port 4000 already in use"

**Symptom**: Backend fails to start with EADDRINUSE error

**Solutions**:
1. Find process using port: `lsof -i :4000` (Mac/Linux) or `netstat -ano | findstr :4000` (Windows)
2. Kill process: `kill -9 <PID>`
3. Or change PORT in `backend/.env`

---

#### "JWT token invalid"

**Symptom**: API returns 401 Unauthorized after login

**Solutions**:
1. Check JWT_SECRET matches between backend `.env` and stored token
2. Token may have expired (24 hours) - login again
3. Clear localStorage: `localStorage.clear()` in browser console
4. Check Authorization header format: `Bearer <token>`

---

#### "Tasks not appearing after creation"

**Symptom**: Task created but doesn't show on board

**Solutions**:
1. Check browser console for errors
2. Verify API response includes task
3. Check board refresh (`fetchBoard()` called)
4. Verify task not soft-deleted (`is_deleted = false`)

---

#### "Drag-and-drop not working"

**Symptom**: Cannot drag tasks between columns

**Solutions**:
1. Check dnd-kit is installed: `npm list @dnd-kit/core`
2. Verify sensors configured in KanbanBoard
3. Check task not in edit mode (dragging disabled while editing)
4. Console errors may indicate missing props

---

#### "Tests failing with database errors"

**Symptom**: Unit tests fail with SQL errors

**Solutions**:
1. Run tests with `--runInBand` flag (sequential execution)
2. Check database is empty before tests: `clearDatabase()` in `beforeAll`
3. Verify foreign key constraints respected in test data
4. Close connections in `afterAll`: `pool.end()`

---

#### "Vite not hot-reloading"

**Symptom**: Changes not reflected in browser

**Solutions**:
1. Check Vite dev server is running
2. Restart Vite: Ctrl+C → `npm run dev`
3. Clear browser cache: Shift+Refresh
4. Check file saved correctly

---

## Git Workflow

### Branch Naming

| Type | Prefix | Example |
|------|--------|---------|
| **Feature** | `feature/` | `feature/task-priorities` |
| **Bug Fix** | `fix/` | `fix/login-redirect` |
| **Hotfix** | `hotfix/` | `hotfix/security-patch` |
| **Refactor** | `refactor/` | `refactor/auth-service` |
| **Docs** | `docs/` | `docs/update-readme` |

### Commit Messages

**Format**: `type: description`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `test`: Add/update tests
- `docs`: Documentation
- `style`: Code style (formatting)
- `chore`: Build/config changes

**Examples**:
```bash
git commit -m "feat: add task priority levels"
git commit -m "fix: resolve drag-drop bug in Safari"
git commit -m "test: add unit tests for auth service"
git commit -m "docs: update API documentation"
```

### Pull Request Process

1. **Create feature branch**: `git checkout -b feature/my-feature`
2. **Make changes and commit**
3. **Push branch**: `git push origin feature/my-feature`
4. **Create PR on GitHub**
5. **Fill out PR template**:
   - Description of changes
   - Related issues
   - Testing performed
   - Screenshots (if UI changes)
6. **Address review feedback**
7. **Merge after approval**

---

## Future Features

Planned features for future development:

### High Priority
- **Search & Filter**: Global search bar for tasks
- **Due Dates**: Add deadlines with visual indicators
- **Multiple Boards**: Users can create multiple boards

### Medium Priority
- **Task Tags**: Custom labels for categorization
- **Priority Levels**: High/Medium/Low badges
- **Task Comments**: Discussion threads on tasks

### Low Priority
- **Dark/Light Theme**: Theme toggle
- **Custom Columns**: User-defined workflow stages
- **Team Collaboration**: Share boards with others

See [main README](../README.md#-future-enhancements) for complete roadmap.

---

## Resources

### Documentation
- [Architecture](./ARCHITECTURE.md) - System design
- [API Reference](./API.md) - Endpoint documentation
- [Database Schema](./DATABASE.md) - Table definitions
- [Testing Guide](./TESTING.md) - Testing strategy

### External Links
- **React**: https://react.dev/
- **Vite**: https://vitejs.dev/
- **Express**: https://expressjs.com/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **dnd-kit**: https://docs.dndkit.com/
- **Playwright**: https://playwright.dev/

---

## Getting Help

### Debugging Steps

1. **Read error message carefully**
2. **Check browser/terminal console**
3. **Search error in troubleshooting section**
4. **Check relevant documentation**
5. **Search GitHub issues**
6. **Ask team/community**

### Support Channels

- **GitHub Issues**: Report bugs or request features
- **Discussions**: Ask questions or share ideas
- **Documentation**: Check `/docs` folder

---

## Summary

This development guide covers:

- ✅ Complete setup instructions
- ✅ Development workflow and hot reload
- ✅ All available npm scripts
- ✅ Code style and conventions
- ✅ Step-by-step feature development
- ✅ Debugging techniques
- ✅ Common troubleshooting solutions
- ✅ Git workflow and PR process

Happy coding! 🚀
