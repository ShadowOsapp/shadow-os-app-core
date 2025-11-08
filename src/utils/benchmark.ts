/**
 * Performance Benchmarking Utilities
 *
 * Tools for measuring and benchmarking ShadowOS operations
 */

export interface BenchmarkResult {
  operation: string;
  duration: number; // milliseconds
  iterations: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  throughput: number; // operations per second
}

/**
 * Benchmark a function execution
 */
export async function benchmark(
  operation: string,
  fn: () => void | Promise<void>,
  iterations: number = 100
): Promise<BenchmarkResult> {
  const durations: number[] = [];

  // Warmup
  for (let i = 0; i < 10; i++) {
    await fn();
  }

  // Actual benchmark
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    durations.push(end - start);
  }

  const totalDuration = durations.reduce((a, b) => a + b, 0);
  const averageDuration = totalDuration / iterations;
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  const throughput = (1000 / averageDuration) * iterations;

  return {
    operation,
    duration: totalDuration,
    iterations,
    averageDuration,
    minDuration,
    maxDuration,
    throughput,
  };
}

/**
 * Benchmark multiple operations and compare
 */
export async function benchmarkCompare(
  operations: Array<{ name: string; fn: () => void | Promise<void> }>,
  iterations: number = 100
): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];

  for (const op of operations) {
    const result = await benchmark(op.name, op.fn, iterations);
    results.push(result);
  }

  return results;
}

/**
 * Format benchmark result for display
 */
export function formatBenchmarkResult(result: BenchmarkResult): string {
  return `
${result.operation}:
  Iterations: ${result.iterations}
  Total Time: ${result.duration.toFixed(2)}ms
  Average: ${result.averageDuration.toFixed(2)}ms
  Min: ${result.minDuration.toFixed(2)}ms
  Max: ${result.maxDuration.toFixed(2)}ms
  Throughput: ${result.throughput.toFixed(2)} ops/sec
  `.trim();
}

/**
 * Compare benchmark results
 */
export function compareBenchmarkResults(
  results: BenchmarkResult[]
): string {
  const sorted = [...results].sort(
    (a, b) => a.averageDuration - b.averageDuration
  );
  const fastest = sorted[0];
  const slowest = sorted[sorted.length - 1];
  const speedup = slowest.averageDuration / fastest.averageDuration;

  let output = "Benchmark Comparison:\n\n";
  for (const result of sorted) {
    output += formatBenchmarkResult(result) + "\n\n";
  }

  output += `Fastest: ${fastest.operation}\n`;
  output += `Slowest: ${slowest.operation}\n`;
  output += `Speedup: ${speedup.toFixed(2)}x\n`;

  return output;
}

