import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
  Typography,
  Alert,
  Collapse,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { useState } from "react";
import { ConfigSection, NumericConfigField } from "./ConfigSections";
import type {
  GAConfig,
  AdaptiveMutationConfig,
  AdaptiveMutationStrategy,
} from "@/server/services/timetableGenerator/types";

interface AdaptiveMutationConfigProps {
  config: GAConfig;
  onChange: (adaptiveConfig: AdaptiveMutationConfig | undefined) => void;
  disabled?: boolean;
}

const STRATEGY_INFO: Record<
  Exclude<AdaptiveMutationStrategy, "none">,
  { label: string; description: string; technical: string; bestFor: string }
> = {
  stagnation: {
    label: "Stagnation-Based",
    description:
      'Increases mutation when fitness stops improving - a "hail mary" to escape local optima.',
    technical:
      "Monitors generations without improvement. When stagnation threshold is reached, mutation probability is multiplied to inject new genetic material.",
    bestFor:
      "Problems prone to premature convergence or getting stuck in local optima.",
  },
  diversity: {
    label: "Diversity-Based",
    description:
      "Adjusts mutation based on population diversity (Hamming distance between chromosomes).",
    technical:
      "Calculates average genetic diversity. When below threshold, increases mutation to prevent population convergence.",
    bestFor:
      "Maintaining genetic diversity throughout evolution, preventing premature convergence.",
  },
  fitness: {
    label: "Fitness-Based (Srinivas & Patnaik)",
    description:
      "Per-individual mutation: low for high-fitness (protect good genes), high for low-fitness (explore).",
    technical:
      "Each individual gets mutation probability based on its fitness relative to population average and maximum. Preserves good solutions while aggressively exploring poor ones.",
    bestFor:
      "Fine-tuning good solutions while exploring poor ones. Best for problems requiring careful balance.",
  },
  hybrid: {
    label: "Hybrid (Stagnation + Diversity)",
    description:
      "Combines stagnation and diversity signals, taking the maximum of both strategies.",
    technical:
      "Monitors both fitness stagnation and population diversity. Uses whichever signal suggests higher mutation.",
    bestFor:
      "Complex problems requiring robust adaptation to both convergence and stagnation.",
  },
};

export function AdaptiveMutationConfigSection({
  config,
  onChange,
  disabled = false,
}: AdaptiveMutationConfigProps) {
  const [enabled, setEnabled] = useState(!!config.adaptiveMutation);
  const [showDetails, setShowDetails] = useState(false);

  const adaptiveConfig = config.adaptiveMutation || {
    strategy: "hybrid" as AdaptiveMutationStrategy,
    baseProbability: 0.01,
    maxProbability: 0.2,
    minProbability: 0.001,
  };

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    if (checked) {
      // Enable with hybrid strategy as default
      onChange({
        strategy: "hybrid",
        baseProbability: 0.01,
        maxProbability: 0.2,
        minProbability: 0.001,
        stagnationThreshold: 20,
        stagnationMultiplier: 1.5,
        diversityThreshold: 0.3,
        diversityMultiplier: 2.0,
      });
    } else {
      onChange(undefined);
    }
  };

  const handleStrategyChange = (
    strategy: Exclude<AdaptiveMutationStrategy, "none">,
  ) => {
    // Update with strategy-specific defaults
    const baseConfig = {
      ...adaptiveConfig,
      strategy,
    };

    switch (strategy) {
      case "stagnation":
        onChange({
          ...baseConfig,
          stagnationThreshold: 15,
          stagnationMultiplier: 2.0,
        });
        break;
      case "diversity":
        onChange({
          ...baseConfig,
          diversityThreshold: 0.25,
          diversityMultiplier: 2.5,
        });
        break;
      case "fitness":
        onChange({
          ...baseConfig,
          fitnessHighProbability: 0.005,
          fitnessLowProbability: 0.08,
        });
        break;
      case "hybrid":
        onChange({
          ...baseConfig,
          stagnationThreshold: 20,
          stagnationMultiplier: 1.5,
          diversityThreshold: 0.3,
          diversityMultiplier: 2.0,
        });
        break;
    }
  };

  const handleFieldChange = (
    field: keyof AdaptiveMutationConfig,
    value: any,
  ) => {
    onChange({
      ...adaptiveConfig,
      [field]: value,
    });
  };

  const currentStrategy = adaptiveConfig.strategy;
  const strategyInfo = STRATEGY_INFO[currentStrategy];

  return (
    <ConfigSection
      title="Adaptive Mutation"
      description="Dynamically adjust mutation probability during evolution to balance exploration vs exploitation"
    >
      <FormControlLabel
        control={
          <Switch
            checked={enabled}
            onChange={(e) => handleToggle(e.target.checked)}
          />
        }
        label="Enable Adaptive Mutation"
        disabled={disabled}
      />
      <Box sx={{ width: "100%" }}>
        <Collapse in={enabled}>
          {/* Strategy Selection */}

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Adaptation Strategy</InputLabel>
            <Select
              value={currentStrategy}
              label="Adaptation Strategy"
              onChange={(e) =>
                handleStrategyChange(
                  e.target.value as Exclude<AdaptiveMutationStrategy, "none">,
                )
              }
              disabled={disabled}
            >
              {(
                Object.keys(STRATEGY_INFO) as Array<
                  Exclude<AdaptiveMutationStrategy, "none">
                >
              ).map((strategy) => (
                <MenuItem key={strategy} value={strategy}>
                  {STRATEGY_INFO[strategy].label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Strategy Info */}
          {strategyInfo && (
            <Alert
              severity="info"
              sx={{ mb: 2 }}
              action={
                <Tooltip title="Show technical details">
                  <IconButton
                    size="small"
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    <InfoIcon />
                  </IconButton>
                </Tooltip>
              }
            >
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>{strategyInfo.label}:</strong>{" "}
                {strategyInfo.description}
              </Typography>
              <Collapse in={showDetails}>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  <strong>Technical:</strong> {strategyInfo.technical}
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  <strong>Best for:</strong> {strategyInfo.bestFor}
                </Typography>
              </Collapse>
            </Alert>
          )}

          {/* Base Parameters (shown for all strategies) */}
          <Box
            sx={{
              display: "grid",
              gap: 2,
              mb: 2,
            }}
          >
            <NumericConfigField
              label="Base Mutation Probability"
              value={adaptiveConfig.baseProbability}
              onChange={(val) => handleFieldChange("baseProbability", val)}
              disabled={disabled}
              technical="Starting/minimum mutation probability. The adaptive strategy will adjust from this baseline."
              humanSummary="Starting point for mutation rate. Will be adjusted up/down based on evolution state."
              min={0.001}
              max={0.1}
              step={0.001}
              flex="1"
            />

            <NumericConfigField
              label="Max Mutation Probability"
              value={adaptiveConfig.maxProbability}
              onChange={(val) => handleFieldChange("maxProbability", val)}
              disabled={disabled}
              technical="Upper limit for mutation probability. Prevents excessive randomization even when adaptation suggests high values."
              humanSummary="Maximum mutation rate allowed. Caps how aggressive the algorithm can get."
              min={0.05}
              max={0.5}
              step={0.01}
              flex="1"
            />

            <NumericConfigField
              label="Min Mutation Probability"
              value={adaptiveConfig.minProbability}
              onChange={(val) => handleFieldChange("minProbability", val)}
              disabled={disabled}
              technical="Lower limit for mutation probability. Ensures some exploration even when not needed."
              humanSummary="Minimum mutation rate. Ensures a baseline level of exploration."
              min={0.0001}
              max={0.01}
              step={0.0001}
              flex="1"
            />
          </Box>

          {/* Stagnation-specific parameters */}
          {(currentStrategy === "stagnation" ||
            currentStrategy === "hybrid") && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1, mt: 1 }}>
                Stagnation Detection
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                  },
                  gap: 2,
                  mb: 2,
                }}
              >
                <NumericConfigField
                  label="Stagnation Threshold"
                  value={adaptiveConfig.stagnationThreshold ?? 20}
                  onChange={(val) =>
                    handleFieldChange("stagnationThreshold", val)
                  }
                  disabled={disabled}
                  technical="Number of generations without fitness improvement before increasing mutation (the 'hail mary' trigger)."
                  humanSummary="How many generations to wait without improvement before boosting mutation."
                  min={5}
                  max={100}
                  step={1}
                  flex="1"
                />

                <NumericConfigField
                  label="Stagnation Multiplier"
                  value={adaptiveConfig.stagnationMultiplier ?? 1.5}
                  onChange={(val) =>
                    handleFieldChange("stagnationMultiplier", val)
                  }
                  disabled={disabled}
                  technical="Factor by which mutation probability is multiplied when stagnation is detected. Higher = more aggressive exploration."
                  humanSummary="How much to increase mutation when stuck. Higher = bigger boost to escape local optima."
                  min={1.1}
                  max={5.0}
                  step={0.1}
                  flex="1"
                />
              </Box>
            </>
          )}

          {/* Diversity-specific parameters */}
          {(currentStrategy === "diversity" ||
            currentStrategy === "hybrid") && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1, mt: 1 }}>
                Diversity Monitoring
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                  },
                  gap: 2,
                  mb: 2,
                }}
              >
                <NumericConfigField
                  label="Diversity Threshold"
                  value={adaptiveConfig.diversityThreshold ?? 0.3}
                  onChange={(val) =>
                    handleFieldChange("diversityThreshold", val)
                  }
                  disabled={disabled}
                  technical="Population diversity level (0-1) below which mutation is increased. 0 = identical, 1 = maximum diversity."
                  humanSummary="How genetically similar the population can be before needing more mutation. Lower = stricter."
                  min={0.1}
                  max={0.8}
                  step={0.05}
                  flex="1"
                />

                <NumericConfigField
                  label="Diversity Multiplier"
                  value={adaptiveConfig.diversityMultiplier ?? 2.0}
                  onChange={(val) =>
                    handleFieldChange("diversityMultiplier", val)
                  }
                  disabled={disabled}
                  technical="Factor by which mutation is increased when diversity is low. Higher = more aggressive diversity injection."
                  humanSummary="How much to boost mutation when population lacks diversity."
                  min={1.1}
                  max={5.0}
                  step={0.1}
                  flex="1"
                />
              </Box>
            </>
          )}

          {/* Fitness-specific parameters */}
          {currentStrategy === "fitness" && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1, mt: 1 }}>
                Per-Individual Mutation (Srinivas & Patnaik)
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                  },
                  gap: 2,
                }}
              >
                <NumericConfigField
                  label="High-Fitness Mutation"
                  value={adaptiveConfig.fitnessHighProbability ?? 0.01}
                  onChange={(val) =>
                    handleFieldChange("fitnessHighProbability", val)
                  }
                  disabled={disabled}
                  technical="Mutation probability for above-average individuals. Low values protect good genetic material."
                  humanSummary="Mutation rate for good timetables. Low = protect their good qualities."
                  min={0.001}
                  max={0.05}
                  step={0.001}
                  flex="1"
                />

                <NumericConfigField
                  label="Low-Fitness Mutation"
                  value={adaptiveConfig.fitnessLowProbability ?? 0.05}
                  onChange={(val) =>
                    handleFieldChange("fitnessLowProbability", val)
                  }
                  disabled={disabled}
                  technical="Mutation probability for below-average individuals. High values aggressively explore alternatives."
                  humanSummary="Mutation rate for poor timetables. High = try radical changes to improve."
                  min={0.01}
                  max={0.2}
                  step={0.01}
                  flex="1"
                />
              </Box>
            </>
          )}
        </Collapse>
      </Box>
    </ConfigSection>
  );
}
