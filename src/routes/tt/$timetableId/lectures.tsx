import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { nanoid } from "nanoid";
import { useLiveQuery } from "@tanstack/react-db";
import { useForm } from "@tanstack/react-form";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Container,
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

  return {
    form,
    handleEdit,
    handleUpdate,
    handleDelete,
    cancelEdit,
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
                <Autocomplete
                  options={teachers}
                  getOptionLabel={(option) =>
                    typeof option === "string"
                      ? option
                      : `${option.name} (${option.email})`
                  }
                  value={
                    teachers.find((t) => t.id === field.state.value) || null
                  }
                  onChange={(_, newValue) => {
                    field.handleChange(newValue?.id || "");
                  }}
                  onBlur={field.handleBlur}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Teacher"
                      error={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0
                      }
                      helperText={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length
                          ? field.state.meta.errors.join(", ")
                          : ""
                      }
                    />
                  )}
                  fullWidth
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                />
              )}
            />

            <form.Field
              name="subjectId"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Subject is required" : undefined,
              }}
              children={(field) => (
                <Autocomplete
                  options={subjects}
                  getOptionLabel={(option) =>
                    typeof option === "string" ? option : option.name
                  }
                  value={
                    subjects.find((s) => s.id === field.state.value) || null
                  }
                  onChange={(_, newValue) => {
                    field.handleChange(newValue?.id || "");
                  }}
                  onBlur={field.handleBlur}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Subject"
                      error={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0
                      }
                      helperText={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length
                          ? field.state.meta.errors.join(", ")
                          : ""
                      }
                    />
                  )}
                  fullWidth
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                />
              )}
            />

            {/* Subdivisions Selection */}
            <form.Field name="subdivisionIds">
              {(field) => (
                <Autocomplete
                  multiple
                  options={subdivisions}
                  getOptionLabel={(option) =>
                    typeof option === "string" ? option : option.name
                  }
                  value={subdivisions.filter((s) =>
                    field.state.value.includes(s.id),
                  )}
                  onChange={(_, newValue) => {
                    field.handleChange(newValue.map((v) => v.id));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Subdivisions" />
                  )}
                  fullWidth
                  isOptionEqualToValue={(option, value) =>
                    option.id === (value as any)?.id
                  }
                />
              )}
            </form.Field>

            {/* Classrooms Selection */}
            <form.Field name="classroomIds">
              {(field) => (
                <Autocomplete
                  multiple
                  options={classrooms}
                  getOptionLabel={(option) =>
                    typeof option === "string" ? option : option.name
                  }
                  value={classrooms.filter((c) =>
                    form.state.values.classroomIds.includes(c.id),
                  )}
                  onChange={(_, newValue) => {
                    field.handleChange(newValue.map((v) => v.id));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Classrooms" />
                  )}
                  fullWidth
                  isOptionEqualToValue={(option, value) =>
                    option.id === (value as any)?.id
                  }
                />
              )}
            </form.Field>

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
