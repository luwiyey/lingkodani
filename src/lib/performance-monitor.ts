import { logMetric } from './monitoring';

/**
 * Performance monitoring hook for tracking critical operations
 */
export class PerformanceMonitor {
  private timers = new Map<string, { start: number; label: string }>();
  private metrics = new Map<string, number[]>();

  startTimer(label: string): void {
    this.timers.set(label, {
      start: performance.now(),
      label,
    });
  }

  endTimer(label: string, metadata?: Record<string, unknown>): number | null {
    const timer = this.timers.get(label);
    if (!timer) {
      console.warn(`Timer "${label}" not found`);
      return null;
    }

    const duration = performance.now() - timer.start;
    this.timers.delete(label);

    // Store metric
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(duration);

    // Log to monitoring system
    logMetric(`perf_${label}`, Math.round(duration), 'ms', metadata);

    console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`, metadata || '');

    return duration;
  }

  getMetrics(label: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p95: number;
  } | null {
    const values = this.metrics.get(label);
    if (!values || values.length === 0) return null;

    const sorted = values.sort((a, b) => a - b);
    const count = values.length;
    const min = sorted[0];
    const max = sorted[count - 1];
    const avg = values.reduce((a, b) => a + b) / count;
    const p95Index = Math.ceil(count * 0.95) - 1;
    const p95 = sorted[p95Index] || max;

    return { count, min, max, avg, p95 };
  }

  getAllMetrics() {
    const result: Record<string, ReturnType<PerformanceMonitor['getMetrics']>> = {};
    this.metrics.forEach((values, label) => {
      result[label] = this.getMetrics(label);
    });
    return result;
  }

  reset(label?: string) {
    if (label) {
      this.metrics.delete(label);
    } else {
      this.metrics.clear();
    }
  }
}

export const monitor = new PerformanceMonitor();

/**
 * Decorator for automatic performance monitoring
 */
export function MonitorPerformance(label?: string) {
  return function (
    target: { name?: string },
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const timerLabel = label || `${target.name}.${propertyKey}`;

    descriptor.value = async function (...args: unknown[]) {
      monitor.startTimer(timerLabel);
      try {
        const result = await originalMethod.apply(this, args);
        monitor.endTimer(timerLabel);
        return result;
      } catch (error) {
        monitor.endTimer(timerLabel, { error: true });
        throw error;
      }
    };

    return descriptor;
  };
}
