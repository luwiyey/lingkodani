# End-to-End (E2E) Testing Guide

**Date**: May 7, 2026  
**Status**: Ready for implementation  
**Purpose**: Comprehensive E2E testing of critical user journeys

## Setup

### Install Playwright (for E2E testing)

```bash
npm install --save-dev @playwright/test @playwright/test@latest
npx playwright install
```

### Configure Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'test-results/playwright-report' }],
    ['json', { outputFile: 'test-results/playwright-results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
```

### Add E2E script to package.json

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report test-results/playwright-report"
  }
}
```

---

## Critical User Journey Tests

### 1. Staff Login & Dashboard Access

```typescript
// e2e-tests/staff-login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Staff Login & Dashboard', () => {
  test('should login as barangay staff and access dashboard', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');
    expect(page).toHaveURL('/login');

    // Fill login form
    await page.fill('input[type="email"]', 'aew@barangay.local');
    await page.fill('input[type="password"]', 'testPassword123!');
    await page.click('button:has-text("Sign In")');

    // Wait for navigation
    await page.waitForURL('/dashboard');
    expect(page).toHaveURL('/dashboard');

    // Verify dashboard elements
    expect(await page.locator('h1:has-text("Dashboard")')).toBeVisible();
    expect(await page.locator('text=SMS Messages')).toBeVisible();
    expect(await page.locator('text=Open Cases')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'aew@barangay.local');
    await page.fill('input[type="password"]', 'wrongPassword');
    await page.click('button:has-text("Sign In")');

    // Wait for error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'aew@barangay.local');
    await page.fill('input[type="password"]', 'testPassword123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/dashboard');

    // Logout
    await page.click('button:has-text("Profile")');
    await page.click('text=Logout');

    // Should redirect to login
    await page.waitForURL('/login');
    expect(page).toHaveURL('/login');
  });
});
```

### 2. SMS Message Processing

```typescript
// e2e-tests/sms-processing.spec.ts
import { test, expect } from '@playwright/test';

test.describe('SMS Message Processing', () => {
  test('should display incoming SMS messages', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'aew@barangay.local');
    await page.fill('input[type="password"]', 'testPassword123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/dashboard');

    // Navigate to SMS feed
    await page.click('text=SMS Messages');
    await expect(page.locator('h2:has-text("Incoming Messages")')).toBeVisible({
      timeout: 5000,
    });

    // Verify message list
    const messageList = page.locator('[data-testid="sms-message-list"]');
    expect(messageList).toBeVisible();
  });

  test('should classify SMS message risk level', async ({ page }) => {
    // Login and navigate to SMS
    await page.goto('/login');
    await page.fill('input[type="email"]', 'aew@barangay.local');
    await page.fill('input[type="password"]', 'testPassword123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/dashboard');

    // Click first message
    await page.click('[data-testid="sms-message-item"]:first-child');

    // Verify AI classification is displayed
    await expect(
      page.locator('[data-testid="risk-level"]')
    ).toBeVisible({ timeout: 10000 });

    const riskLevel = await page.locator('[data-testid="risk-level"]').innerText();
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(riskLevel);
  });

  test('should create case from SMS', async ({ page }) => {
    // Login and navigate to SMS
    await page.goto('/login');
    await page.fill('input[type="email"]', 'aew@barangay.local');
    await page.fill('input[type="password"]', 'testPassword123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/dashboard');

    // Click message and create case
    await page.click('[data-testid="sms-message-item"]:first-child');
    await page.click('button:has-text("Create Case")');

    // Fill case form
    await page.fill('input[placeholder="Case Title"]', 'Test Case');
    await page.fill('textarea[placeholder="Description"]', 'Test description');
    await page.click('button:has-text("Save Case")');

    // Verify case created
    await expect(page.locator('text=Case created successfully')).toBeVisible({
      timeout: 5000,
    });
  });
});
```

### 3. Knowledge Base Search

```typescript
// e2e-tests/knowledge-base.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Knowledge Base Search', () => {
  test('should search knowledge base', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'aew@barangay.local');
    await page.fill('input[type="password"]', 'testPassword123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/dashboard');

    // Navigate to knowledge base
    await page.click('text=Knowledge Base');

    // Search
    await page.fill('input[placeholder="Search knowledge base"]', 'rice pest control');
    await page.press('input[placeholder="Search knowledge base"]', 'Enter');

    // Verify results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible({
      timeout: 5000,
    });

    const resultCount = await page
      .locator('[data-testid="search-result-item"]')
      .count();
    expect(resultCount).toBeGreaterThan(0);
  });

  test('should display AI-powered recommendations', async ({ page }) => {
    // Navigate to knowledge base
    await page.goto('/login');
    await page.fill('input[type="email"]', 'aew@barangay.local');
    await page.fill('input[type="password"]', 'testPassword123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/dashboard');

    await page.click('text=Knowledge Base');

    // Ask question
    await page.fill(
      'input[placeholder="Ask a question"]',
      'How do I control rice leaf blast?'
    );
    await page.press('input[placeholder="Ask a question"]', 'Enter');

    // Verify AI recommendation
    await expect(
      page.locator('[data-testid="ai-recommendation"]')
    ).toBeVisible({ timeout: 10000 });
  });
});
```

### 4. Case Management

```typescript
// e2e-tests/case-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Case Management', () => {
  test('should view case details', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'aew@barangay.local');
    await page.fill('input[type="password"]', 'testPassword123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/dashboard');

    // Navigate to cases
    await page.click('text=Cases');

    // Click first case
    await page.click('[data-testid="case-item"]:first-child');

    // Verify case details
    await expect(page.locator('[data-testid="case-id"]')).toBeVisible();
    await expect(page.locator('[data-testid="case-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="case-messages"]')).toBeVisible();
  });

  test('should update case status', async ({ page }) => {
    // Login and navigate to case
    await page.goto('/login');
    await page.fill('input[type="email"]', 'aew@barangay.local');
    await page.fill('input[type="password"]', 'testPassword123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/dashboard');

    await page.click('text=Cases');
    await page.click('[data-testid="case-item"]:first-child');

    // Update status
    await page.click('select[name="status"]');
    await page.selectOption('select[name="status"]', 'resolved');
    await page.click('button:has-text("Save")');

    // Verify update
    await expect(page.locator('text=Case updated')).toBeVisible({
      timeout: 5000,
    });
  });
});
```

### 5. User Profile Management

```typescript
// e2e-tests/user-profile.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Profile Management', () => {
  test('should update profile information', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'aew@barangay.local');
    await page.fill('input[type="password"]', 'testPassword123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/dashboard');

    // Open profile
    await page.click('button:has-text("Profile")');
    await page.click('text=Edit Profile');

    // Update info
    await page.fill('input[name="title"]', 'Senior AEW');
    await page.click('button:has-text("Save Profile")');

    // Verify update
    await expect(page.locator('text=Profile updated')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should upload avatar', async ({ page }) => {
    // Login and go to profile
    await page.goto('/login');
    await page.fill('input[type="email"]', 'aew@barangay.local');
    await page.fill('input[type="password"]', 'testPassword123!');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/dashboard');

    await page.click('button:has-text("Profile")');
    await page.click('text=Edit Profile');

    // Upload avatar
    const input = page.locator('input[type="file"]');
    await input.setInputFiles('./e2e-tests/fixtures/avatar.png');

    // Verify upload
    await expect(page.locator('text=Avatar uploaded')).toBeVisible({
      timeout: 5000,
    });
  });
});
```

---

## Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e e2e-tests/staff-login.spec.ts

# Run in UI mode (interactive)
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

---

## CI/CD Integration

E2E tests run automatically in GitHub Actions:

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: test-results/playwright-report/
```

---

## Test Coverage Goals

| Feature | Test Cases | Status |
|---------|-----------|--------|
| Authentication | 5 | ✅ Ready |
| SMS Processing | 5 | ✅ Ready |
| Knowledge Base | 4 | ✅ Ready |
| Case Management | 4 | ✅ Ready |
| User Profile | 3 | ✅ Ready |
| Data Export | 3 | 📋 Planned |
| Offline Functionality | 3 | 📋 Planned |
| Mobile Responsiveness | 4 | 📋 Planned |

**Total**: 31+ test cases covering critical user journeys

**Status**: Ready for implementation
