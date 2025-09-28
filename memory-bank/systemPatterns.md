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

## Design Patterns in Use

### Provider Composition Pattern

```typescript
// Pattern: Hierarchical provider composition
// Usage: Clean dependency injection and context management
  <ThemeProvider>
    <QueryClientProvider>
      <RouterProvider>
        <CollectionsProvider>
          <App />
        </CollectionsProvider>
      </RouterProvider>
    </QueryClientProvider>
  </ThemeProvider>
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
2. **Optimistic Update**: Automatic via Tanstack DB.
3. **API Call**: Defined within collection definition
4. **Cache Invalidation**: Automatic
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
3. **User Notification**: Catch errors at call site and display user-friendly messages via snackbar

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
