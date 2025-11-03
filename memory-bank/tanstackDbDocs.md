Combining the **TanStack DB Query Builder API** reference and the **Collections/Querying Guide** into a single, cohesive markdown document provides a complete resource for developers.

Here is the combined document:

---

# 🚀 TanStack DB Query Reference & Usage Guide

This document provides a comprehensive reference for the available collections, the methods on the `BaseQueryBuilder`, and expression functions for effective data querying using `useLiveQuery` in this project.

---

## 💾 Section 1: Available Collections (via `useCollections` hook)

All collections are accessible through the `useCollections` hook. **Note:** Collections ending in `Collection` are of type `CollectionImpl` and support direct synchronous lookup (`.get()`).

### Core Data Collections

| Collection Name         | Purpose                                                 |
| :---------------------- | :------------------------------------------------------ |
| `classroomCollection`   | Stores classroom information.                           |
| `groupCollection`       | Groups of subjects (e.g., for electives).               |
| `lectureCollection`     | Details about individual lectures.                      |
| `slotCollection`        | Defines all available time slots (day and slot number). |
| `subdivisionCollection` | Student subdivisions (e.g., SE-A, SE-B).                |
| `subjectCollection`     | Details about all subjects.                             |
| `teacherCollection`     | Stores teacher information.                             |
| `timetableCollection`   | Metadata about the timetables.                          |

### Join/Relationship Collections

| Collection Name                | Purpose (Join Table)                       |
| :----------------------------- | :----------------------------------------- |
| `lectureClassroomCollection`   | Maps lectures to assigned classrooms.      |
| `lectureSlotCollection`        | Assigns lectures to specific time slots.   |
| `lectureSubdivisionCollection` | Connects lectures to student subdivisions. |
| `subjectClassroomCollection`   | Defines suitable classrooms for subjects.  |
| `subjectTeacherCollection`     | Maps teachers to subjects they can teach.  |

### Unavailable/Constraint Collections

| Collection Name                    | Purpose                                           |
| :--------------------------------- | :------------------------------------------------ |
| `classroomUnavailableCollection`   | Marks classroom unavailable time slots.           |
| `subdivisionUnavailableCollection` | Marks student subdivision unavailable time slots. |
| `teacherUnavailableCollection`     | Marks teacher unavailable time slots.             |

### Live/Derived Collections (For Denormalized/Joined Views)

| Collection Name                    | Purpose                                                                                                                                                      |
| :--------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `completeLectureOnlyCollection`    | Denormalized view: Joins `lecture`, `lectureSlot`, `subject`, and `group`. Includes `slotId`, `lectureId`, `subjectId`, `teacherId`, etc. **Highly useful.** |
| `lectureWithSubdivisionCollection` | Joins `completeLectureOnlyCollection` with `lectureSubdivisionCollection`.                                                                                   |
| `lectureWithClassroomCollection`   | Joins `completeLectureOnlyCollection` with `lectureClassroomCollection`.                                                                                     |

---

## ⚙️ Section 2: `CollectionImpl` Core Methods (Data Management & State Access)

These methods are called directly on a collection object (e.g., `teacherCollection`) for state management, synchronous access, and mutations.

| Method/Property                          | Purpose                                                                                            | Example Usage                                                  |
| :--------------------------------------- | :------------------------------------------------------------------------------------------------- | :------------------------------------------------------------- |
| **`.get(key)`**                          | **Synchronous lookup** of a single item by its primary key.                                        | `teacherCollection.get(teacherId)`                             |
| **`.isReady()`**                         | Checks if the collection has completed its **initial sync**.                                       | `if (collection.isReady()) { ... }`                            |
| **`.size`**                              | Gets the **current number of items** in the collection (synchronous).                              | `const count = collection.size`                                |
| **`.state`**                             | Gets the current collection state as a **`Map<TKey, TOutput>`** (synchronous).                     | `const itemMap = collection.state`                             |
| **`.toArray`**                           | Gets the current collection state as an **array of values** (synchronous).                         | `const itemArray = collection.toArray`                         |
| **`.keys()`, `.values()`, `.entries()`** | Iterators for keys, values, or key-value pairs.                                                    | `for (const [k, v] of collection.entries()) { ... }`           |
| **`.stateWhenReady()`**                  | **Promise** that resolves to the collection **`Map`** once the first sync is complete.             | `await collection.stateWhenReady()`                            |
| **`.toArrayWhenReady()`**                | **Promise** that resolves to the collection **`Array`** once the first sync is complete.           | `await collection.toArrayWhenReady()`                          |
| **`.insert(data)`**                      | Inserts one or more items (returns a **Transaction** object).                                      | `collection.insert({ id: "new", name: "A" })`                  |
| **`.update(key, callback)`**             | Updates one or more items by key(s) using an immer-style draft callback.                           | `collection.update("id1", (draft) => { draft.active = true })` |
| **`.delete(keys)`**                      | Deletes one or more items by key(s).                                                               | `collection.delete(["id1", "id2"])`                            |
| **`.createIndex(cb, config?)`**          | Creates an optimized index (e.g., B+ tree) for faster querying on non-key fields.                  | `collection.createIndex((row) => row.age)`                     |
| **`.subscribeChanges(cb, opts?)`**       | Subscribes to changes (insert, update, delete) for reactive updates _outside_ of React components. | `collection.subscribeChanges((changes) => { ... })`            |

---

## 🔍 Section 3: Querying Data with `useLiveQuery`

The `useLiveQuery(queryFn, deps)` hook from `@tanstack/react-db` is the primary way to fetch reactive data. It takes a query function (`q`) where you chain methods from the `BaseQueryBuilder`.

| Method                       | Description                                                                                     | TypeScript Example                                            |
| :--------------------------- | :---------------------------------------------------------------------------------------------- | :------------------------------------------------------------ |
| **`from(source)`**           | **Starts the query.** Specifies the source collection/subquery. The key is the table **alias**. | `q.from({ users: usersCollection })`                          |
| **`join(s, on, t?)`**        | Joins another collection/subquery. Defaults to a **`left`** join.                               | `.join({ p: posts }, ({u, p}) => eq(u.id, p.userId))`         |
| **`leftJoin(s, on)`**        | Performs a **LEFT JOIN**.                                                                       | `.leftJoin({ c: collection }, ...)`                           |
| **`rightJoin(s, on)`**       | Performs a **RIGHT JOIN**.                                                                      | `.rightJoin({ c: collection }, ...)`                          |
| **`innerJoin(s, on)`**       | Performs an **INNER JOIN**.                                                                     | `.innerJoin({ c: collection }, ...)`                          |
| **`fullJoin(s, on)`**        | Performs a **FULL JOIN**.                                                                       | `.fullJoin({ c: collection }, ...)`                           |
| **`where(callback)`**        | Filters rows based on a condition. Multiple calls are **ANDed**.                                | `.where(({ users }) => gt(users.age, 18))`                    |
| **`having(callback)`**       | Filters **grouped rows** based on aggregate conditions.                                         | `.having(({posts}) => gt(count(posts.id), 5))`                |
| **`select(callback)`**       | Shapes the result by choosing columns or creating computed values/aggregates.                   | `.select(({ u }) => ({ name: u.name, count: count() }))`      |
| **`orderBy(cb, dir/opts?)`** | Sorts the results. Chained calls apply multiple sort criteria.                                  | `.orderBy(({ users }) => users.createdAt, 'desc')`            |
| **`groupBy(callback)`**      | Groups rows for aggregation (must be used before `select` with aggregates).                     | `.groupBy(({ posts }) => posts.userId)`                       |
| **`limit(count)`**           | Limits the number of returned rows. **Requires `orderBy`**.                                     | `.limit(10)`                                                  |
| **`offset(count)`**          | Skips a number of rows. **Requires `orderBy`**.                                                 | `.offset(20)`                                                 |
| **`distinct()`**             | Ensures only unique rows are returned based on selected columns.                                | `.distinct()`                                                 |
| **`findOne()`**              | Transforms the query to return a single result object instead of an array.                      | `.findOne()`                                                  |
| **`fn.select(cb)`**          | **Functional/Imperative select.** **Warning: Cannot be optimized.**                             | `.fn.select(row => ({ name: row.users.name.toUpperCase() }))` |
| **`fn.where(cb)`**           | **Functional/Imperative where.** **Warning: Cannot be optimized.**                              | `.fn.where(row => row.users.name.startsWith('A'))`            |
| **`fn.having(cb)`**          | **Functional/Imperative having.** **Warning: Cannot be optimized.**                             | `.fn.having(row => row.count > 5)`                            |

---

## 💡 Section 4: Expression Functions Reference

These functions are used within the callbacks of methods like `where`, `on`, `having`, `select`, and `orderBy`.

### Comparison Operators

| Function                    | Description                                                                    | TypeScript Example                     |
| :-------------------------- | :----------------------------------------------------------------------------- | :------------------------------------- |
| **`eq(l, r)`**              | Equality comparison.                                                           | `eq(user.id, 1)`                       |
| **`gt(l, r)`, `gte(l, r)`** | Greater than (or equal to).                                                    | `gt(user.age, 18)`                     |
| **`lt(l, r)`, `lte(l, r)`** | Less than (or equal to).                                                       | `lt(user.createdAt, new Date())`       |
| **`inArray(v, a)`**         | Checks if a value is present in an array.                                      | `inArray(user.role, ['admin', 'mod'])` |
| **`like(v, p)`**            | Case-sensitive string pattern matching (e.g., `'%pattern%'`).                  | `like(user.name, 'John%')`             |
| **`ilike(v, p)`**           | Case-insensitive string pattern matching.                                      | `ilike(user.email, '%@gmail.com')`     |
| **`isUndefined(v)`**        | Checks if the property is **absent** (common after a non-matching `leftJoin`). | `isUndefined(profile)`                 |
| **`isNull(v)`**             | Checks if the property exists but is explicitly set to **`null`**.             | `isNull(user.bio)`                     |

### Logical Operators

| Function        | Description                         | TypeScript Example                           |
| :-------------- | :---------------------------------- | :------------------------------------------- |
| **`and(...c)`** | Combines conditions with AND logic. | `and(eq(u.active, true), gt(u.age, 18))`     |
| **`or(...c)`**  | Combines conditions with OR logic.  | `or(eq(u.role, 'admin'), eq(u.role, 'mod'))` |
| **`not(c)`**    | Negates a condition.                | `not(eq(u.active, false))`                   |

### String & Mathematical Functions

| Function                    | Description                                              | TypeScript Example                       |
| :-------------------------- | :------------------------------------------------------- | :--------------------------------------- |
| **`upper(v)` / `lower(v)`** | Converts case.                                           | `upper(user.name)`                       |
| **`length(v)`**             | Gets string or array length.                             | `length(user.tags)`                      |
| **`concat(...v)`**          | Concatenates multiple strings.                           | `concat(u.first, ' ', u.last)`           |
| **`add(l, r)`**             | Adds two numbers.                                        | `add(user.salary, user.bonus)`           |
| **`coalesce(...v)`**        | Returns the **first non-null** value from the arguments. | `coalesce(u.display, u.name, 'Unknown')` |

### Aggregate Functions (Used in `select` or `having` with `groupBy`)

| Function                | Description                                                      | TypeScript Example  |
| :---------------------- | :--------------------------------------------------------------- | :------------------ |
| **`count(v)`**          | Counts non-null values (or all rows if no argument is provided). | `count(user.id)`    |
| **`sum(v)`**            | Sums numeric values.                                             | `sum(order.amount)` |
| **`avg(v)`**            | Calculates the average of numeric values.                        | `avg(user.salary)`  |
| **`min(v)` / `max(v)`** | Finds the minimum/maximum value.                                 | `max(order.amount)` |

---

## 🛠️ Section 5: Querying Examples and Best Practices

### 1\. Basic Filtering and Reactive Fetching

The `useLiveQuery` hook ensures your component re-renders whenever the underlying data changes.

```typescript
import { eq, useLiveQuery } from "@tanstack/react-db";
import { useCollections } from "@/db-collections/providers/useCollections";

function SlotDetails({ slotId }: { slotId: string }) {
  const { completeLectureOnlyCollection } = useCollections();

  const { data: lecturesInSlot } = useLiveQuery(
    (q) =>
      q
        .from({ item: completeLectureOnlyCollection })
        // Filter by the slotId field on the derived collection item
        .where(({ item }) => eq(item.slotId, slotId)),
    [slotId, completeLectureOnlyCollection],
  );

  // ... render lecturesInSlot
}
```

### 2\. Complex Join, Filter, and Select

Fetching all available classrooms for a specific subject, ordered by name.

```typescript
import { eq, useLiveQuery } from "@tanstack/react-db";

function SubjectClassrooms({ subjectId }: { subjectId: string }) {
  const { subjectClassroomCollection, classroomCollection } = useCollections();

  const { data: suitableClassrooms } = useLiveQuery(
    (q) =>
      q
        // 1. Start from the join table to filter by subject
        .from({ sc: subjectClassroomCollection })
        .where(({ sc }) => eq(sc.subjectId, subjectId))
        // 2. Inner join to get the actual classroom data
        .innerJoin({ c: classroomCollection }, ({ sc, c }) =>
          eq(sc.classroomId, c.id),
        )
        // 3. Select only the classroom fields and order the results
        .select(({ c }) => ({
          id: c.id,
          name: c.name,
          // or spread c (...c) to select all columns of c
        }))
        .orderBy(({ c }) => c.name),
    [subjectId, subjectClassroomCollection, classroomCollection],
  );

  // ... render suitableClassrooms
}
```

### 3\. Synchronous Lookup for Single Items

Use the `.get(key)` method when you have the primary key and don't need reactive updates.

```typescript
import { useCollections } from "@/db-collections/providers/useCollections";

export function TeacherName({ teacherId }: { teacherId: string }) {
  const { teacherCollection } = useCollections();
  // Direct, synchronous lookup: teacher is TOutput | undefined
  const teacher = teacherCollection.get(teacherId);

  return <span>{teacher?.name ?? "Unknown Teacher"}</span>;
}
```
