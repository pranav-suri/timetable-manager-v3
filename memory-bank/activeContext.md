# Active Context

## Current Work Focus

### PRIMARY MILESTONE: TIMETABLE GENERATION SYSTEM - COMPLETE ✅

**Date**: October 30, 2025  
**Status**: Production Ready

The genetic algorithm-based timetable generation system is now **fully functional end-to-end**:

- ✅ **All Core GA Components Implemented** (Phases 1-3)
- ✅ **Complete User Interface** (Phase 5)
- ✅ **Integration with Existing Editor** (Phase 5.2 - Simplified)
- ⏳ **Optional Enhancements Available** (Phase 6)

### Recent Completion: Step 5.2 - Collection Integration

**What Changed**: Discovered that complete timetable viewing/editing infrastructure already existed. Only needed to add automatic collection refresh after generation.

**Implementation**: Added collection invalidation in `GenerationResults.tsx` using `queryClient.invalidateQueries()` to trigger UI refresh when job completes.

**Result**: Generated timetables now automatically appear in the existing drag-and-drop editor at `/tt/$timetableId/edit/`.

### Active Development Areas

The timetable management system now includes:

- **Complete Entity Management**: Full CRUD interfaces for teachers, subjects, classrooms, groups, subdivisions, and lectures
- **Genetic Algorithm Generation**: Automated timetable creation with configurable parameters (3 presets + advanced options)
- **Interactive Timetable Editor**: Drag-and-drop editing with conflict detection (already existed)
- **Job Management**: Async generation with progress tracking, cancellation, and history
- **Lock/Unlock Functionality**: Preserve manual edits through regeneration
- **Real-time Synchronization**: Live data updates via TanStack DB Collections
- **Multi-format Export**: Ready for PDF, CSV, and calendar integrations

## Recent Changes

### Timetable Generation System (October 2025)

**Phase 1-3: Core GA Implementation** ✅

- All genetic operators: selection, crossover, mutation, replacement
- Constraint checking: 6 hard + 4 soft constraints
- Fitness evaluation with hierarchical penalty system
- Job management with database persistence
- Configuration presets (Fast/Balanced/Thorough)

**Phase 5.1: Generation UI** ✅

- Generation control panel with parameter configuration
- Real-time progress display with live statistics
- Job history with quality reports
- Error handling and user feedback

**Phase 5.2: Collection Integration** ✅ (Simplified)

- Automatic collection invalidation after generation
- Integration with existing editor (no new components needed)
- Link from results to edit view
- Collections: lectureSlot, lectureClassroom already working

**Key Discovery**: The project already had a complete timetable editor at `/tt/$timetableId/edit/` with:

- Material-UI table-based grid layout
- Drag-and-drop using @dnd-kit
- Conflict detection in drawer
- Lock/unlock support in schema
- Full manual editing capabilities

This eliminated ~800 lines of originally planned UI code. Only needed 30-line collection invalidation.

## Recent Changes

### Code Quality Improvements (October 2025)

- **TypeScript Error Resolution**: Fixed all TypeScript compilation errors including:
  - Corrected route paths in Header component (`/timetable/$timetableId` → `/tt/$timetableId`)
  - Refactored `cognitiveLoadCollection.tsx` to follow standard query-based collection pattern
  - Removed unused imports and functions across multiple files
  - Achieved zero TypeScript errors in production build
- **Cognitive Load Collection**: Successfully refactored to use `queryCollectionOptions` with server-side tRPC endpoint, treating it as a read-only computed collection without mutation handlers

### Refactors (October 2025)

- Split large GA modules under `src/server/services/timetableGenerator/` into focused folders with barrels:
  - `fitness/`, `repair/`, `initialization/`, `selection/`, `mutation/`, `crossover/`, `replacement/`
  - Preserved public APIs and import paths via index barrels (e.g., `./fitness`, `./repair`)
  - Removed legacy monolithic files to avoid path shadowing (kept `types.ts`, `algorithm.ts`, `jobManager.ts`, `validator.ts`, `decoder.ts` unchanged)

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
- **Read-only Collections**: Implemented pattern for computed/derived data (e.g., `cognitiveLoadCollection`) without mutation handlers

### Optimistic Updates and Error Handling

- **Cache Management**: Implemented manual cache updates in `onInsert`, `onUpdate`, and `onDelete` callbacks to avoid unnecessary refetches
- **Error Propagation**: Added `try...catch` blocks in mutation handlers to ensure proper error handling and optimistic update rollbacks
- **User Feedback**: Planned implementation of snackbar notifications for mutation failures
- **Transaction Error Resolution**: Identified and planned fixes for `TransactionError` when network throttling causes mutation failures

### React Performance Optimization

- **Memo Usage**: Discussed proper usage of `React.memo` to prevent unnecessary re-renders
- **Component Optimization**: Identified that memoizing every component can hurt performance and should be targeted at expensive components
- **State in Live Queries**: Confirmed that state variables can be used in `useLiveQuery` for dynamic, reactive data fetching

### UI/UX Improvements

- **MUI v7 Integration**: Converted subdivisions, classrooms, subjects, groups, teachers, and lectures management pages from Tailwind CSS to Material-UI v7 components
- **Design System Consistency**: Implemented Material Design principles across entity management pages
- **Component Library**: Established patterns for using MUI components (Container, Card, Typography, Button, TextField, List, Alert, Select, FormControl, Switch, FormControlLabel, Chip, Checkbox, OutlinedInput)
- **Accessibility**: Improved ARIA labels, semantic HTML structure, and keyboard navigation
- **Responsive Design**: Enhanced mobile responsiveness using MUI's responsive system
- **Entity Management**: Completed management interfaces for all core entities (subdivisions, classrooms, subjects, groups, teachers, lectures) with full CRUD functionality
- **Relationship Handling**: Implemented proper parent-child relationships (subjects belong to groups, lectures belong to teachers and subjects) with dropdown selection
- **Advanced Form Controls**: Added Switch components for boolean fields (allowSimultaneous in groups)
- **Email Validation**: Implemented robust email validation with regex patterns for teacher management
- **Complex Form Validation**: Added number validation with min/max constraints for lecture count and duration fields
- **Multi-Select Components**: Implemented multi-select dropdowns with checkboxes and chip displays for subdivisions and classrooms in lectures
- **Schema Compliance**: Fixed duration field to represent number of slots instead of minutes as per database schema
- **Relationship Queries**: Implemented proper queries to fetch and display related subdivisions and classrooms for each lecture using the pattern from LectureSlot.tsx

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
