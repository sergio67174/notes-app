# Testing Guide

Comprehensive testing documentation for the Notes App (Kanban Board), including unit tests, component tests, and end-to-end tests.

---

## Testing Philosophy

The Notes App follows a **comprehensive testing strategy** with three layers:

1. **Unit Tests** (Backend) - Test business logic in isolation
2. **Component Tests** (Frontend) - Test React components with user interactions
3. **End-to-End Tests** - Test complete user workflows

**Coverage Goals**:
- Backend services: 90%+ code coverage
- Frontend components: 80%+ code coverage
- Critical user flows: 100% E2E coverage

**Test Pyramid**:
```
           ▲
          / \
         /E2E\          Few, slow, high confidence
        /─────\
       /  Int  \        Some, medium speed
      /─────────\
     /   Unit    \      Many, fast, focused
    /─────────────\
```

---

## Testing Stack

| Layer | Framework | Tools | Location |
|-------|-----------|-------|----------|
| **Backend Unit** | Jest | Supertest, pg | `backend/tests/unit/` |
| **Frontend Component** | Vitest | React Testing Library | `frontend/src/tests/` |
| **E2E** | Playwright | - | `tests/playwright/` |

---

## Backend Unit Tests

### Framework: Jest

**Location**: `backend/tests/unit/`

**Test Files**:
- `auth.service.test.js` - Authentication logic
- `task.service.test.js` - Task operations
- `board.service.test.js` - Board operations
- `dbTestUtils.js` - Test database cleanup

### Running Tests

```bash
cd backend

# Run all tests
npm test

# Run specific test file
npm test auth.service.test.js

# Run in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage
```

### Test Configuration

**File**: `backend/package.json`

```json
{
  "scripts": {
    "test": "cross-env NODE_OPTIONS=--experimental-vm-modules jest --runInBand"
  },
  "jest": {
    "testEnvironment": "node",
    "transform": {},
    "extensionsToTreatAsEsm": [".js"]
  }
}
```

**Key Settings**:
- `--runInBand`: Tests run sequentially (prevents DB conflicts)
- `testEnvironment: "node"`: Backend doesn't need DOM
- ES modules support via `NODE_OPTIONS`

### Test Isolation Strategy

**Database Cleanup**:
```javascript
import { clearDatabase } from './dbTestUtils.js';

beforeAll(async () => {
  await clearDatabase(); // Clean slate before all tests
});

afterEach(async () => {
  await clearDatabase(); // Isolation between tests
});

afterAll(async () => {
  await pool.end(); // Close connections
});
```

**Why afterEach?**
- Each test starts with empty database
- No test pollution
- Tests can run in any order

---

### auth.service.test.js

**Coverage**: User registration and authentication

**Requirements Tested**: R-001, R-002, R-003, R-004, R-005, R-006

#### Test Cases

##### TC-001: Register New User
```javascript
test('TC-001: registers a new user, creates board + columns', async () => {
  const user = await registerUser('test@example.com', 'Pass123!', 'Test User');

  // Verify user created
  expect(user).toHaveProperty('id');
  expect(user.email).toBe('test@example.com');
  expect(user.name).toBe('Test User');

  // Verify board created
  const board = await findBoardByOwnerId(user.id);
  expect(board).toBeTruthy();

  // Verify 3 columns created
  const columns = await getColumnsByBoardId(board.id);
  expect(columns).toHaveLength(3);
  expect(columns.map(c => c.slug)).toEqual(['TODO', 'IN_PROGRESS', 'DONE']);
});
```

##### TC-002: Duplicate Email
```javascript
test('TC-002: throws error for duplicate email', async () => {
  await registerUser('duplicate@example.com', 'Pass123!', 'User1');

  await expect(
    registerUser('duplicate@example.com', 'Pass456!', 'User2')
  ).rejects.toThrow('User with this email already exists');
});
```

##### TC-004: Valid Login
```javascript
test('TC-004: login with valid credentials returns token', async () => {
  await registerUser('login@example.com', 'Pass123!', 'User');

  const result = await loginUser('login@example.com', 'Pass123!');

  expect(result).toHaveProperty('token');
  expect(result).toHaveProperty('user');
  expect(result.user.email).toBe('login@example.com');

  // Verify token is valid JWT
  const decoded = verifyToken(result.token);
  expect(decoded.userId).toBe(result.user.id);
});
```

##### TC-005: Invalid Password
```javascript
test('TC-005: login with wrong password throws error', async () => {
  await registerUser('secure@example.com', 'CorrectPass', 'User');

  await expect(
    loginUser('secure@example.com', 'WrongPass')
  ).rejects.toThrow('Invalid email or password');
});
```

**Total Test Cases**: 5

**Coverage**: Registration, duplicate handling, login, authentication errors

---

### task.service.test.js

**Coverage**: Task CRUD operations

**Requirements Tested**: R-008, R-009, R-010, R-011, R-012, R-013, R-021

#### Test Cases

##### TC-010: Create Task
```javascript
test('TC-010: creates task in TODO column', async () => {
  const user = await registerUser('user@example.com', 'Pass123!', 'User');
  const task = await createTaskForUser(user.id, 'My Task', 'Description');

  expect(task.title).toBe('My Task');
  expect(task.description).toBe('Description');
  expect(task.position).toBe(1);

  // Verify in TODO column
  const { board, column } = await findTodoColumnForUser(user.id);
  expect(task.column_id).toBe(column.id);
});
```

##### TC-012: Position Increment
```javascript
test('TC-012: multiple tasks get incrementing positions', async () => {
  const user = await registerUser('user@example.com', 'Pass123!', 'User');

  const task1 = await createTaskForUser(user.id, 'Task 1', '');
  const task2 = await createTaskForUser(user.id, 'Task 2', '');
  const task3 = await createTaskForUser(user.id, 'Task 3', '');

  expect(task1.position).toBe(1);
  expect(task2.position).toBe(2);
  expect(task3.position).toBe(3);
});
```

##### TC-015: Move Task Forward
```javascript
test('TC-015: moves task from TODO → IN_PROGRESS', async () => {
  const user = await registerUser('user@example.com', 'Pass123!', 'User');
  const task = await createTaskForUser(user.id, 'Task', 'Desc');

  const board = await findBoardByOwnerId(user.id);
  const inProgressCol = (await getColumnsByBoardId(board.id))
    .find(c => c.slug === 'IN_PROGRESS');

  const moved = await moveTaskForUser(user.id, task.id, inProgressCol.id, 1);

  expect(moved.column_id).toBe(inProgressCol.id);
  expect(moved.position).toBe(1);
});
```

##### TC-017: Reversible Movement
```javascript
test('TC-017: task can move TODO → IN_PROGRESS → DONE → IN_PROGRESS', async () => {
  const user = await registerUser('user@example.com', 'Pass123!', 'User');
  const task = await createTaskForUser(user.id, 'Task', '');

  const board = await findBoardByOwnerId(user.id);
  const columns = await getColumnsByBoardId(board.id);
  const todo = columns.find(c => c.slug === 'TODO');
  const inProgress = columns.find(c => c.slug === 'IN_PROGRESS');
  const done = columns.find(c => c.slug === 'DONE');

  // TODO → IN_PROGRESS
  let moved = await moveTaskForUser(user.id, task.id, inProgress.id, 1);
  expect(moved.column_id).toBe(inProgress.id);

  // IN_PROGRESS → DONE
  moved = await moveTaskForUser(user.id, task.id, done.id, 1);
  expect(moved.column_id).toBe(done.id);

  // DONE → IN_PROGRESS (move back)
  moved = await moveTaskForUser(user.id, task.id, inProgress.id, 1);
  expect(moved.column_id).toBe(inProgress.id);
});
```

##### TC-018: Invalid Column
```javascript
test('TC-018: throws error when moving to non-existent column', async () => {
  const user = await registerUser('user@example.com', 'Pass123!', 'User');
  const task = await createTaskForUser(user.id, 'Task', '');

  await expect(
    moveTaskForUser(user.id, task.id, 'invalid-uuid', 1)
  ).rejects.toThrow('Target column not found');
});
```

##### TC-009: Update Task
```javascript
test('TC-009: updates task title and description', async () => {
  const user = await registerUser('user@example.com', 'Pass123!', 'User');
  const task = await createTaskForUser(user.id, 'Original', 'Old desc');

  const updated = await updateTaskForUser(user.id, task.id, {
    title: 'Updated',
    description: 'New desc'
  });

  expect(updated.title).toBe('Updated');
  expect(updated.description).toBe('New desc');
  expect(updated.color).toBe(task.color); // Color unchanged
});
```

##### TC-021: Random Color
```javascript
test('TC-021: assigns random pastel color to new task', async () => {
  const user = await registerUser('user@example.com', 'Pass123!', 'User');
  const validColors = ['pastel-yellow', 'pastel-pink', 'pastel-green', 'pastel-blue'];

  const task = await createTaskForUser(user.id, 'Task', '');

  expect(validColors).toContain(task.color);
});
```

**Total Test Cases**: 12+

**Coverage**: Task creation, movement, updates, position management, color assignment

---

### board.service.test.js

**Coverage**: Board operations and DONE task removal

**Requirements Tested**: R-005, R-006, R-013, R-014, R-015, R-017, R-018

#### Test Cases

##### TC-007: Get Board
```javascript
test('TC-007: retrieves board with columns and tasks', async () => {
  const user = await registerUser('user@example.com', 'Pass123!', 'User');
  const task = await createTaskForUser(user.id, 'Task', 'Desc');

  const board = await getMyBoard(user.id);

  expect(board).toHaveProperty('columns');
  expect(board).toHaveProperty('tasks');
  expect(board.columns).toHaveLength(3);
  expect(board.tasks).toHaveLength(1);
  expect(board.tasks[0].id).toBe(task.id);
});
```

##### TC-019: Soft Delete DONE Tasks
```javascript
test('TC-019: soft-deletes tasks in DONE column', async () => {
  const user = await registerUser('user@example.com', 'Pass123!', 'User');

  // Create tasks
  const task1 = await createTaskForUser(user.id, 'Task 1', '');
  const task2 = await createTaskForUser(user.id, 'Task 2', '');

  // Move to DONE
  const board = await findBoardByOwnerId(user.id);
  const doneCol = (await getColumnsByBoardId(board.id))
    .find(c => c.slug === 'DONE');

  await moveTaskForUser(user.id, task1.id, doneCol.id, 1);
  await moveTaskForUser(user.id, task2.id, doneCol.id, 2);

  // Remove DONE tasks
  const result = await removeDoneTasksForMyBoard(user.id);
  expect(result.removedCount).toBe(2);

  // Verify tasks are soft-deleted
  const boardAfter = await getMyBoard(user.id);
  expect(boardAfter.tasks).toHaveLength(0);
});
```

##### TC-022: Idempotent Delete
```javascript
test('TC-022: can call remove-done-tasks twice safely', async () => {
  const user = await registerUser('user@example.com', 'Pass123!', 'User');
  const task = await createTaskForUser(user.id, 'Task', '');

  // Move to DONE
  const board = await findBoardByOwnerId(user.id);
  const doneCol = (await getColumnsByBoardId(board.id))
    .find(c => c.slug === 'DONE');
  await moveTaskForUser(user.id, task.id, doneCol.id, 1);

  // First call
  const result1 = await removeDoneTasksForMyBoard(user.id);
  expect(result1.removedCount).toBe(1);

  // Second call
  const result2 = await removeDoneTasksForMyBoard(user.id);
  expect(result2.removedCount).toBe(0); // Nothing to delete
});
```

**Total Test Cases**: 8+

**Coverage**: Board retrieval, DONE task removal, soft delete, idempotency

---

## Frontend Component Tests

### Framework: Vitest + React Testing Library

**Location**: `frontend/src/tests/`

**Test Files**:
- `App.test.jsx` - Routing
- `AuthPage.test.jsx` - Login page
- `RegisterPage.test.jsx` - Registration page
- `BoardPage.test.jsx` - Main board
- `BoardHeader.test.jsx` - Header component
- `CreateTaskModal.test.jsx` - Task creation modal
- `TaskCard.test.jsx` - Task card component

### Running Tests

```bash
cd frontend

# Run all tests
npm test

# Run specific test file
npm test AuthPage.test.jsx

# Run in watch mode
npm test -- --watch

# Run with UI
npm test -- --ui

# Generate coverage
npm test -- --coverage
```

### Test Utilities

**Setup**: `frontend/src/tests/setupTests.js`

```javascript
import '@testing-library/jest-dom';

// Adds matchers like toBeInTheDocument()
```

**Render Helper Example**:
```javascript
function renderAuthPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    </MemoryRouter>
  );
}
```

---

### BoardPage.test.jsx

**Coverage**: Main board page with task operations

#### Key Test Cases

##### Loading State
```javascript
test('renders loading state initially', () => {
  vi.spyOn(apiClient, 'apiFetch').mockImplementation(
    () => new Promise(() => {}) // Never resolves
  );

  renderBoardPage();
  expect(screen.getByTestId('board-loading')).toBeInTheDocument();
});
```

##### Create Task Flow
```javascript
test('creates a new task and refreshes board', async () => {
  const mockBoard = { board: { columns: [], tasks: [] } };
  const apiFetchSpy = vi.spyOn(apiClient, 'apiFetch')
    .mockResolvedValueOnce(mockBoard) // Initial fetch
    .mockResolvedValueOnce({}) // POST /tasks
    .mockResolvedValueOnce({ board: { columns: [], tasks: [newTask] } }); // Refresh

  renderBoardPage();

  // Open modal
  await waitFor(() => screen.getByTestId('btn-create-task'));
  fireEvent.click(screen.getByTestId('btn-create-task'));

  // Fill form
  fireEvent.change(screen.getByTestId('input-task-title'), {
    target: { value: 'New Task' }
  });

  // Submit
  fireEvent.click(screen.getByTestId('btn-create'));

  // Verify API call
  await waitFor(() => {
    expect(apiFetchSpy).toHaveBeenCalledWith('/tasks', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ title: 'New Task', description: '' })
    }));
  });
});
```

**Total Test Cases**: 15+

**Coverage**: Loading, data display, modals, CRUD operations, error handling

---

### TaskCard.test.jsx

**Coverage**: Task card with inline editing and delete

#### Key Test Cases

##### Inline Editing
```javascript
test('enters edit mode on pencil click', () => {
  renderTaskCard();

  fireEvent.click(screen.getByTestId('task-edit-btn-task-1'));

  expect(screen.getByTestId('task-edit-form-task-1')).toBeInTheDocument();
  expect(screen.getByTestId('task-edit-title-task-1')).toHaveValue('Test Task Title');
});
```

##### Delete Button
```javascript
test('calls onDeleteTask when delete button clicked', () => {
  const onDeleteTask = vi.fn();
  renderTaskCard({ onDeleteTask });

  fireEvent.click(screen.getByTestId('task-delete-btn-task-1'));

  expect(onDeleteTask).toHaveBeenCalledTimes(1);
  expect(onDeleteTask).toHaveBeenCalledWith('task-1');
});
```

**Total Test Cases**: 20+

**Coverage**: Display, editing, deletion, drag-drop, color classes, transparency

---

## End-to-End Tests

### Framework: Playwright

**Location**: `tests/playwright/api/`

**Test Files**:
- `board-workflow.spec.js` - Complete user flow
- `only-one-board.spec.js` - Constraint testing

### Running Tests

```bash
# From project root

# Run all E2E tests
npx playwright test

# Run with browser visible
npx playwright test --headed

# Run specific test
npx playwright test board-workflow

# Debug mode
npx playwright test --debug

# Generate report
npx playwright test --reporter=html
```

### Configuration

**File**: `playwright.config.js`

```javascript
{
  testDir: './tests/playwright',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:4000'
  }
}
```

---

### board-workflow.spec.js

**Test Case**: TC-API-BOARD-001

**Requirements**: REQ-BOARD-001, REQ-COLUMN-001, REQ-TASK-001, REQ-TASK-002, REQ-TASK-003

#### Complete Workflow Test

```javascript
test('TC-API-BOARD-001: complete board workflow', async ({ request }) => {
  // 1. Register user
  const registerRes = await registerUser(request, email, password, name);
  expect(registerRes.status()).toBe(201);

  // 2. Login
  const token = await loginAndGetToken(request, email, password);
  expect(token).toBeTruthy();

  // 3. Get board (verify auto-created columns)
  const boardRes = await request.get('/me/board', { headers: authHeaders(token) });
  const { board } = await safeJson(boardRes);
  expect(board.columns).toHaveLength(3);

  const todoCol = board.columns.find(c => c.slug === 'TODO');
  const inProgressCol = board.columns.find(c => c.slug === 'IN_PROGRESS');
  const doneCol = board.columns.find(c => c.slug === 'DONE');

  // 4. Create task
  const createRes = await request.post('/tasks', {
    headers: authHeaders(token),
    data: { title: 'Test Task', description: 'Testing' }
  });
  const task = await safeJson(createRes);
  expect(task.title).toBe('Test Task');
  expect(task.column_id).toBe(todoCol.id);

  // 5. Move to IN_PROGRESS
  const moveRes1 = await request.patch(`/tasks/${task.id}/move`, {
    headers: authHeaders(token),
    data: { target_column_id: inProgressCol.id, new_position: 1 }
  });
  const moved1 = await safeJson(moveRes1);
  expect(moved1.column_id).toBe(inProgressCol.id);

  // 6. Move to DONE
  const moveRes2 = await request.patch(`/tasks/${task.id}/move`, {
    headers: authHeaders(token),
    data: { target_column_id: doneCol.id, new_position: 1 }
  });
  const moved2 = await safeJson(moveRes2);
  expect(moved2.column_id).toBe(doneCol.id);

  // 7. Delete DONE tasks
  const removeRes = await request.post('/me/board/remove-done-tasks', {
    headers: authHeaders(token)
  });
  const { removedCount } = await safeJson(removeRes);
  expect(removedCount).toBe(1);
});
```

**Total Test Cases**: 2

**Coverage**: Complete user journey from registration to task deletion

---

## Test Coverage Summary

### Backend Unit Tests

| Service | Test Cases | Coverage |
|---------|------------|----------|
| **auth.service** | 5 | Registration, login, errors |
| **task.service** | 12 | CRUD, movement, colors |
| **board.service** | 8 | Board retrieval, soft delete |
| **Total** | **25+** | **Business logic** |

### Frontend Component Tests

| Component | Test Cases | Coverage |
|-----------|------------|----------|
| **App** | 3 | Routing |
| **AuthPage** | 20 | Login form, validation |
| **RegisterPage** | 30 | Registration, validation |
| **BoardPage** | 15 | Board display, CRUD |
| **BoardHeader** | 10 | Header actions |
| **CreateTaskModal** | 20 | Task creation |
| **TaskCard** | 30 | Display, edit, delete |
| **Total** | **128+** | **UI interactions** |

### E2E Tests

| Test | Coverage |
|------|----------|
| **board-workflow** | Complete user flow |
| **only-one-board** | Constraint validation |
| **Total** | **Critical paths** |

---

## Mocking Strategy

### Backend Tests

**Mock External Dependencies**: Database is real (test DB), services are tested against actual PostgreSQL.

**Mock Functions**: None (integration-style unit tests)

### Frontend Tests

**Mock API Client**:
```javascript
vi.spyOn(apiClient, 'apiFetch').mockResolvedValue(mockData);
```

**Mock Context**:
```javascript
const mockUser = { id: '1', name: 'Test', email: 'test@example.com' };
localStorage.setItem('user', JSON.stringify(mockUser));
localStorage.setItem('token', 'fake-token');
```

**Mock dnd-kit**:
```javascript
vi.mock('@dnd-kit/core', () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null
  })
}));
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: notes_db_test

    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd backend && npm install
      - run: cd backend && npm test

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd frontend && npm install
      - run: cd frontend && npm test

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npx playwright install
      - run: npm run backend:start & npm run frontend:start
      - run: npx playwright test
```

---

## Debugging Tests

### Backend

```bash
# Run single test
npm test -- -t "TC-001"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest auth.service.test.js
```

### Frontend

```bash
# Run with Vitest UI
npm test -- --ui

# Debug in browser
npm test -- --inspect
```

### Playwright

```bash
# Debug mode (opens inspector)
npx playwright test --debug

# Headed mode (see browser)
npx playwright test --headed

# Slow motion
npx playwright test --headed --slow-mo=1000
```

---

## Best Practices

### Writing Tests

1. **Descriptive names**: Use test case IDs (TC-001, TC-002)
2. **AAA pattern**: Arrange, Act, Assert
3. **One assertion per concept**: Focus each test
4. **Independent tests**: No shared state
5. **Clean up**: Always restore database/mocks

### Example

```javascript
test('TC-015: moves task from TODO to IN_PROGRESS', async () => {
  // Arrange
  const user = await registerUser('user@example.com', 'Pass123!', 'User');
  const task = await createTaskForUser(user.id, 'Task', '');
  const board = await findBoardByOwnerId(user.id);
  const inProgressCol = findColumn(board, 'IN_PROGRESS');

  // Act
  const moved = await moveTaskForUser(user.id, task.id, inProgressCol.id, 1);

  // Assert
  expect(moved.column_id).toBe(inProgressCol.id);
  expect(moved.position).toBe(1);
});
```

---

## Continuous Improvement

### Test Metrics to Track

1. **Code coverage** (aim for 80%+)
2. **Test execution time** (keep under 5 minutes)
3. **Flaky tests** (should be zero)
4. **Test maintenance effort** (refactor brittle tests)

### Future Enhancements

- **Visual regression tests** (Percy, Chromatic)
- **Performance tests** (Lighthouse CI)
- **Accessibility tests** (axe-core)
- **Load tests** (k6, Artillery)

---

## Summary

The Notes App has **comprehensive test coverage** across all layers:

- **150+ unit and component tests** for business logic and UI
- **E2E tests** for critical user workflows
- **Isolation strategy** prevents test pollution
- **Mocking** for external dependencies
- **CI/CD ready** for automated testing

This testing strategy ensures code quality, prevents regressions, and enables confident refactoring.
