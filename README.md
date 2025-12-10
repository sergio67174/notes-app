# Notes App - Kanban Board

![Tech Stack](https://img.shields.io/badge/React-19.2.0-blue)
![Backend](https://img.shields.io/badge/Node.js-Express-green)
![Database](https://img.shields.io/badge/PostgreSQL-Database-blue)
![Testing](https://img.shields.io/badge/Tests-Jest%20%7C%20Vitest%20%7C%20Playwright-orange)

A modern, full-stack Kanban board application for task management with drag-and-drop functionality, inline editing, and a beautiful dark-themed UI. Built with React 19, Node.js/Express, and PostgreSQL.

---

## ✨ Key Features

- **Drag & Drop**: Smooth task movement between columns (TODO, IN_PROGRESS, DONE)
- **Inline Editing**: Edit tasks directly on cards with pencil icon
- **Task Management**: Create, edit, move, and delete tasks with confirmation modals
- **Secure Authentication**: JWT-based login and registration
- **Beautiful UI**: Dark theme with random pastel-colored task cards
- **Soft Delete**: Deleted tasks preserved in database for potential recovery

---

## 🛠️ Technology Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 19.2.0, Vite 7.2.4, React Router 7.10.1, @dnd-kit 6.3.1 |
| **Backend** | Node.js, Express 5.2.1, PostgreSQL, JWT, Bcrypt |
| **Testing** | Jest (backend), Vitest (frontend), Playwright (E2E), React Testing Library |
| **DevOps** | CORS, Nodemon, ESLint, cross-env |

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- PostgreSQL v14+
- npm v9+

### Installation

```bash
# Clone repository
git clone <repository-url>
cd notes_app

# Setup backend
cd backend
npm install
cp .env.example .env  # Configure database credentials
npm run dev           # Starts on http://localhost:4000

# Setup frontend (new terminal)
cd frontend
npm install
cp .env.example .env  # Configure API URL
npm run dev           # Starts on http://localhost:5173
```

### Database Setup

```sql
CREATE DATABASE notes_db;

-- Run table creation scripts (see docs/DATABASE.md for complete schema)
```

### Environment Variables

**Backend** (`.env`):
```env
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=notes_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
```

**Frontend** (`.env`):
```env
VITE_API_BASE_URL=http://localhost:4000
```

---

## 📁 Project Structure

```
notes_app/
├── backend/                  # Node.js/Express API
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── services/         # Business logic
│   │   ├── repositories/     # Data access layer
│   │   ├── middleware/       # Auth & error handling
│   │   ├── routes/           # API endpoints
│   │   └── utils/            # JWT & password utilities
│   └── tests/unit/           # Jest tests
│
├── frontend/                 # React application
│   ├── src/
│   │   ├── pages/            # Page components (BoardPage, AuthPage)
│   │   ├── components/       # UI components (TaskCard, KanbanBoard)
│   │   ├── context/          # React Context (AuthContext)
│   │   └── api/              # API client
│   └── tests/                # Vitest tests
│
├── tests/playwright/         # End-to-end tests
└── docs/                     # Detailed documentation
```

---

## 📚 Documentation

Comprehensive documentation is available in the `/docs` folder:

- **[Architecture](docs/ARCHITECTURE.md)** - System architecture, layers, and design patterns
- **[API Reference](docs/API.md)** - Complete API documentation with examples
- **[Database Schema](docs/DATABASE.md)** - Table definitions and relationships
- **[Testing Guide](docs/TESTING.md)** - Testing strategy and coverage
- **[Development Guide](docs/DEVELOPMENT.md)** - Setup, workflows, and contribution guidelines

---

## 🔑 Quick API Overview

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/auth/register` | POST | Register new user | No |
| `/auth/login` | POST | Login user | No |
| `/me/board` | GET | Get user's board | Yes |
| `/me/board/remove-done-tasks` | POST | Delete all DONE tasks | Yes |
| `/tasks` | POST | Create task | Yes |
| `/tasks/:id` | PATCH | Update task | Yes |
| `/tasks/:id/move` | PATCH | Move task to column | Yes |
| `/tasks/:id` | DELETE | Delete task | Yes |

**Base URL**: `http://localhost:4000`

**Authentication**: Bearer token in `Authorization` header

---

## 🧪 Running Tests

```bash
# Backend unit tests
cd backend
npm test

# Frontend component tests
cd frontend
npm test

# End-to-end tests (from root)
npx playwright test
```

---

## 🎯 Future Enhancements

- Search & filter tasks
- Due dates with visual indicators
- Multiple boards per user
- Task tags and priority levels
- Keyboard shortcuts
- Real-time collaboration

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md#future-features) for complete roadmap.

---

## 📄 License

MIT License

---

## 👨‍💻 Author

**Eddy**

---

## 🙏 Acknowledgments

Built with React, Node.js, PostgreSQL, and the amazing [@dnd-kit](https://dndkit.com/) library.

---

**For detailed documentation, please refer to the `/docs` folder.**
