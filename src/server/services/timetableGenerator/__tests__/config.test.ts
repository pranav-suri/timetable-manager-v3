/**
 * @file config.test.ts
 * @description Test suite for the GA configuration management module.
 */

import { describe, it, assert } from "vitest";
import {
  DEFAULT_GA_CONFIG,
  mergeConfig,
  validateConfig,
  FAST_PRESET,
} from "../config";
import type { GAConfig, PartialGAConfig } from "../types";

describe("GA Configuration Management", () => {
  it("should return the default config if no partial config is provided", () => {
    const config = mergeConfig();
    assert.deepStrictEqual(config, DEFAULT_GA_CONFIG);
  });

  it("should merge a partial config with the default config", () => {
    const partialConfig: PartialGAConfig = {
      populationSize: 100,
      maxGenerations: 500,
    };
    const config = mergeConfig(partialConfig);
    assert.strictEqual(config.populationSize, 100);
    assert.strictEqual(config.maxGenerations, 500);
    assert.strictEqual(
      config.crossoverProbability,
      DEFAULT_GA_CONFIG.crossoverProbability,
    );
  });

  it("should deeply merge the constraintWeights", () => {
    const partialConfig: PartialGAConfig = {
      constraintWeights: {
        idleTime: 10,
      },
    };
    const config = mergeConfig(partialConfig);
    assert.strictEqual(config.constraintWeights.idleTime, 10);
    assert.strictEqual(
      config.constraintWeights.hardConstraintWeight,
      DEFAULT_GA_CONFIG.constraintWeights.hardConstraintWeight,
    );
  });

  it("should apply a preset configuration", () => {
    const config = mergeConfig(FAST_PRESET);
    assert.strictEqual(config.populationSize, FAST_PRESET.populationSize);
    assert.strictEqual(config.maxGenerations, FAST_PRESET.maxGenerations);
  });

  it("should throw an error for an invalid population size", () => {
    const invalidConfig: GAConfig = { ...DEFAULT_GA_CONFIG, populationSize: 5 };
    assert.throws(
      () => validateConfig(invalidConfig),
      /Population size must be at least 10/,
    );
  });

  it("should throw an error for an invalid elite count", () => {
    const invalidConfig: GAConfig = { ...DEFAULT_GA_CONFIG, eliteCount: 200 };
    assert.throws(
      () => validateConfig(invalidConfig),
      /Elite count must be non-negative and less than population size/,
    );
  });

  it("should throw an error for an invalid probability", () => {
    const invalidConfig: GAConfig = {
      ...DEFAULT_GA_CONFIG,
      crossoverProbability: 1.1,
    };
    assert.throws(
      () => validateConfig(invalidConfig),
      /Crossover probability must be between 0 and 1/,
    );
  });
});
