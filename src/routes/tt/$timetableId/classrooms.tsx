import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { nanoid } from "nanoid";
import { useCollections } from "@/db-collections/providers/useCollections";

export const Route = createFileRoute("/tt/$timetableId/classrooms")({
  component: RouteComponent,
});

function RouteComponent() {
  const { classroomCollection } = useCollections();
  const { timetableId } = Route.useParams();
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    classroomCollection.insert({
      id: nanoid(4),
      name,
      timetableId,
    });
    setName("");
  };

  return (
    <div>
      <h1>Add Classroom</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Classroom Name:</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <button type="submit">Add Classroom</button>
      </form>
    </div>
  );
}
