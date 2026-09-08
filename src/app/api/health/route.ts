import { NextResponse } from 'next/server';
import { getHealthStatus } from '@/lib/health-check';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const health = await getHealthStatus();

    const statusCode =
      health.status === 'healthy'
        ? 200
        : health.status === 'degraded'
          ? 202
          : 503;

    return NextResponse.json(health, {
      status: statusCode,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
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
