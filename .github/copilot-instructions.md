## About this Project

Esy-IM is a full-stack instant messaging application featuring a Go backend and a Next.js frontend. The project is structured as a monorepo with two main directories: `im-backend` and `im-frontend`.

### Core Technologies
- **Backend**: Go, Gin, GORM, PostgreSQL, Redis, WebSocket
- **Frontend**: Next.js, TypeScript, Tailwind CSS, Zustand for state management

---

## Workspace Structure

- `im-backend/`: The Go backend service.
- `im-frontend/`: The Next.js frontend application.
- `ui/`: Contains static HTML mockups that serve as a design reference for the frontend UI. When implementing or fixing UI components, refer to these files for layout and styling guidance.

---

## Backend (`im-beta`)

The backend follows a strict layered architecture. When adding or modifying features, you must adhere to this pattern.

**Architecture Layers:**
1.  **`controller`**: Handles HTTP request validation and parsing. It calls `service` layer methods to perform business logic.
    - Example: `internal/controller/user_controller.go`
2.  **`service`**: Contains the core business logic. It orchestrates data from repositories and other services.
    - Example: `internal/service/user_service.go`
3.  **`repository`**: Responsible for all database interactions using GORM. It abstracts away the data access logic.
    - Example: `internal/repository/user_repository.go`

**Key Packages:**
- `internal/router/router.go`: Defines all API routes.
- `internal/pkg/db.go`: Database connection setup.
- `internal/pkg/jwt.go`: JWT authentication logic.
- `internal/pkg/response.go`: Defines the standard API response structure.
- `cmd/server/main.go`: The application entry point.

**Development Workflow:**
- To run the backend server: `go run cmd/server/main.go`
- Configuration is managed via environment variables (see `im-backend/README.md`).

---

## Frontend (`im-frontend`)

The frontend is a modern Next.js application using the App Router.

**Key Directories & Files:**
- `app/`: Contains the pages for the application (e.g., `app/chat/page.tsx`).
- `components/ui/`: Home to reusable UI components like `nav-tabs.tsx`. New shared components should be placed here.
- `lib/api/`: Contains functions for making API calls to the backend.
- `lib/http.ts`: A centralized Axios instance for handling HTTP requests. All backend communication should use this.
- `lib/store.ts` & `lib/ui-store.ts`: State management using Zustand.

**Development Workflow:**
- To install dependencies: `npm install`
- To run the development server: `npm run dev`

**UI Implementation:**
- When working on UI tasks, always refer to the corresponding HTML file in the `ui/` directory (e.g., `ui/chat_screen/code.html` for the chat page) to ensure the implementation matches the design.
