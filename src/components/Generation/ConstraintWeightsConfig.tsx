import type { ConstraintWeights } from "@/server/services/timetableGenerator/types";
import { ConfigSection, NumericConfigField } from "./ConfigSections";
import { DeprioritizationConfig } from "./DeprioritizationConfig";

interface ConstraintWeightsConfigProps {
  weights: ConstraintWeights;
  onChange: (
    field: keyof ConstraintWeights,
    value: number | number[] | Array<{ day: number; period: number }>,
  ) => void;
  disabled?: boolean;
}

export function ConstraintWeightsConfig({
  weights,
  onChange,
  disabled = false,
}: ConstraintWeightsConfigProps) {
  return (
    <>
      {/* Core Soft Constraint Weights */}
      <ConfigSection
        title="Core Soft Constraint Weights"
        description="Higher weights mean stricter enforcement. These control the relative importance of different scheduling preferences."
      >
        <NumericConfigField
          label="Idle Time Weight"
          value={weights.idleTime}
          onChange={(val) => onChange("idleTime", val)}
          disabled={disabled}
          technical="Penalty for gaps (idle slots) in student/teacher schedules. Higher values strongly discourage breaks between consecutive lectures."
          humanSummary="How much to avoid gaps in schedules. Higher = fewer breaks between classes."
          min={0}
          max={50}
        />

        <NumericConfigField
          label="Consecutive Preference Weight"
          value={weights.consecutivePreference}
          onChange={(val) => onChange("consecutivePreference", val)}
          disabled={disabled}
          technical="Reward for scheduling multi-hour lectures in consecutive slots when preferred. Helps group related lecture hours together."
          humanSummary="How much to group multi-hour lectures together. Higher = stronger preference for back-to-back scheduling."
          min={0}
          max={50}
        />

        <NumericConfigField
          label="Teacher Daily Limit Weight"
          value={weights.teacherDailyLimit}
          onChange={(val) => onChange("teacherDailyLimit", val)}
          disabled={disabled}
          technical="Penalty for exceeding teacher's daily maximum teaching hours. Helps enforce workload limits per day."
          humanSummary="How strictly to enforce daily teaching hour limits for teachers. Higher = stricter daily limits."
          min={0}
          max={50}
        />

        <NumericConfigField
          label="Teacher Weekly Limit Weight"
          value={weights.teacherWeeklyLimit}
          onChange={(val) => onChange("teacherWeeklyLimit", val)}
          disabled={disabled}
          technical="Penalty for exceeding teacher's weekly maximum teaching hours. Ensures total workload stays within bounds."
          humanSummary="How strictly to enforce weekly teaching hour limits for teachers. Higher = stricter weekly limits."
          min={0}
          max={50}
        />

        <NumericConfigField
          label="Excessive Daily Lectures Weight"
          value={weights.excessiveDailyLectures}
          onChange={(val) => onChange("excessiveDailyLectures", val)}
          disabled={disabled}
          technical="Penalty when a lecture's duration hours are exceeded in a single day. For example, a 3-hour lecture shouldn't have more than 3 hours scheduled on the same day."
          humanSummary="How much to prevent cramming too many hours of the same subject on one day. Higher = better spread across days."
          min={0}
          max={50}
        />
      </ConfigSection>

      {/* Day Balance Weights */}
      <ConfigSection
        title="Day Balance Constraints"
        description="Control how lectures are distributed throughout each day to avoid overloaded or underutilized days."
      >
        <NumericConfigField
          label="Excessively Empty Day Weight"
          value={weights.excessivelyEmptyDay}
          onChange={(val) => onChange("excessivelyEmptyDay", val)}
          disabled={disabled}
          technical="Penalty for days with too few lectures (below minLecturesPerDay threshold). Discourages wasted days with only 1-2 classes."
          humanSummary="How much to avoid days with very few classes. Higher = stronger preference to have meaningful class days."
          min={0}
          max={50}
        />

        <NumericConfigField
          label="Excessively Filled Day Weight"
          value={weights.excessivelyFilledDay}
          onChange={(val) => onChange("excessivelyFilledDay", val)}
          disabled={disabled}
          technical="Penalty for days with too many lectures (above maxLecturesPerDay threshold). Prevents student/teacher burnout from overloaded days."
          humanSummary="How much to avoid cramming too many classes into one day. Higher = stricter limit on daily class count."
          min={0}
          max={50}
        />

        <NumericConfigField
          label="Min Lectures Per Day"
          value={weights.minLecturesPerDay}
          onChange={(val) => onChange("minLecturesPerDay", val)}
          disabled={disabled}
          technical="Minimum number of lectures a day should have to not be considered 'excessively empty'. Days with fewer lectures are penalized."
          humanSummary="Minimum classes per day to be considered a 'real' class day. Below this triggers empty day penalty."
          min={1}
          max={10}
        />

        <NumericConfigField
          label="Max Lectures Per Day"
          value={weights.maxLecturesPerDay}
          onChange={(val) => onChange("maxLecturesPerDay", val)}
          disabled={disabled}
          technical="Maximum number of lectures a day should have before being considered 'excessively filled'. Days exceeding this are penalized. Leave empty for no limit."
          humanSummary="Maximum classes per day before triggering overload penalty. Leave empty for unlimited."
          min={1}
          max={15}
        />
      </ConfigSection>

      {/* Timing Preferences */}
      <ConfigSection
        title="Timing Preference Weights"
        description="Control scheduling preferences for specific times or multi-duration lectures."
      >
        <NumericConfigField
          label="Multi-Duration Late Weight"
          value={weights.multiDurationLate}
          onChange={(val) => onChange("multiDurationLate", val)}
          disabled={disabled}
          technical="Penalty for starting multi-duration lectures too late in the day (after multiDurationPreferredFraction). Prevents lectures from running past institute hours."
          humanSummary="How much to avoid starting long lectures late in the day. Higher = push multi-hour classes earlier."
          min={0}
          max={50}
        />

        <NumericConfigField
          label="Deprioritized Day Weight"
          value={weights.deprioritizedDay}
          onChange={(val) => onChange("deprioritizedDay", val)}
          disabled={disabled}
          technical="Penalty for scheduling on days marked as deprioritized (e.g., Fridays). Soft preference to avoid certain days."
          humanSummary="How much to avoid scheduling on certain days. Higher = stronger avoidance of deprioritized days."
          min={0}
          max={50}
        />

        <NumericConfigField
          label="Deprioritized Slot Weight"
          value={weights.deprioritizedSlot}
          onChange={(val) => onChange("deprioritizedSlot", val)}
          disabled={disabled}
          technical="Penalty for scheduling in time slots marked as deprioritized (e.g., early morning or late afternoon). Soft preference to avoid certain periods."
          humanSummary="How much to avoid scheduling at certain times. Higher = stronger avoidance of deprioritized time slots."
          min={0}
          max={50}
        />

        <NumericConfigField
          label="Deprioritized Day-Slot Weight"
          value={weights.deprioritizedDaySlot}
          onChange={(val) => onChange("deprioritizedDaySlot", val)}
          disabled={disabled}
          technical="Penalty for scheduling in specific day-period combinations marked as deprioritized (e.g., Friday afternoons). Most specific deprioritization."
          humanSummary="How much to avoid specific day+time combinations. Higher = strongest avoidance of exact unwanted slots."
          min={0}
          max={50}
        />

        <NumericConfigField
          label="Multi-Duration Preferred Fraction"
          value={weights.multiDurationPreferredFraction}
          onChange={(val) => onChange("multiDurationPreferredFraction", val)}
          disabled={disabled}
          technical="Fraction of the day (0-1) after which multi-duration lectures are considered 'late'. E.g., 0.6 means last 40% of day is late."
          humanSummary="What portion of the day is 'late' for starting long lectures. 0.6 = last 40% of the day."
          min={0}
          max={1}
          step={0.05}
        />
      </ConfigSection>

      {/* Deprioritization Settings */}
      <DeprioritizationConfig
        deprioritizedDays={weights.deprioritizedDays}
        deprioritizedSlotNumbers={weights.deprioritizedSlotNumbers}
        deprioritizedDaySlots={weights.deprioritizedDaySlots}
        onChange={onChange}
        disabled={disabled}
      />
    </>
  );
}
