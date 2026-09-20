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

    // Beri interaksi pengguna di Tab B agar dasar autoplay pelayar membenarkan audio
    await pageB.click('body');

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

    // Pastikan kedua-dua halaman mempunyai interaksi pengguna aktif
    await pageA.click('body');
    await pageB.click('body');

    // Tunggu audio sedia dimuatkan (buffered) di kedua-dua tab sebelum mula bermain
    await pageA.waitForFunction(() => {
      const audios = (window as any).__poysic_audios || [];
      return audios.some((a: HTMLAudioElement) => a.readyState >= 2);
    }, { timeout: 12000 }).catch(() => {});

    await pageB.waitForFunction(() => {
      const audios = (window as any).__poysic_audios || [];
      return audios.some((a: HTMLAudioElement) => a.readyState >= 2);
    }, { timeout: 12000 }).catch(() => {});

    // 4. Tab A (Hos): Klik butang Main Muzik
    const playBtn = pageA.getByRole('button', { name: /Main Muzik/i });
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

    const createRoomBtn = pageA.getByRole('button', { name: /CIPTA BILIK SEGERA/i });
    await createRoomBtn.click();

    await pageA.waitForURL(/.*\?room=[a-zA-Z0-9_-]+/);
    const roomUrl = pageA.url();

    // 2. Tab B (Pendengar): Sertai bilik yang sama
    await pageB.goto(roomUrl);
    await pageB.waitForLoadState('domcontentloaded');

    // Pastikan kedua-dua tab menyambung ke bilik
    await pageA.waitForSelector('text=PENDENGAR', { timeout: 8000 });
    await pageB.waitForSelector('text=PENDENGAR', { timeout: 8000 });

    // Sahkan pada mulanya Tab B adalah Pendengar (butang kawalan dinyahdayakan)
    const playBtnB = pageB.locator('button[title*="Hanya hos bilik"]');
    await expect(playBtnB).toBeDisabled();

    // 3. Tab A (Hos) ditutup
    await pageA.close();
    await contextA.close();

    // 4. Sahkan Tab B dinaikkan pangkat menjadi Hos Baru dalam tempoh < 5 saat
    // Apabila menjadi Hos, butang play di Tab B menjadi aktif dan judulnya berubah ke 'Main Muzik'
    const newHostPlayBtn = pageB.locator('button[title="Main Muzik"], button[title="Jeda Muzik"]');
    await expect(newHostPlayBtn).toBeEnabled({ timeout: 5000 });

    console.log('[Playwright Host Migration] Listener successfully promoted to new host within <5s');
  } finally {
    await contextB.close();
  }
});
