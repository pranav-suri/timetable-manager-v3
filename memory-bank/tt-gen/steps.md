# Timetable Generation Algorithm Implementation Steps

> **Last Updated**: October 29, 2025  
> **Status**: Not Started  
> **Current Phase**: Phase 1 - Foundation

## Overview

This document outlines the complete implementation roadmap for the Genetic Algorithm-based timetable generation system. The implementation is divided into 6 major phases, each containing multiple steps. Each step is designed to be independently completable by an AI agent.

## Important Instructions for Implementing Agents

### Before Starting Any Step

1. **Read the research**: Review `/memory-bank/tt-gen/research.md` to understand the theoretical foundation
2. **Check current context**: Review `/memory-bank/systemPatterns.md` and `/memory-bank/activeContext.md`
3. **Understand the data model**: Examine Prisma schemas in `/prisma/schema/`
4. **Follow architectural patterns**: Use Collections → tRPC → Prisma pattern (see `.github/copilot-instructions.md`)

### During Implementation

1. **Type Safety First**: Run `npx tsc --noEmit` frequently - zero errors required
2. **Use Collections Pattern**: Never bypass collections for data access in components
3. **Material-UI v7**: Use MUI components, not Tailwind classes
4. **Error Handling**: Implement comprehensive try-catch blocks and user feedback
5. **Performance**: Consider computational complexity; use appropriate data structures
6. **Testing**: Validate each implementation with sample data

### After Completing Each Step

1. **Update this file**: Mark step as complete with date and brief notes
2. **Create summary**: Create a new file `memory-bank/tt-gen/step-summaries/X-Y.md` and add a "Completion Summary" (max 250 lines)
3. **Document next steps**: Create a new file `memory-bank/tt-gen/next-instr/X-Y.md` and add "Next Step Instructions" (max 250 lines) for continuity
4. **Run quality checks**: `npm run check` for linting/formatting
5. **Commit changes**: Create a meaningful commit message

LIMIT OF 250 LINES IS OF UTMOST IMPORTANCE FOR THE TWO FILES.

### Step Completion Template

```markdown
## Step X.Y - [Step Name]

**Status**: ✅ Complete | 🚧 In Progress | ⏳ Not Started  
**Completed**: YYYY-MM-DD  
**Agent Notes**: Brief implementation notes

### Completion Summary

[Max 250 lines - NO CODE SNIPPETS - explain what was implemented, key decisions made,
challenges overcome, architectural choices, performance considerations, and any deviations
from the original plan with justification]

### Next Step Instructions

[Max 250 lines - NO CODE SNIPPETS - provide context for the next agent: what they need to
understand, which files to examine first, important gotchas, dependencies on this step,
and clear starting point for their work]
```

---

## Phase 1: Foundation & Data Structures

### Step 1.1 - Define Core Data Types & Interfaces

**Status**: ✅ Complete  
**Completed**: 2025-10-29  
**Agent Notes**: Created comprehensive type system leveraging Prisma types with GA-specific extensions

**Objective**: Create TypeScript interfaces and types for the entire GA system based on Section 1 & 2 of research.

**Requirements**:

1. **Input Entity Types** - Create GA-optimized versions of Prisma models:
   - GALecture: Include all lecture properties plus derived enrollment and required features
   - GASlot: Linearized timeslot representation with day/period mapping
   - GATeacher: Teacher with availability as Set of unavailable slot IDs
   - GAClassroom: Classroom with features as Set for fast subset checking
   - GASubdivision: Student group with enrolled lecture IDs

2. **Chromosome Representation** - Implement direct encoding (Section 2):
   - Gene interface: lectureId (fixed), timeslotId (variable), classroomId (variable)
   - Chromosome: Array of Gene objects
   - Ensure fixed-length structure matching total events to schedule

3. **Constraint Violation Types**:
   - HardViolation: type enum, involved gene indices, severity score
   - SoftViolation: type enum, involved gene indices, penalty value
   - Include all violation types from research Section 1.2

4. **Fitness Evaluation Types**:
   - FitnessResult: total penalty, fitness score, hard/soft penalties, violation lists, feasibility flag
   - Implement hierarchical structure where hard violations always dominate

5. **GA Configuration**:
   - All tunable parameters from research Section 5 (Table 3)
   - Population size, crossover/mutation probabilities, tournament size, elitism rate
   - Termination criteria: max generations, stagnation limit
   - Constraint weights for hierarchical penalty system

6. **Supporting Types**:
   - LookupMaps: Fast O(1) access to relationships (teacher→lectures, subdivision→lectures, etc.)
   - GAContext: Container for all data structures needed during evolution
   - GenerationStats: Track best/average/worst fitness per generation for monitoring

**Validation**:

- All types should align with existing Prisma models
- TypeScript compilation should pass with no errors
- Export all types from `types.ts` for use in other modules

**Context Dependencies**:

- Prisma schema files in `/prisma/schema/`
- Existing database models (Lecture, Slot, Teacher, Subdivision, Classroom)

---

### Step 1.2 - Implement Data Transformation Layer

**Status**: ✅ Complete  
**Completed**: 2025-10-29  
**Agent Notes**: Implemented comprehensive data loading with efficient lookup map generation

**Objective**: Create functions to transform Prisma database entities into GA-optimized data structures.

**Requirements**:

1. **Main Data Loader Function**:
   - Load all timetable-related entities from database using Prisma
   - Use appropriate `include` statements to fetch relationships efficiently
   - Transform each entity type to its GA-optimized equivalent
   - Return complete dataset with event count calculation

2. **Lecture Expansion Logic**:
   - Each Lecture with count N becomes N separate schedulable events
   - Generate unique event IDs using lecture ID and session index
   - Pre-calculate total enrollment from associated subdivisions
   - Aggregate required classroom features from all possible classrooms
   - Handle duration requirements (consecutive slots)

3. **Slot Linearization Utilities**:
   - Convert (day, period) pairs to single integer/string slot IDs
   - Implement reverse mapping for result display
   - Ensure bijective mapping (every slot has unique ID, every ID maps to one slot)
   - Consider performance: use simple arithmetic or lookup table

4. **Lookup Map Construction** (Critical for Performance):
   - teacherToLectures: Map teacher IDs to all their lecture event IDs
   - subdivisionToLectures: Map subdivision IDs to all their lecture event IDs
   - classroomFeatures: Map classroom IDs to Set of available features
   - teacherUnavailability: Map teacher IDs to Set of unavailable slot IDs
   - subdivisionUnavailability: Map subdivision IDs to Set of unavailable slot IDs
   - classroomUnavailability: Map classroom IDs to Set of unavailable slot IDs
   - All lookups must be O(1) for constraint checking performance

5. **Data Validation and Error Handling**:
   - Check for empty or insufficient data (no lectures, no slots, etc.)
   - Validate referential integrity (all IDs reference existing entities)
   - Ensure solvability: at least one valid timeslot-classroom pair for each lecture
   - Throw descriptive errors with actionable messages for users
   - Warn about potential issues (very few rooms, high utilization, etc.)

**Validation**:

- Test with actual database data
- Ensure all relationships are correctly mapped
- Verify linearization/delinearization is bijective
- Confirm O(1) lookup performance

**Context Dependencies**:

- Step 1.1 types
- Prisma client and models
- Understanding of current database schema relationships

---

### Step 1.3 - Implement Constraint Checker Module

**Status**: ✅ Complete  
**Completed**: 2025-10-29  
**Agent Notes**: Implemented all hard and soft constraint checkers with hierarchical fitness evaluation

**Objective**: Implement all hard and soft constraint checking functions as defined in Section 1.2 of research.

**Requirements**:

1. **Hard Constraint Checker Functions** (Section 1.2.1):
   - Teacher Clash: Detect if any teacher is assigned multiple lectures in same timeslot
   - Student Clash: Detect if any subdivision has overlapping lectures in same timeslot
   - Room Clash: Detect if any classroom is double-booked in same timeslot
   - Room Capacity: Check if lecture enrollment exceeds assigned classroom capacity
   - Room Features: Verify assigned classroom has all required features for the lecture
   - Teacher Availability: Ensure teachers aren't scheduled during unavailable times
   - Each function should return array of specific violations with gene indices

2. **Soft Constraint Checker Functions** (Section 1.2.2):
   - Idle Time Minimization: Count gaps between first and last class for each subdivision per day
   - Class Distribution: Calculate variance in lectures per day for each course
   - Consecutive Lectures: Count instances of teachers with >2 consecutive teaching periods
   - Additional: Consider cognitive load constraints from existing system
   - Each function returns violations with penalty values

3. **Master Constraint Evaluation**:
   - Single function that calls all constraint checkers
   - Aggregates all violations and calculates total penalties
   - Uses weight system from config (hard = 1000, soft = 1-10 range)
   - Returns comprehensive FitnessResult object
   - Must be highly optimized as called thousands of times per generation

4. **Performance Optimization** (Critical):
   - Pre-group genes by timeslot to avoid O(n²) clash detection
   - Use Map/Set data structures for O(1) lookups, not array iterations
   - Consider caching intermediate results within a generation
   - Profile and optimize hot paths
   - Target: <100ms for full evaluation of 200-event chromosome

5. **Testing Requirements**:
   - Create unit tests for each individual constraint function
   - Test valid chromosomes (should return zero violations)
   - Test chromosomes with specific known violations
   - Test edge cases: empty schedules, single events, maximum capacity
   - Validate penalty calculations match expected values

**Validation**:

- Each constraint function should be independently testable
- Performance: Full constraint check on 200-event chromosome should complete in <100ms
- Accuracy: Manual verification with sample data

**Context Dependencies**:

- Step 1.1 types
- Step 1.2 data structures and lookup maps
- Research Section 1.2.1 and 1.2.2

---

## Phase 2: Genetic Algorithm Core Components

### Step 2.1 - Implement Fitness Function

**Status**: ✅ Complete  
**Completed**: 2025-10-29  
**Agent Notes**: Created fitness.ts with caching, comparison utilities, and statistics functions

**Objective**: Implement the hierarchical penalty-based fitness evaluation system (Research Section 3).

**Requirements**:

1. **Fitness Calculation Function**:
   - Implement the inverse proportional fitness formula: fitness = 1 / (1 + totalPenalty)
   - Total penalty = hardPenalty + softPenalty
   - Ensure numerical stability (handle division by zero, very large penalties)
   - Return comprehensive FitnessResult object

2. **Hierarchical Penalty System**:
   - Hard constraint weight: 1000 per violation (or configurable)
   - Soft constraint weights: 1-10 range based on importance
   - Ensure single hard violation always outweighs all possible soft violations
   - Implement penalty calculation using constraint checker from Step 1.3

3. **Niched-Penalty Comparison (Advanced)**:
   - Implement tournament comparison logic from research Section 3.3
   - Feasible solution always beats infeasible
   - Between feasible: lower soft penalty wins
   - Between infeasible: lower hard penalty wins
   - This creates parameter-less constraint handling

4. **Performance Optimization**:
   - Cache fitness results for identical chromosomes (use hash of gene array)
   - Reuse constraint evaluation results
   - Consider partial re-evaluation for mutation (only changed genes)

5. **Fitness Landscape Analysis** (Optional but Recommended):
   - Track fitness statistics across generations
   - Identify when population is trapped in local optimum
   - Provide data for convergence monitoring

**Validation**:

- Perfect timetable (no violations) should have fitness = 1.0
- Infeasible solution should have fitness << feasible solution
- Fitness should decrease smoothly with increasing violations
- Performance: Fitness evaluation should take <10ms per chromosome

**Context Dependencies**:

- Step 1.1 types (FitnessResult)
- Step 1.3 constraint checker
- Research Section 3

---

### Step 2.2 - Implement Population Initialization

**Status**: ✅ Complete  
**Completed**: 2025-10-29  
**Agent Notes**: Implemented hybrid initialization (random + heuristic) with locked assignment support

**Objective**: Create hybrid population initialization strategy (Research Section 4.1).

**Requirements**:

1. **Random Initialization (80% of population)**:
   - For each gene, randomly select valid timeslot and classroom
   - Ensure randomness across entire search space
   - No bias toward any particular timeslot or room
   - Fast generation: use efficient random selection

2. **Heuristic Initialization (20% of population)**:
   - Implement greedy construction heuristic
   - Priority order: largest enrollment first, or most constrained lectures
   - For each lecture, find first valid (timeslot, classroom) pair
   - Valid = doesn't create immediate hard constraint violation
   - If no valid placement found, use random fallback

3. **Hybrid Population Creation**:
   - Generate mix of random (80%) and heuristic (20%) chromosomes
   - Ensure population size matches config
   - All chromosomes should have correct length (total events to schedule)

4. **Validation and Repair**:
   - Check each initialized chromosome for basic validity
   - Count initial violations for baseline metrics
   - Optionally apply light repair to heuristic solutions
   - Log initialization statistics (avg violations, feasible count)

5. **Diversity Metrics**:
   - Measure initial population diversity (unique gene combinations)
   - Ensure no duplicate chromosomes in initial population
   - Track for debugging and performance analysis

**Validation**:

- Population size should match config exactly
- Each chromosome should have correct length
- Heuristic solutions should generally have fewer violations than random
- Initialization should complete in <5 seconds for population of 200

**Context Dependencies**:

- Step 1.1 types (Chromosome, Gene)
- Step 1.2 data loader (available slots, classrooms)
- Research Section 4.1

---

### Step 2.3 - Implement Selection Operator (Tournament Selection)

**Status**: ✅ Complete  
**Completed**: 2025-10-29  
**Agent Notes**: Implemented tournament selection with niched-penalty comparison and selection statistics

**Objective**: Implement tournament selection with configurable pressure (Research Section 4.2).

**Requirements**:

1. **Tournament Selection Algorithm**:
   - Randomly select k individuals from population (k = tournament size)
   - Compare fitness of all tournament participants
   - Return the individual with highest fitness as winner
   - Repeat to select required number of parents

2. **Niched-Penalty Integration**:
   - Use comparison rules instead of raw fitness values
   - Implement three-way comparison from Step 2.1
   - This makes selection work seamlessly with constraint hierarchy

3. **Configurable Selection Pressure**:
   - Tournament size parameter controls pressure
   - Smaller k (2-3) = lower pressure, more diversity
   - Larger k (5-7) = higher pressure, faster convergence
   - Default should be k=3 (balanced)

4. **Parent Pool Generation**:
   - Select required number of parents for next generation
   - Typical: select popSize parents (allows duplicates)
   - Ensure selection is random each time (don't reuse same random seed)

5. **Statistics Tracking**:
   - Track selection frequency of individuals
   - Identify if selection pressure is too high (one individual dominates)
   - Provide metrics for parameter tuning

**Validation**:

- Fitter individuals should be selected more frequently
- Least fit individuals should still have non-zero selection probability (diversity)
- Selection should be stochastic (different results each run)
- Performance: Selecting 200 parents should take <10ms

**Context Dependencies**:

- Step 2.1 fitness function and comparison logic
- Research Section 4.2

---

### Step 2.4 - Implement Crossover Operator with Repair

**Status**: ✅ Complete  
**Completed**: 2025-10-30  
**Agent Notes**: Implemented uniform crossover with integrated repair mechanism. Created comprehensive repair strategies for all hard constraint violations with limited-attempt heuristic approach.

**Files Created**:

- `src/server/services/timetableGenerator/crossover.ts` - Uniform crossover implementation
- `src/server/services/timetableGenerator/repair.ts` - Repair mechanism for constraint violations
- `src/server/services/timetableGenerator/__tests__/crossover.test.ts` - Validation tests

**Objective**: Implement uniform crossover with integrated repair mechanism (Research Section 4.3).

**Requirements**:

1. **Uniform Crossover**:
   - For each gene position, randomly choose which parent contributes
   - 50% probability for each parent (unbiased mixing)
   - Create two offspring by swapping parent roles
   - Maintain chromosome length and gene structure

2. **Repair Mechanism** (Critical):
   - Immediately after crossover, scan offspring for hard violations
   - Focus on clash-type violations (room, teacher, student)
   - For each violation, attempt to resolve by reassigning timeslot or classroom
   - Try limited number of random reassignments (e.g., 10 attempts)
   - If unresolved, leave as-is (fitness function will penalize)

3. **Repair Strategies**:
   - Room clash: Try different classroom for one conflicting lecture
   - Teacher/Student clash: Try different timeslot for one conflicting lecture
   - Prefer moves that don't create new violations
   - Use greedy approach: first valid move is accepted

4. **Crossover Probability**:
   - Respect crossover probability from config (default 0.9)
   - If crossover doesn't occur, offspring = exact copies of parents
   - Ensure genetic material is still passed to next generation

5. **Performance and Effectiveness**:
   - Repair should be fast: <50ms per offspring
   - Track repair success rate (% of violations fixed)
   - Monitor if repair is improving offspring viability
   - Balance repair effort vs computational cost

**Validation**:

- Offspring should inherit genes from both parents
- Repair should reduce (not eliminate) hard violations
- Crossover should maintain population diversity
- Test with chromosomes known to produce clashes

**Context Dependencies**:

- Step 1.1 types (Chromosome, Gene)
- Step 1.3 constraint checkers (for repair validation)
- Research Section 4.3

---

### Step 2.5 - Implement Mutation Operator

**Status**: ✅ Complete  
**Completed**: 2025-10-30  
**Agent Notes**: Implemented multi-strategy mutation (swap + random reset) with locked gene preservation and configurable probabilities

**Files Created**:

- `src/server/services/timetableGenerator/mutation.ts` - Mutation operator implementation (~265 lines)
- `src/server/services/timetableGenerator/__tests__/mutation.test.ts` - Comprehensive test suite (~420 lines)

**Objective**: Implement multi-strategy mutation for diversity maintenance (Research Section 4.4).

**Requirements**:

1. **Swap Mutation (Primary Strategy - 90%)**:
   - Select two random genes in chromosome
   - Swap their (timeslotId, classroomId) assignments
   - Maintains overall solution structure with local perturbation
   - Fast and preserves good building blocks

2. **Random Reset Mutation (Secondary Strategy - 10%)**:
   - Select one random gene
   - Assign completely new random (timeslotId, classroomId)
   - Introduces more significant novelty
   - Helps escape local optima

3. **Mutation Probability Control**:
   - Respect mutation probability from config (default 0.05)
   - Apply per chromosome, not per gene
   - When mutation occurs, choose strategy based on sub-probabilities

4. **Constraint-Aware Mutation (Optional Enhancement)**:
   - Bias random reset toward valid assignments
   - Check if new assignment creates immediate clash
   - Retry if obvious violation (limited attempts)
   - Balance between exploration and maintaining feasibility

5. **Adaptive Mutation (Optional)**:
   - Increase mutation rate if population diversity is low
   - Decrease if too many infeasible solutions
   - Monitor diversity metrics from population
   - Dynamically adjust mutation probability

**Validation**:

- Mutation should introduce variation without destroying good solutions
- Mutation rate should match configured probability
- Test that both strategies are being applied
- Performance: Mutation should take <5ms per chromosome

**Context Dependencies**:

- Step 1.1 types (Chromosome, Gene)
- Step 1.2 data (available slots, classrooms for random reset)
- Research Section 4.4

---

### Step 2.6 - Implement Elitism and Population Replacement

**Status**: ✅ Complete
**Completed**: 2025-10-30
**Agent Notes**: Implemented elitism and replacement strategy, ensuring the best individuals from a generation are carried over to the next. This guarantees monotonic improvement of the best solution.

**Files Created**:

- `src/server/services/timetableGenerator/replacement.ts` - Elitism and replacement logic.
- `src/server/services/timetableGenerator/__tests__/replacement.test.ts` - Test suite.

**Objective**: Implement elitism to preserve best solutions (Research Section 4.5).

**Requirements**:

1. **Elite Selection**:
   - Identify top N individuals from current population
   - N = elitismRate × populationSize (default 2%, so 4 elites for pop=200)
   - Sort population by fitness to find elites
   - Handle ties in fitness scores consistently

2. **Elite Preservation**:
   - Copy elite individuals directly to next generation
   - No crossover or mutation applied to elites
   - Guarantees best solution never gets worse

3. **Population Replacement Strategy**:
   - Fill remaining slots with offspring from crossover/mutation
   - Total next generation = elites + offspring
   - Ensure population size remains constant
   - Handle edge cases (very small populations, high elitism rate)

4. **Diversity Monitoring**:
   - Check if elites are dominating population (many duplicates)
   - Warn if diversity drops too low
   - Consider diversity preservation mechanisms

5. **Generational Statistics**:
   - Track best fitness over generations
   - Track average fitness of population
   - Identify stagnation (best fitness not improving)
   - Log for analysis and debugging

**Validation**:

- Best fitness should never decrease across generations
- Population size should remain constant
- Elites should appear in next generation unchanged
- Test with various elitism rates (0%, 2%, 5%)

**Context Dependencies**:

- Step 2.1 fitness function
- All previous genetic operators
- Research Section 4.5

---

## Phase 3: Algorithm Integration & Execution Control

### Step 3.1 - Implement Main GA Loop

**Status**: ✅ Complete
**Completed**: 2025-10-30
**Agent Notes**: Implemented the main evolutionary loop in `algorithm.ts`, integrating all core genetic operators. The loop now orchestrates the entire process from population initialization to termination.

**Files Created**:

- `src/server/services/timetableGenerator/algorithm.ts` - The main GA loop.
- `src/server/services/timetableGenerator/__tests__/algorithm.test.ts` - Integration test for the main loop.

**Objective**: Integrate all GA components into main evolutionary loop.

**Requirements**:

1. **Algorithm Initialization**:
   - Load timetable data using Step 1.2 data loader
   - Create initial population using Step 2.2 initializer
   - Evaluate fitness of all initial individuals
   - Initialize statistics tracking structures
   - Set up configuration parameters

2. **Main Evolutionary Loop**:
   - For each generation up to maxGenerations:
     - Select parents using tournament selection
     - Apply crossover to create offspring
     - Apply mutation to offspring
     - Evaluate fitness of all offspring
     - Combine elites with offspring for next population
     - Update statistics and check termination conditions

3. **Termination Conditions** (Research Section 5.2):
   - Max generations reached
   - Fitness stagnation: no improvement for N generations (default 100)
   - Feasible solution found (if configured to stop early)
   - Timeout (wall-clock time limit)
   - Manual cancellation (check job status periodically)

4. **Progress Tracking**:
   - Update job progress in database every generation or every N generations
   - Calculate percentage complete based on generations
   - Report best fitness, violations count
   - Estimate time remaining based on generation speed

5. **Memory and Performance**:
   - Avoid memory leaks (properly dispose of old populations)
   - Monitor memory usage for large populations
   - Optimize hot paths identified through profiling
   - Consider generational garbage collection

**Validation**:

- Algorithm should complete or terminate gracefully
- Best fitness should improve over generations (generally)
- Progress should be accurately reported
- Test with small problem (10 lectures) to verify correctness

**Context Dependencies**:

- All Phase 1 and Phase 2 components
- Research Section 5

---

### Step 3.2 - Implement Configuration Management

**Status**: ✅ Complete  
**Completed**: 2025-10-30  
**Agent Notes**: Created comprehensive configuration system with defaults, validation, preset modes, and proper type safety. All test files updated to use config.ts exports.

**Files Created/Modified**:

- `src/server/services/timetableGenerator/config.ts` (created)
- `src/server/services/timetableGenerator/__tests__/config.test.ts` (created)
- Updated all test files to import DEFAULT_GA_CONFIG from config.ts
- Fixed PartialGAConfig type to properly support partial constraint weights

**Objective**: Create configuration system with defaults and validation.

**Requirements**:

1. **Default Configuration** (Research Table 3):
   - populationSize: 200
   - maxGenerations: 1000
   - crossoverProbability: 0.9
   - mutationProbability: 0.05
   - tournamentSize: 3
   - elitismRate: 0.02
   - stagnationLimit: 100
   - hardPenaltyWeight: 1000
   - Soft penalty weights: idleTime=5, distribution=3, consecutive=8

2. **Configuration Validation**:
   - Validate all parameters are within acceptable ranges
   - Population size: 50-1000
   - Probabilities: 0.0-1.0
   - Tournament size: 2-10
   - Throw errors for invalid configurations

3. **Configuration Merging**:
   - Accept partial config from user (via tRPC endpoint)
   - Merge with defaults for any missing values
   - Allow advanced users to tune parameters
   - Log final configuration being used

4. **Preset Configurations**:
   - Fast mode: Small population, fewer generations
   - Balanced mode: Default settings
   - Thorough mode: Large population, more generations
   - Make it easy to select presets via UI

5. **Parameter Documentation**:
   - Document effect of each parameter
   - Provide guidance on when to adjust parameters
   - Include examples of good configurations for different problem sizes

**Validation**:

- Invalid configs should be rejected with clear error messages
- Default config should work well for typical problems
- Test merging with various partial configs

**Context Dependencies**:

- Step 1.1 types (GAConfig)
- Research Section 5.1 (Table 3)

---

### Step 3.3 - Implement Result Persistence and Job Management

**Status**: ✅ Complete
**Completed**: 2025-10-30
**Agent Notes**: Created jobManager.ts to handle async execution, status/progress updates, result persistence, and cancellation. Modified generateRouter.ts to use the new job manager, starting jobs in the background. Fixed cancel logic and updated module exports.

**Objective**: Handle asynchronous job execution and result storage.

**Requirements**:

1. **Asynchronous Execution**:
   - Run GA in background (don't block tRPC response)
   - Use async/await properly to avoid blocking Node event loop
   - Consider worker threads for true parallelism (optional)
   - Handle errors and exceptions gracefully

2. **Job Status Updates**:
   - Update job record in database throughout execution
   - Status transitions: PENDING → IN_PROGRESS → COMPLETED/FAILED
   - Update progress field (0-100) based on generation count
   - Store intermediate results for resumability (optional)

3. **Result Serialization**:
   - Convert best chromosome to LectureSlot assignments
   - Store in database using Prisma
   - Delete existing LectureSlot records for timetable first
   - Create new LectureSlot records from chromosome genes
   - Mark locked slots if user had pre-assigned any lectures

4. **Error Handling**:
   - Catch all errors during execution
   - Store error message in job.error field
   - Set status to FAILED
   - Provide actionable error messages to user
   - Don't corrupt database on failure

5. **Job Cancellation**:
   - Periodically check job.status in database
   - If changed to CANCELLED externally, stop algorithm gracefully
   - Clean up resources and update final status
   - Allow user to cancel long-running jobs

**Validation**:

- Job status should accurately reflect execution state
- Results should be correctly persisted to database
- Cancelled jobs should stop within reasonable time (few seconds)
- Failed jobs should not leave partial/corrupt data

**Context Dependencies**:

- Step 3.1 main algorithm
- Existing Job model and generateRouter
- Prisma client for database operations

---

## Phase 4: Result Decoding & Integration

### Step 4.1 - Implement Chromosome Decoder

**Status**: ✅ Complete
**Completed**: 2025-10-30
**Agent Notes**: Created a dedicated `decoder.ts` module to handle the translation of the final chromosome into usable formats. Moved the logic for creating `LectureSlot` records from `jobManager.ts` to the new module. Also implemented a `chromosomeToJSON` function to create a rich, human-readable JSON output as specified in the research documentation.

**Objective**: Transform best chromosome into usable timetable format (Research Section 7).

**Requirements**:

1. **Gene to LectureSlot Mapping**:
   - For each gene in best chromosome:
     - Extract lectureId (base lecture, not session ID)
     - Extract timeslotId and classroomId
     - Create LectureSlot database record linking lecture to slot
     - Create LectureClassroom record if not already exists

2. **Handle Multi-Session Lectures**:
   - Original lecture with count=3 produced 3 genes
   - All 3 should map back to same lectureId
   - Create 3 separate LectureSlot records
   - Ensure each session has different timeslot

3. **Data Denormalization for Display**:
   - Generate complete event objects with all details
   - Include course name, teacher name, room name, subdivision names
   - Calculate day and period from linearized slot ID
   - Format times for human readability

4. **Multiple View Formats**:
   - Weekly grid view (days × periods matrix)
   - Teacher schedule view (per teacher)
   - Subdivision schedule view (per student group)
   - Room utilization view (per classroom)
   - All views derived from same base chromosome

5. **JSON Export Structure** (Research Section 7.2):
   - Create hierarchical JSON matching research specification
   - Include metadata: timetableId, generation date, fitness score, violations
   - Include complete schedule array with all event details
   - Make format compatible with frontend consumption

**Validation**:

- Every gene should produce exactly one LectureSlot record
- No duplicate LectureSlot records (same lecture + slot)
- All data should be consistent with database relationships
- JSON should be valid and parseable

**Context Dependencies**:

- Step 1.1 types (Chromosome, Gene)
- Step 1.2 data transformation (reverse mapping)
- Research Section 7
- Prisma models (LectureSlot, LectureClassroom)

---

### Step 4.2 - Implement Timetable Validation and Quality Metrics

**Status**: ✅ Complete
**Completed**: 2025-10-30
**Agent Notes**: Created a `validator.ts` module to perform post-generation validation and calculate high-level quality metrics like room utilization and teacher load balance. Integrated this into the `jobManager` to store a quality report with the final job results.

**Objective**: Validate final timetable and calculate quality metrics.

**Requirements**:

1. **Post-Generation Validation**:
   - Re-run all constraint checks on final solution
   - Verify hardPenalty = 0 (if feasible solution found)
   - Count and categorize all soft constraint violations
   - Generate detailed violation report

2. **Quality Metrics Calculation**:
   - Room utilization percentage
   - Teacher load balance (variance in hours per teacher)
   - Student schedule quality (compactness, gaps)
   - Cognitive load distribution (use existing cognitive load utils)
   - Overall satisfaction score

3. **Comparison with Previous Timetables**:
   - If timetable was previously generated, load old results
   - Compare quality metrics
   - Highlight improvements or degradations
   - Provide decision support for accepting new timetable

4. **Feasibility Certification**:
   - Clearly indicate if timetable is clash-free and valid
   - List any remaining hard violations (shouldn't be any)
   - Provide confidence score or quality grade (A/B/C)

5. **Report Generation**:
   - Create human-readable summary report
   - Include statistics, metrics, violation details
   - Export as JSON for UI display
   - Optionally generate PDF report (future enhancement)

**Validation**:

- Validator should catch any violations GA missed
- Metrics should match manual calculations
- Report should be clear and actionable for users

**Context Dependencies**:

- Step 1.3 constraint checkers
- Step 4.1 decoder
- Existing cognitive load utilities

---

## Phase 5: User Interface Integration

### Step 5.1 - Create Generation UI Component

**Status**: ✅ Complete  
**Completed**: 2025-10-30  
**Agent Notes**: Implemented complete generation UI with controls, progress tracking, and results display using Material-UI v7

**Files Created**:

- `src/routes/tt/$timetableId/generate.tsx` - Main generation route
- `src/components/Generation/GenerationControls.tsx` - Configuration and preset selector
- `src/components/Generation/GenerationProgress.tsx` - Real-time progress display
- `src/components/Generation/GenerationResults.tsx` - Results visualization
- `src/components/Generation/index.ts` - Component exports

**Objective**: Create user interface for timetable generation workflow.

**Requirements**:

1. **Generation Control Panel**:
   - Start generation button with configuration options
   - Preset selector (Fast/Balanced/Thorough)
   - Advanced options expander for parameter tuning
   - Validation of user inputs before starting
   - Integration with existing useJobs hook

2. **Real-Time Progress Display**:
   - Progress bar showing generation completion
   - Live updates using polling (already in useJobs)
   - Display current generation number, best fitness
   - Show estimated time remaining
   - Real-time violation count display

3. **Job Status Management**:
   - Show list of all generation jobs for timetable
   - Status indicators (pending, running, completed, failed)
   - Cancel button for running jobs
   - View results button for completed jobs
   - Delete old job records

4. **Results Visualization**:
   - Display final timetable in grid format
   - Use existing timetable display components if available
   - Show quality metrics and statistics
   - Highlight any remaining violations
   - Compare with previous version

5. **Error Handling and Feedback**:
   - Clear error messages for failures
   - Guidance on fixing common issues
   - Snackbar notifications for status changes
   - Loading states and skeletons during generation

**Validation**:

- UI should be responsive and not freeze during generation
- Progress updates should appear smoothly
- Test with actual generation jobs
- Ensure Material-UI v7 components are used throughout

**Context Dependencies**:

- Existing useJobs hook
- Material-UI v7 components
- TanStack Router patterns
- Existing timetable display components

---

### Step 5.2 - Integrate with Collections System

**Status**: ❌ CANCELLED (Already Exists)  
**Completed**: 2025-10-30  
**Agent Notes**: Discovered that complete timetable viewing and editing infrastructure already exists at `/tt/$timetableId/edit/` with drag-and-drop functionality. No need to rebuild. Only need to add automatic collection refresh after generation.

**Why Cancelled**:

The project already has:

1. ✅ Complete timetable grid component with Material-UI Table at `src/routes/tt/$timetableId/edit/-MuiTimetable.tsx`
2. ✅ Drag-and-drop lecture slot editing using @dnd-kit
3. ✅ LectureSlot and LectureClassroom collections already registered in CollectionProvider
4. ✅ Lock/unlock functionality via `isLocked` field in Prisma schema
5. ✅ Conflict detection and display in drawer component
6. ✅ Manual editing capabilities fully functional

**What Was Actually Needed**:

Only automatic collection invalidation after generation completes. This has been implemented by:

- Adding `useQueryClient` import in GenerationResults component
- Detecting when job status changes to "COMPLETED"
- Invalidating lectureSlot and lectureClassroom collections
- This triggers automatic UI refresh in the existing edit view

**Translation Layer**: None needed. The GA's `chromosomeToLectureSlots()` function in `decoder.ts` already outputs the exact Prisma format that the existing UI consumes (LectureSlot records with lectureId, slotId, classroomId, isLocked fields).

**Files Modified**:

- `src/components/Generation/GenerationResults.tsx` - Added collection invalidation on job completion

**Original Requirements Status**:

1. ✅ Automatic Collection Refresh - Implemented via queryClient.invalidateQueries
2. ✅ Optimistic Updates - Not needed, server-side generation with proper loading states
3. ✅ Manual Override Support - Already exists in edit view with lock functionality
4. ✅ Collection Query Integration - Already working, existing views use useLiveQuery
5. ⏳ Rollback Mechanism - Future enhancement, not critical (can be added later)

**Context Dependencies**:

- Existing edit route at `src/routes/tt/$timetableId/edit/`
- LectureSlot and LectureClassroom collections
- TanStack Query invalidation API
- No need to build new components

---

## Phase 6: Advanced Enhancements & Optimization

### Step 6.1 - Implement Local Search Hybridization (Memetic Algorithm)

**Status**: ⏳ Not Started  
**Estimated Effort**: 5-6 hours  
**Files to Create/Modify**:

- `src/server/services/timetableGenerator/localSearch.ts` (new)
- Modify `src/server/services/timetableGenerator/algorithm.ts`

**Objective**: Enhance GA with local search for faster convergence (Research Section 6.1).

**Requirements**:

1. **Hill Climbing Local Search**:
   - After crossover/mutation, apply local search to offspring
   - Try small local moves: swap two genes, move one gene to nearby slot
   - Accept moves that improve fitness
   - Limit iterations (e.g., 20 moves) to avoid excessive computation

2. **Move Neighborhood Definition**:
   - Swap moves: Exchange two genes' assignments
   - Shift moves: Change one gene's timeslot to adjacent period
   - Room reassignment: Change gene's classroom without changing time
   - Define which moves are "neighbors" in search space

3. **Simulated Annealing Variant** (Alternative):
   - Accept worsening moves with probability based on temperature
   - Cool temperature over iterations
   - Helps escape local optima while still improving
   - More sophisticated than pure hill climbing

4. **Selective Application**:
   - Don't apply to all offspring (too expensive)
   - Apply to promising offspring (e.g., those with fitness > threshold)
   - Balance exploitation (local search) vs exploration (GA)

5. **Performance Tuning**:
   - Local search shouldn't dominate computation time
   - Target: <100ms per local search invocation
   - Monitor if it's actually improving results
   - Make it configurable (can be disabled)

**Validation**:

- Solutions should improve faster with local search enabled
- Compare convergence with and without memetic hybridization
- Ensure it doesn't slow down algorithm excessively
- Test on various problem sizes

**Context Dependencies**:

- Step 2.1 fitness evaluation
- Step 3.1 main algorithm
- Research Section 6.1

---

### Step 6.2 - Context-Specific Performance Enhancements

**Status**: ⏳ Not Started  
**Estimated Effort**: 6-8 hours  
**Files to Create/Modify**:

- `src/server/services/timetableGenerator/contextEnhancements.ts` (new)
- Modify constraint checkers and fitness function

**Objective**: Implement optimizations tailored to the specific database schema and constraints.

**Requirements**:

1. **Cognitive Load-Aware Initialization**:
   - Use existing cognitive load tracking system
   - Initialize heuristically to balance cognitive load across subdivisions
   - Avoid scheduling heavy subjects consecutively for same group
   - Use cognitive load data from db-collections/cognitiveLoadCollection

2. **Subdivision-Specific Constraints**:
   - Respect subdivision unavailability (already in schema)
   - Add soft constraint for subdivision preferences (if data exists)
   - Balance workload across days for each subdivision
   - Minimize back-to-back heavy courses

3. **Teacher Workload Balancing**:
   - Implement soft constraint for even distribution of teaching hours
   - Avoid scheduling teacher for too many consecutive periods
   - Respect teacher preferences for morning/afternoon slots
   - Track cognitive load on teachers as well as students

4. **Classroom Optimization**:
   - Prefer assigning lectures to classrooms with minimal excess capacity
   - Minimize classroom changes for same teacher/subdivision
   - Consider classroom proximity if location data available
   - Optimize room utilization across the week

5. **Duration Handling for Multi-Slot Lectures**:
   - Lectures with duration > 1 need consecutive slots
   - Ensure consecutive slots are in same day
   - Don't split across lunch breaks if such breaks exist
   - Verify no clashes for entire duration block

6. **Pre-Assignment and Locking**:
   - Support LectureSlot.isLocked flag from schema
   - Locked assignments must be preserved in initial population
   - Never mutate or crossover locked genes
   - Build GA around existing fixed assignments

7. **Smart Repair Strategies**:
   - When repairing room clash, try similar capacity rooms first
   - When repairing teacher clash, try adjacent timeslots
   - Use domain knowledge to make repairs more likely to succeed
   - Learn from failed repairs to improve strategy

8. **Incremental Re-optimization**:
   - If timetable already exists, use as seed for population
   - Apply small perturbations to existing solution
   - Faster re-generation for minor constraint changes
   - Useful for iterative refinement workflow

**Validation**:

- Generate timetables and verify enhancements are active
- Compare quality metrics with base implementation
- Ensure cognitive load is balanced in results
- Test locked slot preservation
- Verify multi-slot lectures are scheduled correctly

**Context Dependencies**:

- All previous steps
- Existing cognitive load utilities
- Database schema (Subdivision, LectureSlot, Classroom, Teacher)
- Real-world usage patterns and requirements

---

### Step 6.3 - Parallel Execution Support (Optional)

**Status**: ⏳ Not Started  
**Estimated Effort**: 6-8 hours  
**Files to Create/Modify**:

- `src/server/services/timetableGenerator/parallel.ts` (new)
- Modify main algorithm for parallel execution

**Objective**: Implement parallelization for large-scale problems (Research Section 6.2).

**Requirements**:

1. **Island Model Implementation**:
   - Split population into N islands (sub-populations)
   - Run independent GA on each island in separate thread
   - Periodically migrate best individuals between islands
   - Merge results at end to find global best

2. **Worker Thread Setup**:
   - Use Node.js worker_threads for true parallelism
   - Serialize/deserialize data for thread communication
   - Handle thread lifecycle (spawn, communicate, terminate)
   - Ensure thread-safe operations

3. **Migration Strategy**:
   - Every M generations, exchange top K individuals between islands
   - Use ring topology (island i sends to island (i+1) mod N)
   - Balance migration frequency vs independence
   - Default: migrate 2 individuals every 20 generations

4. **Load Balancing**:
   - Distribute computation evenly across available cores
   - Monitor thread performance and adjust if needed
   - Handle failures gracefully (one thread crash doesn't kill all)

5. **Configuration**:
   - Number of islands should match CPU cores (or be configurable)
   - Should be optional (disable for small problems)
   - Auto-detect available cores and recommend configuration

**Validation**:

- Verify speedup on multi-core systems
- Ensure results quality doesn't degrade
- Test with 2, 4, 8 islands
- Check memory usage doesn't explode

**Context Dependencies**:

- All Phase 1-3 components
- Node.js worker_threads API
- Research Section 6.2

---

## Phase 7: Testing, Documentation & Deployment

### Step 7.1 - Comprehensive Testing Suite

**Status**: ⏳ Not Started  
**Estimated Effort**: 6-8 hours  
**Files to Create/Modify**:

- `src/server/services/timetableGenerator/__tests__/` (new directory)
- Test files for each module

**Objective**: Create thorough test coverage for all GA components.

**Requirements**:

1. **Unit Tests**:
   - Test each constraint checker independently
   - Test fitness function with known inputs/outputs
   - Test genetic operators (selection, crossover, mutation)
   - Test data transformation and loading functions
   - Aim for >80% code coverage

2. **Integration Tests**:
   - Test complete GA execution on small problems
   - Verify correct integration of all components
   - Test job management workflow
   - Test result persistence and retrieval

3. **Performance Tests**:
   - Benchmark constraint checking speed
   - Benchmark fitness evaluation
   - Benchmark full generation run
   - Ensure performance meets targets from steps above

4. **Edge Case Tests**:
   - Empty timetables, single lecture
   - Over-constrained problems (no feasible solution)
   - Under-constrained problems (many solutions)
   - Large problems (stress test)

5. **Regression Tests**:
   - Create test cases from real usage
   - Ensure bug fixes don't reintroduce bugs
   - Test with actual database data (anonymized)

**Validation**:

- All tests should pass
- No flaky tests (random failures)
- Tests should run in reasonable time
- Coverage report should show good coverage

**Context Dependencies**:

- All implemented components
- Testing framework (Jest, Vitest, or similar)

---

### Step 7.2 - Documentation and User Guide

**Status**: ⏳ Not Started  
**Estimated Effort**: 4-5 hours  
**Files to Create/Modify**:

- `memory-bank/tt-gen/implementation-guide.md` (new)
- `memory-bank/tt-gen/user-guide.md` (new)
- Update README.md

**Objective**: Create comprehensive documentation for developers and users.

**Requirements**:

1. **Developer Documentation**:
   - Architecture overview of GA implementation
   - Explanation of each module and its responsibilities
   - Data flow diagrams
   - API documentation for key functions
   - Guide for extending or modifying the algorithm

2. **User Guide**:
   - How to use timetable generation feature
   - Explanation of configuration options
   - How to interpret results and quality metrics
   - Troubleshooting common issues
   - Best practices for data preparation

3. **Algorithm Explanation**:
   - Simplified explanation of genetic algorithms
   - How constraints are handled
   - What the parameters mean and how to tune them
   - Expected runtime and resource usage

4. **Configuration Guide**:
   - When to use Fast/Balanced/Thorough presets
   - How to adjust parameters for specific needs
   - Examples of good configurations for different scenarios

5. **Code Documentation**:
   - JSDoc comments for all public functions
   - Clear variable and function naming
   - Inline comments for complex logic
   - Type documentation

**Validation**:

- Documentation should be accurate and up-to-date
- Non-technical users should understand user guide
- Developers should be able to extend system using docs

**Context Dependencies**:

- All implemented code
- User feedback and common questions

---

### Step 7.3 - Monitoring, Logging, and Debugging Tools

**Status**: ⏳ Not Started  
**Estimated Effort**: 3-4 hours  
**Files to Create/Modify**:

- `src/server/services/timetableGenerator/monitoring.ts` (new)
- Modify algorithm to add logging hooks

**Objective**: Add comprehensive monitoring and debugging capabilities.

**Requirements**:

1. **Structured Logging**:
   - Log key events: generation start/complete, errors
   - Log performance metrics: generation time, fitness evolution
   - Use appropriate log levels (debug, info, warn, error)
   - Include context: timetableId, jobId, timestamp

2. **Performance Monitoring**:
   - Track time spent in each algorithm phase
   - Identify bottlenecks and slow operations
   - Log memory usage periodically
   - Alert if performance degrades unexpectedly

3. **Convergence Monitoring**:
   - Export fitness evolution data for plotting
   - Track diversity metrics over generations
   - Identify premature convergence
   - Detect stagnation early

4. **Debug Mode**:
   - Verbose logging when enabled
   - Dump intermediate populations to file
   - Step-by-step constraint evaluation logging
   - Useful for troubleshooting specific problems

5. **Analytics and Metrics**:
   - Track success rate (% of jobs that find feasible solution)
   - Average runtime by problem size
   - Most common failure reasons
   - Usage statistics

**Validation**:

- Logs should be informative but not overwhelming
- Debug mode should provide detailed insights
- Monitoring shouldn't significantly impact performance

**Context Dependencies**:

- All algorithm components
- Logging framework (Winston, Pino, or similar)

---

## Completion Checklist

Before considering the implementation complete, verify:

- [ ] All phases and steps are marked complete
- [ ] TypeScript compiles with zero errors (`npx tsc --noEmit`)
- [ ] All tests pass
- [ ] Code is formatted and linted (`npm run check`)
- [ ] Documentation is complete and accurate
- [ ] Successfully generated timetable for real data
- [ ] UI integration works smoothly
- [ ] Performance meets all targets specified in steps
- [ ] No memory leaks in long-running generations
- [ ] Error handling is comprehensive
- [ ] User guide is clear and helpful

## Success Metrics

The implementation will be considered successful when:

1. **Functional**: Can generate clash-free timetables for typical university scenarios (50-200 lectures)
2. **Performance**: Completes generation in <10 minutes for typical problems
3. **Quality**: Produces timetables with minimal soft constraint violations
4. **Reliable**: Successfully completes generation >95% of the time
5. **Usable**: Non-technical users can successfully use the feature
6. **Maintainable**: Well-documented code that can be extended

---

_Last updated: October 29, 2025_  
_Implementation not yet started_
