import {
  Box,
  FormControlLabel,
  MenuItem,
  Select,
  Switch,
  Typography,
} from "@mui/material";
import { ConfigSection, NumericConfigField } from "./ConfigSections";
import type { MultiThreadedGAConfig } from "@/server/services/timetableGenerator/types";

interface MultiThreadingParametersProps {
  enabled: boolean;
  config: MultiThreadedGAConfig;
  onEnabledChange: (enabled: boolean) => void;
  onChange: (
    field: keyof MultiThreadedGAConfig,
    value: number | string,
  ) => void;
  disabled?: boolean;
}

export function MultiThreadingParameters({
  enabled,
  config,
  onEnabledChange,
  onChange,
  disabled = false,
}: MultiThreadingParametersProps) {
  return (
    <ConfigSection
      title="Multi-Threading (Island Model)"
      description="Enable parallel processing using multiple CPU cores for faster generation"
    >
      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={enabled}
              onChange={(e) => onEnabledChange(e.target.checked)}
              disabled={disabled}
            />
          }
          label={
            <Box>
              <Typography variant="body2">Enable Multi-Threading</Typography>
              <Typography variant="caption" color="textSecondary">
                Uses island model to run evolution on multiple CPU cores in
                parallel. Can significantly speed up generation (2-4x faster on
                multi-core systems).
              </Typography>
            </Box>
          }
        />
      </Box>

      {enabled && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <NumericConfigField
              label="Number of Islands"
              value={config.numIslands ?? 0}
              onChange={(val) => onChange("numIslands", val)}
              disabled={disabled}
              technical="Number of parallel worker threads (islands) to run. Each island evolves independently and periodically exchanges solutions. Defaults to CPU count - 1."
              humanSummary="How many parallel populations to run. More islands = better diversity but diminishing returns. Leave at 0 for auto-detection."
              min={0}
              max={32}
            />

            <NumericConfigField
              label="Migration Interval"
              value={config.migrationInterval ?? 50}
              onChange={(val) => onChange("migrationInterval", val)}
              disabled={disabled}
              technical="Number of generations between migration events where best individuals are shared between islands."
              humanSummary="How often islands exchange their best solutions. More frequent = better information sharing but more overhead."
              min={1}
              max={500}
            />

            <NumericConfigField
              label="Migration Size"
              value={config.migrationSize ?? 2}
              onChange={(val) => onChange("migrationSize", val)}
              disabled={disabled}
              technical="Number of individuals to exchange between islands during each migration event."
              humanSummary="How many solutions are shared between islands. More = faster convergence but less diversity."
              min={1}
              max={10}
            />
          </Box>

          <Typography
            variant="caption"
            color="textSecondary"
            sx={{ display: "block" }}
          >
            0 = Auto-detect (CPU cores - 1)
          </Typography>

          <Box>
            <Typography variant="body2" gutterBottom>
              Migration Strategy
            </Typography>
            <Select
              fullWidth
              value={config.migrationStrategy ?? "best"}
              onChange={(e) => onChange("migrationStrategy", e.target.value)}
              disabled={disabled}
            >
              <MenuItem value="best">
                <Box>
                  <Typography variant="body2">Best (Recommended)</Typography>
                  <Typography variant="caption" color="textSecondary">
                    Migrate the best solutions from each island
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="random">
                <Box>
                  <Typography variant="body2">Random</Typography>
                  <Typography variant="caption" color="textSecondary">
                    Migrate random solutions to maintain diversity
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="diverse">
                <Box>
                  <Typography variant="body2">Diverse</Typography>
                  <Typography variant="caption" color="textSecondary">
                    Migrate solutions with high genetic diversity
                  </Typography>
                </Box>
              </MenuItem>
            </Select>
            <Typography
              variant="caption"
              color="textSecondary"
              sx={{ mt: 0.5, display: "block" }}
            >
              How to select solutions for migration between islands. "Best"
              usually provides the fastest convergence.
            </Typography>
          </Box>
        </Box>
      )}
    </ConfigSection>
  );
}
