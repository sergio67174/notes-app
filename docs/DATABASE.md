# Database Schema

Complete database schema documentation for the Notes App (Kanban Board) PostgreSQL database.

---

## Database Overview

**Database Type**: PostgreSQL

**Connection**: Pool-based connection using `pg` driver

**Key Features**:
- UUID primary keys for all tables
- Foreign key constraints for data integrity
- Unique constraints for business rules
- Soft delete support for tasks
- Automatic timestamps (`created_at`, `updated_at`)

---

## Entity Relationship Diagram

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id (PK)         │◄──┐
│ email (UNIQUE)  │   │
│ password_hash   │   │
│ name            │   │
│ created_at      │   │
│ updated_at      │   │
└─────────────────┘   │
                      │ owner_id (FK, UNIQUE)
                      │
┌─────────────────┐   │
│     boards      │   │
│─────────────────│   │
│ id (PK)         │◄──┘
│ owner_id (FK)   │◄──┐
│ name            │   │
│ created_at      │   │
│ updated_at      │   │
└─────────────────┘   │
        │             │
        │ board_id (FK)
        │             │
        ▼             │
┌─────────────────┐   │
│    columns      │   │
│─────────────────│   │
│ id (PK)         │◄──┼──┐
│ board_id (FK)   │◄──┘  │
│ name            │      │
│ slug            │      │
│ position        │      │
│ created_at      │      │
│ updated_at      │      │
└─────────────────┘      │
        │                │ column_id (FK)
        │                │
        │ column_id (FK) │
        │                │
        ▼                │
┌─────────────────┐      │
│     tasks       │      │
│─────────────────│      │
│ id (PK)         │      │
│ board_id (FK)   │──────┘
│ column_id (FK)  │──────┘
│ title           │
│ description     │
│ position        │
│ color           │
│ is_deleted      │
│ deleted_at      │
│ created_at      │
│ updated_at      │
└─────────────────┘
```

**Relationships**:
- One user has one board (1:1 via UNIQUE constraint on `owner_id`)
- One board has many columns (1:N)
- One column has many tasks (1:N)
- One board has many tasks (1:N, direct reference for faster queries)

---

## Table Schemas

### users Table

Stores user account information with hashed passwords.

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique user identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User email address (for login) |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hashed password (10 rounds) |
| `name` | VARCHAR(255) | NOT NULL | User's display name |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last profile update timestamp |

**Indexes**:
- Primary key index on `id`
- Unique index on `email` (for fast login lookups)

**Security Notes**:
- Password is hashed with bcrypt (10 salt rounds)
- Plain passwords never stored
- Email used for authentication

**Example Row**:
```sql
INSERT INTO users (email, password_hash, name) VALUES (
    'user@example.com',
    '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
    'John Doe'
);
```

---

### boards Table

Stores Kanban boards. Each user has exactly one board.

```sql
CREATE TABLE boards (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID UNIQUE NOT NULL REFERENCES users(id),
    name            VARCHAR(255) DEFAULT 'Personal board',
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique board identifier |
| `owner_id` | UUID | UNIQUE, NOT NULL, FK → users.id | User who owns this board |
| `name` | VARCHAR(255) | DEFAULT 'Personal board' | Board display name |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Board creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last board update timestamp |

**Constraints**:
- **UNIQUE** on `owner_id`: One board per user
- **Foreign Key** to `users(id)`: Board must belong to valid user

**Indexes**:
- Primary key index on `id`
- Unique index on `owner_id` (enforces one-board-per-user)

**Business Rule**: Each user can have only one board (enforced at database level).

**Auto-Creation**: Board is automatically created when user registers (via `auth.service.js`).

**Example Row**:
```sql
INSERT INTO boards (owner_id, name) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Personal board'
);
```

---

### columns Table

Stores Kanban columns (TODO, IN_PROGRESS, DONE).

```sql
CREATE TABLE columns (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id        UUID NOT NULL REFERENCES boards(id),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(50) NOT NULL,
    position        INTEGER NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique column identifier |
| `board_id` | UUID | NOT NULL, FK → boards.id | Parent board |
| `name` | VARCHAR(255) | NOT NULL | Display name (e.g., "To Do") |
| `slug` | VARCHAR(50) | NOT NULL | Machine-readable identifier |
| `position` | INTEGER | NOT NULL | Display order (1, 2, 3) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Column creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last column update timestamp |

**Constraints**:
- **Foreign Key** to `boards(id)`: Column must belong to valid board

**Indexes**:
- Primary key index on `id`
- Index on `board_id` (for fast board queries)

**Default Columns**: Three columns are auto-created for each board:

| slug | name | position |
|------|------|----------|
| `TODO` | To Do | 1 |
| `IN_PROGRESS` | In Progress | 2 |
| `DONE` | Done | 3 |

**Auto-Creation**: Columns are automatically created when board is created (via `column.repository.js`).

**Example Rows**:
```sql
INSERT INTO columns (board_id, name, slug, position) VALUES
    ('board-uuid', 'To Do', 'TODO', 1),
    ('board-uuid', 'In Progress', 'IN_PROGRESS', 2),
    ('board-uuid', 'Done', 'DONE', 3);
```

---

### tasks Table

Stores task cards with soft delete support.

```sql
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
```

**Columns**:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique task identifier |
| `board_id` | UUID | NOT NULL, FK → boards.id | Parent board (denormalized for performance) |
| `column_id` | UUID | NOT NULL, FK → columns.id | Current column |
| `title` | VARCHAR(255) | NOT NULL | Task title |
| `description` | TEXT | NULLABLE | Task description (optional) |
| `position` | INTEGER | NOT NULL | Order within column |
| `color` | VARCHAR(50) | NOT NULL | Pastel color identifier |
| `is_deleted` | BOOLEAN | DEFAULT FALSE | Soft delete flag |
| `deleted_at` | TIMESTAMP | NULLABLE | When task was deleted |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Task creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last task update timestamp |

**Constraints**:
- **Foreign Key** to `boards(id)`: Task must belong to valid board
- **Foreign Key** to `columns(id)`: Task must belong to valid column

**Indexes**:
- Primary key index on `id`
- Index on `board_id` and `is_deleted` (for efficient board queries)
- Index on `column_id` (for column-specific queries)

**Valid Colors**:
- `pastel-yellow` (#fef9c3)
- `pastel-pink` (#fce7f3)
- `pastel-green` (#d1fae5)
- `pastel-blue` (#dbeafe)

**Soft Delete Strategy**:
- When deleted: `is_deleted = TRUE`, `deleted_at = NOW()`
- Queries exclude `is_deleted = TRUE` by default
- Enables potential "undo" functionality

**Example Row**:
```sql
INSERT INTO tasks (board_id, column_id, title, description, position, color) VALUES (
    'board-uuid',
    'column-uuid',
    'Implement authentication',
    'Add JWT-based auth system',
    1,
    'pastel-yellow'
);
```

---

## Constraints and Rules

### Foreign Key Constraints

All foreign keys cascade appropriately:

```sql
-- boards.owner_id → users.id
CONSTRAINT fk_board_owner
    FOREIGN KEY (owner_id)
    REFERENCES users(id)
    ON DELETE CASCADE;

-- columns.board_id → boards.id
CONSTRAINT fk_column_board
    FOREIGN KEY (board_id)
    REFERENCES boards(id)
    ON DELETE CASCADE;

-- tasks.board_id → boards.id
CONSTRAINT fk_task_board
    FOREIGN KEY (board_id)
    REFERENCES boards(id)
    ON DELETE CASCADE;

-- tasks.column_id → columns.id
CONSTRAINT fk_task_column
    FOREIGN KEY (column_id)
    REFERENCES columns(id)
    ON DELETE CASCADE;
```

**Cascade Behavior**:
- Delete user → Delete board → Delete columns + tasks
- Delete board → Delete columns + tasks
- Delete column → Delete tasks in that column

### Unique Constraints

**users.email**:
```sql
CONSTRAINT unique_email UNIQUE (email);
```
Prevents duplicate account registrations.

**boards.owner_id**:
```sql
CONSTRAINT unique_owner UNIQUE (owner_id);
```
Enforces one-board-per-user rule.

---

## Soft Delete Strategy

### Why Soft Delete?

Tasks use soft delete instead of hard delete for several reasons:

1. **Data Recovery**: Users can potentially recover accidentally deleted tasks
2. **Audit Trail**: Maintain history of what was deleted and when
3. **Analytics**: Track task completion patterns
4. **Undo Functionality**: Future feature to restore deleted tasks

### Implementation

**Deletion**:
```sql
UPDATE tasks
SET is_deleted = TRUE, deleted_at = NOW()
WHERE id = $1;
```

**Querying Active Tasks**:
```sql
SELECT * FROM tasks
WHERE board_id = $1
  AND is_deleted = FALSE;
```

**Permanent Cleanup** (manual, if needed):
```sql
DELETE FROM tasks
WHERE is_deleted = TRUE
  AND deleted_at < NOW() - INTERVAL '30 days';
```

---

## Indexes

### Performance Indexes

**Recommended indexes for production**:

```sql
-- Fast user lookup by email (login)
CREATE INDEX idx_users_email ON users(email);

-- Fast board lookup by owner
CREATE INDEX idx_boards_owner ON boards(owner_id);

-- Fast column lookup by board
CREATE INDEX idx_columns_board ON columns(board_id);

-- Fast task lookup by board (excluding deleted)
CREATE INDEX idx_tasks_board_active ON tasks(board_id, is_deleted)
WHERE is_deleted = FALSE;

-- Fast task lookup by column
CREATE INDEX idx_tasks_column ON tasks(column_id);

-- Task ordering within columns
CREATE INDEX idx_tasks_column_position ON tasks(column_id, position);
```

---

## Data Types Rationale

### UUID vs SERIAL

**Choice**: UUID for all primary keys

**Rationale**:
- Globally unique (no conflicts in distributed systems)
- Non-sequential (security - harder to guess IDs)
- Generated at database level (`gen_random_uuid()`)

**Alternative**: SERIAL/BIGSERIAL (sequential integers)
- Simpler
- Smaller storage (8 bytes vs 16 bytes)
- Not suitable for multi-instance deployments

### VARCHAR Lengths

| Column | Length | Rationale |
|--------|--------|-----------|
| `email` | 255 | Max email length per RFC 5321 |
| `name` | 255 | Sufficient for display names |
| `password_hash` | 255 | Bcrypt output is 60 chars, buffer for future algorithms |
| `title` | 255 | Task titles should be concise |
| `color` | 50 | Pastel color identifiers (e.g., "pastel-yellow") |
| `description` | TEXT | No limit (detailed task descriptions) |

### TIMESTAMP vs TIMESTAMPTZ

**Choice**: TIMESTAMP (without timezone)

**Rationale**:
- Simpler for single-region application
- Application handles timezone display
- NOW() returns current timestamp

**Alternative**: TIMESTAMPTZ (with timezone)
- Better for multi-region applications
- Automatic timezone conversion

---

## Sample Data

### Complete Database Seed

```sql
-- User
INSERT INTO users (id, email, password_hash, name) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'john@example.com', '$2b$10$abc...', 'John Doe');

-- Board (auto-created on registration)
INSERT INTO boards (id, owner_id, name) VALUES
('b1234567-1234-1234-1234-123456789abc', '550e8400-e29b-41d4-a716-446655440000', 'Personal board');

-- Columns (auto-created with board)
INSERT INTO columns (id, board_id, name, slug, position) VALUES
('c1111111-1111-1111-1111-111111111111', 'b1234567-1234-1234-1234-123456789abc', 'To Do', 'TODO', 1),
('c2222222-2222-2222-2222-222222222222', 'b1234567-1234-1234-1234-123456789abc', 'In Progress', 'IN_PROGRESS', 2),
('c3333333-3333-3333-3333-333333333333', 'b1234567-1234-1234-1234-123456789abc', 'Done', 'DONE', 3);

-- Tasks
INSERT INTO tasks (id, board_id, column_id, title, description, position, color, is_deleted) VALUES
('t1111111-1111-1111-1111-111111111111', 'b1234567-1234-1234-1234-123456789abc', 'c1111111-1111-1111-1111-111111111111', 'Implement login', 'Add JWT authentication', 1, 'pastel-yellow', FALSE),
('t2222222-2222-2222-2222-222222222222', 'b1234567-1234-1234-1234-123456789abc', 'c2222222-2222-2222-2222-222222222222', 'Design UI', 'Create Figma mockups', 1, 'pastel-pink', FALSE),
('t3333333-3333-3333-3333-333333333333', 'b1234567-1234-1234-1234-123456789abc', 'c3333333-3333-3333-3333-333333333333', 'Setup database', 'PostgreSQL schema', 1, 'pastel-green', FALSE);
```

---

## Database Queries

### Common Query Patterns

#### Get User's Board with Columns and Tasks

```sql
-- Get board
SELECT * FROM boards WHERE owner_id = $1;

-- Get columns
SELECT * FROM columns
WHERE board_id = $1
ORDER BY position;

-- Get active tasks
SELECT * FROM tasks
WHERE board_id = $1
  AND is_deleted = FALSE
ORDER BY column_id, position;
```

#### Create Task in TODO Column

```sql
-- Find TODO column
SELECT id FROM columns
WHERE board_id = $1 AND slug = 'TODO';

-- Calculate next position
SELECT COALESCE(MAX(position), 0) + 1
FROM tasks
WHERE column_id = $1 AND is_deleted = FALSE;

-- Insert task
INSERT INTO tasks (board_id, column_id, title, description, position, color)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;
```

#### Move Task to Different Column

```sql
UPDATE tasks
SET column_id = $1, position = $2, updated_at = NOW()
WHERE id = $3
RETURNING *;
```

#### Soft Delete All DONE Tasks

```sql
-- Find DONE column
SELECT id FROM columns
WHERE board_id = $1 AND slug = 'DONE';

-- Soft delete tasks
UPDATE tasks
SET is_deleted = TRUE, deleted_at = NOW()
WHERE column_id = $1 AND is_deleted = FALSE
RETURNING id;
```

---

## Database Backup

### Backup Strategy

**Recommended**:
- Daily full backups
- Transaction log backups every hour
- Retention: 30 days

**PostgreSQL Commands**:

```bash
# Full backup
pg_dump -U postgres -d notes_db > backup_$(date +%Y%m%d).sql

# Restore
psql -U postgres -d notes_db < backup_20250115.sql
```

### Critical Tables Priority

1. **users** - Account data
2. **boards** - Board metadata
3. **tasks** - Task content (includes soft-deleted)
4. **columns** - Column definitions

---

## Database Migrations

### Initial Schema Creation

Run in order:

```sql
-- 1. Users
CREATE TABLE users (...);

-- 2. Boards
CREATE TABLE boards (...);

-- 3. Columns
CREATE TABLE columns (...);

-- 4. Tasks
CREATE TABLE tasks (...);

-- 5. Indexes
CREATE INDEX idx_users_email ON users(email);
-- ... other indexes
```

### Future Migrations

**Suggested migration tool**: `node-pg-migrate` or `knex.js`

**Naming convention**: `YYYYMMDDHHMMSS_description.sql`

**Example**: `20250115120000_add_task_priority.sql`

---

## Summary

The Notes App database schema is designed with:

- **4 tables**: users, boards, columns, tasks
- **UUID primary keys**: Globally unique identifiers
- **Foreign key constraints**: Data integrity enforcement
- **Soft delete**: Task recovery capability
- **Unique constraints**: One board per user
- **Automatic timestamps**: Audit trail

This schema supports the current Kanban board functionality and is extensible for future features like multiple boards, task priorities, and team collaboration.
