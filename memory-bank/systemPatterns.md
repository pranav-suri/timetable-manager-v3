# System Patterns

## Architecture Overview

### Architecture Overview

- **Layered Architecture**: Frontend UI → State Management → API Layer → Business Logic → Data Access
- **Component Architecture**: Feature-based organization with clear separation of concerns

## Key Technical Decisions

### State Management Strategy

- **Server State**: Tanstack DB for API data (caching, synchronization, optimistic updates)
- **Client State**: Zustand for UI state (theme, user preferences, snackbar notifications)
- **Form State**: Tanstack Form for complex form management
- **Router State**: TanStack Router for location and navigation state

### Data Fetching Patterns

- **Tanstack DB**: Data fetching integrated into tanstack DB collections. Data automattically loaded upon page load.
- **tRPC Integration**: Type-safe API calls with automatic client generation
- **Optimistic Updates**: Immediate UI feedback for better UX
- **Error Boundaries**: Graceful error handling with user feedback

### Database Design Patterns

- **Normalized Schema**: Clean separation of entities with proper relationships
- **Prisma Best Practices**: Type-safe database operations with generated client

## Component Relationships

- **Data Flow Architecture**: User Interaction → Component → Collection Hook → tRPC Procedure → Prisma Query → Database → TanStack Query Cache → UI State Update.
- **Collection System Architecture**: Provider-based architecture with hooks for CRUD operations, cache management, and error handling.

## Critical Implementation Paths

- **Timetable Generation Flow**: Data collection, validation, algorithm execution, conflict resolution, and result persistence.
- **CRUD Operation Flow**: User action, optimistic update via Tanstack DB, API call, cache invalidation, and UI synchronization.
- **Error Handling Flow**: Error occurrence, classification, user feedback via snackbar, recovery actions, and logging.
- **Optimistic Update Error Handling**: Mutation failures trigger automatic rollback by TanStack DB, with user notification via snackbar.

## Performance Patterns

- **Lazy Loading Strategy**: Route-based code splitting, component lazy loading, and data prefetching.
- **Caching Strategy**: Query caching with TanStack Query, component memoization, and asset caching.
- **Optimization Patterns**: Virtual scrolling, debounced search, and pagination.

## Security Patterns

- **Input Validation**: Zod schemas for runtime type validation, sanitization of user inputs, and authorization checks.
- **Data Protection**: Environment-based secrets management, SQL injection prevention via Prisma ORM, and XSS protection.

## Testing Patterns

- **Component Testing**: Unit tests with React Testing Library, integration tests, and E2E tests.
- **API Testing**: tRPC procedure tests, database integration tests, and performance tests.

## Deployment Patterns

- **Build Optimization**: Tree shaking, asset optimization, and CDN integration.
- **Environment Management**: Configuration as code, feature flags, and rollback strategies.

## Evolution Patterns

#### Migration Strategy

- **Database migrations** with Prisma for schema changes.
- **Migration Size**: Implement migration size to be configurable as a percentage.
- **API versioning** for backward compatibility.
- **Feature toggles** for gradual adoption.

### Refactoring Guidelines

- **Incremental changes** to minimize risk.
- **Comprehensive testing** before refactoring.
- **Documentation updates** alongside code changes.
