import { test, expect } from '@playwright/test';

/**
 * client/tests/sync.spec.ts
 * Ujian Penyegerakan Audio 2-Konteks Pelayar (Playwright E2E)
 * Senario:
 * 1. Buka Context A (Hos) -> Cipta bilik segera.
 * 2. Buka Context B (Pendengar) -> Sertai bilik yang sama melalui URL (?room=...).
 * 3. Hos menekan butang Play.
 * 4. Tunggu 3 saat mainan stabil.
 * 5. Sahkan perbezaan currentTime audio antara kedua-dua tab adalah di dalam julat ±500ms.
 */

test('2-browser sync: create room in A, join in B, play, verify audio currentTime within ±500ms after 3s', async ({ browser }) => {
  // 1. Sediakan dua konteks pelayar berasingan (Context A untuk Hos, Context B untuk Pendengar)
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();

  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  try {
    // 2. Tab A (Hos): Buka landing page dan cipta bilik
    await pageA.goto('http://localhost:5173');
    await pageA.waitForLoadState('domcontentloaded');

    // Klik butang CIPTA BILIK SEGERA
    const createRoomBtn = pageA.getByRole('button', { name: /CIPTA BILIK SEGERA/i });
    await createRoomBtn.click();

    // Tunggu URL dikemas kini dengan parameter ?room=...
    await pageA.waitForURL(/.*\?room=[a-zA-Z0-9_-]+/);
    const roomUrl = pageA.url();
    const roomId = new URL(roomUrl).searchParams.get('room');
    expect(roomId).toBeTruthy();

    // 3. Tab B (Pendengar): Sertai bilik yang sama
    await pageB.goto(roomUrl);
    await pageB.waitForLoadState('domcontentloaded');

    // Jika modal nama muncul di Tab B, masukkan nama samaran dan klik mula
    const joinModalInput = pageB.getByPlaceholder(/Nama samaran anda/i);
    if (await joinModalInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await joinModalInput.fill('Pendengar B');
      const startBtn = pageB.getByRole('button', { name: /Mula Mendengar/i });
      if (await startBtn.isVisible()) {
        await startBtn.click();
      }
    }

    // Tunggu kedua-dua tab menyambung ke bilik (bilangan peserta dipaparkan)
    await pageA.waitForSelector('text=PENDENGAR', { timeout: 8000 });
    await pageB.waitForSelector('text=PENDENGAR', { timeout: 8000 });

    // 4. Tab A (Hos): Klik butang Main Muzik
    const playBtn = pageA.getByRole('button', { name: /Main Muzik/i });
    await playBtn.click();

    // Tunggu selama 3 saat untuk audio bermain serentak dan penyegerakan jam Cristian stabil
    await pageA.waitForTimeout(3000);

    // 5. Ekstrak currentTime elemen audio daripada kedua-dua tab
    const currentTimeA = await pageA.evaluate(() => {
      const audio = document.querySelector('audio');
      return audio ? audio.currentTime : -1;
    });

    const currentTimeB = await pageB.evaluate(() => {
      const audio = document.querySelector('audio');
      return audio ? audio.currentTime : -1;
    });

    // Sahkan kedua-dua audio telah mula bermain
    expect(currentTimeA).toBeGreaterThan(0);
    expect(currentTimeB).toBeGreaterThan(0);

    // 6. Sahkan perbezaan masa (drift) di antara kedua-dua tab adalah di dalam had ±500ms (0.5 saat)
    const driftMs = Math.abs(currentTimeA - currentTimeB) * 1000;
    console.log(`[Playwright Sync Test] Time A: ${currentTimeA.toFixed(2)}s | Time B: ${currentTimeB.toFixed(2)}s | Drift: ${driftMs.toFixed(0)}ms`);

    expect(driftMs).toBeLessThanOrEqual(500);
  } finally {
    await contextA.close();
    await contextB.close();
  }
});
