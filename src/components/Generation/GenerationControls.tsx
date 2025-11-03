import { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { PopulationParameters } from "./PopulationParameters";
import { EvolutionParameters } from "./EvolutionParameters";
import { ConstraintWeightsConfig } from "./ConstraintWeightsConfig";
import { MultiThreadingParameters } from "./MultiThreadingParameters";
import type {
  ConstraintWeights,
  GAConfig,
  MultiThreadedGAConfig,
  PartialGAConfig,
} from "@/server/services/timetableGenerator/types";
import {
  BALANCED_PRESET,
  DEFAULT_GA_CONFIG,
  FAST_PRESET,
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

  const handleMultiThreadedChange = (enabled: boolean) => {
    setPreset("custom");

    // Get current config or defaults
    const currentMultiThreadConfig = config.multiThreadConfig ?? {
      numIslands: 0, // 0 = auto-detect
      migrationInterval: 50,
      migrationSize: 2,
      migrationStrategy: "best" as const,
    };
    console.log(enabled);

    onConfigChange({
      ...config,
      multiThreaded: enabled,
      multiThreadConfig: currentMultiThreadConfig,
    });
  };

  const handleMultiThreadConfigChange = (
    field: keyof MultiThreadedGAConfig,
    value: number | string,
  ) => {
    setPreset("custom");

    // Ensure we have a base config to spread from
    const currentMultiThreadConfig = config.multiThreadConfig ?? {
      numIslands: 0,
      migrationInterval: 50,
      migrationSize: 2,
      migrationStrategy: "best" as const,
    };

    onConfigChange({
      ...config,
      multiThreadConfig: {
        ...currentMultiThreadConfig,
        [field]: value,
      },
    });
  };

  // Get effective config (merge with defaults)
  const effectiveConfig: GAConfig = {
    ...DEFAULT_GA_CONFIG,
    ...config,
    constraintWeights: {
      ...DEFAULT_GA_CONFIG.constraintWeights,
      ...config.constraintWeights,
    },
    multiThreadConfig: {
      ...DEFAULT_GA_CONFIG.multiThreadConfig,
      ...config.multiThreadConfig,
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

            {/* Multi-Threading Options */}
            <MultiThreadingParameters
              enabled={effectiveConfig.multiThreaded}
              config={effectiveConfig.multiThreadConfig}
              onEnabledChange={handleMultiThreadedChange}
              onChange={handleMultiThreadConfigChange}
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
