import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('Capture UI Review Data & Performance Telemetry', async ({ page }) => {
  const artifactsDir = 'C:\\Users\\USER\\.gemini\\antigravity\\brain\\4b538eaf-c074-44b0-a2f9-2e1fde170690';
  
  // 1. Navigate to Landing Page
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');

  // Capture Landing View Screenshot
  const landingScreenshotPath = path.join(artifactsDir, 'landing_view_review.png');
  await page.screenshot({ path: landingScreenshotPath, fullPage: true });

  // 2. Measure Landing Page Web Vitals & DOM Metrics
  const landingMetrics = await page.evaluate(() => {
    const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find((e) => e.name === 'first-contentful-paint')?.startTime || 0;
    
    // Check form labels on landing page
    const inputs = Array.from(document.querySelectorAll('input'));
    const unlabeledInputs = inputs.filter((input) => {
      const id = input.id;
      const hasLabel = id ? !!document.querySelector(`label[for="${id}"]`) : false;
      const wrappedInLabel = !!input.closest('label');
      const hasAria = !!input.getAttribute('aria-label') || !!input.getAttribute('aria-labelledby');
      return !hasLabel && !wrappedInLabel && !hasAria;
    }).length;

    // Check touch targets < 44px
    const interactiveElements = Array.from(document.querySelectorAll('button, a, input, select'));
    const smallTouchTargets = interactiveElements.filter((el) => {
      const rect = el.getBoundingClientRect();
      return (rect.width > 0 && rect.height > 0) && (rect.width < 44 || rect.height < 44);
    }).map((el) => ({
      tag: el.tagName,
      text: (el.textContent || '').trim().slice(0, 30),
      className: el.className,
      width: el.getBoundingClientRect().width,
      height: el.getBoundingClientRect().height,
    }));

    return {
      domNodes: document.querySelectorAll('*').length,
      fcpMs: fcp,
      domContentLoadedMs: timing ? timing.domContentLoadedEventEnd - timing.startTime : 0,
      loadMs: timing ? timing.loadEventEnd - timing.startTime : 0,
      unlabeledInputs,
      smallTouchTargets,
    };
  });

  // 3. Create room and navigate to Player View
  const createBtn = page.getByRole('button', { name: /INSTANT ROOM|CIPTA BILIK SEGERA/i });
  await createBtn.click();
  await page.waitForURL(/.*\?room=[a-zA-Z0-9_-]+/);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Allow vinyl, canvas visualizer to settle

  // Capture Player View Screenshot
  const playerScreenshotPath = path.join(artifactsDir, 'player_view_review.png');
  await page.screenshot({ path: playerScreenshotPath, fullPage: true });

  // 4. Measure Player View Metrics
  const playerMetrics = await page.evaluate(() => {
    // Check small touch targets in player view
    const interactive = Array.from(document.querySelectorAll('button, a, input, select'));
    const smallTargets = interactive.filter((el) => {
      const rect = el.getBoundingClientRect();
      return (rect.width > 0 && rect.height > 0) && (rect.width < 44 || rect.height < 44);
    }).map((el) => ({
      tag: el.tagName,
      text: (el.textContent || '').trim().slice(0, 30),
      ariaLabel: el.getAttribute('aria-label') || '',
      width: Math.round(el.getBoundingClientRect().width),
      height: Math.round(el.getBoundingClientRect().height),
    }));

    // Check images missing loading="lazy"
    const images = Array.from(document.querySelectorAll('img'));
    const eagerImages = images.filter((img) => !img.getAttribute('loading') || img.getAttribute('loading') !== 'lazy').map((img) => img.src.slice(0, 50));

    // Check tab navigation ARIA
    const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
    const tablist = document.querySelector('[role="tablist"]');

    return {
      domNodes: document.querySelectorAll('*').length,
      smallTargets,
      eagerImagesCount: eagerImages.length,
      hasTabList: !!tablist,
      tabsCount: tabs.length,
    };
  });

  const auditReport = {
    landingMetrics,
    playerMetrics,
  };

  fs.writeFileSync(
    path.join(artifactsDir, 'ui_review_telemetry.json'),
    JSON.stringify(auditReport, null, 2)
  );

  console.log('[UI Review Telemetry Captured Successfully]');
});
