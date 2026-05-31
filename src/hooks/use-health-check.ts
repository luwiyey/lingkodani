'use client';

import { useState, useEffect } from 'react';
import { logMetric } from '@/lib/monitoring';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, unknown>;
  timestamp: Date;
}

export function useHealthCheck(interval: number = 30000) {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();

        setHealth(data);

        // Log to monitoring
        logMetric('health_check', response.ok ? 1 : 0, 'count', {
          status: data.status,
        });
      } catch (error) {
        console.error('Health check failed:', error);
        setHealth({
          status: 'unhealthy',
          checks: { api: { status: 'error' } },
          timestamp: new Date(),
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkHealth();

    // Set up interval for periodic checks
    const timer = setInterval(checkHealth, interval);

    return () => clearInterval(timer);
  }, [interval]);

  return { health, isLoading };
}
