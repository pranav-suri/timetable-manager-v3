import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { nanoid } from "nanoid";
import { useLiveQuery } from "@tanstack/react-db";
import { useForm } from "@tanstack/react-form";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { LectureList } from "./-lecturesComponents";
import type { Classroom, Lecture, Subdivision } from "generated/prisma/client";
import type {
  InsertLectureParams,
  UpdateLectureParams,
} from "@/db-collections/transactions";
import { useCollections } from "@/db-collections/providers/useCollections";
import {
  useLectureInsert,
  useLectureUpdate,
} from "@/db-collections/transactions";

export const Route = createFileRoute("/tt/$timetableId/lectures")({
  component: RouteComponent,
});

function useCollectionQueries() {
  const {
    teacherCollection,
    subjectCollection,
    subdivisionCollection,
    classroomCollection,
  } = useCollections();

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

  return { teachers, subjects, subdivisions, classrooms };
}

function useLectureHandlers() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const { timetableId } = Route.useParams();
  const insertLecture = useLectureInsert();
  const updateLecture = useLectureUpdate();
  const {
    lectureCollection,
    subdivisionCollection,
    classroomCollection,
    lectureSubdivisionCollection,
    lectureClassroomCollection,
  } = useCollections();

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
        classroomIds: value.classroomIds,
        subdivisionIds: value.subdivisionIds,
      } satisfies InsertLectureParams;
      insertLecture(newLecture);
      form.reset();
    },
  });

  const handleEdit = (input: {
    lecture: Lecture;
    classroomsOfLecture: Classroom[];
    subdivisionsOfLecture: Subdivision[];
  }) => {
    const { lecture, classroomsOfLecture, subdivisionsOfLecture } = input;
    setEditingId(lecture.id);
    form.setFieldValue("teacherId", lecture.teacherId);
    form.setFieldValue("subjectId", lecture.subjectId);
    form.setFieldValue("count", lecture.count);
    form.setFieldValue("duration", lecture.duration);
    // Note: For editing, we'd need to fetch the related subdivisions and classrooms
    // For now, we'll just reset them to empty arrays
    form.setFieldValue(
      "subdivisionIds",
      subdivisionsOfLecture.map((ls) => ls.id),
    );
    form.setFieldValue(
      "classroomIds",
      classroomsOfLecture.map((lc) => lc.id),
    );
  };

  const handleUpdate = () => {
    if (editingId) {
      const updatedLecture = {
        id: editingId,
        teacherId: form.state.values.teacherId,
        subjectId: form.state.values.subjectId,
        count: form.state.values.count,
        duration: form.state.values.duration,
        classroomIds: form.state.values.classroomIds,
        subdivisionIds: form.state.values.subdivisionIds,
      } satisfies UpdateLectureParams;
      updateLecture(updatedLecture);
      setEditingId(null);
      form.reset();
    }
  };

  const handleDelete = async (id: string) => {
    await lectureCollection.delete(id).isPersisted.promise;
    lectureSubdivisionCollection.utils.refetch();
    lectureClassroomCollection.utils.refetch();
  };

  const cancelEdit = () => {
    setEditingId(null);
    form.reset();
  };

  const getSubdivisionName = (subdivisionId: string) => {
    const subdivision = subdivisionCollection.get(subdivisionId);
    return subdivision ? subdivision.name : "Unknown Subdivision";
  };

  const getClassroomName = (classroomId: string) => {
    const classroom = classroomCollection.get(classroomId);
    return classroom ? classroom.name : "Unknown Classroom";
  };

  return {
    form,
    handleEdit,
    handleUpdate,
    handleDelete,
    cancelEdit,
    getSubdivisionName,
    getClassroomName,
    editingId,
  };
}

function RouteComponent() {
  const { classrooms, subdivisions, subjects, teachers } =
    useCollectionQueries();
  const {
    form,
    handleEdit,
    handleUpdate,
    handleDelete,
    cancelEdit,
    getSubdivisionName,
    getClassroomName,
    editingId,
  } = useLectureHandlers();

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
            <form.Field name="subdivisionIds">
              {(field) => (
                <FormControl fullWidth>
                  <InputLabel>Subdivisions</InputLabel>
                  <Select
                    multiple
                    value={field.state.value}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.handleChange(
                        typeof value === "string" ? value.split(",") : value,
                      );
                    }}
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
                          checked={field.state.value.includes(subdivision.id)}
                        />
                        {subdivision.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </form.Field>

            {/* Classrooms Selection */}
            <form.Field name="classroomIds">
              {(field) => (
                <FormControl fullWidth>
                  <InputLabel>Classrooms</InputLabel>
                  <Select
                    multiple
                    value={form.state.values.classroomIds}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.handleChange(
                        typeof value === "string" ? value.split(",") : value,
                      );
                    }}
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
                            form.state.values.classroomIds.indexOf(
                              classroom.id,
                            ) > -1
                          }
                        />
                        {classroom.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </form.Field>

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
      <LectureList handleEdit={handleEdit} handleDelete={handleDelete} />
    </Container>
  );
}
