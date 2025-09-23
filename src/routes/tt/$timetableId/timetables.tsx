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
  ListItemSecondaryAction,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import type { Timetable } from "generated/prisma/client";
import { useCollections } from "@/db-collections/providers/useCollections";

export const Route = createFileRoute("/tt/$timetableId/timetables")({
  component: RouteComponent,
});

function RouteComponent() {
  const { timetableCollection } = useCollections();
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: timetables } = useLiveQuery((q) =>
    q.from({ timetableCollection }),
  );

  const form = useForm({
    defaultValues: { name: "" },
    onSubmit: ({ value }) => {
      const newTimetable = {
        id: nanoid(4),
        name: value.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      } satisfies Timetable;

      timetableCollection.insert(newTimetable);
      form.reset();
    },
  });

  const handleEdit = (timetable: Timetable) => {
    setEditingId(timetable.id);
    form.setFieldValue("name", timetable.name);
  };

  const handleUpdate = () => {
    if (editingId) {
      timetableCollection.update(editingId, (draft) => {
        draft.name = form.state.values.name;
      });
      setEditingId(null);
      form.reset();
    }
  };

  const handleDelete = (id: string) => {
    timetableCollection.delete(id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    form.reset();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Timetables Management
      </Typography>
      {/* Timetable Form Start ----------- */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            {editingId ? "Edit Timetable" : "Add New Timetable"}
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
                  label="Timetable Name"
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
                  placeholder="Enter timetable name"
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
                        : "Add Timetable"}
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
      {/* ----------- Timetable Form End  */}
      <TimetableList
        timetables={timetables}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
      />
    </Container>
  );
}

/* ---------------- Timetable List Component ---------------- */
function TimetableList({
  timetables,
  handleEdit,
  handleDelete,
}: {
  timetables: Timetable[];
  handleEdit: (timetable: Timetable) => void;
  handleDelete: (id: string) => void;
}) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Existing Timetables
        </Typography>

        {timetables.length > 0 ? (
          <List>
            {timetables.map((timetable) => (
              <ListItem key={timetable.id} divider>
                <ListItemText
                  primary={timetable.name}
                  primaryTypographyProps={{ variant: "h6" }}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => handleEdit(timetable)}
                    sx={{ mr: 1 }}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDelete(timetable.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          <Alert severity="info" sx={{ mt: 2 }}>
            No timetables found. Add your first timetable above.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
