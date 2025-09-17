# Technical Context

## Technology Stack

### Frontend
- **React 19+** with TypeScript for type-safe component development
- **TanStack Router** for client-side routing and data fetching
- **TanStack Query** for server state management and caching
- **Zustand** for client-side state management (snackbar, UI, user stores)
- **Tailwind CSS** for styling (inferred from project structure)
- **Vite** for build tooling and development server

### Backend
- **tRPC** for type-safe API layer between frontend and backend
- **Prisma** as ORM for database operations
- **Node.js** runtime environment

### Database
- **SQLite** (development) / **PostgreSQL** (production) via Prisma
- Database schema includes: Teachers, Subjects, Classrooms, Lectures, Slots, Timetables, etc.

### Development Tools
- **TypeScript** for static type checking
- **ESLint** for code linting
- **Prettier** for code formatting
- **Vite** for fast development builds
- **Git** for version control

## Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn package manager
- Git

### Installation
```bash
git clone https://github.com/pranav-suri/timetable-manager-v3.git
cd timetable-manager-v3
npm install
```

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

### Database Setup
```bash
npx prisma generate   # Generate Prisma client
npx prisma db push    # Push schema to database
npx prisma studio     # Open Prisma Studio for database management
```

## Technical Constraints

### Performance
- **Client-side rendering** with hydration for optimal UX
- **Lazy loading** of routes and components
- **Efficient data fetching** with TanStack Query caching
- **Optimized bundle size** through code splitting

### Scalability
- **Modular architecture** with separate concerns (collections, routers, components)
- **Type-safe APIs** with tRPC ensuring frontend-backend consistency
- **Database optimization** through Prisma query optimization

### Security
- **Input validation** through Zod schemas
- **Type safety** preventing runtime errors
- **Environment-based configuration** for sensitive data

## Dependencies

### Core Dependencies
- `@tanstack/react-query`: Data fetching and caching
- `@tanstack/router`: Client-side routing
- `@trpc/client`: tRPC client for type-safe API calls
- `@trpc/react-query`: Integration between tRPC and TanStack Query
- `@trpc/server`: tRPC server implementation
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
- **Zustand stores** for UI state and user preferences
- **Prisma client** for type-safe database operations

### Development Workflow
- **Hot module replacement** during development
- **Automatic code formatting** on save
- **Type checking** integrated into build process
- **Linting** for code quality enforcement

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
- **Sample data generation** relies on CSV/XLSX parsing
- **No automated testing** setup currently
- **Limited error boundaries** in production
- **No internationalization** support

### Future Improvements
- **Unit and integration tests** with Jest/Vitest
- **Error monitoring** with Sentry
- **Performance monitoring** with analytics
- **Progressive Web App** capabilities
