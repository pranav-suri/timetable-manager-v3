# AI Coding Agent Instructions: Timetable Manager V3

## Project Identity & Purpose

**Educational timetable management system** for scheduling courses, teachers, classrooms, and student groups with automated constraint optimization. Built for universities/colleges to generate conflict-free course schedules.

## Architecture: The Big Picture

### Technology Stack (React 19 SSR)
- **Development**: Use Bun as the package manager and build tool
- **Frontend**: React 19 + Material-UI v7 (NOT Tailwind despite package.json)
- **Routing**: TanStack Router v1 (file-based, SSR-capable)
- **State**: TanStack DB Collections (optimistic updates) + Zustand (UI state)
- **API**: tRPC v11 (type-safe server procedures)
- **Database**: Prisma 6 + SQLite (split schema pattern)
- **Testing**: Vitest + React Testing Library

### The Core Pattern: Collections → tRPC → Prisma

```
UI Component
    ↓ useCollections()
TanStack DB Collection (client-side cache + optimistic updates)
    ↓ onInsert/onUpdate/onDelete callbacks
tRPC Procedure (type-safe API)
    ↓ ctx.prisma
Prisma ORM
    ↓
SQLite Database
```

**Critical**: Data ALWAYS flows through collections. Direct tRPC usage in components is forbidden.

### Why Collections? (The "Why" Behind This Pattern)

Traditional React Query pattern causes stale data issues when switching between timetables. Collections solve this by:

1. Clearing cache on timetable change (`queryClient.clear()` in `CollectionProvider.tsx`)
2. Providing optimistic updates that auto-rollback on error
3. Centralizing mutation logic (no scattered `onSuccess` callbacks)
4. Enabling cross-component reactivity via `useLiveQuery`

## Essential Implementation Patterns

### Pattern 1: Creating a New Collection

**File**: `src/db-collections/entityCollection.tsx`

```typescript
import { createCollection, queryCollectionOptions } from "@tanstack/react-db";
import type { CollectionInput } from "./providers/CollectionProvider";

export function getEntityCollection(input: CollectionInput) {
  const { timetableId, trpc, queryClient, trpcClient } = input;

  return createCollection(
    queryCollectionOptions({
      queryClient,
      queryKey: ["entity", timetableId],
      queryFn: () => trpcClient.entity.list.query({ timetableId }),

      // CRITICAL: These callbacks trigger optimistic updates + server sync
      onInsert: async (newEntity) => {
        try {
          return await trpcClient.entity.add.mutate(newEntity);
        } catch (error) {
          throw error; // Thrown errors trigger automatic rollback
        }
      },

      onUpdate: async (updatedEntity) => {
        return await trpcClient.entity.update.mutate(updatedEntity);
      },

      onDelete: async (id) => {
        await trpcClient.entity.delete.mutate({ id });
      },
    }),
  );
}
```

**Register in `CollectionProvider.tsx`**:

```typescript
entityCollection: getEntityCollection(input),
```

**Exception**: Read-only/computed collections (e.g., `cognitiveLoadCollection`) omit mutation handlers.

### Pattern 2: Using Collections in Components

```tsx
import { useCollections } from "@/db-collections/providers/useCollections";
import { useLiveQuery } from "@tanstack/react-db";

function TeachersList() {
  const { teacherCollection } = useCollections();

  // Reactive query - auto-updates when collection changes
  const { data: teachers } = useLiveQuery(
    (q) => q.from({ teacher: teacherCollection }),
    [teacherCollection], // MUST include collection in deps
  );

  // Mutations with automatic optimistic updates
  const handleAdd = async (teacher) => {
    try {
      await teacherCollection.insert(teacher);
      // Success feedback handled by collection
    } catch (error) {
      // Show error snackbar - optimistic update auto-rolled back
      console.error(error);
    }
  };

  return (/* UI using teachers data */);
}
```

**Why this works**: `useLiveQuery` subscribes to collection changes. When you call `.insert()`, it:

1. Immediately updates local cache (optimistic)
2. Calls `onInsert` callback → tRPC mutation
3. On success: cache stays updated
4. On error: throws, collection auto-reverts cache

### Pattern 3: tRPC Router Structure

**File**: `src/server/trpc/routers/entityRouter.ts`

```typescript
import { authedProcedure, router } from "../trpc";
import { zodIdSchema } from "../utils";
import { z } from "zod";

export const entityRouter = router({
  // Query: ALWAYS named "list", returns array
  list: authedProcedure
    .input(z.object({ timetableId: zodIdSchema }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.entity.findMany({
        where: { timetableId: input.timetableId },
        include: {
          /* relations */
        },
      });
    }),

  // Mutations: add/update/delete
  add: authedProcedure
    .input(z.object({ timetableId: zodIdSchema, name: z.string() /* ... */ }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.entity.create({ data: input });
    }),

  update: authedProcedure
    .input(z.object({ id: zodIdSchema, name: z.string().optional() /* ... */ }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.prisma.entity.update({ where: { id }, data });
    }),

  delete: authedProcedure
    .input(z.object({ id: zodIdSchema }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.entity.delete({ where: { id: input.id } });
    }),
});
```

**Register in `src/server/trpc/routers/index.ts`**:

```typescript
entity: entityRouter,
```

### Pattern 4: Prisma Schema (Split Files)

**Files**: `prisma/schema/*.prisma`

Each entity gets its own file (e.g., `Teacher.prisma`):

```prisma
model Teacher {
  id            String   @id @default(nanoid(4))
  name          String
  email         String
  timetableId   String
  dailyMaxHours Int      @default(8)
  weeklyMaxHours Int     @default(40)
  createdAt     DateTime @default(now())

  timetable     Timetable @relation(fields: [timetableId], references: [id], onDelete: Cascade)
  lectures      Lecture[]
  unavailableSlots TeacherUnavailable[]
}
```

**After changes**: `npx prisma generate` → regenerates `generated/prisma/client.ts`

### Pattern 5: Material-UI Component Usage

**File**: `src/routes/tt/$timetableId/teachers.tsx`

```tsx
import {
  Container,
  Card,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  Alert,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

function TeachersPage() {
  return (
    <Container maxWidth="lg">
      <Card sx={{ p: 3, mb: 2 }}>
        <Typography variant="h4" gutterBottom>
          Teachers
        </Typography>

        <TextField label="Name" variant="outlined" fullWidth sx={{ mb: 2 }} />

        <Button variant="contained" color="primary">
          Add Teacher
        </Button>
      </Card>

      <List>
        {teachers.map((teacher) => (
          <ListItem
            key={teacher.id}
            secondaryAction={
              <IconButton edge="end">
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemText primary={teacher.name} secondary={teacher.email} />
          </ListItem>
        ))}
      </List>
    </Container>
  );
}
```

**Key MUI patterns**:

- Use `sx` prop for styling, not Tailwind classes
- `Container maxWidth="lg"` for page wrappers
- `Card sx={{ p: 2 }}` for content sections
- `variant="outlined"` for form inputs
- Icon imports from `@mui/icons-material`

## Critical Workflows & Commands

### Development Cycle

```bash
npm run dev              # Start dev server (port 3000)
npx tsc --noEmit        # Type check (MUST pass before commit)
npm run check           # Format + lint (auto-fix)
npx prisma studio       # Browse database visually
```

### After Schema Changes

```bash
# 1. Edit prisma/schema/*.prisma
# 2. Generate client
npx prisma generate
# 3. Push to dev database
npx prisma db push
# 4. Type check
npx tsc --noEmit
```

### Testing

```bash
npm run test            # Run all tests
npm run test -- src/server/services/timetableGenerator  # Specific path
```

## Memory Bank System (Agent Continuity)

**Location**: `memory-bank/` directory

**Before any task**: Read these files in order:

1. `projectbrief.md` - Core requirements
2. `systemPatterns.md` - Architecture decisions
3. `activeContext.md` - Current work state
4. `tt-gen/steps.md` - Timetable algorithm implementation roadmap
5. `tanstackDbDocs.md` - Advanced TanStack DB patterns

**After completing features**: Update `activeContext.md` and `progress.md`

**For timetable algorithm work**: Follow `tt-gen/steps.md` strictly - each step has completion checklist

## Project-Specific Conventions

### Routing Paths

- ✅ Use: `/tt/$timetableId/teachers`
- ❌ Avoid: `/timetable/$timetableId/teachers`

The `/tt/` prefix is the established convention (see all route files in `src/routes/tt/`).

### tRPC Procedure Naming

- ✅ Use: `list`, `add`, `update`, `delete`
- ❌ Avoid: `getAll`, `create`, `modify`, `remove`

Consistency across all routers enables predictable collection implementation.

### ID Generation

- Uses `nanoid(4)` for all primary keys (see Prisma schemas)
- 4-character IDs balance uniqueness with readability
- Import via `import { nanoid } from "nanoid"`

### Error Handling in Collections

```typescript
onInsert: async (newEntity) => {
  try {
    return await trpcClient.entity.add.mutate(newEntity);
  } catch (error) {
    // Log to console
    console.error("Failed to add entity:", error);
    // Re-throw to trigger optimistic update rollback
    throw error;
  }
};
```

**Critical**: Must throw errors to trigger TanStack DB's automatic rollback.

## Common Integration Points

### Cross-Component Data Sharing

**Problem**: Multiple components need same data (e.g., teacher list in dropdown + teacher page)
**Solution**: Both use same collection - TanStack DB handles cache sharing

```tsx
// Component A
const { teacherCollection } = useCollections();
const { data: teachers } = useLiveQuery(
  (q) => q.from({ teacher: teacherCollection }),
  [teacherCollection],
);

// Component B (different file)
const { teacherCollection } = useCollections();
const { data: teachers } = useLiveQuery(
  (q) => q.from({ teacher: teacherCollection }),
  [teacherCollection],
);
// Same query, same cache - no duplicate requests
```

### Form Validation with Zod

```typescript
import { z } from "zod";

const teacherSchema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email("Invalid email"),
  dailyMaxHours: z.number().min(1).max(24),
});

// In form component
const handleSubmit = (data) => {
  const validated = teacherSchema.parse(data); // Throws on invalid
  await teacherCollection.insert(validated);
};
```

### Relationship Handling

Many-to-many relationships use junction tables:

- `SubjectTeacher` (subjects ↔ teachers)
- `SubjectClassroom` (subjects ↔ classrooms)
- `LectureSubdivision` (lectures ↔ subdivisions)

Pattern: Create separate collections for junction tables, use in UI with multi-select.

## Testing Patterns

### Component Tests (Vitest)

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

describe("TeachersList", () => {
  it("renders teacher names", () => {
    render(<TeachersList />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });
});
```

**Import pattern**: Use `config.ts` for DEFAULT_GA_CONFIG, not `types.ts`

## Known Gotchas & Solutions

### 1. Collection Not Updating UI

**Symptom**: Data changes but UI doesn't refresh
**Cause**: Missing collection in `useLiveQuery` dependency array
**Fix**: `useLiveQuery((q) => ..., [collection])` ← MUST include

### 2. TypeScript Errors After Schema Change

**Symptom**: Type errors referencing Prisma models
**Solution**: Run `npx prisma generate` to regenerate types

### 3. Optimistic Update Not Rolling Back

**Symptom**: On error, UI shows stale data
**Cause**: Mutation handler caught error without re-throwing
**Fix**: Always `throw error` after logging in catch blocks

### 4. "Collection Not Found" Runtime Error

**Symptom**: `teacherCollection is undefined`
**Cause**: Forgot to add to `CollectionProvider.tsx`
**Fix**: Add `entityCollection: getEntityCollection(input)` to collections object

### 5. Route Not Found (404)

**Symptom**: Navigation fails with 404
**Cause**: Using wrong route prefix
**Fix**: Use `/tt/$timetableId/...` not `/timetable/$timetableId/...`

## Current State & Active Work (October 2025)

**Completed**:

- ✅ All CRUD interfaces (teachers, subjects, classrooms, lectures, etc.)
- ✅ Material-UI v7 migration complete
- ✅ Zero TypeScript compilation errors
- ✅ TanStack DB collections for all entities
- ✅ Cognitive load tracking (read-only collection)
- ✅ Timetable algorithm foundation (types, fitness evaluation, operators)

**In Progress**:

- 🚧 Genetic Algorithm implementation (Phase 3 - see `memory-bank/tt-gen/steps.md`)
- 🚧 Job management for async timetable generation
- 🚧 Step 3.3: Result persistence and job status tracking

**Next Up**:

- ⏳ Timetable visualization UI
- ⏳ Drag-and-drop schedule editing
- ⏳ PDF/CSV export

**Reference**: Check `memory-bank/activeContext.md` for latest updates.

## Quick Reference: File Locations

```
src/
├── db-collections/          # TanStack DB collections
│   ├── providers/
│   │   └── CollectionProvider.tsx    # Central registration
│   └── *Collection.tsx               # Individual collections
├── server/
│   ├── trpc/routers/                 # tRPC procedures
│   └── services/timetableGenerator/  # GA algorithm
├── routes/                            # File-based routing
│   ├── __root.tsx                    # App layout
│   └── tt/$timetableId/              # Timetable routes
└── components/                        # Reusable UI

prisma/
└── schema/                            # Split schema files

memory-bank/                           # Agent memory system
├── activeContext.md                   # Current state
├── systemPatterns.md                  # Architecture
└── tt-gen/
    ├── steps.md                       # Algorithm roadmap
    └── research.md                    # GA theory
```

## Anti-Patterns to Avoid

1. ❌ Using `trpc.entity.list.useQuery()` in components → Use collections
2. ❌ Creating collections with internal `useLiveQuery` → Collections are data sources
3. ❌ Forgetting to throw errors in mutation handlers → Breaks optimistic updates
4. ❌ Using Tailwind classes → This is Material-UI v7
5. ❌ Naming tRPC query as `getAll` → Use `list`
6. ❌ Skipping `npx tsc --noEmit` before commit → Breaks production build
7. ❌ Adding mutation handlers to read-only collections → Causes runtime errors
8. ❌ Direct Prisma calls from components → Bypasses cache/optimistic updates

## Support & Documentation

- **TanStack DB**: `memory-bank/tanstackDbDocs.md`
- **Architecture**: `memory-bank/systemPatterns.md`
- **Algorithm Work**: `memory-bank/tt-gen/steps.md`
- **Active Context**: `memory-bank/activeContext.md`
- **Existing Cline Memory**: `.clinerules` (agent continuity patterns)

**When stuck**: Check Memory Bank first, then ask specific questions referencing relevant files.
