import {
  Box,
  Checkbox,
  Chip,
  FormControlLabel,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import type { GenerationOptions } from "./types";

interface GenerationOptionsFormProps {
  options: GenerationOptions;
  onChange: (options: GenerationOptions) => void;
  disabled?: boolean;
}

export function GenerationOptionsForm({
  options,
  onChange,
  disabled = false,
}: GenerationOptionsFormProps) {
  const handleChange = (field: keyof GenerationOptions, value: any) => {
    onChange({ ...options, [field]: value });
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Generation Options
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <TextField
          type="number"
          label="Max Iterations"
          value={options.maxIterations}
          onChange={(e) =>
            handleChange("maxIterations", parseInt(e.target.value) || 10000)
          }
          disabled={disabled}
          sx={{ width: 200 }}
        />

        <TextField
          type="number"
          label="Timeout (minutes)"
          value={options.timeoutMinutes}
          onChange={(e) =>
            handleChange("timeoutMinutes", parseInt(e.target.value) || 10)
          }
          disabled={disabled}
          sx={{ width: 200 }}
        />
      </Box>

      <Box sx={{ mb: 1 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={options.prioritizeTeacherPreferences}
              onChange={(e) =>
                handleChange("prioritizeTeacherPreferences", e.target.checked)
              }
              disabled={disabled}
            />
          }
          label="Prioritize Teacher Preferences"
        />
      </Box>

      <Box sx={{ mb: 1 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={options.allowPartialSolutions}
              onChange={(e) =>
                handleChange("allowPartialSolutions", e.target.checked)
              }
              disabled={disabled}
            />
          }
          label="Allow Partial Solutions"
        />
      </Box>

      {/* NEW: Cognitive Load Options */}
      <Box sx={{ mb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={options.balanceCognitiveLoad}
                onChange={(e) =>
                  handleChange("balanceCognitiveLoad", e.target.checked)
                }
                disabled={disabled}
              />
            }
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <span>Balance Cognitive Load</span>
                <Chip label="NEW" size="small" color="primary" sx={{ ml: 1 }} />
              </Box>
            }
          />
          <Tooltip
            title="Ensures teachers have evenly distributed schedules, avoiding consecutive lectures and unbalanced workdays. Lower values create more balanced schedules but may be harder to satisfy."
            arrow
          >
            <IconButton size="small">
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {options.balanceCognitiveLoad && (
        <Box sx={{ ml: 4, mb: 2 }}>
          <TextField
            type="number"
            label="Max Cognitive Load (%)"
            value={options.maxCognitiveLoad}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 70;
              // Clamp between 0 and 100
              const clampedValue = Math.min(100, Math.max(0, value));
              handleChange("maxCognitiveLoad", clampedValue);
            }}
            disabled={disabled}
            inputProps={{
              min: 0,
              max: 100,
              step: 5,
            }}
            sx={{ width: 200 }}
            helperText="Lower = more balanced, harder to satisfy"
          />
        </Box>
      )}
    </Box>
  );
}
