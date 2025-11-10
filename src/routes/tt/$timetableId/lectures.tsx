import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { nanoid } from "nanoid";
import { eq, useLiveQuery } from "@tanstack/react-db";
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
import ListIcon from "@mui/icons-material/List";
import GridOnIcon from "@mui/icons-material/GridOn";
import { useCollections } from "@/db-collections/providers/useCollections";
import {
  InsertLectureParams,
  UpdateLectureParams,
  useLectureInsert,
  useLectureUpdate,
} from "@/db-collections/transactions";
import type { Lecture, Classroom, Subdivision } from "generated/prisma/client";
import type { LectureColumnConfig } from "./-BatchEditGridLectures";
import { LectureList } from "./-lecturesComponents";
import { BatchEditGrid } from "./-BatchEditGridLectures";

type Collections = ReturnType<typeof useCollections>;

export const Route = createFileRoute("/tt/$timetableId/lectures")({
  component: RouteComponent,
});

function useCollectionQueries(collections: Collections) {
  const {
    teacherCollection,
    subjectCollection,
    subdivisionCollection,
    classroomCollection,
  } = collections;

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

function useLectureHandlers(collections: Collections) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const { timetableId } = Route.useParams();
  const insertLecture = useLectureInsert();
  const updateLecture = useLectureUpdate();
  const {
    lectureCollection,
    lectureSubdivisionCollection,
    lectureClassroomCollection,
  } = collections;

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
    insertLecture,
    updateLecture,
  };
}

function RouteComponent() {
  const collections = useCollections();
  const { classrooms, subdivisions, subjects, teachers } =
    useCollectionQueries(collections);
  const {
    form,
    handleEdit,
    handleUpdate,
    handleDelete,
    cancelEdit,
    editingId,
    insertLecture,
    updateLecture,
  } = useLectureHandlers(collections);
  const { timetableId } = Route.useParams();
  const { lectureCollection, subdivisionGroupTempCollection } = collections;
  const [batchEditMode, setBatchEditMode] = useState(false);
  const { data: lectures } = useLiveQuery(
    (q) => q.from({ lectureCollection }),
    [lectureCollection],
  );

  // Fetch lecture relationships for batch edit grid
  const { data: lectureClassroomsData } = useLiveQuery(
    (q) =>
      q
        .from({ lectureClassroom: collections.lectureClassroomCollection })
        .innerJoin(
          { classroom: collections.classroomCollection },
          ({ lectureClassroom, classroom }) =>
            eq(lectureClassroom.classroomId, classroom.id),
        )
        .select(({ lectureClassroom, classroom }) => ({
          lectureId: lectureClassroom.lectureId,
          classroomId: lectureClassroom.classroomId,
          classroomName: classroom.name,
        })),
    [collections.lectureClassroomCollection, collections.classroomCollection],
  );

  const { data: lectureSubdivisionsData } = useLiveQuery(
    (q) =>
      q
        .from({ lectureSubdivision: collections.lectureSubdivisionCollection })
        .innerJoin(
          { subdivision: collections.subdivisionCollection },
          ({ lectureSubdivision, subdivision }) =>
            eq(lectureSubdivision.subdivisionId, subdivision.id),
        )
        .select(({ lectureSubdivision, subdivision }) => ({
          lectureId: lectureSubdivision.lectureId,
          subdivisionId: lectureSubdivision.subdivisionId,
          subdivisionName: subdivision.name,
        })),
    [collections.lectureSubdivisionCollection, collections.subdivisionCollection],
  );
  const { data: subdivisionGroupsComplete } = useLiveQuery(
    (q) => q.from({ subdivisionGroupTempCollection }),
    [subdivisionGroupTempCollection],
  );

  // Create map from group names to subdivision IDs
  const groupNameToSubdivisionIds: Record<string, string[]> = {};
  subdivisionGroupsComplete.forEach((sg) => {
    groupNameToSubdivisionIds[sg.name] ??= [];
    if (!groupNameToSubdivisionIds[sg.name]!.includes(sg.subdivisionId)) {
      groupNameToSubdivisionIds[sg.name]!.push(sg.subdivisionId);
    }
  });

  // Get unique group names for the dropdown
  const groupNames = Object.keys(groupNameToSubdivisionIds).sort();

  const teacherOptions = teachers.map((teacher) => ({
    label: teacher.name,
    value: teacher.id,
  }));

  const subjectOptions = subjects.map((subject) => ({
    label: subject.name,
    value: subject.id,
  }));

  const classroomOptions = classrooms.map((classroom) => ({
    label: classroom.name,
    value: classroom.id,
  }));

  const subdivisionOptions = subdivisions.map((subdivision) => ({
    label: subdivision.name,
    value: subdivision.id,
  }));

  const lectureColumns = [
    {
      data: "subjectId",
      type: "dropdown",
      header: "Subject",
      options: subjectOptions,
      required: true,
    },
    {
      data: "teacherId",
      type: "dropdown",
      header: "Teacher",
      options: teacherOptions,
      required: true,
    },
    {
      data: "count",
      type: "numeric",
      header: "Count",
      required: true,
      validate: (value: any) =>
        typeof value === "number" && value >= 1
          ? undefined
          : "Count must be at least 1.",
    },
    {
      data: "duration",
      type: "numeric",
      header: "Duration (slots)",
      required: true,
      validate: (value: any) =>
        typeof value === "number" && value >= 1
          ? undefined
          : "Duration must be at least 1 slot.",
    },
    {
      data: "classroomName",
      type: "dropdown",
      header: "Classroom",
      options: classroomOptions,
    },
    {
      data: "subdivisionName",
      type: "dropdown",
      header: "Subdivision",
      options: subdivisionOptions,
    },
  ] satisfies LectureColumnConfig[];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h3" component="h1">
          Lectures Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={batchEditMode ? <ListIcon /> : <GridOnIcon />}
          onClick={() => setBatchEditMode((prev) => !prev)}
        >
          {batchEditMode ? "Individual Edit" : "Batch Edit"}
        </Button>
      </Box>

      {batchEditMode ? (
        <BatchEditGrid
          columns={lectureColumns}
          data={lectures}
          dataSchema={() => ({
            id: nanoid(4),
            teacherId: "",
            subjectId: "",
            count: 1,
            duration: 1,
            timetableId,
            createdAt: new Date(),
          })}
          collection={lectureCollection}
          lectureClassrooms={lectureClassroomsData}
          lectureSubdivisions={lectureSubdivisionsData}
          onInsertLecture={insertLecture}
          onUpdateLecture={updateLecture}
        />
      ) : (
        <>
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
                        option.id === value.id
                      }
                    />
                  )}
                </form.Field>

                {/* Subdivision Groups Selection */}
                <Autocomplete
                  multiple
                  options={groupNames}
                  value={[]}
                  onChange={(_, selectedGroups) => {
                    // Get current subdivision IDs
                    const currentSubdivisionIds =
                      form.state.values.subdivisionIds;

                    // Get subdivision IDs from selected groups
                    const newSubdivisionIds = selectedGroups.flatMap(
                      (groupName) => groupNameToSubdivisionIds[groupName] || [],
                    );

                    // Combine and deduplicate
                    const combinedSubdivisionIds = [
                      ...new Set([
                        ...currentSubdivisionIds,
                        ...newSubdivisionIds,
                      ]),
                    ];

                    // Update the form field
                    form.setFieldValue(
                      "subdivisionIds",
                      combinedSubdivisionIds,
                    );
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Add Subdivision Groups" />
                  )}
                  fullWidth
                />

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
                        option.id === value.id
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
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length
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
                      value < 1
                        ? "Duration must be at least 1 slot"
                        : undefined,
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
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length
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
        </>
      )}
    </Container>
  );
}
