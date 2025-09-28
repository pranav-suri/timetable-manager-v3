### Instructions for Using TanStack DB Collections

This guide provides instructions on how to effectively query data from the available TanStack DB collections in this project.

### Available Collections

You can access all collections through the `useCollections` hook.

#### **Core Data Collections:**
These are synced with the backend and represent the primary data entities.

*   `classroomCollection`: Stores classroom information.
*   `groupCollection`: Contains information about groups of subjects (e.g., for electives).
*   `lectureCollection`: Holds details about individual lectures.
*   `lectureClassroomCollection`: A join table mapping lectures to their assigned classrooms.
*   `lectureSlotCollection`: Assigns lectures to specific time slots in the timetable.
*   `lectureSubdivisionCollection`: A join table connecting lectures to student subdivisions.
*   `slotCollection`: Defines all available time slots (day and slot number).
*   `subdivisionCollection`: Stores information about student subdivisions (e.g., SE-A, SE-B).
*   `subjectCollection`: Contains details about all subjects.
*   `teacherCollection`: Stores teacher information.
*   `timetableCollection`: Contains metadata about the timetables.

#### **Unavailable/Constraint Collections:**
These collections store scheduling constraints.

*   `classroomUnavailableCollection`: Marks time slots when a classroom is unavailable.
*   `subdivisionUnavailableCollection`: Marks time slots when a subdivision is unavailable.
*   `teacherUnavailableCollection`: Marks time slots when a teacher is unavailable.

#### **Join/Relationship Collections:**

*   `subjectClassroomCollection`: Defines which classrooms are suitable for which subjects.
*   `subjectTeacherCollection`: Maps which teachers can teach which subjects.

#### **Live/Derived Collections:**
These collections are computed in real-time from the core collections and are highly useful for simplifying component logic.

*   `completeLectureOnlyCollection`: A powerful derived collection that provides a denormalized view of lectures. It joins `lecture`, `lectureSlot`, `subject`, and `group` collections to give you a flat structure with all the essential information about a lecture scheduled in a slot, including `lectureSlotId`, `slotId`, `lectureId`, `subjectId`, `teacherId`, `groupId`, and `allowSimultaneous`.
*   `lectureWithSubdivisionCollection`: Joins `completeLectureOnlyCollection` with `lectureSubdivisionCollection` to link scheduled lectures with their respective student subdivisions.
*   `lectureWithClassroomCollection`: Joins `completeLectureOnlyCollection` with `lectureClassroomCollection` to link scheduled lectures with their assigned classrooms.

### How to Query Data

The primary method for reactively querying data in your components is the `useLiveQuery` hook from `@tanstack/react-db`. It takes a query function and a dependency array.

#### **1. Basic Fetching from a Collection**

To get all items from a collection, use the `from` clause.

**Example:** Fetching all lectures.
```typescript
import { useLiveQuery } from "@tanstack/react-db";
import { useCollections } from "@/db-collections/providers/useCollections";

function MyComponent() {
  const { lectureCollection } = useCollections();
  const { data: allLectures } = useLiveQuery(
    (q) => q.from({ lecture: lectureCollection }),
    [lectureCollection]
  );

  // ...
}
```

#### **2. Filtering Data with `where`**

Use the `where` clause with a predicate function to filter items. The `eq` (equals) operator is commonly used for comparisons.

**Example:** Fetching all lectures in a specific time slot from the derived `completeLectureOnlyCollection`.
```typescript
import { eq, useLiveQuery } from "@tanstack/react-db";
import { useCollections } from "@/db-collections/providers/useCollections";

function Slot({ slotId }: { slotId: string }) {
  const { completeLectureOnlyCollection } = useCollections();

  const { data: lecturesInSlot } = useLiveQuery(
    (q) =>
      q
        .from({ item: completeLectureOnlyCollection })
        .where(({ item }) => eq(item.slotId, slotId)),
    [slotId, completeLectureOnlyCollection]
  );

  // ...
}
```

#### **3. Joining Collections with `join` and `innerJoin`**

You can combine data from multiple collections using joins. `innerJoin` only includes results where there is a match in both collections, while `join` (a left join) includes all results from the "left" collection, even if there's no match in the "right".

**Example:** Fetching all classrooms assigned to a specific lecture.
```typescript
import { eq, useLiveQuery } from "@tanstack/react-db";
import { useCollections } from "@/db-collections/providers/useCollections";

function LectureDetails({ lectureId }: { lectureId: string }) {
  const { lectureClassroomCollection, classroomCollection } = useCollections();

  const { data: classrooms } = useLiveQuery(
    (q) =>
      q
        .from({ lectureClassroom: lectureClassroomCollection })
        .where(({ lectureClassroom }) =>
          eq(lectureClassroom.lectureId, lectureId),
        )
        .innerJoin(
          { classroom: classroomCollection },
          ({ lectureClassroom, classroom }) =>
            eq(lectureClassroom.classroomId, classroom.id),
        )
        .select(({ classroom }) => ({ ...classroom })), // Select only the classroom data
    [lectureId, lectureClassroomCollection, classroomCollection],
  );

  // ...
}
```

#### **4. Ordering Results with `orderBy`**

Use the `orderBy` clause to sort your query results.

**Example:** Fetching slots for a specific day, ordered by their period number.
```typescript
import { eq, useLiveQuery } from "@tanstack/react-db";
import { useCollections } from "@/db-collections/providers/useCollections";

function DayRow({ day }: { day: number }) {
  const { slotCollection } = useCollections();

  const { data: slotsOfDay } = useLiveQuery(
    (q) =>
      q
        .from({ slot: slotCollection })
        .where(({ slot }) => eq(slot.day, day))
        .orderBy(({ slot }) => slot.number),
    [day, slotCollection],
  );

  // ...
}
```

#### **5. Selecting Specific Fields and Unique Values with `select` and `distinct`**

To shape your result and avoid unnecessary data, use the `select` clause. Combine it with `distinct` to get unique values.

**Example:** Getting the distinct list of day numbers for the timetable header.
```typescript
import { useLiveQuery } from "@tanstack/react-db";
import { useCollections } from "@/db-collections/providers/useCollections";

function MuiTimetable() {
  const { slotCollection } = useCollections();

  const { data: slotDays } = useLiveQuery(
    (q) =>
      q
        .from({ slot: slotCollection })
        .select(({ slot }) => ({ day: slot.day }))
        .distinct()
        .orderBy(({ slot }) => slot.day),
    [slotCollection],
  );
  
  // slotDays will be an array of objects like [{ day: 1 }, { day: 2 }, ...]
  // ...
}
```

#### **6. Synchronous Data Retrieval with `.get()`**

When you need to access a single item from a collection synchronously and you already have its key, you can use the `.get()` method. This is useful for simple lookups inside components or helper functions where you don't need the reactive updates of `useLiveQuery`.

**Example:** Fetching a teacher's name by their ID.
```typescript
import { useCollections } from "@/db-collections/providers/useCollections";

export function TeacherInfo({ teacherId }: { teacherId: string }) {
  const { teacherCollection } = useCollections();
  const teacher = teacherCollection.get(teacherId); // Direct, synchronous lookup

  return (
    <Typography>
      <b>Teacher:</b> {teacher?.name ?? "Loading..."}
    </Typography>
  );
}
```