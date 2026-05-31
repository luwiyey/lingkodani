import { NextResponse } from 'next/server';
import { getHealthStatus } from '@/lib/health-check';

export const runtime = 'nodejs';

export async function GET(): Promise<NextResponse> {
  try {
    const health = await getHealthStatus();

    const statusCode =
      health.status === 'healthy'
        ? 200
        : health.status === 'degraded'
          ? 202
          : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date(),
      },
      { status: 500 }
    );
  }
}
