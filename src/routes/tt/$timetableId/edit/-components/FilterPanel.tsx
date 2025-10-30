import { useLiveQuery } from "@tanstack/react-db";
import { useCollections } from "@/db-collections/providers/useCollections";
import { useLectureSlotFiltersStore } from "@/zustand/lectureSlotFiltersStore";
import {
  Paper,
  Typography,
  Button,
  Box,
  FormControlLabel,
  Checkbox,
  Stack,
  Divider,
  Alert,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";

interface FilterPanelProps {
  /** Optional: CSS class for styling */
  className?: string;
}

export function FilterPanel({ className }: FilterPanelProps) {
  // Get collections for rendering options
  const {
    teacherCollection,
    subjectCollection,
    subdivisionCollection,
    classroomCollection,
  } = useCollections();

  // Get current filter values and actions from store
  const {
    teacherIds,
    subjectIds,
    subdivisionIds,
    classroomIds,
    toggleTeacherId,
    toggleSubjectId,
    toggleSubdivisionId,
    toggleClassroomId,
    clearAllFilters,
    hasActiveFilters,
  } = useLectureSlotFiltersStore();

  // Fetch all teachers
  const { data: allTeachers } = useLiveQuery(
    (q) => q.from({ teacher: teacherCollection }),
    [teacherCollection],
  );

  // Fetch all subjects
  const { data: allSubjects } = useLiveQuery(
    (q) =>
      q.from({ subject: subjectCollection }).select(({ subject }) => ({
        id: subject.id,
        name: subject.name,
      })),
    [subjectCollection],
  );

  // Fetch all subdivisions
  const { data: allSubdivisions } = useLiveQuery(
    (q) =>
      q
        .from({ subdivision: subdivisionCollection })
        .select(({ subdivision }) => ({
          id: subdivision.id,
          name: subdivision.name,
        })),
    [subdivisionCollection],
  );

  // Fetch all classrooms
  const { data: allClassrooms } = useLiveQuery(
    (q) =>
      q.from({ classroom: classroomCollection }).select(({ classroom }) => ({
        id: classroom.id,
        name: classroom.name,
      })),
    [classroomCollection],
  );

  return (
    <Paper
      className={className}
      sx={{
        p: 2,
        height: "100%",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Filters
        </Typography>
        {hasActiveFilters() && (
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<ClearIcon />}
            onClick={() => clearAllFilters()}
          >
            Clear
          </Button>
        )}
      </Box>

      <Stack spacing={2} sx={{ flex: 1 }}>
        {/* Teacher Filter */}
        {allTeachers.length > 0 && (
          <>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Teachers ({teacherIds.length})
              </Typography>
              <Stack spacing={0.5}>
                {allTeachers.map((teacher) => (
                  <FormControlLabel
                    key={teacher.id}
                    control={
                      <Checkbox
                        size="small"
                        checked={teacherIds.includes(teacher.id)}
                        onChange={() => toggleTeacherId(teacher.id)}
                      />
                    }
                    label={
                      <Typography variant="body2">{teacher.name}</Typography>
                    }
                  />
                ))}
              </Stack>
            </Box>
            <Divider />
          </>
        )}

        {/* Subject Filter */}
        {allSubjects.length > 0 && (
          <>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Subjects ({subjectIds.length})
              </Typography>
              <Stack spacing={0.5}>
                {allSubjects.map((subject) => (
                  <FormControlLabel
                    key={subject.id}
                    control={
                      <Checkbox
                        size="small"
                        checked={subjectIds.includes(subject.id)}
                        onChange={() => toggleSubjectId(subject.id)}
                      />
                    }
                    label={
                      <Typography variant="body2">{subject.name}</Typography>
                    }
                  />
                ))}
              </Stack>
            </Box>
            <Divider />
          </>
        )}

        {/* Subdivision Filter */}
        {allSubdivisions.length > 0 && (
          <>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Subdivisions ({subdivisionIds.length})
              </Typography>
              <Stack spacing={0.5}>
                {allSubdivisions.map((subdivision) => (
                  <FormControlLabel
                    key={subdivision.id}
                    control={
                      <Checkbox
                        size="small"
                        checked={subdivisionIds.includes(subdivision.id)}
                        onChange={() => toggleSubdivisionId(subdivision.id)}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        {subdivision.name}
                      </Typography>
                    }
                  />
                ))}
              </Stack>
            </Box>
            <Divider />
          </>
        )}

        {/* Classroom Filter */}
        {allClassrooms.length > 0 && (
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Classrooms ({classroomIds.length})
            </Typography>
            <Stack spacing={0.5}>
              {allClassrooms.map((classroom) => (
                <FormControlLabel
                  key={classroom.id}
                  control={
                    <Checkbox
                      size="small"
                      checked={classroomIds.includes(classroom.id)}
                      onChange={() => toggleClassroomId(classroom.id)}
                    />
                  }
                  label={
                    <Typography variant="body2">{classroom.name}</Typography>
                  }
                />
              ))}
            </Stack>
          </Box>
        )}
      </Stack>

      {/* Filter Summary */}
      {hasActiveFilters() && (
        <Box
          sx={{ mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider" }}
        >
          <Alert severity="info" sx={{ py: 1 }}>
            <Typography variant="caption">
              <strong>Filters Active:</strong>
              {teacherIds.length > 0 && ` Teachers (${teacherIds.length})`}
              {teacherIds.length > 0 &&
                (subjectIds.length > 0 ||
                  subdivisionIds.length > 0 ||
                  classroomIds.length > 0) &&
                " •"}
              {subjectIds.length > 0 && ` Subjects (${subjectIds.length})`}
              {subjectIds.length > 0 &&
                (subdivisionIds.length > 0 || classroomIds.length > 0) &&
                " •"}
              {subdivisionIds.length > 0 &&
                ` Subdivisions (${subdivisionIds.length})`}
              {subdivisionIds.length > 0 && classroomIds.length > 0 && " •"}
              {classroomIds.length > 0 &&
                ` Classrooms (${classroomIds.length})`}
            </Typography>
          </Alert>
        </Box>
      )}
    </Paper>
  );
}
