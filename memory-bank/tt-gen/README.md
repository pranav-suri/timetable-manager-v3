# Timetable Generation Implementation Guide

## Overview

This directory contains comprehensive documentation for implementing a Genetic Algorithm-based timetable generation system for the university timetabling problem.

## Documents

### 1. `research.md`

**Purpose**: Theoretical foundation and algorithm design

**Contents**:

- Formal problem definition as Constraint Satisfaction and Optimization Problem (CSOP)
- Input entity specifications aligned with our database schema
- Hard and soft constraint categorization with mathematical formulations
- Direct chromosome encoding scheme
- Hierarchical penalty-based fitness function design
- Detailed genetic operator specifications (selection, crossover, mutation, elitism)
- Parameter tuning guidelines with empirical ranges
- Advanced enhancements (memetic algorithms, parallelization)
- **NEW Section 6.3**: Context-specific performance enhancements tailored to our Prisma schema and TanStack DB architecture

**Key Sections**:

- Section 1: Problem formalization
- Section 2: Chromosome representation
- Section 3: Fitness evaluation
- Section 4: Genetic operators
- Section 5: Configuration and execution control
- Section 6: Advanced enhancements (including context-specific optimizations)
- Section 7: Result decoding and JSON serialization

### 2. `steps.md`

**Purpose**: Detailed, step-by-step implementation roadmap

**Structure**: 7 phases, 20+ individual steps, each designed for independent completion

**Phases**:

1. **Foundation & Data Structures** (3 steps)
   - Type definitions
   - Data transformation layer
   - Constraint checking infrastructure

2. **Genetic Algorithm Core** (6 steps)
   - Fitness function
   - Population initialization
   - Selection operator
   - Crossover with repair
   - Mutation operator
   - Elitism and replacement

3. **Algorithm Integration** (3 steps)
   - Main GA loop
   - Configuration management
   - Job management and persistence

4. **Result Decoding** (2 steps)
   - Chromosome decoder
   - Validation and quality metrics

5. **UI Integration** (2 steps)
   - Generation UI components
   - Collections system integration

6. **Advanced Enhancements** (3 steps)
   - Memetic algorithm implementation
   - Context-specific optimizations
   - Parallel execution (optional)

7. **Testing & Deployment** (3 steps)
   - Comprehensive test suite
   - Documentation
   - Monitoring and debugging tools

**Key Features**:

- Each step includes detailed requirements, validation criteria, and context dependencies
- Estimated effort for each step
- Clear instructions for AI agents (no code snippets in instructions)
- Completion template requiring 250-line summaries and next-step guidance
- Success metrics and completion checklist

## How to Use This Documentation

### For Implementation Agents

1. **Start here**: Read this README to understand the overall structure
2. **Read research**: Review `research.md` for theoretical understanding
3. **Check steps**: Open `steps.md` and find your assigned step
4. **Gather context**: Follow the "Context Dependencies" to read necessary background
5. **Implement**: Complete the step according to requirements
6. **Update**: Add completion summary and next-step instructions to `steps.md`
7. **Validate**: Run type checking, tests, and quality checks

### For Project Managers

- Track progress by monitoring step completion status in `steps.md`
- Phases 1-3 are prerequisites for a working system
- Phases 4-5 make it usable
- Phases 6-7 optimize and productionize

### For Users/Stakeholders

- Read Section 6.3 of `research.md` to understand context-specific features
- Focus on practical benefits: cognitive load balancing, locked slots, incremental optimization
- Quality metrics and comparison features explained in Phase 4

## Context-Specific Features

Our implementation goes beyond generic GA frameworks with:

1. **Cognitive Load Integration**: Balances student workload using existing cognitive load tracking
2. **Locked Slot Support**: Allows manual pre-assignment of critical lectures
3. **Duration Handling**: Properly schedules multi-slot lectures with consecutive periods
4. **Subdivision Unavailability**: Respects student group availability constraints
5. **Incremental Re-optimization**: Warm-start from existing timetables for faster refinement
6. **Collection System Integration**: Seamless integration with TanStack DB architecture
7. **Smart Repair**: Domain-aware conflict resolution strategies
8. **Multi-Objective Optimization**: Balance multiple quality dimensions simultaneously

## Current Status

**Last Updated**: October 29, 2025  
**Phase**: Not Started  
**Next Step**: Step 1.1 - Define Core Data Types & Interfaces

## Dependencies

### Technical Stack

- TypeScript
- Prisma ORM
- tRPC for API
- TanStack DB for client-side data
- Material-UI v7 for UI
- Node.js for server

### Domain Knowledge Required

- Genetic algorithms and evolutionary computation
- Constraint satisfaction problems
- University timetabling domain
- Our specific database schema (Prisma models)

## Success Criteria

A successful implementation will:

1. Generate clash-free timetables for 50-200 lecture scenarios
2. Complete in <10 minutes for typical problems
3. Produce high-quality schedules with minimal soft violations
4. Integrate seamlessly with existing UI/collections
5. Provide clear error messages and diagnostics
6. Support iterative refinement workflow

## References

The research document includes 55+ citations to academic literature on genetic algorithms, timetabling, and constraint satisfaction. Key foundational papers are referenced throughout.

## Questions or Issues?

- Check `memory-bank/systemPatterns.md` for architectural patterns
- Review `memory-bank/activeContext.md` for current project state
- See `.github/copilot-instructions.md` for coding standards
- Consult Prisma schema in `prisma/schema/` for data model

---

**Note**: This is a comprehensive, production-ready implementation plan. Each step is designed to be completable by an AI agent with proper context. Follow the instructions carefully and maintain the high quality standards outlined in the project guidelines.
