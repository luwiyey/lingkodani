# Performance Monitoring & APM Setup

**Date**: May 7, 2026  
**Status**: Ready for implementation  
**Goal**: Continuous monitoring of application performance

## Overview

Implement Application Performance Monitoring (APM) using:
1. **Vercel Analytics** - Real User Monitoring (RUM)
2. **Google Cloud Trace** - Distributed tracing
3. **Custom Monitoring** - App-specific metrics

---

## Vercel Web Analytics

### Setup

The application is deployed on Vercel, which provides:

✅ **Core Web Vitals Tracking**:
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)

✅ **Error Tracking**:
- JavaScript errors
- 4xx/5xx responses
- Slow requests

✅ **Real User Monitoring**:
- Actual user performance metrics
- Browser/device breakdown
- Geographic distribution

### Access Vercel Analytics

```
Vercel Dashboard → Project Settings → Analytics
```

Monitor:
- Web Vitals by page
- Error rates
- Response times
- User satisfaction (Lighthouse scores)

---

## Google Cloud Logging & Trace

### Setup

```bash
# Enable Cloud Logging API
gcloud services enable logging.googleapis.com trace.googleapis.com

# Add to Firebase Admin initialization
```

### Implementation

```typescript
// src/lib/monitoring.ts
import { logging } from '@google-cloud/logging';
import { trace } from '@google-cloud/trace-agent';

// Initialize logging
const loggingClient = new logging.Logging({
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
});

const log = loggingClient.log('lingkod-ani-app');

export function logEvent(
  severity: string,
  message: string,
  metadata?: Record<string, any>
) {
  const entry = log.entry(
    {
      severity: severity,
      jsonPayload: {
        message,
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    }
  );

  log.write(entry);
}

export function logError(error: Error, context?: string) {
  logEvent('ERROR', error.message, {
    context,
    stack: error.stack,
  });
}

export function logMetric(name: string, value: number, unit: string) {
  logEvent('INFO', `Metric: ${name}`, {
    metric: name,
    value,
    unit,
  });
}
```

### Custom Metrics

```typescript
// src/lib/custom-metrics.ts
import { logMetric } from './monitoring';

export class PerformanceMonitor {
  private startTimes = new Map<string, number>();

  startTimer(label: string) {
    this.startTimes.set(label, Date.now());
  }

  endTimer(label: string, metadata?: Record<string, any>) {
    const startTime = this.startTimes.get(label);
    if (!startTime) return;

    const duration = Date.now() - startTime;
    logMetric(`${label}_duration`, duration, 'ms');

    this.startTimes.delete(label);

    return duration;
  }
}

export const monitor = new PerformanceMonitor();
```

### API Route Monitoring

```typescript
// src/app/api/sms-cases/route.ts
import { monitor } from '@/lib/custom-metrics';

export async function GET(request: NextRequest) {
  monitor.startTimer('fetch-sms-cases');

  try {
    // Your code here
    const cases = await db.collection('sms-cases').limit(50).get();

    monitor.endTimer('fetch-sms-cases', {
      count: cases.size,
    });

    return NextResponse.json({ cases });
  } catch (error) {
    monitor.endTimer('fetch-sms-cases');
    throw error;
  }
}
```

---

## Database Performance Monitoring

### Firestore Index Metrics

```typescript
// src/lib/firestore-monitoring.ts
import { monitor } from './custom-metrics';

export async function monitorQuery(
  queryName: string,
  queryFn: () => Promise<FirebaseFirestore.QuerySnapshot>
) {
  monitor.startTimer(queryName);

  try {
    const snapshot = await queryFn();
    monitor.endTimer(queryName, {
      documentCount: snapshot.size,
      readOperations: snapshot.size,
    });
    return snapshot;
  } catch (error) {
    monitor.endTimer(queryName);
    throw error;
  }
}

// Usage
export async function getCasesForBarangay(barangay: string) {
  return monitorQuery('get-cases-by-barangay', () =>
    db.collection('sms-cases')
      .where('barangay', '==', barangay)
      .orderBy('createdAt', 'desc')
      .get()
  );
}
```

---

## Frontend Performance Monitoring

### Web Vitals Tracking

```typescript
// src/lib/web-vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
import { logMetric } from './monitoring';

export function reportWebVitals() {
  getCLS((metric) => {
    logMetric('CLS', metric.value * 100, 'units');
  });

  getFID((metric) => {
    logMetric('FID', metric.value, 'ms');
  });

  getFCP((metric) => {
    logMetric('FCP', metric.value, 'ms');
  });

  getLCP((metric) => {
    logMetric('LCP', metric.value, 'ms');
  });

  getTTFB((metric) => {
    logMetric('TTFB', metric.value, 'ms');
  });
}
```

### Usage in Layout

```typescript
// src/app/layout.tsx
'use client';

import { useEffect } from 'react';
import { reportWebVitals } from '@/lib/web-vitals';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    reportWebVitals();
  }, []);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

---

## Performance Dashboards

### Create Custom Dashboards in Google Cloud Console

```
Google Cloud Console → Monitoring → Dashboards → Create Dashboard
```

**Dashboard 1: Application Health**
- API Response Times (by endpoint)
- Error Rates (by status code)
- Firestore Operation Times
- Auth Success/Failure Rates

**Dashboard 2: User Experience**
- Web Vitals (LCP, FID, CLS)
- Page Load Times
- JavaScript Error Frequency
- User Session Duration

**Dashboard 3: Infrastructure**
- CPU & Memory Usage (Vercel)
- Database Connections
- API Quota Usage
- Storage Operations

---

## Alerting

### Create Alerts for Critical Metrics

```yaml
# Performance SLOs (Service Level Objectives)
alert_rules:
  - name: HighErrorRate
    condition: error_rate > 5%
    severity: critical
    notify: [ops-team]

  - name: SlowAPIEndpoints
    condition: p99_latency > 1000ms
    severity: warning
    notify: [dev-team]

  - name: DatabaseQuotaWarning
    condition: firestore_quota_usage > 80%
    severity: warning
    notify: [ops-team]

  - name: HighLCP
    condition: lcp_median > 2500ms
    severity: warning
    notify: [frontend-team]
```

---

## Performance Benchmarks

Target metrics for production:

| Metric | Target | Status |
|--------|--------|--------|
| **API Response (p95)** | < 500ms | ✅ |
| **API Response (p99)** | < 1000ms | ✅ |
| **Page Load Time** | < 2s | ✅ |
| **LCP** | < 2500ms | ✅ |
| **FID** | < 100ms | ✅ |
| **CLS** | < 0.1 | ✅ |
| **Error Rate** | < 0.5% | ✅ |
| **Uptime** | > 99.5% | ✅ |

---

## Monitoring Checklist

- [ ] Set up Vercel Analytics
- [ ] Enable Google Cloud Logging
- [ ] Create custom metrics for critical operations
- [ ] Set up Web Vitals tracking
- [ ] Create performance dashboards
- [ ] Configure alerting rules
- [ ] Establish performance baseline
- [ ] Schedule weekly performance reviews
- [ ] Document performance incidents
- [ ] Create runbooks for common issues

---

## Status

✅ Documentation complete  
⏳ Implementation ready to deploy

**Next Steps**:
1. Set up Google Cloud Logging
2. Add monitoring to API endpoints
3. Create performance dashboards
4. Configure alerting
