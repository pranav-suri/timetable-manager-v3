import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  PlayArrow as PlayArrowIcon,
} from "@mui/icons-material";
import type { PartialGAConfig } from "@/server/services/timetableGenerator/types";
import {
  DEFAULT_GA_CONFIG,
  FAST_PRESET,
  BALANCED_PRESET,
  THOROUGH_PRESET,
} from "@/server/services/timetableGenerator/config";

interface GenerationControlsProps {
  config: PartialGAConfig;
  onConfigChange: (config: PartialGAConfig) => void;
  onStartGeneration: () => void;
  isStarting: boolean;
  disabled?: boolean;
}

type PresetType = "fast" | "balanced" | "thorough" | "custom";

export function GenerationControls({
  config,
  onConfigChange,
  onStartGeneration,
  isStarting,
  disabled = false,
}: GenerationControlsProps) {
  const [preset, setPreset] = useState<PresetType>("balanced");
  const [advancedExpanded, setAdvancedExpanded] = useState(false);

  const handlePresetChange = (newPreset: PresetType) => {
    setPreset(newPreset);
    switch (newPreset) {
      case "fast":
        onConfigChange(FAST_PRESET);
        break;
      case "balanced":
        onConfigChange(BALANCED_PRESET);
        break;
      case "thorough":
        onConfigChange(THOROUGH_PRESET);
        break;
      case "custom":
        // Keep current config
        break;
    }
  };

  const handleConfigFieldChange = (
    field: keyof PartialGAConfig,
    value: number | boolean,
  ) => {
    setPreset("custom");
    onConfigChange({
      ...config,
      [field]: value,
    });
  };

  const handleConstraintWeightChange = (field: string, value: number) => {
    setPreset("custom");
    onConfigChange({
      ...config,
      constraintWeights: {
        ...config.constraintWeights,
        [field]: value,
      },
    });
  };

  // Get effective config (merge with defaults)
  const effectiveConfig = {
    ...DEFAULT_GA_CONFIG,
    ...config,
    constraintWeights: {
      ...DEFAULT_GA_CONFIG.constraintWeights,
      ...config.constraintWeights,
    },
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Generation Configuration
      </Typography>

      {/* Preset Selector */}
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Preset Mode</InputLabel>
          <Select
            value={preset}
            label="Preset Mode"
            onChange={(e) => handlePresetChange(e.target.value as PresetType)}
            disabled={disabled}
          >
            <MenuItem value="fast">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <span>Fast</span>
                <Chip label="~1 min" size="small" />
              </Box>
            </MenuItem>
            <MenuItem value="balanced">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <span>Balanced (Recommended)</span>
                <Chip label="~5 min" size="small" color="primary" />
              </Box>
            </MenuItem>
            <MenuItem value="thorough">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <span>Thorough</span>
                <Chip label="~10 min" size="small" />
              </Box>
            </MenuItem>
            <MenuItem value="custom">Custom</MenuItem>
          </Select>
        </FormControl>

        {preset !== "custom" && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="textSecondary">
              {preset === "fast" &&
                "Quick generation with smaller population. Good for testing."}
              {preset === "balanced" &&
                "Default settings. Good balance between quality and speed."}
              {preset === "thorough" &&
                "Larger population and more generations. Best quality results."}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Quick Stats */}
      <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Chip
          label={`Population: ${effectiveConfig.populationSize}`}
          variant="outlined"
        />
        <Chip
          label={`Max Generations: ${effectiveConfig.maxGenerations}`}
          variant="outlined"
        />
        <Chip
          label={`Timeout: ${effectiveConfig.maxExecutionTimeMs / 60000} min`}
          variant="outlined"
        />
      </Box>

      {/* Advanced Options */}
      <Accordion
        expanded={advancedExpanded}
        onChange={() => setAdvancedExpanded(!advancedExpanded)}
        sx={{ mb: 3 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Advanced Options</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Population Parameters */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Population Parameters
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                sx={{ flex: "1 1 250px" }}
                type="number"
                label="Population Size"
                value={effectiveConfig.populationSize}
                onChange={(e) =>
                  handleConfigFieldChange(
                    "populationSize",
                    parseInt(e.target.value) ||
                      DEFAULT_GA_CONFIG.populationSize,
                  )
                }
                disabled={disabled}
                slotProps={{
                  input: {
                    endAdornment: (
                      <Tooltip title="Number of candidate solutions in each generation. Higher = better exploration but slower.">
                        <IconButton size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ),
                  },
                }}
              />

              <TextField
                sx={{ flex: "1 1 250px" }}
                type="number"
                label="Elite Count"
                value={effectiveConfig.eliteCount}
                onChange={(e) =>
                  handleConfigFieldChange(
                    "eliteCount",
                    parseInt(e.target.value) || DEFAULT_GA_CONFIG.eliteCount,
                  )
                }
                disabled={disabled}
                slotProps={{
                  input: {
                    endAdornment: (
                      <Tooltip title="Number of best solutions preserved unchanged in each generation.">
                        <IconButton size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ),
                  },
                }}
              />
            </Box>

            {/* Evolution Parameters */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Evolution Parameters
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                sx={{ flex: "1 1 250px" }}
                type="number"
                label="Max Generations"
                value={effectiveConfig.maxGenerations}
                onChange={(e) =>
                  handleConfigFieldChange(
                    "maxGenerations",
                    parseInt(e.target.value) ||
                      DEFAULT_GA_CONFIG.maxGenerations,
                  )
                }
                disabled={disabled}
                slotProps={{
                  input: {
                    endAdornment: (
                      <Tooltip title="Maximum number of evolutionary cycles. More generations allow better solutions but take longer.">
                        <IconButton size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ),
                  },
                }}
              />

              <TextField
                sx={{ flex: "1 1 250px" }}
                type="number"
                label="Stagnation Limit"
                value={effectiveConfig.maxStagnantGenerations}
                onChange={(e) =>
                  handleConfigFieldChange(
                    "maxStagnantGenerations",
                    parseInt(e.target.value) ||
                      DEFAULT_GA_CONFIG.maxStagnantGenerations,
                  )
                }
                disabled={disabled}
                slotProps={{
                  input: {
                    endAdornment: (
                      <Tooltip title="Stop if no improvement for this many generations. Prevents wasting time when stuck.">
                        <IconButton size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ),
                  },
                }}
              />

              <TextField
                sx={{ flex: "1 1 250px" }}
                type="number"
                label="Crossover Probability"
                value={effectiveConfig.crossoverProbability}
                onChange={(e) =>
                  handleConfigFieldChange(
                    "crossoverProbability",
                    parseFloat(e.target.value) ||
                      DEFAULT_GA_CONFIG.crossoverProbability,
                  )
                }
                disabled={disabled}
                slotProps={{
                  input: {
                    startAdornment: null,
                    endAdornment: (
                      <Tooltip title="Probability of combining two parent solutions (0-1). Higher = more mixing.">
                        <IconButton size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ),
                  },
                  htmlInput: { min: 0, max: 1, step: 0.05 },
                }}
              />

              <TextField
                sx={{ flex: "1 1 250px" }}
                type="number"
                label="Mutation Probability"
                value={effectiveConfig.mutationProbability}
                onChange={(e) =>
                  handleConfigFieldChange(
                    "mutationProbability",
                    parseFloat(e.target.value) ||
                      DEFAULT_GA_CONFIG.mutationProbability,
                  )
                }
                disabled={disabled}
                slotProps={{
                  input: {
                    endAdornment: (
                      <Tooltip title="Probability of random changes to maintain diversity (0-1). Too high = chaos, too low = premature convergence.">
                        <IconButton size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ),
                  },
                  htmlInput: { min: 0, max: 1, step: 0.01 },
                }}
              />
            </Box>

            {/* Constraint Weights */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Soft Constraint Weights
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Higher weights mean stricter enforcement
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                sx={{ flex: "1 1 250px" }}
                type="number"
                label="Idle Time Weight"
                value={effectiveConfig.constraintWeights.idleTime}
                onChange={(e) =>
                  handleConstraintWeightChange(
                    "idleTime",
                    parseInt(e.target.value) || 5,
                  )
                }
                disabled={disabled}
              />

              <TextField
                sx={{ flex: "1 1 250px" }}
                type="number"
                label="Daily Distribution Weight"
                value={effectiveConfig.constraintWeights.dailyDistribution}
                onChange={(e) =>
                  handleConstraintWeightChange(
                    "dailyDistribution",
                    parseInt(e.target.value) || 3,
                  )
                }
                disabled={disabled}
              />

              <TextField
                sx={{ flex: "1 1 250px" }}
                type="number"
                label="Consecutive Preference Weight"
                value={effectiveConfig.constraintWeights.consecutivePreference}
                onChange={(e) =>
                  handleConstraintWeightChange(
                    "consecutivePreference",
                    parseInt(e.target.value) || 8,
                  )
                }
                disabled={disabled}
              />

              <TextField
                sx={{ flex: "1 1 250px" }}
                type="number"
                label="Cognitive Load Weight"
                value={effectiveConfig.constraintWeights.cognitiveLoad}
                onChange={(e) =>
                  handleConstraintWeightChange(
                    "cognitiveLoad",
                    parseInt(e.target.value) || 7,
                  )
                }
                disabled={disabled}
              />
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Start Button */}
      <Button
        variant="contained"
        size="large"
        fullWidth
        startIcon={<PlayArrowIcon />}
        onClick={onStartGeneration}
        disabled={disabled || isStarting}
      >
        {isStarting ? "Starting Generation..." : "Start Generation"}
      </Button>
    </Box>
  );
}
