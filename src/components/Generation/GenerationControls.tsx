import { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayArrowIcon,
} from "@mui/icons-material";
import type {
  PartialGAConfig,
  ConstraintWeights,
} from "@/server/services/timetableGenerator/types";
import {
  DEFAULT_GA_CONFIG,
  FAST_PRESET,
  BALANCED_PRESET,
  THOROUGH_PRESET,
} from "@/server/services/timetableGenerator/config";
import { PopulationParameters } from "./PopulationParameters";
import { EvolutionParameters } from "./EvolutionParameters";
import { ConstraintWeightsConfig } from "./ConstraintWeightsConfig";

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

  const handleConstraintWeightChange = (
    field: keyof ConstraintWeights,
    value: number | number[] | Array<{ day: number; period: number }>,
  ) => {
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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Population Parameters */}
            <PopulationParameters
              config={effectiveConfig}
              onChange={handleConfigFieldChange}
              disabled={disabled}
            />

            {/* Evolution Parameters */}
            <EvolutionParameters
              config={effectiveConfig}
              onChange={handleConfigFieldChange}
              disabled={disabled}
            />

            {/* Constraint Weights */}
            <ConstraintWeightsConfig
              weights={effectiveConfig.constraintWeights}
              onChange={handleConstraintWeightChange}
              disabled={disabled}
            />
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
