import { eq, useLiveQuery } from "@tanstack/react-db";
import {
  Alert,
  Box,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import type { Classroom, Lecture, Subdivision } from "generated/prisma/client";
import { useCollections } from "@/db-collections/providers/useCollections";

/* ---------------- Lecture List Component ---------------- */
export function LectureList({
  handleEdit,
  handleDelete,
}: {
  handleEdit: (input: {
    lecture: Lecture;
    classroomsOfLecture: Classroom[];
    subdivisionsOfLecture: Subdivision[];
  }) => void;
  handleDelete: (id: string) => void;
}) {
  const { lectureCollection } = useCollections();
  const { data: lectures } = useLiveQuery(
    (q) => q.from({ lectureCollection }),
    [lectureCollection],
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Existing Lectures
        </Typography>

        {lectures.length > 0 ? (
          <List>
            {lectures.map((lecture) => (
              <LectureItem
                key={lecture.id}
                lecture={lecture}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
              />
            ))}
          </List>
        ) : (
          <Alert severity="info" sx={{ mt: 2 }}>
            No lectures found. Add your first lecture above.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// Create a component for each lecture item to fetch its relationships
export function LectureItem({
  lecture,
  handleEdit,
  handleDelete,
}: {
  lecture: Lecture;
  handleEdit: (input: {
    lecture: Lecture;
    classroomsOfLecture: Classroom[];
    subdivisionsOfLecture: Subdivision[];
  }) => void;
  handleDelete: (id: string) => void;
}) {
  const {
    lectureSubdivisionCollection,
    lectureClassroomCollection,
    subdivisionCollection,
    classroomCollection,
    teacherCollection,
    subjectCollection,
  } = useCollections();

  // Helper functions to get names
  const getTeacherName = (teacherId: string) => {
    const teacher = teacherCollection.get(teacherId);
    return teacher ? teacher.name : "Unknown Teacher";
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjectCollection.get(subjectId);
    return subject ? subject.name : "Unknown Subject";
  };

  // Fetch related subdivisions for this lecture
  const { data: subdivisionsOfLecture } = useLiveQuery(
    (q) =>
      q
        .from({ lectureSubdivision: lectureSubdivisionCollection })
        .where(({ lectureSubdivision }) =>
          eq(lectureSubdivision.lectureId, lecture.id),
        )
        .innerJoin(
          { subdivision: subdivisionCollection },
          ({ lectureSubdivision, subdivision }) =>
            eq(lectureSubdivision.subdivisionId, subdivision.id),
        )
        .select(({ subdivision }) => ({ ...subdivision }))
        .orderBy(({ subdivision }) => subdivision.name),
    [lecture.id, lectureSubdivisionCollection, subdivisionCollection],
  );

  // Fetch related classrooms for this lecture
  const { data: classroomsOfLecture } = useLiveQuery(
    (q) =>
      q
        .from({ lectureClassroom: lectureClassroomCollection })
        .where(({ lectureClassroom }) =>
          eq(lectureClassroom.lectureId, lecture.id),
        )
        .innerJoin(
          { classroom: classroomCollection },
          ({ lectureClassroom, classroom }) =>
            eq(lectureClassroom.classroomId, classroom.id),
        )
        .select(({ classroom }) => ({ ...classroom }))
        .orderBy(({ classroom }) => classroom.name),
    [lecture.id, lectureClassroomCollection, classroomCollection],
  );

  const subdivisionNames = subdivisionsOfLecture.map((s) => s.name).join(", ");
  const classroomNames = classroomsOfLecture.map((c) => c.name).join(", ");

  return (
    <ListItem
      key={lecture.id}
      divider
      secondaryAction={
        <>
          <IconButton
            edge="end"
            aria-label="edit"
            onClick={() =>
              handleEdit({
                lecture,
                classroomsOfLecture,
                subdivisionsOfLecture,
              })
            }
            sx={{ mr: 1 }}
            color="primary"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            edge="end"
            aria-label="delete"
            onClick={() => handleDelete(lecture.id)}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </>
      }
    >
      <ListItemText
        primary={`${getSubjectName(lecture.subjectId)} - ${getTeacherName(lecture.teacherId)}`}
        secondary={
          <Box>
            <Typography variant="body2" component="span">
              Count: {lecture.count}, Duration: {lecture.duration} slots
            </Typography>
            {subdivisionNames && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Subdivisions: {subdivisionNames}
              </Typography>
            )}
            {classroomNames && (
              <Typography variant="caption" display="block">
                Classrooms: {classroomNames}
              </Typography>
            )}
          </Box>
        }
        slotProps={{
          primary: {
            variant: "h6",
          },
        }}
      />
    </ListItem>
  );
}
