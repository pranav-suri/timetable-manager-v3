import {
  Box,
  TextField,
  Typography,
  Tooltip,
  IconButton,
  Divider,
  Paper,
} from "@mui/material";
import { Info as InfoIcon } from "@mui/icons-material";

// Helper component for tooltips with technical + human-friendly explanations
interface ConfigTooltipProps {
  technical: string;
  humanSummary: string;
}

export function ConfigTooltip({ technical, humanSummary }: ConfigTooltipProps) {
  return (
    <Box sx={{ maxWidth: 350 }}>
      <Typography variant="body2" sx={{ mb: 1 }}>
        {technical}
      </Typography>
      <Divider sx={{ my: 1 }} />
      <Typography variant="body2" sx={{ fontStyle: "italic", opacity: 0.9 }}>
        <strong>In other words:</strong> {humanSummary}
      </Typography>
    </Box>
  );
}

// Reusable numeric input with tooltip
interface NumericConfigFieldProps {
  label: string;
  value: number | undefined;
  onChange: (value: number) => void;
  disabled?: boolean;
  technical: string;
  humanSummary: string;
  min?: number;
  max?: number;
  step?: number;
  flex?: string;
}

export function NumericConfigField({
  label,
  value,
  onChange,
  disabled = false,
  technical,
  humanSummary,
  min,
  max,
  step = 1,
  flex = "1 1 250px",
}: NumericConfigFieldProps) {
  return (
    <TextField
      sx={{ flex }}
      type="number"
      label={label}
      value={value ?? ""}
      onChange={(e) => {
        const val =
          step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value);
        if (!isNaN(val)) onChange(val);
      }}
      disabled={disabled}
      slotProps={{
        input: {
          endAdornment: (
            <Tooltip
              title={
                <ConfigTooltip
                  technical={technical}
                  humanSummary={humanSummary}
                />
              }
            >
              <IconButton size="small">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ),
        },
        htmlInput: { min, max, step },
      }}
    />
  );
}

// Section wrapper component
interface ConfigSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function ConfigSection({
  title,
  description,
  children,
}: ConfigSectionProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography
        variant="caption"
        color="textSecondary"
        sx={{ display: "block", mb: 2 }}
      >
        {description}
      </Typography>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>{children}</Box>
    </Paper>
  );
}
