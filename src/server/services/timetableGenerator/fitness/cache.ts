import { evaluateChromosome } from "../constraints";
import type {
  Chromosome,
  ConstraintWeights,
  FitnessResult,
  GAInputData,
} from "../types";

// Internal: Generate a hash key for a chromosome for caching purposes.
// Uses a simple string representation of gene assignments.
// Format: "lectureEventId:timeslotId|..."
// NOTE: classroomId is not included because classrooms are immutable per lecture
function hashChromosome(chromosome: Chromosome): string {
  return chromosome
    .map((gene) => `${gene.lectureEventId}:${gene.timeslotId}`)
    .join("|");
}

/**
 * Cache for storing fitness evaluations to avoid redundant calculations.
 * The cache is generation-scoped and uses an LRU eviction strategy
 * to prevent unbounded memory growth with large populations.
 */
export class FitnessCache {
  private cache: Map<string, FitnessResult> = new Map();
  private hits = 0;
  private misses = 0;
  private maxSize: number;

  /**
   * @param maxSize - Maximum cache entries (default: 2x population size or 2000)
   */
  constructor(maxSize = 2000) {
    this.maxSize = maxSize;
  }

  /**
   * Get fitness result from cache, or evaluate and cache if not present.
   */
  get(
    chromosome: Chromosome,
    inputData: GAInputData,
    weights: ConstraintWeights,
  ): FitnessResult {
    const key = hashChromosome(chromosome);
    const cached = this.cache.get(key);

    if (cached) {
      this.hits++;
      // LRU: Move to end by deleting and re-inserting
      this.cache.delete(key);
      this.cache.set(key, cached);
      return cached;
    }

    this.misses++;
    const result = evaluateChromosome(chromosome, inputData, weights);

    // Enforce size limit using LRU eviction
    if (this.cache.size >= this.maxSize) {
      // Delete oldest entry (first item in Map)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, result);
    return result;
  }

  /**
   * Directly cache a fitness result (useful for external evaluation).
   */
  set(chromosome: Chromosome, result: FitnessResult): void {
    const key = hashChromosome(chromosome);

    // Enforce size limit
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, result);
  }

  /**
   * Clear the cache (should be called periodically to free memory).
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics for performance monitoring.
   */
  getStats(): { size: number; hits: number; misses: number; hitRate: number } {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }
}
