# System Patterns

## Architecture Overview

### Layered Architecture
```
┌─────────────────┐
│   Frontend UI   │  React Components + TypeScript
├─────────────────┤
│  State Management│  Zustand Stores + TanStack Query
├─────────────────┤
│   API Layer     │  tRPC Procedures (Type-Safe)
├─────────────────┤
│  Business Logic │  Server Controllers + Utils
├─────────────────┤
│   Data Access   │  Prisma ORM + Database
└─────────────────┘
```

### Component Architecture
- **Atomic Design Pattern**: Components organized by complexity (atoms, molecules, organisms)
- **Feature-based organization**: Related components grouped by domain
- **Separation of concerns**: UI, business logic, and data access clearly separated

## Key Technical Decisions

### State Management Strategy
- **Server State**: TanStack Query for API data (caching, synchronization, optimistic updates)
- **Client State**: Zustand for UI state (theme, user preferences, snackbar notifications)
- **Form State**: React Hook Form for complex form management
- **Router State**: TanStack Router for location and navigation state

### Data Fetching Patterns
- **tRPC Integration**: Type-safe API calls with automatic client generation
- **Query Invalidation**: Smart cache invalidation on mutations
- **Optimistic Updates**: Immediate UI feedback for better UX
- **Error Boundaries**: Graceful error handling with user feedback

### Database Design Patterns
- **Normalized Schema**: Clean separation of entities with proper relationships
- **Prisma Best Practices**: Type-safe database operations with generated client
- **Migration Strategy**: Version-controlled schema changes
- **Indexing Strategy**: Optimized queries for common access patterns

## Design Patterns in Use

### Collection Pattern
```typescript
// Pattern: CollectionProvider wraps data access logic
// Usage: Provides CRUD operations with caching and synchronization
interface Collection<T> {
  data: T[]
  isLoading: boolean
  create: (item: T) => Promise<void>
  update: (id: string, item: Partial<T>) => Promise<void>
  delete: (id: string) => Promise<void>
}
```

### Router Pattern
```typescript
// Pattern: Feature-based routing with lazy loading
// Usage: Modular route definitions with code splitting
const timetableRoutes = createRoute({
  path: '/timetable',
  component: lazy(() => import('./TimetablePage')),
  loader: async () => {
    // Pre-load critical data
    return await timetableQuery.prefetch()
  }
})
```

### Provider Composition Pattern
```typescript
// Pattern: Hierarchical provider composition
// Usage: Clean dependency injection and context management
<CollectionsProvider>
  <ThemeProvider>
    <QueryClientProvider>
      <RouterProvider>
        <App />
      </RouterProvider>
    </QueryClientProvider>
  </ThemeProvider>
</CollectionsProvider>
```

## Component Relationships

### Data Flow Architecture
```
User Interaction → Component → Collection Hook → tRPC Procedure → Prisma Query → Database
                                      ↓
                                 TanStack Query Cache
                                      ↓
                                 UI State Update
```

### Collection System Architecture
```
CollectionProvider (Context)
├── CollectionContext (State)
├── useCollection (Hook)
│   ├── CRUD Operations
│   ├── Cache Management
│   └── Error Handling
└── Collection Components
    ├── List View
    ├── Create Form
    └── Edit Form
```

## Critical Implementation Paths

### Timetable Generation Flow
1. **Data Collection**: Gather teachers, subjects, classrooms, constraints
2. **Validation**: Ensure data integrity and constraint satisfaction
3. **Algorithm Execution**: Run scheduling algorithm with optimization
4. **Conflict Resolution**: Handle and resolve scheduling conflicts
5. **Result Persistence**: Save generated timetable to database

### CRUD Operation Flow
1. **User Action**: Trigger create/update/delete operation
2. **Optimistic Update**: Immediately update UI for responsiveness
3. **API Call**: Execute tRPC procedure with proper error handling
4. **Cache Invalidation**: Update query cache with fresh data
5. **UI Synchronization**: Reflect changes across all dependent components

### Error Handling Flow
1. **Error Occurrence**: Catch errors at component or API level
2. **Error Classification**: Determine error type (validation, network, server)
3. **User Feedback**: Display appropriate error messages via snackbar
4. **Recovery Actions**: Provide options to retry or recover state
5. **Logging**: Record errors for debugging and monitoring

### Optimistic Update Error Handling
1. **Mutation Failure**: When tRPC mutations fail, throw errors from `onInsert`/`onUpdate`/`onDelete` callbacks
2. **Automatic Rollback**: TanStack DB automatically rolls back optimistic updates on thrown errors
3. **Cache Synchronization**: Use manual cache updates with `queryClient.setQueryData` to avoid unnecessary refetches
4. **User Notification**: Catch errors at call site and display user-friendly messages via snackbar

## Performance Patterns

### Lazy Loading Strategy
- **Route-based code splitting** for faster initial page loads
- **Component lazy loading** for non-critical UI elements
- **Data prefetching** for anticipated user navigation

### Caching Strategy
- **Query caching** with TanStack Query for API responses
- **Component memoization** for expensive computations
- **Asset caching** through Vite build optimization

### Optimization Patterns
- **Virtual scrolling** for large data sets
- **Debounced search** for efficient filtering
- **Pagination** for data-heavy operations

## Security Patterns

### Input Validation
- **Zod schemas** for runtime type validation
- **Sanitization** of user inputs before database operations
- **Authorization checks** at API procedure level

### Data Protection
- **Environment-based secrets** management
- **SQL injection prevention** through Prisma ORM
- **XSS protection** through React's built-in sanitization

## Testing Patterns

### Component Testing
- **Unit tests** for individual components with React Testing Library
- **Integration tests** for component interactions
- **E2E tests** for critical user journeys

### API Testing
- **tRPC procedure tests** for business logic validation
- **Database integration tests** for data operations
- **Performance tests** for critical paths

## Deployment Patterns

### Build Optimization
- **Tree shaking** to eliminate unused code
- **Asset optimization** through Vite bundling
- **CDN integration** for static assets

### Environment Management
- **Configuration as code** for different environments
- **Feature flags** for gradual rollouts
- **Rollback strategies** for failed deployments

## Evolution Patterns

### Migration Strategy
- **Database migrations** with Prisma for schema changes
- **API versioning** for backward compatibility
- **Feature toggles** for gradual feature adoption

### Refactoring Guidelines
- **Incremental changes** to minimize risk
- **Comprehensive testing** before refactoring
- **Documentation updates** alongside code changes
