import type { GAConfig } from "@/server/services/timetableGenerator/types";
import { ConfigSection, NumericConfigField } from "./ConfigSections";

interface EvolutionParametersProps {
  config: GAConfig;
  onChange: (field: keyof GAConfig, value: number) => void;
  disabled?: boolean;
}

export function EvolutionParameters({
  config,
  onChange,
  disabled = false,
}: EvolutionParametersProps) {
  return (
    <ConfigSection
      title="Evolution Parameters"
      description="Controls how the algorithm evolves and improves solutions over time"
    >
      <NumericConfigField
        label="Max Generations"
        value={config.maxGenerations}
        onChange={(val) => onChange("maxGenerations", val)}
        disabled={disabled}
        technical="Maximum number of evolutionary cycles before stopping. Each generation creates and evaluates a new population of candidate solutions."
        humanSummary="How many rounds of evolution to run. More rounds = potentially better timetables but takes longer."
        min={10}
        max={10000}
      />

      <NumericConfigField
        label="Stagnation Limit"
        value={config.maxStagnantGenerations}
        onChange={(val) => onChange("maxStagnantGenerations", val)}
        disabled={disabled}
        technical="Stop generation if the best fitness doesn't improve for this many consecutive generations. Prevents wasting computation when the algorithm is stuck."
        humanSummary="How long to wait without improvement before giving up. Prevents wasting time when no better solution can be found."
        min={10}
        max={1000}
      />

      <NumericConfigField
        label="Target Fitness"
        value={config.targetFitness}
        onChange={(val) => onChange("targetFitness", val)}
        disabled={disabled}
        technical="Stop when a solution reaches this fitness score (0-1). A fitness of 0.95 means 95% of constraints are satisfied."
        humanSummary="Quality threshold to stop at. 1.0 = perfect, 0.95 = near-perfect. Stops early if this quality is reached."
        min={0}
        max={1}
        step={0.01}
      />

      <NumericConfigField
        label="Crossover Probability"
        value={config.crossoverProbability}
        onChange={(val) => onChange("crossoverProbability", val)}
        disabled={disabled}
        technical="Probability that two parent solutions will be combined (crossed over) to produce offspring (0-1). Higher values promote more information exchange between solutions."
        humanSummary="How often good timetables are mixed together to create better ones. Higher = more mixing and exploration."
        min={0}
        max={1}
        step={0.05}
      />

      <NumericConfigField
        label="Mutation Probability"
        value={config.mutationProbability}
        onChange={(val) => onChange("mutationProbability", val)}
        disabled={disabled}
        technical="Probability of applying random changes to a solution to maintain genetic diversity (0-1). Prevents premature convergence but too high causes chaos."
        humanSummary="How often random changes occur. Helps escape local optima but too much creates randomness."
        min={0}
        max={1}
        step={0.01}
      />

      <NumericConfigField
        label="Swap Mutation Ratio"
        value={config.swapMutationRatio}
        onChange={(val) => onChange("swapMutationRatio", val)}
        disabled={disabled}
        technical="When mutation occurs, this is the probability of swapping two lecture slots vs. completely randomizing a slot (0-1)."
        humanSummary="Type of mutation to use. High = gentle swaps, low = more radical randomization. Swaps are usually safer."
        min={0}
        max={1}
        step={0.05}
      />
    </ConfigSection>
  );
}
