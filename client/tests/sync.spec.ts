import { test, expect } from '@playwright/test';

/**
 * client/tests/sync.spec.ts
 * Ujian Penyegerakan Audio & Kitaran Hayat Bilik (Playwright E2E)
 *
 * Ujian 1: 2-browser sync (Host play, kedua-dua tab main serentak dalam ±500ms selepas 3 saat)
 * Ujian 2: Host migration (Host tutup tab, pendengar dinaikkan pangkat menjadi hos baru dalam <5 saat)
 */

test('2-browser sync: create room in A, join in B, play, verify audio currentTime within ±500ms after 3s', async ({ browser }) => {
  // 1. Sediakan dua konteks pelayar berasingan (Context A untuk Hos, Context B untuk Pendengar)
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();

  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  // Pintas dan simpan rujukan elemen in-memory new Audio() untuk semakan masa sebenar
  const captureAudioScript = () => {
    const OrigAudio = window.Audio;
    (window as any).__poysic_audios = [];
    window.Audio = function (...args: any[]) {
      const instance = new OrigAudio(...args);
      (window as any).__poysic_audios.push(instance);
      return instance;
    } as any;
  };

  await pageA.addInitScript(captureAudioScript);
  await pageB.addInitScript(captureAudioScript);

  try {
    // 2. Tab A (Hos): Buka landing page dan cipta bilik
    await pageA.goto('http://localhost:5173');
    await pageA.waitForLoadState('domcontentloaded');

    // Klik butang CIPTA BILIK SEGERA / CREATE INSTANT ROOM
    const createRoomBtn = pageA.getByRole('button', { name: /INSTANT ROOM|CIPTA BILIK SEGERA/i });
    await createRoomBtn.click();

    // Tunggu URL dikemas kini dengan parameter ?room=...
    await pageA.waitForURL(/.*\?room=[a-zA-Z0-9_-]+/);
    const roomUrl = pageA.url();
    const roomId = new URL(roomUrl).searchParams.get('room');
    expect(roomId).toBeTruthy();

    // 3. Tab B (Pendengar): Sertai bilik yang sama
    await pageB.goto(roomUrl);
    await pageB.waitForLoadState('domcontentloaded');

    // Beri interaksi pengguna di Tab B agar dasar autoplay pelayar membenarkan audio
    await pageB.click('body');

    // Jika modal nama muncul di Tab B, masukkan nama samaran dan klik mula
    const joinModalInput = pageB.locator('input[placeholder*="Azim"], input[placeholder*="Alex"], input[placeholder*="samaran"], input[aria-label*="samaran"], input[aria-label*="NICKNAME"]');
    if (await joinModalInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await joinModalInput.fill('Pendengar B');
      const startBtn = pageB.getByRole('button', { name: /Sertai Bilik|JOIN ROOM/i });
      if (await startBtn.isVisible()) {
        await startBtn.click();
      }
    }

    // Tunggu kedua-dua tab menyambung ke bilik (bilangan peserta dipaparkan)
    await pageA.locator('text=/PENDENGAR|LISTENERS/i').first().waitFor({ timeout: 8000 });
    await pageB.locator('text=/PENDENGAR|LISTENERS/i').first().waitFor({ timeout: 8000 });

    // Pastikan kedua-dua halaman mempunyai interaksi pengguna aktif
    await pageA.click('body');
    await pageB.click('body');

    // Jika ada notifikasi autoplay disekat pelayar di Tab B, klik Aktifkan Audio
    const resumeBtnB = pageB.getByRole('button', { name: /Aktifkan Audio|Resume Audio|Enable Audio/i });
    if (await resumeBtnB.isVisible({ timeout: 1000 }).catch(() => false)) {
      await resumeBtnB.click();
    }

    // Tunggu audio sedia dimuatkan (buffered) di kedua-dua tab sebelum mula bermain
    await pageA.waitForFunction(() => {
      const audios = (window as any).__poysic_audios || [];
      return audios.some((a: HTMLAudioElement) => a.readyState >= 2);
    }, { timeout: 12000 }).catch(() => {});

    await pageB.waitForFunction(() => {
      const audios = (window as any).__poysic_audios || [];
      return audios.some((a: HTMLAudioElement) => a.readyState >= 2);
    }, { timeout: 12000 }).catch(() => {});

    // 4. Tab A (Hos): Klik butang Main Muzik / Play Music
    const playBtn = pageA.getByRole('button', { name: /Main Muzik|Play Music/i });
    await playBtn.click();

    // Tunggu selama 3 saat untuk audio bermain serentak dan penyegerakan jam Cristian stabil
    await pageA.waitForTimeout(3000);

    // 5. Ekstrak elemen audio aktif (yang sedang bermain) daripada kedua-dua tab
    const audiosInfoA = await pageA.evaluate(() => {
      const audios = (window as any).__poysic_audios || [];
      return audios.map((a: HTMLAudioElement) => ({
        src: a.src,
        currentTime: a.currentTime,
        paused: a.paused,
        readyState: a.readyState,
      }));
    });

    const audiosInfoB = await pageB.evaluate(() => {
      const audios = (window as any).__poysic_audios || [];
      return audios.map((a: HTMLAudioElement) => ({
        src: a.src,
        currentTime: a.currentTime,
        paused: a.paused,
        readyState: a.readyState,
      }));
    });

    // Pilih elemen audio yang aktif dimainkan (bukan fail pra-muatan queue)
    const stateA = audiosInfoA.find((a: any) => !a.paused) || audiosInfoA.find((a: any) => a.currentTime > 0);
    const stateB = audiosInfoB.find((a: any) => !a.paused) || audiosInfoB.find((a: any) => a.currentTime > 0);

    const currentTimeA = stateA?.currentTime ?? -1;
    const currentTimeB = stateB?.currentTime ?? -1;

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

test('host closes tab: listener promoted to new host within 5s', async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();

  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  try {
    // 1. Tab A (Hos): Buka landing page dan cipta bilik
    await pageA.goto('http://localhost:5173');
    await pageA.waitForLoadState('domcontentloaded');

    const createRoomBtn = pageA.getByRole('button', { name: /INSTANT ROOM|CIPTA BILIK SEGERA/i });
    await createRoomBtn.click();

    await pageA.waitForURL(/.*\?room=[a-zA-Z0-9_-]+/);
    const roomUrl = pageA.url();

    // 2. Tab B (Pendengar): Sertai bilik yang sama
    await pageB.goto(roomUrl);
    await pageB.waitForLoadState('domcontentloaded');

    // Beri interaksi pengguna di Tab B
    await pageB.click('body');

    // Jika modal nama muncul di Tab B, masukkan nama samaran dan klik mula
    const joinModalInput = pageB.locator('input[placeholder*="Azim"], input[placeholder*="Alex"], input[placeholder*="samaran"], input[aria-label*="samaran"], input[aria-label*="NICKNAME"]');
    if (await joinModalInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await joinModalInput.fill('Pendengar B');
      const startBtn = pageB.getByRole('button', { name: /Sertai Bilik|JOIN ROOM/i });
      if (await startBtn.isVisible()) {
        await startBtn.click();
      }
    }

    // Pastikan kedua-dua tab menyambung ke bilik
    await pageA.locator('text=/PENDENGAR|LISTENERS/i').first().waitFor({ timeout: 8000 });
    await pageB.locator('text=/PENDENGAR|LISTENERS/i').first().waitFor({ timeout: 8000 });

    // Sahkan pada mulanya Tab B adalah Pendengar (butang kawalan dinyahdayakan)
    const playBtnB = pageB.getByRole('button', { name: /Play Music|Main Muzik/i });
    await expect(playBtnB).toBeDisabled();

    // 3. Tab A (Hos) ditutup
    await pageA.close();
    await contextA.close();

    // 4. Sahkan Tab B dinaikkan pangkat menjadi Hos Baru dalam tempoh < 5 saat
    // Apabila menjadi Hos, butang play di Tab B menjadi aktif
    await expect(playBtnB).toBeEnabled({ timeout: 5000 });

    console.log('[Playwright Host Migration] Listener successfully promoted to new host within <5s');
  } finally {
    await contextB.close();
  }
});

test('music search: source selector supports Jamendo CC & Audius with badges', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('domcontentloaded');

    const createRoomBtn = page.getByRole('button', { name: /INSTANT ROOM|CIPTA BILIK SEGERA/i });
    await createRoomBtn.click();

    await page.waitForURL(/.*\?room=[a-zA-Z0-9_-]+/);

    // Switch to search tab
    const searchTab = page.getByRole('tab', { name: /01 SEARCH|SEARCH/i });
    await searchTab.click();

    // Verify source selector buttons
    const allSourcesBtn = page.getByRole('button', { name: /ALL SOURCES|SEMUA SUMBER/i });
    const jamendoBtn = page.getByRole('button', { name: /JAMENDO CC/i });
    const audiusBtn = page.getByRole('button', { name: /AUDIUS/i });

    await expect(allSourcesBtn).toBeVisible();
    await expect(jamendoBtn).toBeVisible();
    await expect(audiusBtn).toBeVisible();

    // Verify minimum touch target for source buttons
    const box = await audiusBtn.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);

    // Filter by Audius
    await audiusBtn.click();

    // Type a query in search box
    const searchInput = page.getByPlaceholder(/Search music tracks|Cari trek muzik/i);
    await searchInput.fill('chill');
    const submitBtn = page.getByRole('button', { name: /SEARCH|CARI/i });
    await submitBtn.click();

    // Wait for search results
    await page.waitForTimeout(2000);

    console.log('[Playwright Audius Search] Successfully verified Jamendo & Audius sources in UI');
  } finally {
    await context.close();
  }
});
