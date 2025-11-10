import { useMemo } from "react";
import { Box, Paper, Typography, Tooltip, Chip } from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import type { GenerationStats } from "@/server/services/timetableGenerator/types";

interface AdaptiveMutationChartProps {
  stats: GenerationStats[];
}

export function AdaptiveMutationChart({ stats }: AdaptiveMutationChartProps) {
  // Check if adaptive mutation was used
  const hasAdaptiveMutation = stats.some(
    (s) => s.mutationProbability !== undefined,
  );

  if (!hasAdaptiveMutation) {
    return null; // Don't show if adaptive mutation wasn't enabled
  }

  const chartData = useMemo(() => {
    return stats.map((s) => ({
      generation: s.generation,
      mutationRate: s.mutationProbability
        ? s.mutationProbability * 100
        : undefined,
      diversity: s.diversity ? s.diversity * 100 : undefined,
      fitness: s.bestFitness * 100,
      stagnation: s.stagnation,
    }));
  }, [stats]);

  // Calculate statistics
  const avgMutationRate =
    stats.reduce((sum, s) => sum + (s.mutationProbability ?? 0), 0) /
    stats.length;
  const maxMutationRate = Math.max(
    ...stats.map((s) => s.mutationProbability ?? 0),
  );
  const minMutationRate = Math.min(
    ...stats.map((s) => s.mutationProbability ?? 1),
  );

  const hasStagnationPeriods = stats.some(
    (s) => s.stagnation && s.stagnation > 20,
  );

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <AutoFixHighIcon color="primary" />
        <Typography variant="h6">Adaptive Mutation Analysis</Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
        <Chip
          label={`Avg Rate: ${(avgMutationRate * 100).toFixed(2)}%`}
          variant="outlined"
          size="small"
        />
        <Chip
          label={`Min: ${(minMutationRate * 100).toFixed(2)}%`}
          variant="outlined"
          size="small"
          color="success"
        />
        <Chip
          label={`Max: ${(maxMutationRate * 100).toFixed(2)}%`}
          variant="outlined"
          size="small"
          color="warning"
        />
        {hasStagnationPeriods && (
          <Tooltip title="Algorithm experienced stagnation periods where adaptive mutation increased">
            <Chip
              label="Stagnation Detected"
              variant="outlined"
              size="small"
              color="info"
              icon={<AutoFixHighIcon />}
            />
          </Tooltip>
        )}
      </Box>

      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        This chart shows how the mutation probability dynamically adjusted
        during evolution to balance exploration and exploitation.
      </Typography>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="generation"
            label={{
              value: "Generation",
              position: "insideBottom",
              offset: -5,
            }}
          />
          <YAxis
            yAxisId="left"
            label={{ value: "Rate (%)", angle: -90, position: "insideLeft" }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{
              value: "Fitness (%)",
              angle: 90,
              position: "insideRight",
            }}
          />
          <RechartsTooltip
            formatter={(value: number) => `${value.toFixed(2)}%`}
            labelFormatter={(label: number) => `Generation ${label}`}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="mutationRate"
            stroke="#1976d2"
            strokeWidth={2}
            name="Mutation Rate"
            dot={false}
          />
          {stats.some((s) => s.diversity !== undefined) && (
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="diversity"
              stroke="#9c27b0"
              strokeWidth={2}
              name="Diversity"
              dot={false}
              strokeDasharray="5 5"
            />
          )}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="fitness"
            stroke="#2e7d32"
            strokeWidth={2}
            name="Best Fitness"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="textSecondary">
          <strong>Interpretation:</strong> When fitness plateaus (green line
          flattens), adaptive mutation increases (blue line rises) to inject
          diversity and escape local optima. When diversity drops (purple dashed
          line), mutation also increases to prevent premature convergence.
        </Typography>
      </Box>
    </Paper>
  );
}
