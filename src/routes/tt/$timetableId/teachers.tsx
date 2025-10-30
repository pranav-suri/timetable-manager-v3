import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { nanoid } from "nanoid";
import { useLiveQuery } from "@tanstack/react-db";
import { useForm } from "@tanstack/react-form";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { useCollections } from "@/db-collections/providers/useCollections";

export const Route = createFileRoute("/tt/$timetableId/teachers")({
  component: RouteComponent,
});

function RouteComponent() {
  const { teacherCollection } = useCollections();
  const { timetableId } = Route.useParams();
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: teachers } = useLiveQuery(
    (q) => q.from({ teacherCollection }),
    [teacherCollection],
  );

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
    },
    onSubmit: ({ value }) => {
      const newTeacher = {
        id: nanoid(4),
        name: value.name,
        email: value.email,
        timetableId,
        dailyMaxHours: 8,
        weeklyMaxHours: 40,
      };
      teacherCollection.insert(newTeacher);
      form.reset();
    },
  });

  const handleEdit = (teacher: any) => {
    setEditingId(teacher.id);
    form.setFieldValue("name", teacher.name);
    form.setFieldValue("email", teacher.email);
  };

  const handleUpdate = () => {
    if (editingId) {
      teacherCollection.update(editingId, (draft) => {
        draft.name = form.state.values.name;
        draft.email = form.state.values.email;
      });
      setEditingId(null);
      form.reset();
    }
  };

  const handleDelete = (id: string) => {
    teacherCollection.delete(id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    form.reset();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Teachers Management
      </Typography>
      {/* Teacher Form */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            {editingId ? "Edit Teacher" : "Add New Teacher"}
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
              name="name"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Name is required" : undefined,
              }}
              children={(field) => (
                <TextField
                  fullWidth
                  label="Teacher Name"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  error={
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                  }
                  helperText={
                    field.state.meta.isTouched && field.state.meta.errors.length
                      ? field.state.meta.errors.join(", ")
                      : ""
                  }
                  placeholder="Enter teacher name"
                />
              )}
            />

            <form.Field
              name="email"
              validators={{
                onChange: ({ value }) => {
                  if (!value) return "Email is required";
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailRegex.test(value))
                    return "Please enter a valid email address";
                  return undefined;
                },
              }}
              children={(field) => (
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  error={
                    field.state.meta.isTouched &&
                    field.state.meta.errors.length > 0
                  }
                  helperText={
                    field.state.meta.isTouched && field.state.meta.errors.length
                      ? field.state.meta.errors.join(", ")
                      : ""
                  }
                  placeholder="Enter email address"
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
                        : "Add Teacher"}
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
      {/* Teachers List */}
      <TeacherList
        teachers={teachers}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
      />
    </Container>
  );
}

/* ---------------- Teacher List Component ---------------- */
function TeacherList({
  teachers,
  handleEdit,
  handleDelete,
}: {
  teachers: any[];
  handleEdit: (teacher: any) => void;
  handleDelete: (id: string) => void;
}) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Existing Teachers
        </Typography>

        {teachers.length > 0 ? (
          <List>
            {teachers.map((teacher) => (
              <ListItem
                key={teacher.id}
                divider
                secondaryAction={
                  <>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleEdit(teacher)}
                      sx={{ mr: 1 }}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDelete(teacher.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </>
                }
              >
                <ListItemText
                  primary={teacher.name}
                  secondary={teacher.email}
                  slotProps={{ primary: { variant: "h6" } }}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Alert severity="info" sx={{ mt: 2 }}>
            No teachers found. Add your first teacher above.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
