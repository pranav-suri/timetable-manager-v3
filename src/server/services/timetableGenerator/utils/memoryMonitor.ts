/**
 * @file memoryMonitor.ts
 * @description Utilities for monitoring and managing memory usage during GA runs.
 */

/**
 * Get current memory usage statistics.
 */
export function getMemoryStats() {
  const mem = process.memoryUsage();
  return {
    heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
    heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
    rssMB: Math.round(mem.rss / 1024 / 1024),
    externalMB: Math.round(mem.external / 1024 / 1024),
    heapUsagePercent: Math.round((mem.heapUsed / mem.heapTotal) * 100),
  };
}

/**
 * Log memory statistics with optional prefix.
 */
export function logMemoryStats(prefix = "Memory") {
  const stats = getMemoryStats();
  console.log(
    `${prefix}: Heap ${stats.heapUsedMB}/${stats.heapTotalMB}MB (${stats.heapUsagePercent}%), RSS ${stats.rssMB}MB`,
  );
}

/**
 * Check if memory usage is approaching limits and warn.
 * @param thresholdPercent - Warn if heap usage exceeds this percentage (default: 85%)
 * @returns true if memory is getting low
 */
export function checkMemoryPressure(thresholdPercent = 85): boolean {
  const stats = getMemoryStats();
  const isLow = stats.heapUsagePercent >= thresholdPercent;

  if (isLow) {
    console.warn(
      `⚠️  Memory pressure detected: ${stats.heapUsagePercent}% heap usage (${stats.heapUsedMB}/${stats.heapTotalMB}MB)`,
    );
  }

  return isLow;
}

/**
 * Attempt to trigger garbage collection if exposed.
 * Requires Node.js flag: --expose-gc
 */
export function requestGarbageCollection() {
  if (global.gc) {
    const before = getMemoryStats();
    global.gc();
    const after = getMemoryStats();
    const freedMB = before.heapUsedMB - after.heapUsedMB;

    if (freedMB > 0) {
      console.log(`🗑️  GC freed ${freedMB}MB`);
    }
    return freedMB;
  } else {
    console.warn(
      "⚠️  Garbage collection not exposed. Run with --expose-gc flag.",
    );
    return 0;
  }
}

/**
 * Memory-aware execution helper.
 * Periodically checks memory and triggers GC if needed.
 */
export class MemoryMonitor {
  private checkInterval: number;
  private gcThreshold: number;
  private lastCheck = Date.now();
  private memoryHistory: number[] = [];
  private readonly historySize = 10;

  /**
   * @param checkInterval - Check memory every N milliseconds (default: 10000 = 10s)
   * @param gcThreshold - Trigger GC if heap usage exceeds this % (default: 80)
   */
  constructor(checkInterval = 10000, gcThreshold = 80) {
    this.checkInterval = checkInterval;
    this.gcThreshold = gcThreshold;
  }

  /**
   * Check memory and perform cleanup if needed.
   * Call this periodically in long-running loops.
   */
  check(context?: string): void {
    const now = Date.now();
    if (now - this.lastCheck < this.checkInterval) {
      return; // Too soon, skip check
    }

    this.lastCheck = now;
    const stats = getMemoryStats();

    // Track memory trend
    this.memoryHistory.push(stats.heapUsedMB);
    if (this.memoryHistory.length > this.historySize) {
      this.memoryHistory.shift();
    }

    // Log with context
    const prefix = context ? `Memory (${context})` : "Memory";
    console.log(
      `${prefix}: ${stats.heapUsedMB}/${stats.heapTotalMB}MB (${stats.heapUsagePercent}%)`,
    );

    // Trigger GC if threshold exceeded
    if (stats.heapUsagePercent >= this.gcThreshold) {
      console.warn(`⚠️  High memory usage: ${stats.heapUsagePercent}%`);
      requestGarbageCollection();
    }

    // Warn if memory is growing rapidly
    if (this.memoryHistory.length === this.historySize) {
      const growth =
        this.memoryHistory[this.historySize - 1]! - this.memoryHistory[0]!;
      const avgGrowthPerCheck = growth / this.historySize;

      if (avgGrowthPerCheck > 50) {
        // Growing > 50MB per check
        console.warn(
          `⚠️  Memory growing rapidly: +${growth}MB over last ${this.historySize} checks (avg +${avgGrowthPerCheck.toFixed(1)}MB/check)`,
        );
      }
    }
  }

  /**
   * Get memory usage trend information.
   */
  getTrend(): {
    current: number;
    min: number;
    max: number;
    avg: number;
    growth: number;
  } {
    if (this.memoryHistory.length === 0) {
      return { current: 0, min: 0, max: 0, avg: 0, growth: 0 };
    }

    const current = this.memoryHistory[this.memoryHistory.length - 1]!;
    const min = Math.min(...this.memoryHistory);
    const max = Math.max(...this.memoryHistory);
    const avg =
      this.memoryHistory.reduce((sum, v) => sum + v, 0) /
      this.memoryHistory.length;
    const growth = current - this.memoryHistory[0]!;

    return { current, min, max, avg, growth };
  }

  /**
   * Reset the monitor's internal state.
   */
  reset(): void {
    this.memoryHistory = [];
    this.lastCheck = Date.now();
  }
}
