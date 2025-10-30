import type { GAConfig } from "@/server/services/timetableGenerator/types";
import { ConfigSection, NumericConfigField } from "./ConfigSections";

interface PopulationParametersProps {
  config: GAConfig;
  onChange: (field: keyof GAConfig, value: number) => void;
  disabled?: boolean;
}

export function PopulationParameters({
  config,
  onChange,
  disabled = false,
}: PopulationParametersProps) {
  return (
    <ConfigSection
      title="Population Parameters"
      description="Controls how many candidate timetables are maintained and evolved"
    >
      <NumericConfigField
        label="Population Size"
        value={config.populationSize}
        onChange={(val) => onChange("populationSize", val)}
        disabled={disabled}
        technical="Number of candidate solutions (timetables) maintained in each generation. Larger populations explore more possibilities but require more computation."
        humanSummary="How many different timetable variations are tested simultaneously. More = better quality but slower."
        min={10}
        max={1000}
      />

      <NumericConfigField
        label="Elite Count"
        value={config.eliteCount}
        onChange={(val) => onChange("eliteCount", val)}
        disabled={disabled}
        technical="Number of best solutions automatically preserved unchanged in each generation to prevent loss of good solutions during evolution."
        humanSummary="How many of the best timetables are kept safe from random changes. Ensures progress isn't lost."
        min={1}
        max={20}
      />

      <NumericConfigField
        label="Tournament Size"
        value={config.tournamentSize}
        onChange={(val) => onChange("tournamentSize", val)}
        disabled={disabled}
        technical="Number of randomly selected candidates that compete for selection as a parent. Higher values increase selection pressure toward better solutions."
        humanSummary="How many timetables compete to be chosen for breeding. Higher = favors the best ones more strongly."
        min={2}
        max={10}
      />

      <NumericConfigField
        label="Heuristic Init Ratio"
        value={config.heuristicInitRatio}
        onChange={(val) => onChange("heuristicInitRatio", val)}
        disabled={disabled}
        technical="Proportion of initial population created using intelligent heuristics vs. random generation (0-1). Heuristic initialization often finds better starting points."
        humanSummary="What fraction of starting timetables are created smartly vs. randomly. Higher = better starting point."
        min={0}
        max={1}
        step={0.05}
      />
    </ConfigSection>
  );
}
