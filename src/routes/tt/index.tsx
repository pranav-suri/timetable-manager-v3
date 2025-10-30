import { useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import type { Timetable } from "generated/prisma/client";
import { useTRPC, useTRPCClient } from "@/integrations/trpc";
import { getTimetableCollection } from "@/db-collections/timetableCollection";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuthStore } from "@/zustand/authStore";

export const Route = createFileRoute("/tt/")({
  component: () => (
    <RequireAuth>
      <RouteComponent />
    </RequireAuth>
  ),
  ssr: false,
});

function RouteComponent() {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [collectionsInitialized, setCollectionsInitialized] = useState(false);
  const timetableCollection = getTimetableCollection({
    queryClient,
    trpcClient,
    trpc,
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      timetableCollection.preload();
      await timetableCollection.stateWhenReady();
      setCollectionsInitialized(true);
    }
    init();
  }, [timetableCollection]);

  const { data: timetables } = useLiveQuery(
    (q) => q.from({ timetableCollection }),
    // NOTE:
    // Specifying the hook breaks the code and does not render the timetables.
    // collectionsInitialized is necessary to ensure the query is recomputed once the collections are ready.
    // DO NOT SPECIFY THE HOOK BELOW
    // eslint-disable-next-line
    [collectionsInitialized, timetableCollection],
  );

  const form = useForm({
    defaultValues: { name: "" },
    onSubmit: ({ value }) => {
      if (!user?.organizationId) {
        console.error("No organization ID found");
        return;
      }

      const newTimetable = {
        id: nanoid(4),
        name: value.name,
        organizationId: user.organizationId,
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

  if (!collectionsInitialized) return "LOADING ----->";

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
                <Link
                  to={"/tt/$timetableId/edit"}
                  params={{ timetableId: timetable.id }}
                >
                  <ListItemText
                    primary={timetable.name}
                    primaryTypographyProps={{ variant: "h6" }}
                  />
                </Link>
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
