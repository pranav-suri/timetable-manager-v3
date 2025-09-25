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
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { useCollections } from "@/db-collections/providers/useCollections";

export const Route = createFileRoute("/tt/$timetableId/_layout/subjects")({
  component: RouteComponent,
});

function RouteComponent() {
  const { subjectCollection, groupCollection } = useCollections();
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: subjects } = useLiveQuery(
    (q) => q.from({ subjectCollection }),
    [subjectCollection],
  );

  const { data: groups } = useLiveQuery(
    (q) => q.from({ groupCollection }),
    [groupCollection],
  );

  const form = useForm({
    defaultValues: {
      name: "",
      groupId: "",
    },
    onSubmit: ({ value }) => {
      const newSubject = {
        id: nanoid(4),
        name: value.name,
        groupId: value.groupId,
      };
      subjectCollection.insert(newSubject);
      form.reset();
    },
  });

  const handleEdit = (subject: any) => {
    setEditingId(subject.id);
    form.setFieldValue("name", subject.name);
    form.setFieldValue("groupId", subject.groupId);
  };

  const handleUpdate = () => {
    if (editingId) {
      subjectCollection.update(editingId, (draft) => {
        draft.name = form.state.values.name;
        draft.groupId = form.state.values.groupId;
      });
      setEditingId(null);
      form.reset();
    }
  };

  const handleDelete = (id: string) => {
    subjectCollection.delete(id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    form.reset();
  };

  // Group subjects by their parent group
  const groupedSubjects = subjects.reduce(
    (acc, subject) => {
      const groupId = subject.groupId;
      if (!acc[groupId]) {
        acc[groupId] = [];
      }
      acc[groupId].push(subject);
      return acc;
    },
    {} as Record<string, typeof subjects>,
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Subjects Management
      </Typography>

      {/* Subject Form */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            {editingId ? "Edit Subject" : "Add New Subject"}
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
                  label="Subject Name"
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
                  placeholder="Enter subject name"
                />
              )}
            />

            <form.Field
              name="groupId"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Group is required" : undefined,
              }}
              children={(field) => (
                <FormControl fullWidth>
                  <InputLabel>Group</InputLabel>
                  <Select
                    value={field.state.value}
                    label="Group"
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    error={
                      field.state.meta.isTouched &&
                      field.state.meta.errors.length > 0
                    }
                  >
                    {groups.map((group) => (
                      <MenuItem key={group.id} value={group.id}>
                        {group.name}
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
                        : "Add Subject"}
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

      {/* Subjects List */}
      <SubjectList
        groupedSubjects={groupedSubjects}
        groups={groups}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
      />
    </Container>
  );
}

/* ---------------- Subject List Component ---------------- */
function SubjectList({
  groupedSubjects,
  groups,
  handleEdit,
  handleDelete,
}: {
  groupedSubjects: Record<string, any[]>;
  groups: any[];
  handleEdit: (subject: any) => void;
  handleDelete: (id: string) => void;
}) {
  const getGroupName = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    return group ? group.name : "Unknown Group";
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Existing Subjects
        </Typography>

        {Object.keys(groupedSubjects).length > 0 ? (
          <Box>
            {Object.entries(groupedSubjects).map(([groupId, subjects]) => (
              <Box key={groupId} sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, color: "primary.main" }}>
                  {getGroupName(groupId)}
                </Typography>
                <List>
                  {subjects.map((subject) => (
                    <ListItem key={subject.id} divider>
                      <ListItemText
                        primary={subject.name}
                        primaryTypographyProps={{ variant: "h6" }}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="edit"
                          onClick={() => handleEdit(subject)}
                          sx={{ mr: 1 }}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDelete(subject.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            ))}
          </Box>
        ) : (
          <Alert severity="info" sx={{ mt: 2 }}>
            No subjects found. Add your first subject above.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
