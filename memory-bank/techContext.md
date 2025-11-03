# Technical Context

## Technology Stack

### Frontend

- **React 19+** with TypeScript for type-safe component development
- **TanStack Router** for client-side routing and data fetching
- **TanStack Query** for server state management and caching
- **TanStack DB** for client-side data collections and live queries
- **Zustand** for client-side state management (snackbar, UI, user stores)
- **Material-UI v7** for component library and design system
- **Vite** for build tooling and development server

### Backend

- **tRPC** for type-safe API layer between frontend and backend
- **Prisma** as ORM for database operations
- **Node.js** runtime environment

### Database

- **SQLite** (development) / **PostgreSQL** (production) via Prisma
- Database schema includes: Teachers, Subjects, Classrooms, Lectures, Slots, Timetables, etc.

## Development Setup

### Prerequisites

- Node.js 18+
- bun package manager
- Git

### Quick Start

```bash
git clone https://github.com/pranav-suri/timetable-manager-v3.git
cd timetable-manager-v3
bun install
bun dev
```

### Key Commands

```bash
bun dev          # Start development server
bun build        # Build for production
bun prisma generate  # Generate Prisma client
bun prisma db push   # Push schema to database
```

## Dependencies

### Core Dependencies

- `@tanstack/react-query`: Data fetching and caching
- `@tanstack/react-db`: Client-side data collections and live queries
- `@tanstack/router`: Client-side routing
- `@trpc/client`: tRPC client for type-safe API calls
- `@trpc/react-query`: Integration between tRPC and TanStack Query
- `@trpc/server`: tRPC server implementation
- `@mui/material`: Material-UI component library
- `prisma`: Database ORM
- `react`: UI framework
- `react-dom`: React DOM rendering
- `zustand`: State management

### Development Dependencies

- `@types/node`: Node.js type definitions
- `@types/react`: React type definitions
- `@types/react-dom`: React DOM type definitions
- `@typescript-eslint/eslint-plugin`: TypeScript ESLint rules
- `@typescript-eslint/parser`: TypeScript parser for ESLint
- `eslint`: Code linting
- `prettier`: Code formatting
- `typescript`: TypeScript compiler
- `vite`: Build tool

## Tool Usage Patterns

### Code Organization

- **Feature-based structure** with clear separation of concerns
- **TypeScript strict mode** for maximum type safety
- **Consistent naming conventions** following React/TypeScript best practices
- **Modular component design** with reusable UI elements

### Data Flow

- **tRPC procedures** for all server operations
- **TanStack Query** for client-side data management
- **TanStack DB Collections** for client-side data operations with optimistic updates
- **Zustand stores** for UI state and user preferences
- **Prisma client** for type-safe database operations

### Development Workflow

- **Hot module replacement** during development
- **Automatic code formatting** on save
- **Type checking** integrated into build process (zero TypeScript errors maintained)
- **Linting** for code quality enforcement
- **Regular TypeScript checks** via `npx tsc --noEmit`

### React Performance Patterns

- **Selective Memoization**: Use `React.memo` only for expensive components, not all components
- **State in Live Queries**: State variables can be used in `useLiveQuery` for dynamic, reactive data fetching
- **Dependency Arrays**: Always include state variables in `useLiveQuery` dependency arrays for proper reactivity

### Error Handling Patterns

- **Optimistic Update Rollback**: Throw errors from `onInsert`/`onUpdate`/`onDelete` callbacks to trigger automatic rollback
- **Manual Cache Updates**: Use `queryClient.setQueryData` to update cache without refetches
- **User Feedback**: Implement snackbar notifications for mutation failures
- **Transaction Error Prevention**: Proper error propagation prevents `TransactionError` during network throttling

## Build and Deployment

### Build Process

- **Vite bundler** for optimized production builds
- **TypeScript compilation** with strict checking
- **Asset optimization** and code splitting
- **Source maps** for debugging

### Environment Configuration

- **Environment variables** for configuration
- **Development vs production** database configurations
- **API endpoints** configurable per environment

## Known Technical Debt

### Current Limitations

- **Preferred unavailability** UI not yet implemented
- **Advanced filtering** for exports not yet implemented
- **No automated testing** setup currently
- **Limited error boundaries** in production
- **No internationalization** support

### Future Improvements

- **Unit and integration tests** with Jest/Vitest
- **Error monitoring** with Sentry
- **Performance monitoring** with analytics
- **Progressive Web App** capabilities
- **Undo/Redo Functionality (Ctrl+Z)**: Implement undo/redo for timetable edits
- **Loading State Management**: Improve loading state indicators when data is not synced
- **Advanced Filtering**: Implement filtering options for exports and generation
- **Bulk Operations**: Multi-select editing capabilities for timetable management
- **User Authentication & Authorization**: Role-based access control system
- **Performance Optimization**: Database query optimization and frontend bundle size reduction
