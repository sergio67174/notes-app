-- Notes App Database Schema
-- Created: 2025-12-11
-- Description: Initial schema for Kanban board application

-- Drop tables if they exist (for testing)
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS columns CASCADE;
DROP TABLE IF EXISTS boards CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- TABLE: users
-- ============================================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- TABLE: boards
-- ============================================================================
CREATE TABLE boards (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(255) DEFAULT 'Personal board',
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- TABLE: columns
-- ============================================================================
CREATE TABLE columns (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id        UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(50) NOT NULL,
    position        INTEGER NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- TABLE: tasks
-- ============================================================================
CREATE TABLE tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id        UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    column_id       UUID NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    position        INTEGER NOT NULL,
    color           VARCHAR(50) NOT NULL,
    is_deleted      BOOLEAN DEFAULT FALSE,
    deleted_at      TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

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