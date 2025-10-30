import type {
  Lecture,
  Teacher,
  Subdivision,
  Classroom,
  Slot,
  Subject,
  Group,
  LectureSubdivision,
  LectureClassroom,
  LectureSlot,
  TeacherUnavailable,
  SubdivisionUnavailable,
  ClassroomUnavailable,
} from "generated/prisma/client";

/**
 * Lecture with all necessary relationships loaded for GA processing.
 * This includes subdivisions, combined classrooms (immutable), and locked slots.
 *
 * Combined Classrooms: Represents classrooms that can be "opened and combined"
 * to form a larger space. The lecture MUST use all these classrooms together.
 */
export interface GALecture extends Lecture {
  teacher: GATeacher;
  subdivisions: LectureSubdivision[];
  combinedClassrooms: LectureClassroom[]; // Fixed set of classrooms for this lecture
  lockedSlots: LectureSlot[];
  subject: Subject & {
    group: Group;
  };
}

/**
 * Teacher with unavailability information for constraint checking.
 */
export interface GATeacher extends Teacher {
  unavailableSlots: TeacherUnavailable[];
}

/**
 * Subdivision (student group) with unavailability information.
 */
export interface GASubdivision extends Subdivision {
  unavailableSlots: SubdivisionUnavailable[];
}

/**
 * Classroom with unavailability information.
 */
export interface GAClassroom extends Classroom {
  unavailableSlots: ClassroomUnavailable[];
}

/**
 * Slot with day and period information for scheduling.
 */
export interface GASlot extends Slot {
  // Already has day and number, no extensions needed
}

// ============================================================================
// CHROMOSOME REPRESENTATION (Core GA Data Structure)
// ============================================================================

/**
 * A Gene represents a single scheduled event in the timetable.
 * This is the atomic unit of the chromosome.
 *
 * Structure:
 * - lectureEventId: Unique identifier for this specific event instance
 *   (e.g., "lec1-evt0", "lec1-evt1" for a lecture with count=2)
 * - lectureId: The original lecture ID from database
 * - timeslotId: The assigned slot ID (MUTABLE during evolution)
 * - isLocked: Whether this assignment is locked (from LectureSlot)
 * - duration: Number of consecutive slots required
 *
 * NOTE: classroomId is NOT stored in the gene because classrooms are
 * immutable and fixed per lecture (stored in GALecture.combinedClassrooms).
 */
export interface Gene {
  lectureEventId: string; // Unique identifier for this event instance
  lectureId: string; // Original lecture ID
  timeslotId: string; // Assigned slot (mutable)
  isLocked: boolean; // True if this is a pre-assigned (locked) slot
  duration: number; // Number of consecutive slots needed
}

/**
 * A Chromosome represents a complete timetable solution.
 * It is a fixed-length array of genes, one for each event to be scheduled.
 *
 * Length = Sum of all lecture.count values
 *
 * Example: If there are 3 lectures with counts [2, 1, 3],
 * the chromosome will have 6 genes total.
 */
export type Chromosome = Gene[];

/**
 * A Population is an array of chromosomes representing
 * the current generation in the GA.
 */
export type Population = Chromosome[];

// ============================================================================
// CONSTRAINT VIOLATION TYPES
// ============================================================================

/**
 * Enumeration of all hard constraint types from research Section 1.2.1
 */
export enum HardConstraintType {
  TEACHER_CLASH = "TEACHER_CLASH", // Teacher assigned to multiple lectures simultaneously
  SUBDIVISION_CLASH = "SUBDIVISION_CLASH", // Student group has overlapping lectures
  ROOM_CLASH = "ROOM_CLASH", // Classroom double-booked
  TEACHER_UNAVAILABLE = "TEACHER_UNAVAILABLE", // Teacher scheduled during unavailable time
  SUBDIVISION_UNAVAILABLE = "SUBDIVISION_UNAVAILABLE", // Students scheduled during unavailable time
  ROOM_UNAVAILABLE = "ROOM_UNAVAILABLE", // Classroom used during unavailable time
  ROOM_CAPACITY = "ROOM_CAPACITY", // Room too small for expected enrollment
  ROOM_FEATURES = "ROOM_FEATURES", // Room lacks required features
  CONSECUTIVE_SLOTS = "CONSECUTIVE_SLOTS", // Multi-slot lecture not in consecutive periods
  LOCKED_SLOT_VIOLATION = "LOCKED_SLOT_VIOLATION", // Locked slot assignment changed
  DAILY_DISTRIBUTION = "DAILY_DISTRIBUTION", // Uneven distribution of lectures across days
}

/**
 * Enumeration of all soft constraint types from research Section 1.2.2
 */
export enum SoftConstraintType {
  IDLE_TIME = "IDLE_TIME", // Gaps between first and last class for students
  CONSECUTIVE_PREFERENCE = "CONSECUTIVE_PREFERENCE", // Preference for back-to-back classes
  TEACHER_DAILY_LIMIT = "TEACHER_DAILY_LIMIT", // Exceeded daily teaching hours
  TEACHER_WEEKLY_LIMIT = "TEACHER_WEEKLY_LIMIT", // Exceeded weekly teaching hours
  COGNITIVE_LOAD = "COGNITIVE_LOAD", // High cognitive load for students
  EXCESSIVE_DAILY_LECTURES = "EXCESSIVE_DAILY_LECTURES", // More than lecture.duration lectures on same day
}

/**
 * Represents a single hard constraint violation.
 */
export interface HardViolation {
  type: HardConstraintType;
  geneIndices: number[]; // Indices of genes involved in this violation
  severity: number; // Severity score (for prioritization within hard constraints)
  description: string; // Human-readable description
  entityIds: string[]; // IDs of entities involved (teacher, classroom, etc.)
}

/**
 * Represents a single soft constraint violation.
 */
export interface SoftViolation {
  type: SoftConstraintType;
  geneIndices: number[]; // Indices of genes involved
  penalty: number; // Penalty value
  description: string; // Human-readable description
  entityIds: string[]; // IDs of entities involved
}

// ============================================================================
// FITNESS EVALUATION TYPES
// ============================================================================

/**
 * Complete fitness evaluation result for a chromosome.
 * This includes all penalties, violations, and feasibility status.
 */
export interface FitnessResult {
  // Summary metrics
  totalPenalty: number; // Total weighted penalty (hard + soft)
  fitnessScore: number; // Normalized fitness: 1 / (1 + totalPenalty)
  isFeasible: boolean; // True if no hard constraints violated

  // Detailed penalties
  hardPenalty: number; // Sum of all hard constraint penalties
  softPenalty: number; // Sum of all soft constraint penalties

  // Violation details
  hardViolations: HardViolation[];
  softViolations: SoftViolation[];

  // Counts for quick assessment
  hardViolationCount: number;
  softViolationCount: number;
}

/**
 * Comparison result for niched-penalty tournament selection.
 * Used to compare two chromosomes according to hierarchical rules.
 */
export enum ComparisonResult {
  BETTER = 1, // First chromosome is better
  WORSE = -1, // Second chromosome is better
  EQUAL = 0, // Chromosomes are equally fit
}

// ============================================================================
// LOOKUP MAPS (Performance Optimization)
// ============================================================================

/**
 * Precomputed lookup maps for O(1) constraint checking.
 * These are derived from the input data at initialization.
 */
export interface LookupMaps {
  // Lecture relationships
  teacherToLectures: Map<string, string[]>; // teacherId -> lectureEventIds[]
  subdivisionToLectures: Map<string, string[]>; // subdivisionId -> lectureEventIds[]
  lectureToSubdivisions: Map<string, string[]>; // lectureId -> subdivisionIds[]
  lectureToCombinedClassrooms: Map<string, string[]>; // lectureId -> classroomIds[] (immutable combined set)

  // Event metadata
  eventToLecture: Map<string, GALecture>; // lectureEventId -> GALecture
  eventToSubdivisions: Map<string, string[]>; // lectureEventId -> subdivisionIds[]

  // Unavailability sets (for fast lookup)
  teacherUnavailable: Map<string, Set<string>>; // teacherId -> Set<slotId>
  subdivisionUnavailable: Map<string, Set<string>>; // subdivisionId -> Set<slotId>
  classroomUnavailable: Map<string, Set<string>>; // classroomId -> Set<slotId>

  // Slot mapping
  slotIdToSlot: Map<string, GASlot>; // slotId -> GASlot
  slotLinearization: Map<string, number>; // slotId -> linearized index
  linearToSlotId: Map<number, string>; // linearized index -> slotId

  // Classroom metadata
  classroomIdToClassroom: Map<string, GAClassroom>; // classroomId -> GAClassroom
  classroomCapacity: Map<string, number>; // classroomId -> capacity

  // Locked slots
  lockedAssignments: Map<string, { slotId: string }>; // lectureEventId -> locked slot assignment (classroom is immutable)
}

// ============================================================================
// GA CONFIGURATION
// ============================================================================

/**
 * Constraint weight configuration for penalty calculation.
 * Hard constraints always use a much higher weight (e.g., 1000).
 */
export interface ConstraintWeights {
  // Hard constraint base weight
  hardConstraintWeight: number; // Default: 1000

  // Soft constraint weights (relative importance)
  idleTime: number; // Default: 5
  dailyDistribution: number; // Default: 3
  consecutivePreference: number; // Default: 8
  teacherDailyLimit: number; // Default: 10
  teacherWeeklyLimit: number; // Default: 15
  cognitiveLoad: number; // Default: 7
  excessiveDailyLectures: number; // Default: 6
}

/**
 * Complete GA configuration with all tunable parameters.
 * Based on research Section 5 (Table 3).
 */
export interface GAConfig {
  // Population parameters
  populationSize: number; // Default: 200
  eliteCount: number; // Default: 4 (2% of 200)
  heuristicInitRatio: number; // Default: 0.2 (20% heuristic, 80% random)

  // Genetic operator probabilities
  crossoverProbability: number; // Default: 0.9
  mutationProbability: number; // Default: 0.05
  swapMutationRatio: number; // Default: 0.9 (90% swap, 10% random reset)

  // Selection parameters
  tournamentSize: number; // Default: 3

  // Termination conditions
  maxGenerations: number; // Default: 1000
  maxStagnantGenerations: number; // Default: 200 (no improvement)
  targetFitness: number; // Default: 0.95 (near-perfect solution)
  maxExecutionTimeMs: number; // Default: 600000 (10 minutes)

  // Constraint weights
  constraintWeights: ConstraintWeights;

  // Advanced options
  enableRepair: boolean; // Default: true
  enableMemetic: boolean; // Default: false (future enhancement)
  enableParallel: boolean; // Default: false (future enhancement)
  randomSeed?: number; // For reproducibility (optional)
  stopOnFeasible: boolean; // if true, the algorithm will stop when a feasible solution is found
}

// ============================================================================
// GENERATION STATISTICS
// ============================================================================

/**
 * Statistics for a single generation in the GA.
 */
export interface GenerationStats {
  generation: number;
  bestFitness: number;
  bestHardPenalty: number;
  bestSoftPenalty: number;
  isFeasible: boolean;
  avgFitness: number;
  stagnation: number;
}

/**
 * Result of a GA run.
 */
export interface GAResult {
  bestChromosome: Chromosome;
  bestFitness: FitnessResult;
  stats: GenerationStats[];
  totalTime: number;
}

/**
 * Complete execution statistics for the GA run.
 */
export interface ExecutionStats {
  generationStats: GenerationStats[];
  totalGenerations: number;
  totalExecutionTimeMs: number;
  terminationReason:
    | "MAX_GENERATIONS"
    | "TARGET_FITNESS"
    | "STAGNATION"
    | "TIMEOUT"
    | "MANUAL_CANCEL";
  finalBestFitness: number;
  finalBestIsFeasible: boolean;
  improvementCount: number; // Number of generations with fitness improvement
}

// ============================================================================
// INPUT DATA CONTAINER
// ============================================================================

/**
 * Complete dataset loaded from database for GA processing.
 * This is the input to the algorithm.
 */
export interface GAInputData {
  timetableId: string;
  lectures: GALecture[];
  teachers: GATeacher[];
  subdivisions: GASubdivision[];
  classrooms: GAClassroom[];
  slots: GASlot[];
  totalEvents: number; // Sum of all lecture.count values
  eventIds: string[]; // Ordered array of all event IDs (lecture-evt0, lecture-evt1, ...)
  lookupMaps: LookupMaps; // Precomputed for performance
}

// ============================================================================
// OUTPUT DATA STRUCTURE
// ============================================================================

/**
 * A scheduled event in the final timetable.
 * This is the decoded output from a gene.
 */
export interface ScheduledEvent {
  lectureEventId: string;
  lectureId: string;
  lectureName: string;
  teacherId: string;
  teacherName: string;
  subdivisionIds: string[];
  subdivisionNames: string[];
  slotId: string;
  day: number;
  period: number;
  classroomId: string;
  classroomName: string;
  duration: number;
  isLocked: boolean;
}

/**
 * Complete timetable output with all scheduled events.
 */
export interface GeneratedTimetable {
  timetableId: string;
  events: ScheduledEvent[];
  fitness: FitnessResult;
  stats: ExecutionStats;
  generatedAt: Date;
}

// ============================================================================
// RESULT QUALITY METRICS
// ============================================================================

/**
 * Quality metrics for comparing timetable solutions.
 */
export interface QualityMetrics {
  feasibilityScore: number; // 1.0 if feasible, 0.0 if not
  teacherUtilization: number; // Percentage of teacher availability used
  classroomUtilization: number; // Percentage of classroom capacity used
  averageIdleTime: number; // Average idle time per subdivision per day
  teacherLoadBalance: number; // Standard deviation of teacher workload
  cognitiveLoadBalance: number; // Standard deviation of cognitive load
  dailyDistributionScore: number; // How evenly lectures are distributed
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Partial configuration for user-provided overrides.
 * All fields are optional and will be merged with defaults.
 */
export type PartialGAConfig = Partial<Omit<GAConfig, "constraintWeights">> & {
  constraintWeights?: Partial<ConstraintWeights>;
};

/**
 * Progress callback function type for reporting generation progress.
 */
export type ProgressCallback = (stats: GenerationStats) => void | Promise<void>;

/**
 * Cancellation check function type for manual termination.
 */
export type CancellationCheck = () => boolean | Promise<boolean>;
