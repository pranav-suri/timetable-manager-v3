# Active Context

## Current Work Focus

### PRIMARY MILESTONE: TIMETABLE GENERATION SYSTEM - COMPLETE ✅

**Date**: November 3, 2025
**Status**: Production Ready - All Core GA Features Implemented

The genetic algorithm-based timetable generation system is now **fully functional end-to-end**:

- ✅ **All Core GA Components Implemented** (Phases 1-3)
- ✅ **Complete User Interface** (Phase 5 - Fully integrated with editor)
- ✅ **Integration with Existing Editor** (Phase 5.2 - Seamless automatic refresh)
- ✅ **Job Management System** (Async generation with status tracking)
- ✅ **Result Persistence** (Generated timetables automatically saved and accessible)

### Recent Developments

- **Timetable Generation System**: Fully functional end-to-end genetic algorithm-based system with core GA components, complete UI, and integration with the existing editor. Automatic collection refresh ensures generated timetables appear in the drag-and-drop editor at `/tt/$timetableId/edit/`.
- **Entity Management**: Comprehensive CRUD interfaces for all core entities (teachers, subjects, classrooms, groups, subdivisions, lectures) with Material-UI v7 components, advanced form controls, and relationship handling.
- **Code Quality**: Achieved zero TypeScript errors in production build, refactored `cognitiveLoadCollection.tsx`, and split large GA modules into focused folders.
- **API & Data Flow**: Full type-safe API layer with tRPC, efficient data fetching with TanStack Query, and real-time updates via TanStack DB Collections with optimistic updates and robust error handling.
- **UI/UX**: Material-UI v7 integration for consistent design, improved accessibility, and responsive design across entity management pages.

## Next Steps

### Immediate Priorities (Next Sprint)

1. **Preferred Unavailability Management**
   - Implement new database table for preferred unavailability.
   - Develop UI for editing both absolute and preferred unavailability for teachers, classrooms, and subdivisions.

2. **Lecture Management Enhancements**
   - Improve management interfaces for classroom and subdivision assignments within lectures.

3. **Data Import/Export Enhancements**
   - ✅ Export with filters functionality completed (including custom grouped exports)
   - Enhance tools for creating and managing input data.
   - Provide options to export timetables in machine-readable formats and individual timetables.

4. **User Experience Improvements**
   - Implement undo/redo functionality (Ctrl+Z) for timetable edits.
   - Improve loading state indicators when data is not synced.

### Medium-term Goals (1-3 months)

1. **User Authentication & Authorization**
   - Role-based access control
   - User management system
   - Session handling

2. **Advanced Features**
   - Bulk operations for timetable management.
   - Version control for timetable changes.
   - Reporting and analytics.
   - Notifications: Real-time updates and conflict alerts.
   - Search & Filter: Advanced search across all entities.
   - AI Agent Integration: Explore and integrate AI agent capabilities (low priority).

3. **Performance Optimization**
   - Database query optimization and indexing.
   - Frontend bundle size reduction and lazy loading.
   - Advanced caching strategy improvements.
   - Architecture preparation for larger institutions.
   - Implement migration size to be configurable as a percentage.

## Active Decisions and Considerations

### Technical Decisions

- **State Management**: TanStack Query for server state, Zustand for client state
- **Database Choice**: SQLite for development, PostgreSQL for production
- **API Pattern**: tRPC for type safety over REST
- **Component Library**: Material-UI v7 for consistent, accessible, and responsive components

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
