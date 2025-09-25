import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { nanoid } from "nanoid";
import { eq, useLiveQuery } from "@tanstack/react-db";
import { useForm } from "@tanstack/react-form";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Container,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import type { Lecture, Subject, Teacher } from "generated/prisma/client";
import { useCollections } from "@/db-collections/providers/useCollections";

export const Route = createFileRoute("/tt/$timetableId/_layout/lectures")({
  component: RouteComponent,
});

function RouteComponent() {
  const {
    lectureCollection,
    teacherCollection,
    subjectCollection,
    subdivisionCollection,
    classroomCollection,
    lectureSubdivisionCollection,
    lectureClassroomCollection,
  } = useCollections();
  const { timetableId } = Route.useParams();
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: lectures } = useLiveQuery(
    (q) => q.from({ lectureCollection }),
    [lectureCollection],
  );

  const { data: teachers } = useLiveQuery(
    (q) => q.from({ teacherCollection }),
    [teacherCollection],
  );

  const { data: subjects } = useLiveQuery(
    (q) => q.from({ subjectCollection }),
    [subjectCollection],
  );

  const { data: subdivisions } = useLiveQuery(
    (q) => q.from({ subdivisionCollection }),
    [subdivisionCollection],
  );

  const { data: classrooms } = useLiveQuery(
    (q) => q.from({ classroomCollection }),
    [classroomCollection],
  );

  const form = useForm({
    defaultValues: {
      teacherId: "",
      subjectId: "",
      count: 1,
      duration: 1,
      subdivisionIds: [] as string[],
      classroomIds: [] as string[],
    },
    onSubmit: ({ value }) => {
      const newLecture = {
        id: nanoid(4),
        teacherId: value.teacherId,
        subjectId: value.subjectId,
        timetableId,
        count: value.count,
        duration: value.duration,
        createdAt: new Date(),
      };
      lectureCollection.insert(newLecture);
      form.reset();
    },
  });

  const handleEdit = (lecture: Lecture) => {
    setEditingId(lecture.id);
    form.setFieldValue("teacherId", lecture.teacherId);
    form.setFieldValue("subjectId", lecture.subjectId);
    form.setFieldValue("count", lecture.count);
    form.setFieldValue("duration", lecture.duration);
    // Note: For editing, we'd need to fetch the related subdivisions and classrooms
    // For now, we'll just reset them to empty arrays
    form.setFieldValue("subdivisionIds", []);
    form.setFieldValue("classroomIds", []);
  };

  const handleUpdate = () => {
    if (editingId) {
      lectureCollection.update(editingId, (draft) => {
        draft.teacherId = form.state.values.teacherId;
        draft.subjectId = form.state.values.subjectId;
        draft.count = form.state.values.count;
        draft.duration = form.state.values.duration;
      });
      setEditingId(null);
      form.reset();
    }
  };

  const handleDelete = (id: string) => {
    lectureCollection.delete(id);
    lectureSubdivisionCollection.utils.refetch();
    lectureClassroomCollection.utils.refetch();
  };

  const cancelEdit = () => {
    setEditingId(null);
    form.reset();
  };

  // Helper functions to get names
  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    return teacher ? teacher.name : "Unknown Teacher";
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    return subject ? subject.name : "Unknown Subject";
  };

  const getSubdivisionName = (subdivisionId: string) => {
    const subdivision = subdivisions.find((s) => s.id === subdivisionId);
    return subdivision ? subdivision.name : "Unknown Subdivision";
  };

  const getClassroomName = (classroomId: string) => {
    const classroom = classrooms.find((c) => c.id === classroomId);
    return classroom ? classroom.name : "Unknown Classroom";
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Lectures Management
      </Typography>

      {/* Lecture Form */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            {editingId ? "Edit Lecture" : "Add New Lecture"}
          </Typography>

          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (editingId) {
                handleUpdate();
              } else {
                form.handleSubmit();
              }
            }}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <form.Field
              name="teacherId"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Teacher is required" : undefined,
              }}
              children={(field) => (
                <FormControl fullWidth>
                  <InputLabel>Teacher</InputLabel>
                  <Select
                    value={field.state.value}
                    label="Teacher"
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={
                      field.state.meta.isTouched &&
                      field.state.meta.errors.length > 0
                    }
                  >
                    {teachers.map((teacher) => (
                      <MenuItem key={teacher.id} value={teacher.id}>
                        {teacher.name} ({teacher.email})
                      </MenuItem>
                    ))}
                  </Select>
                  {field.state.meta.isTouched &&
                  field.state.meta.errors.length ? (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {field.state.meta.errors.join(", ")}
                    </Typography>
                  ) : null}
                </FormControl>
              )}
            />

            <form.Field
              name="subjectId"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Subject is required" : undefined,
              }}
              children={(field) => (
                <FormControl fullWidth>
                  <InputLabel>Subject</InputLabel>
                  <Select
                    value={field.state.value}
                    label="Subject"
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={
                      field.state.meta.isTouched &&
                      field.state.meta.errors.length > 0
                    }
                  >
                    {subjects.map((subject) => (
                      <MenuItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {field.state.meta.isTouched &&
                  field.state.meta.errors.length ? (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                      {field.state.meta.errors.join(", ")}
                    </Typography>
                  ) : null}
                </FormControl>
              )}
            />

            <form.Field
              name="count"
              validators={{
                onChange: ({ value }) =>
                  value < 1 ? "Count must be at least 1" : undefined,
              }}
              children={(field) => (
                <TextField
                  fullWidth
                  label="Count"
                  type="number"
                  value={field.state.value}
                  onChange={(e) =>
                    field.handleChange(parseInt(e.target.value) || 1)
                  }
                  onBlur={field.handleBlur}
                  error={
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                  }
                  helperText={
                    field.state.meta.isTouched && field.state.meta.errors.length
                      ? field.state.meta.errors.join(", ")
                      : "Number of times this lecture occurs"
                  }
                  inputProps={{ min: 1 }}
                />
              )}
            />

            <form.Field
              name="duration"
              validators={{
                onChange: ({ value }) =>
                  value < 1 ? "Duration must be at least 1 slot" : undefined,
              }}
              children={(field) => (
                <TextField
                  fullWidth
                  label="Duration (slots)"
                  type="number"
                  value={field.state.value}
                  onChange={(e) =>
                    field.handleChange(parseInt(e.target.value) || 1)
                  }
                  onBlur={field.handleBlur}
                  error={
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                  }
                  helperText={
                    field.state.meta.isTouched && field.state.meta.errors.length
                      ? field.state.meta.errors.join(", ")
                      : "Number of time slots this lecture occupies"
                  }
                  inputProps={{ min: 1 }}
                />
              )}
            />

            {/* Subdivisions Selection */}
            <FormControl fullWidth>
              <InputLabel>Subdivisions</InputLabel>
              <Select
                multiple
                value={form.state.values.subdivisionIds}
                onChange={(e) =>
                  form.setFieldValue(
                    "subdivisionIds",
                    e.target.value as string[],
                  )
                }
                input={<OutlinedInput label="Subdivisions" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip
                        key={value}
                        label={getSubdivisionName(value)}
                        size="small"
                      />
                    ))}
                  </Box>
                )}
              >
                {subdivisions.map((subdivision) => (
                  <MenuItem key={subdivision.id} value={subdivision.id}>
                    <Checkbox
                      checked={
                        form.state.values.subdivisionIds.indexOf(
                          subdivision.id,
                        ) > -1
                      }
                    />
                    {subdivision.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Classrooms Selection */}
            <FormControl fullWidth>
              <InputLabel>Classrooms</InputLabel>
              <Select
                multiple
                value={form.state.values.classroomIds}
                onChange={(e) =>
                  form.setFieldValue("classroomIds", e.target.value as string[])
                }
                input={<OutlinedInput label="Classrooms" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip
                        key={value}
                        label={getClassroomName(value)}
                        size="small"
                      />
                    ))}
                  </Box>
                )}
              >
                {classrooms.map((classroom) => (
                  <MenuItem key={classroom.id} value={classroom.id}>
                    <Checkbox
                      checked={
                        form.state.values.classroomIds.indexOf(classroom.id) >
                        -1
                      }
                    />
                    {classroom.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={!canSubmit}
                    startIcon={editingId ? <EditIcon /> : <AddIcon />}
                  >
                    {isSubmitting
                      ? "Saving..."
                      : editingId
                        ? "Update"
                        : "Add Lecture"}
                  </Button>
                )}
              />

              {editingId && (
                <Button variant="outlined" onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Lectures List */}
      <LectureList
        lectures={lectures}
        teachers={teachers}
        subjects={subjects}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
      />
    </Container>
  );
}

/* ---------------- Lecture List Component ---------------- */
function LectureList({
  lectures,
  teachers,
  subjects,
  handleEdit,
  handleDelete,
}: {
  lectures: Lecture[];
  teachers: Teacher[];
  subjects: Subject[];
  handleEdit: (lecture: Lecture) => void;
  handleDelete: (id: string) => void;
}) {
  const { classroomCollection, subdivisionCollection } = useCollections();
  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    return teacher ? teacher.name : "Unknown Teacher";
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((s) => s.id === subjectId);
    return subject ? subject.name : "Unknown Subject";
  };

  // Create a component for each lecture item to fetch its relationships
  const LectureItem = ({ lecture }: { lecture: Lecture }) => {
    const { lectureSubdivisionCollection, lectureClassroomCollection } =
      useCollections();

    // Fetch related subdivisions for this lecture
    const { data: lectureSubdivisions } = useLiveQuery(
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
      [lecture.id, lectureSubdivisionCollection],
    );

    // Fetch related classrooms for this lecture
    const { data: lectureClassrooms } = useLiveQuery(
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
      [lecture.id, lectureClassroomCollection],
    );

    const subdivisionNames = lectureSubdivisions.map((s) => s.name).join(", ");
    const classroomNames = lectureClassrooms.map((c) => c.name).join(", ");

    return (
      <ListItem key={lecture.id} divider>
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
          primaryTypographyProps={{ variant: "h6" }}
        />
        <ListItemSecondaryAction>
          <IconButton
            edge="end"
            aria-label="edit"
            onClick={() => handleEdit(lecture)}
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
        </ListItemSecondaryAction>
      </ListItem>
    );
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Existing Lectures
        </Typography>

        {lectures.length > 0 ? (
          <List>
            {lectures.map((lecture) => (
              <LectureItem key={lecture.id} lecture={lecture} />
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
