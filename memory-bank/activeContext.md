# Active Context

## Current Work Focus

### Primary Focus: Timetable Management System
The project is currently focused on building a comprehensive timetable management system for educational institutions. The core functionality revolves around:

- **Data Management**: CRUD operations for teachers, subjects, classrooms, and student groups
- **Timetable Generation**: Automated scheduling with constraint optimization
- **Interactive Editing**: Drag-and-drop interface for manual timetable adjustments
- **Multi-format Export**: PDF, CSV, and calendar integrations

### Active Development Areas
Based on open tabs and recent activity, current development is concentrated on:
- **tRPC Router Implementation**: Building type-safe API endpoints for all entities
- **Collection System**: Data access layer with caching and synchronization
- **Database Schema**: Prisma models for complex relationships
- **UI Components**: React components for timetable visualization and editing

## Recent Changes

### Database Schema Evolution
- **Complex Relationships**: Implemented many-to-many relationships between teachers/subjects, subjects/classrooms, lectures/slots
- **Availability Management**: Added unavailability tracking for teachers, classrooms, and subdivisions
- **Timetable Structure**: Multi-level hierarchy (timetable → lectures → slots → assignments)

### API Architecture
- **tRPC Integration**: Full type-safe API layer with automatic client generation
- **Router Organization**: Modular router structure for different entity types
- **Query Optimization**: Efficient data fetching with proper caching strategies

### Collection Pattern Implementation
- **Provider Architecture**: Context-based data management for all entities
- **Hook-based Access**: Custom hooks for CRUD operations with error handling
- **State Synchronization**: Real-time updates across components

### Optimistic Updates and Error Handling
- **Cache Management**: Implemented manual cache updates in `onInsert`, `onUpdate`, and `onDelete` callbacks to avoid unnecessary refetches
- **Error Propagation**: Added `try...catch` blocks in mutation handlers to ensure proper error handling and optimistic update rollbacks
- **User Feedback**: Planned implementation of snackbar notifications for mutation failures
- **Transaction Error Resolution**: Identified and planned fixes for `TransactionError` when network throttling causes mutation failures

### React Performance Optimization
- **Memo Usage**: Discussed proper usage of `React.memo` to prevent unnecessary re-renders
- **Component Optimization**: Identified that memoizing every component can hurt performance and should be targeted at expensive components
- **State in Live Queries**: Confirmed that state variables can be used in `useLiveQuery` for dynamic, reactive data fetching

## Next Steps

### Immediate Priorities (Next Sprint)
1. **Timetable Generation Algorithm**
   - Implement core scheduling logic
   - Add constraint validation
   - Optimize for performance

2. **UI Component Development**
   - Build timetable visualization component
   - Implement drag-and-drop editing
   - Add conflict detection UI

3. **Data Import/Export**
   - CSV/XLSX import functionality
   - PDF export for timetables
   - Calendar integration (iCal)

### Medium-term Goals (1-2 months)
1. **User Authentication & Authorization**
   - Role-based access control
   - User management system
   - Session handling

2. **Advanced Features**
   - Bulk operations for timetable management
   - Version control for timetable changes
   - Reporting and analytics

3. **Performance Optimization**
   - Database query optimization
   - Frontend bundle size reduction
   - Caching strategy improvements

## Active Decisions and Considerations

### Technical Decisions
- **State Management**: TanStack Query for server state, Zustand for client state
- **Database Choice**: SQLite for development, PostgreSQL for production
- **API Pattern**: tRPC for type safety over REST
- **Component Library**: Custom components over third-party UI libraries

### Architecture Decisions
- **Modular Structure**: Feature-based organization with clear separation
- **Type Safety**: Strict TypeScript usage throughout the application
- **Error Handling**: Centralized error management with user feedback
- **Caching Strategy**: Aggressive caching with smart invalidation

### Design Decisions
- **User Experience**: Intuitive drag-and-drop interface for timetable editing
- **Data Flow**: Unidirectional data flow with proper state management
- **Responsive Design**: Mobile-first approach with progressive enhancement
- **Accessibility**: WCAG compliance for inclusive design

## Important Patterns and Preferences

### Code Organization
- **File Naming**: kebab-case for files, PascalCase for components
- **Import Order**: External libraries → internal modules → relative imports
- **Export Pattern**: Named exports preferred over default exports

### Development Workflow
- **Git Strategy**: Feature branches with descriptive commit messages
- **Code Review**: Required for all changes with automated checks
- **Testing**: Unit tests for critical logic, integration tests for workflows

### Performance Considerations
- **Bundle Splitting**: Route-based code splitting for optimal loading
- **Image Optimization**: Lazy loading and responsive images
- **Database Queries**: N+1 query prevention with proper includes

## Current Challenges

### Technical Challenges
- **Algorithm Complexity**: Developing efficient timetable generation algorithm
- **Type Safety**: Maintaining type safety across complex data relationships
- **Performance**: Optimizing for large datasets with real-time updates

### Business Logic Challenges
- **Constraint Management**: Handling complex scheduling constraints
- **Conflict Resolution**: Automated conflict detection and resolution
- **User Workflow**: Designing intuitive workflows for complex operations

## Risk Mitigation

### Technical Risks
- **Scalability**: Database design optimized for growth
- **Maintainability**: Clean architecture with comprehensive documentation
- **Security**: Input validation and proper authentication implementation

### Project Risks
- **Scope Creep**: Clear requirements and phased development
- **Timeline**: Realistic milestones with buffer time
- **Resource Dependencies**: Modular design allowing parallel development

## Success Metrics

### Development Metrics
- **Code Coverage**: Target 80%+ test coverage
- **Performance**: Sub-2 second load times for all pages
- **Type Safety**: Zero TypeScript errors in production

### Product Metrics
- **User Adoption**: Intuitive interface requiring minimal training
- **Data Integrity**: 100% accuracy in timetable generation
- **Reliability**: 99.9% uptime with graceful error handling

## Communication and Collaboration

### Team Coordination
- **Documentation**: Comprehensive memory bank for project continuity
- **Code Standards**: Consistent patterns and conventions
- **Knowledge Sharing**: Regular reviews and pair programming

### Stakeholder Management
- **Progress Updates**: Regular status reports with clear milestones
- **Feedback Integration**: User feedback incorporated into development
- **Change Management**: Controlled process for requirement changes
