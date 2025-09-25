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
import type { Subdivision } from "generated/prisma/client";
import { useCollections } from "@/db-collections/providers/useCollections";

export const Route = createFileRoute("/tt/$timetableId/_layout/subdivisions")({
  component: RouteComponent,
});

function RouteComponent() {
  const { subdivisionCollection } = useCollections();
  const { timetableId } = Route.useParams();
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: subdivisions } = useLiveQuery(
    (q) => q.from({ subdivisionCollection }),
    [subdivisionCollection],
  );

  const form = useForm({
    defaultValues: { name: "" },
    onSubmit: ({ value }) => {
      const newSubdivision = {
        id: nanoid(4),
        name: value.name,
        timetableId,
      };
      subdivisionCollection.insert(newSubdivision);
      form.reset();
    },
  });

  const handleEdit = (subdivision: Subdivision) => {
    setEditingId(subdivision.id);
    form.setFieldValue("name", subdivision.name);
  };

  const handleUpdate = () => {
    if (editingId) {
      subdivisionCollection.update(editingId, (draft) => {
        draft.name = form.state.values.name;
      });
      setEditingId(null);
      form.reset();
    }
  };

  const handleDelete = (id: string) => {
    subdivisionCollection.delete(id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    form.reset();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Subdivisions Management
      </Typography>
      {/* Subdivision Form Start ----------- */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" component="h2" gutterBottom>
            {editingId ? "Edit Subdivision" : "Add New Subdivision"}
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
                  label="Subdivision Name"
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
                  placeholder="Enter subdivision name"
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
                        : "Add Subdivision"}
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
      {/* ----------- Subdivision Form End  */}
      <SubdivisionList
        subdivisions={subdivisions}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
      />
    </Container>
  );
}

/* ---------------- Subdivision List Component ---------------- */
function SubdivisionList({
  subdivisions,
  handleEdit,
  handleDelete,
}: {
  subdivisions: Subdivision[];
  handleEdit: (subdivision: Subdivision) => void;
  handleDelete: (id: string) => void;
}) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Existing Subdivisions
        </Typography>

        {subdivisions.length > 0 ? (
          <List>
            {subdivisions.map((subdivision) => (
              <ListItem key={subdivision.id} divider>
                <ListItemText
                  primary={subdivision.name}
                  primaryTypographyProps={{ variant: "h6" }}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => handleEdit(subdivision)}
                    sx={{ mr: 1 }}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDelete(subdivision.id)}
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
            No subdivisions found. Add your first subdivision above.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
