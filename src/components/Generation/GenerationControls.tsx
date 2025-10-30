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
  Divider,
  Paper,
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

// Helper component for tooltips with technical + human-friendly explanations
interface ConfigTooltipProps {
  technical: string;
  humanSummary: string;
}

function ConfigTooltip({ technical, humanSummary }: ConfigTooltipProps) {
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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Population Parameters */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ fontWeight: 600 }}
              >
                Population Parameters
              </Typography>
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ display: "block", mb: 2 }}
              >
                Controls how many candidate timetables are maintained and
                evolved
              </Typography>

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
                        <Tooltip
                          title={
                            <ConfigTooltip
                              technical="Number of candidate solutions (timetables) maintained in each generation. Larger populations explore more possibilities but require more computation."
                              humanSummary="How many different timetable variations are tested simultaneously. More = better quality but slower."
                            />
                          }
                        >
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
                        <Tooltip
                          title={
                            <ConfigTooltip
                              technical="Number of best solutions automatically preserved unchanged in each generation to prevent loss of good solutions during evolution."
                              humanSummary="How many of the best timetables are kept safe from random changes. Ensures progress isn't lost."
                            />
                          }
                        >
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
                  label="Tournament Size"
                  value={effectiveConfig.tournamentSize}
                  onChange={(e) =>
                    handleConfigFieldChange(
                      "tournamentSize",
                      parseInt(e.target.value) ||
                        DEFAULT_GA_CONFIG.tournamentSize,
                    )
                  }
                  disabled={disabled}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <Tooltip
                          title={
                            <ConfigTooltip
                              technical="Number of randomly selected candidates that compete for selection as a parent. Higher values increase selection pressure toward better solutions."
                              humanSummary="How many timetables compete to be chosen for breeding. Higher = favors the best ones more strongly."
                            />
                          }
                        >
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
                  label="Heuristic Init Ratio"
                  value={effectiveConfig.heuristicInitRatio}
                  onChange={(e) =>
                    handleConfigFieldChange(
                      "heuristicInitRatio",
                      parseFloat(e.target.value) ||
                        DEFAULT_GA_CONFIG.heuristicInitRatio,
                    )
                  }
                  disabled={disabled}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <Tooltip
                          title={
                            <ConfigTooltip
                              technical="Proportion of initial population created using intelligent heuristics vs. random generation (0-1). Heuristic initialization often finds better starting points."
                              humanSummary="What fraction of starting timetables are created smartly vs. randomly. Higher = better starting point."
                            />
                          }
                        >
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ),
                    },
                    htmlInput: { min: 0, max: 1, step: 0.05 },
                  }}
                />
              </Box>
            </Paper>

            {/* Evolution Parameters */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ fontWeight: 600 }}
              >
                Evolution Parameters
              </Typography>
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ display: "block", mb: 2 }}
              >
                Controls how the algorithm evolves and improves solutions over
                time
              </Typography>

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
                        <Tooltip
                          title={
                            <ConfigTooltip
                              technical="Maximum number of evolutionary cycles before stopping. Each generation creates and evaluates a new population of candidate solutions."
                              humanSummary="How many rounds of evolution to run. More rounds = potentially better timetables but takes longer."
                            />
                          }
                        >
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
                        <Tooltip
                          title={
                            <ConfigTooltip
                              technical="Stop generation if the best fitness doesn't improve for this many consecutive generations. Prevents wasting computation when the algorithm is stuck."
                              humanSummary="How long to wait without improvement before giving up. Prevents wasting time when no better solution can be found."
                            />
                          }
                        >
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
                  label="Target Fitness"
                  value={effectiveConfig.targetFitness}
                  onChange={(e) =>
                    handleConfigFieldChange(
                      "targetFitness",
                      parseFloat(e.target.value) ||
                        DEFAULT_GA_CONFIG.targetFitness,
                    )
                  }
                  disabled={disabled}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <Tooltip
                          title={
                            <ConfigTooltip
                              technical="Stop when a solution reaches this fitness score (0-1). A fitness of 0.95 means 95% of constraints are satisfied."
                              humanSummary="Quality threshold to stop at. 1.0 = perfect, 0.95 = near-perfect. Stops early if this quality is reached."
                            />
                          }
                        >
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ),
                    },
                    htmlInput: { min: 0, max: 1, step: 0.01 },
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
                      endAdornment: (
                        <Tooltip
                          title={
                            <ConfigTooltip
                              technical="Probability that two parent solutions will be combined (crossed over) to produce offspring (0-1). Higher values promote more information exchange between solutions."
                              humanSummary="How often good timetables are mixed together to create better ones. Higher = more mixing and exploration."
                            />
                          }
                        >
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
                        <Tooltip
                          title={
                            <ConfigTooltip
                              technical="Probability of applying random changes to a solution to maintain genetic diversity (0-1). Prevents premature convergence but too high causes chaos."
                              humanSummary="How often radical changes to the timetable occur during generation. Helps escape local optima but too much creates randomness."
                            />
                          }
                        >
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ),
                    },
                    htmlInput: { min: 0, max: 1, step: 0.01 },
                  }}
                />

                <TextField
                  sx={{ flex: "1 1 250px" }}
                  type="number"
                  label="Swap Mutation Ratio"
                  value={effectiveConfig.swapMutationRatio}
                  onChange={(e) =>
                    handleConfigFieldChange(
                      "swapMutationRatio",
                      parseFloat(e.target.value) ||
                        DEFAULT_GA_CONFIG.swapMutationRatio,
                    )
                  }
                  disabled={disabled}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <Tooltip
                          title={
                            <ConfigTooltip
                              technical="When mutation occurs, this is the probability of swapping two lecture slots vs. completely randomizing a slot (0-1)."
                              humanSummary="Type of mutation to use. High = gentle swaps, low = more radical randomization. Swaps are usually safer."
                            />
                          }
                        >
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ),
                    },
                    htmlInput: { min: 0, max: 1, step: 0.05 },
                  }}
                />
              </Box>
            </Paper>

            {/* Constraint Weights */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ fontWeight: 600 }}
              >
                Soft Constraint Weights
              </Typography>
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ display: "block", mb: 2 }}
              >
                Higher weights mean stricter enforcement. These control the
                relative importance of different scheduling preferences.
              </Typography>

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
                  slotProps={{
                    input: {
                      endAdornment: (
                        <Tooltip
                          title={
                            <ConfigTooltip
                              technical="Penalty for gaps (idle slots) in student/teacher schedules. Higher values strongly discourage breaks between consecutive lectures."
                              humanSummary="How much to avoid gaps in schedules. Higher = fewer breaks between classes."
                            />
                          }
                        >
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
                  label="Daily Distribution Weight"
                  value={effectiveConfig.constraintWeights.dailyDistribution}
                  onChange={(e) =>
                    handleConstraintWeightChange(
                      "dailyDistribution",
                      parseInt(e.target.value) || 3,
                    )
                  }
                  disabled={disabled}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <Tooltip
                          title={
                            <ConfigTooltip
                              technical="Penalty for uneven distribution of lectures across days. Encourages spreading lectures evenly throughout the week."
                              humanSummary="How much to balance workload across the week. Higher = more even distribution of classes."
                            />
                          }
                        >
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
                  label="Consecutive Preference Weight"
                  value={
                    effectiveConfig.constraintWeights.consecutivePreference
                  }
                  onChange={(e) =>
                    handleConstraintWeightChange(
                      "consecutivePreference",
                      parseInt(e.target.value) || 8,
                    )
                  }
                  disabled={disabled}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <Tooltip
                          title={
                            <ConfigTooltip
                              technical="Reward for scheduling multi-hour lectures in consecutive slots when preferred. Helps group related lecture hours together."
                              humanSummary="How much to group multi-hour lectures together. Higher = stronger preference for back-to-back scheduling."
                            />
                          }
                        >
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
                  label="Teacher Daily Limit Weight"
                  value={effectiveConfig.constraintWeights.teacherDailyLimit}
                  onChange={(e) =>
                    handleConstraintWeightChange(
                      "teacherDailyLimit",
                      parseInt(e.target.value) || 10,
                    )
                  }
                  disabled={disabled}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <Tooltip
                          title={
                            <ConfigTooltip
                              technical="Penalty for exceeding teacher's daily maximum teaching hours. Helps enforce workload limits per day."
                              humanSummary="How strictly to enforce daily teaching hour limits for teachers. Higher = stricter daily limits."
                            />
                          }
                        >
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
                  label="Teacher Weekly Limit Weight"
                  value={effectiveConfig.constraintWeights.teacherWeeklyLimit}
                  onChange={(e) =>
                    handleConstraintWeightChange(
                      "teacherWeeklyLimit",
                      parseInt(e.target.value) || 15,
                    )
                  }
                  disabled={disabled}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <Tooltip
                          title={
                            <ConfigTooltip
                              technical="Penalty for exceeding teacher's weekly maximum teaching hours. Ensures total workload stays within bounds."
                              humanSummary="How strictly to enforce weekly teaching hour limits for teachers. Higher = stricter weekly limits."
                            />
                          }
                        >
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
                  label="Cognitive Load Weight"
                  value={effectiveConfig.constraintWeights.cognitiveLoad}
                  onChange={(e) =>
                    handleConstraintWeightChange(
                      "cognitiveLoad",
                      parseInt(e.target.value) || 7,
                    )
                  }
                  disabled={disabled}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <Tooltip
                          title={
                            <ConfigTooltip
                              technical="Penalty based on subject difficulty and scheduling. Harder subjects scheduled late in the day or back-to-back receive higher penalties."
                              humanSummary="How much to consider mental fatigue when scheduling difficult subjects. Higher = avoid hard subjects late or consecutively."
                            />
                          }
                        >
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
                  label="Excessive Daily Lectures Weight"
                  value={
                    effectiveConfig.constraintWeights.excessiveDailyLectures
                  }
                  onChange={(e) =>
                    handleConstraintWeightChange(
                      "excessiveDailyLectures",
                      parseInt(e.target.value) || 6,
                    )
                  }
                  disabled={disabled}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <Tooltip
                          title={
                            <ConfigTooltip
                              technical="Penalty when a lecture's duration hours are exceeded in a single day. For example, a 3-hour lecture shouldn't have more than 3 hours scheduled on the same day."
                              humanSummary="How much to prevent cramming too many hours of the same subject on one day. Higher = better spread across days."
                            />
                          }
                        >
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ),
                    },
                  }}
                />
              </Box>
            </Paper>
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
