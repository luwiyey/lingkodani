import { getHealthStatus } from '@/lib/health-check';

describe('deployment health metadata', () => {
  const originalCommit = process.env.VERCEL_GIT_COMMIT_SHA;
  const originalBranch = process.env.VERCEL_GIT_COMMIT_REF;
  const originalEnvironment = process.env.VERCEL_ENV;

  afterEach(() => {
    process.env.VERCEL_GIT_COMMIT_SHA = originalCommit;
    process.env.VERCEL_GIT_COMMIT_REF = originalBranch;
    process.env.VERCEL_ENV = originalEnvironment;
  });

  it('reports the exact Vercel revision serving the health request', async () => {
    process.env.VERCEL_GIT_COMMIT_SHA = 'abc123';
    process.env.VERCEL_GIT_COMMIT_REF = 'main';
    process.env.VERCEL_ENV = 'production';

    const health = await getHealthStatus();

    expect(health.status).toBe('healthy');
    expect(health.deployment).toEqual({
      commit: 'abc123',
      branch: 'main',
      environment: 'production',
    });
  });
});
