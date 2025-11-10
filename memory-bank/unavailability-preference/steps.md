# Unavailability Preference Feature - Frontend Implementation Steps

## Overview

This document tracks the implementation of hard vs soft (preferred) unavailability for teachers, classrooms, and subdivisions. The backend is **COMPLETE** with schema changes, constraints, and GA integration.

**Backend Status**: ✅ COMPLETE

- `isPreferred` field added to all unavailability models (default: false)
- Hard constraint functions updated to check `isPreferred = false`
- New soft constraint functions created for `isPreferred = true`
- Constraint weights and evaluation logic integrated

---

## Implementation Steps

### Step 1: Verify and Update tRPC Routers ✅

**Status**: COMPLETE  
**Completion Date**: November 7, 2025  
**Estimated Time**: 30 minutes  
**Agent Instructions**:

1. Check the following router files:
   - `src/server/trpc/routers/availability/teacherUnavailabilitiesRouter.ts`
   - `src/server/trpc/routers/availability/classroomUnavailabilitiesRouter.ts`
   - `src/server/trpc/routers/availability/subdivisionUnavailabilitiesRouter.ts`

2. Ensure the `add` and `update` mutation input schemas include:

   ```typescript
   isPreferred: z.boolean().default(false);
   ```

3. Verify that Zod schemas properly validate the new field

4. Test the mutations work correctly with the database

5. **After completion**:
   - Update this file, change status to ✅ COMPLETE
   - Create `1-routers-summary.md` documenting:
     - What routers were updated
     - Any issues encountered
     - Example input/output for mutations

---

### Step 2: Create Shared Availability Grid Component 🎨

**Status**: COMPLETE  
**Completion Date**: November 7, 2025  
**Estimated Time**: 2-3 hours  
**Dependencies**: Step 1  
**Agent Instructions**:

1. Create `src/components/Availability/AvailabilityGrid.tsx`

2. This component should:
   - Display a grid/calendar of all slots (days × periods)
   - Allow toggling slots as unavailable (checkbox/click)
   - For each selected slot, show radio buttons:
     - "Hard Unavailable" (cannot schedule) - Red theme
     - "Preferred Unavailable" (try to avoid) - Yellow/orange theme
   - Handle both controlled and uncontrolled modes
   - Accept props for entity type (teacher/classroom/subdivision)

3. Design requirements:
   - Use Material-UI components (match existing app style)
   - Mobile-responsive (consider using DataGrid or custom grid)
   - Clear visual distinction between hard/soft unavailability
   - Show slot day and period number clearly

4. Props interface should include:

   ```typescript
   interface AvailabilityGridProps {
     slots: Slot[];
     unavailableSlots: Array<{
       id: string;
       slotId: string;
       isPreferred: boolean;
     }>;
     onAdd: (slotId: string, isPreferred: boolean) => void;
     onUpdate: (id: string, isPreferred: boolean) => void;
     onDelete: (id: string) => void;
     readonly?: boolean;
   }
   ```

5. **After completion**:
   - Update this file, change status to ✅ COMPLETE
   - Create `2-grid-component-summary.md` documenting:
     - Component API and props
     - UI/UX decisions made
     - Screenshots or mockups if possible
     - Usage examples

---

### Step 3: Implement TeacherUnavailableEditor 👨‍🏫

**Status**: COMPLETE  
**Completion Date**: November 7, 2025  
**Estimated Time**: 1-2 hours  
**Dependencies**: Step 2  
**Agent Instructions**:

1. Update `src/components/Availability/TeacherUnavailableEditor.tsx`

2. Implementation requirements:
   - Accept `teacherId` as prop
   - Use `teacherUnavailableCollection` from `useCollections()`
   - Use `slotCollection` to fetch all available slots
   - Integrate the `AvailabilityGrid` component
   - Handle insert/update/delete operations via collection

3. Component structure:

   ```typescript
   interface TeacherUnavailableEditorProps {
     teacherId: string;
   }
   ```

4. Use `useLiveQuery` to reactively fetch:
   - All slots for the timetable
   - Current unavailability records for this teacher

5. Wire up grid callbacks to collection mutations:
   - `onAdd` → `teacherUnavailableCollection.insert()`
   - `onUpdate` → `teacherUnavailableCollection.update()`
   - `onDelete` → `teacherUnavailableCollection.delete()`

6. Add loading/error states

7. **After completion**:
   - Update this file, change status to ✅ COMPLETE
   - Create `3-teacher-editor-summary.md` documenting:
     - Implementation details
     - Any challenges faced
     - How data flows through the component

---

### Step 4: Implement ClassroomUnavailableEditor 🏫

**Status**: COMPLETE  
**Completion Date**: November 7, 2025  
**Estimated Time**: 1 hour  
**Dependencies**: Step 3  
**Agent Instructions**:

1. Update `src/components/Availability/ClassroomUnavailableEditor.tsx`

2. Follow the same pattern as Step 3, but for classrooms:
   - Accept `classroomId` as prop
   - Use `classroomUnavailableCollection`
   - Integrate `AvailabilityGrid` component

3. **After completion**:
   - Update this file, change status to ✅ COMPLETE
   - Create `4-classroom-editor-summary.md`

---

### Step 5: Implement SubdivisionUnavailableEditor 👥

**Status**: COMPLETE  
**Completion Date**: November 7, 2025  
**Estimated Time**: 1 hour  
**Dependencies**: Step 4  
**Agent Instructions**:

1. Update `src/components/Availability/SubdivisionUnavailableEditor.tsx`

2. Follow the same pattern as Steps 3-4, but for subdivisions:
   - Accept `subdivisionId` as prop
   - Use `subdivisionUnavailableCollection`
   - Integrate `AvailabilityGrid` component

3. **After completion**:
   - Update this file, change status to ✅ COMPLETE
   - Create `5-subdivision-editor-summary.md`

---

### Step 6: Integrate Editors into Entity Pages 🔗

**Status**: COMPLETE  
**Completion Date**: November 7, 2025  
**Estimated Time**: 2-3 hours  
**Dependencies**: Steps 3, 4, 5  
**Agent Instructions**:

1. Update `src/routes/tt/$timetableId/teachers.tsx`:
   - Add a new tab or expandable section for unavailability
   - Show `TeacherUnavailableEditor` when a teacher is selected
   - Consider using Material-UI Tabs, Dialog, or Accordion

2. Update `src/routes/tt/$timetableId/classrooms.tsx`:
   - Similar integration for classroom unavailability

3. Update `src/routes/tt/$timetableId/subdivisions.tsx`:
   - Similar integration for subdivision unavailability

4. Design pattern recommendation:

   ```tsx
   // Option A: Tabs
   <Tabs>
     <Tab label="List" />
     <Tab label="Unavailability" />
   </Tabs>

   // Option B: In-line accordion (when item selected)
   <Accordion>
     <AccordionSummary>Teacher Details</AccordionSummary>
     <AccordionDetails>
       <TeacherUnavailableEditor teacherId={selectedId} />
     </AccordionDetails>
   </Accordion>

   // Option C: Side drawer or modal
   <Drawer open={showUnavailability}>
     <TeacherUnavailableEditor teacherId={selectedId} />
   </Drawer>
   ```

5. Ensure consistent UX across all three pages

6. **After completion**:
   - Update this file, change status to ✅ COMPLETE
   - Create `6-page-integration-summary.md` documenting:
     - UI pattern chosen and why
     - User flow explanation
     - Screenshots if available

---

### Step 7: Add Visual Indicators (Optional Enhancement) 🎨

**Status**: COMPLETE  
**Completion Date**: November 7, 2025  
**Estimated Time**: 2-3 hours  
**Dependencies**: Step 6  
**Agent Instructions**:

1. Update the timetable editor grid (`src/routes/tt/$timetableId/edit/`)

2. Add visual indicators for unavailable slots:
   - Hard unavailable: Red background with ❌ icon
   - Preferred unavailable: Yellow/orange background with ⚠️ icon
   - Show tooltips explaining the constraint type

3. This helps users understand constraints when viewing the generated timetable

4. **After completion**:
   - Update this file, change status to ✅ COMPLETE
   - Create `7-visual-indicators-summary.md`

---

### Step 8: Testing and Polish ✅

**Status**: COMPLETE  
**Completion Date**: November 7, 2025  
**Estimated Time**: 2-4 hours  
**Dependencies**: Steps 1-7  
**Agent Instructions**:

1. Create comprehensive test scenarios:
   - Add hard unavailability for a teacher
   - Add soft unavailability for a classroom
   - Update existing unavailability from hard to soft
   - Delete unavailability records
   - Generate timetable and verify constraints work

2. Test edge cases:
   - Empty state (no unavailability)
   - All slots unavailable
   - Switching between hard/soft for same slot
   - Multiple entities with overlapping unavailability

3. UI/UX polish:
   - Add helpful tooltips explaining hard vs soft
   - Ensure loading states are smooth
   - Error handling with user-friendly messages
   - Mobile responsiveness

4. Documentation:
   - Update user-facing docs if they exist
   - Add inline code comments
   - Create usage examples

5. **After completion**:
   - Update this file, change status to ✅ COMPLETE
   - Create `8-testing-summary.md` documenting:
     - Test scenarios covered
     - Bugs found and fixed
     - Performance considerations
     - Remaining known issues (if any)

---

## Progress Tracker

| Step | Feature                      | Status      | Completion Date  |
| ---- | ---------------------------- | ----------- | ---------------- |
| 1    | tRPC Routers                 | ✅ COMPLETE | November 7, 2025 |
| 2    | Availability Grid Component  | ✅ COMPLETE | November 7, 2025 |
| 3    | Teacher Editor               | ✅ COMPLETE | November 7, 2025 |
| 4    | Classroom Editor             | ✅ COMPLETE | November 7, 2025 |
| 5    | Subdivision Editor           | ✅ COMPLETE | November 7, 2025 |
| 6    | Page Integration             | ✅ COMPLETE | November 7, 2025 |
| 7    | Visual Indicators (Optional) | ✅ COMPLETE | November 7, 2025 |
| 8    | Testing & Polish             | ✅ COMPLETE | November 7, 2025 |

**Overall Progress**: 8/8 steps complete (100%) ✅

---

## Important Notes for AI Agents

### Pattern to Follow (Critical!)

1. **Always use collections** - Never call tRPC directly from components

   ```typescript
   // ✅ CORRECT
   const { teacherUnavailableCollection } = useCollections();
   teacherUnavailableCollection.insert({ ... });

   // ❌ WRONG
   const mutation = trpc.teacherUnavailabilities.add.useMutation();
   mutation.mutate({ ... });
   ```

2. **Use useLiveQuery for reactive data**

   ```typescript
   const { data: unavailability } = useLiveQuery(
     (q) => q.from({ teacherUnavailableCollection }),
     [teacherUnavailableCollection],
   );
   ```

3. **Material-UI v7** - This project uses MUI, NOT Tailwind
   - Import from `@mui/material`
   - Follow existing component patterns in the codebase

4. **Type Safety** - Always run `bunx tsc --noEmit` before marking complete

5. **Backend is Complete** - No need to modify:
   - Prisma schemas (already have `isPreferred`)
   - Constraint functions (hard/soft already implemented)
   - GA algorithm (already integrated)

### File Naming Convention for Summaries

- `1-routers-summary.md`
- `2-grid-component-summary.md`
- `3-teacher-editor-summary.md`
- etc.

### Summary Template

Each summary file should include:

```markdown
# Step X: [Feature Name] - Implementation Summary

## Date Completed

[Date]

## What Was Done

- Bullet points of main changes
- Files created/modified

## Implementation Details

- Technical decisions made
- Patterns used
- Challenges overcome

## Testing

- What was tested
- Results

## Next Steps

- What the next agent should know
- Any blockers or issues to watch for

## Screenshots/Examples

[If applicable]
```

---

## Backend Implementation Reference

For context, here's what was already completed on the backend:

### Schema Changes

- Added `isPreferred: Boolean @default(false)` to:
  - `TeacherUnavailable`
  - `ClassroomUnavailable`
  - `SubdivisionUnavailable`

### New Constraint Functions

- `checkTeacherPreferredUnavailability()` (soft constraint)
- `checkSubdivisionPreferredUnavailability()` (soft constraint)
- `checkRoomPreferredUnavailability()` (soft constraint)

### Updated Hard Constraint Functions

- `checkTeacherUnavailability()` - now only checks `isPreferred = false`
- `checkSubdivisionUnavailability()` - now only checks `isPreferred = false`
- `checkRoomUnavailability()` - now only checks `isPreferred = false`

### Configuration

- Added `preferredUnavailability: 5` weight to `ConstraintWeights`
- Default penalty: 5 points per soft unavailability violation
- Integrated into `evaluateChromosome()` and `validateSolution()`

---

**Last Updated**: November 3, 2025  
**Status**: Ready for frontend implementation
