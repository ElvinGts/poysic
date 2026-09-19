/**
 * server/src/test_server.ts
 * Comprehensive test suite verifying all PoySic modular backend components:
 * - RoomManager lifecycle, host migration, and empty-room garbage collection leak fix
 * - QueueManager mutations, deduplication, and auto-advance sequencing
 * - Cristian's algorithm clock synchronization handler & position math
 * - Jamendo search query resolution and offline fallback catalogue
 * - Express HTTP REST endpoints (/api/health, /api/tracks/curated, /api/rooms/:id)
 */

import assert from 'assert';
import http from 'http';
import { RoomManager } from './rooms';
import { addToQueue, advanceTrack, clearQueue, removeFromQueue } from './queue';
import { calculateExpectedPosition, handleClockPing } from './clockSync';
import { FALLBACK_TRACKS, getCuratedTracks, searchJamendoTracks } from './jamendo';
import { app, server } from './index';

async function runTests() {
  console.log('=== Running PoySic Server Modular Test Suite ===\n');

  // ----------------------------------------------------
  // Test 1: RoomManager Lifecycle & Host Migration
  // ----------------------------------------------------
  console.log('[Test 1] RoomManager: join, leave, and host migration');
  const rm = new RoomManager();

  // User 1 creates room
  const join1 = rm.join('room-alpha', 'socket-1', 'Alice', '🐱');
  assert.strictEqual(join1.isNew, true, 'First join should create new room');
  assert.strictEqual(join1.participant.isHost, true, 'First user should be designated host');
  assert.strictEqual(join1.room.hostId, 'socket-1', 'Host ID must be socket-1');
  assert.strictEqual(join1.room.participants.length, 1, 'Room should have 1 participant');
  assert.strictEqual(join1.room.currentTrack?.id, FALLBACK_TRACKS[0].id, 'Should load starter track');
  assert.strictEqual(join1.room.queue.length, 3, 'Queue should contain 3 initial fallback tracks');

  // User 2 joins existing room
  const join2 = rm.join('room-alpha', 'socket-2', 'Bob', '🐶');
  assert.strictEqual(join2.isNew, false, 'Second join should not create new room');
  assert.strictEqual(join2.participant.isHost, false, 'Second user should not be host');
  assert.strictEqual(join2.room.participants.length, 2, 'Room should have 2 participants');

  // Update profile
  const updated = rm.updateProfile('room-alpha', 'socket-2', 'Bobby', '🦊');
  assert.ok(updated, 'Profile update should succeed');
  assert.strictEqual(updated?.participant.name, 'Bobby', 'Name should be updated to Bobby');
  assert.strictEqual(updated?.participant.avatar, '🦊', 'Avatar should be updated');

  // Host (Alice) leaves -> Bob should be promoted to host
  const leave1 = rm.leave('room-alpha', 'socket-1');
  assert.strictEqual(leave1.newHostId, 'socket-2', 'Bob should be promoted to new host');
  assert.strictEqual(rm.get('room-alpha')?.hostId, 'socket-2', 'Room hostId should now be socket-2');
  assert.strictEqual(rm.get('room-alpha')?.participants[0].isHost, true, 'Bob isHost flag must be true');
  console.log('  ✓ RoomManager join, profile update, and host migration passed');

  // ----------------------------------------------------
  // Test 2: RoomManager Disconnect Garbage Collection Leak Fix
  // ----------------------------------------------------
  console.log('\n[Test 2] RoomManager: verify disconnect garbage collection memory leak fix');
  const rmGc = new RoomManager();
  rmGc.join('room-beta', 'socket-user-1', 'Charlie');

  // Abrupt socket disconnect of the sole user
  const dcResults = rmGc.handleDisconnect('socket-user-1');
  assert.strictEqual(dcResults.length, 1, 'Should report 1 affected room');
  assert.strictEqual(dcResults[0].isNowEmpty, true, 'Room must be flagged as empty');
  assert.strictEqual(rmGc.get('room-beta')?.participants.length, 0, 'Room has 0 participants');

  // Room should still be temporarily in map during grace period
  assert.ok(rmGc.get('room-beta') !== undefined, 'Room exists during grace period');

  // Trigger rapid cleanup with 20ms timer to verify automated deletion
  rmGc.scheduleCleanup('room-beta', 20);
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.strictEqual(
    rmGc.get('room-beta'),
    undefined,
    'Room must be deleted from memory after grace period (memory leak fixed)'
  );
  console.log('  ✓ Disconnect garbage collection memory leak fix verified');

  // ----------------------------------------------------
  // Test 3: QueueManager Operations & Auto-advance
  // ----------------------------------------------------
  console.log('\n[Test 3] QueueManager: deduplication, removals, and auto-advance');
  const testRoom = {
    roomId: 'test-queue-room',
    hostId: 'host-1',
    currentTrack: FALLBACK_TRACKS[0],
    isPlaying: true,
    position: 0,
    lastUpdated: Date.now(),
    queue: [FALLBACK_TRACKS[1]],
    participants: [],
  };

  // Deduplication test
  const addedDuplicate = addToQueue(testRoom, FALLBACK_TRACKS[1]);
  assert.strictEqual(addedDuplicate, false, 'Duplicate track must be rejected');
  assert.strictEqual(testRoom.queue.length, 1, 'Queue length should remain 1');

  // Add new track
  const addedNew = addToQueue(testRoom, FALLBACK_TRACKS[2]);
  assert.strictEqual(addedNew, true, 'Unique track must be accepted');
  assert.strictEqual(testRoom.queue.length, 2, 'Queue length should now be 2');

  // Remove track
  const removed = removeFromQueue(testRoom, FALLBACK_TRACKS[1].id);
  assert.strictEqual(removed, true, 'Track should be successfully removed');
  assert.strictEqual(testRoom.queue.length, 1, 'Queue length should now be 1');
  assert.strictEqual(testRoom.queue[0].id, FALLBACK_TRACKS[2].id, 'Remaining track must match');

  // Auto-advance with 1 song in queue
  const advance1 = advanceTrack(testRoom);
  assert.strictEqual(advance1.finished, false, 'Playback should not be finished');
  assert.strictEqual(advance1.nextTrack?.id, FALLBACK_TRACKS[2].id, 'Next track should be loaded');
  assert.strictEqual(testRoom.currentTrack?.id, FALLBACK_TRACKS[2].id, 'Current track updated');
  assert.strictEqual(testRoom.position, 0, 'Position reset to 0');
  assert.strictEqual(testRoom.isPlaying, true, 'Playback status remains true');

  // Auto-advance with empty queue
  const advance2 = advanceTrack(testRoom);
  assert.strictEqual(advance2.finished, true, 'Playback should finish when queue is empty');
  assert.strictEqual(advance2.nextTrack, null, 'No next track');
  assert.strictEqual(testRoom.isPlaying, false, 'Playback should pause');
  assert.strictEqual(
    testRoom.position,
    FALLBACK_TRACKS[2].duration,
    'Position should be capped at song duration'
  );

  // Clear queue
  testRoom.queue = [FALLBACK_TRACKS[0], FALLBACK_TRACKS[1]];
  clearQueue(testRoom);
  assert.strictEqual(testRoom.queue.length, 0, 'Clear queue should empty array');
  console.log('  ✓ QueueManager deduplication, removal, and auto-advance passed');

  // ----------------------------------------------------
  // Test 4: Clock Synchronization (Cristian's Algorithm)
  // ----------------------------------------------------
  console.log("\n[Test 4] ClockSync: Cristian's algorithm ping and position math");
  let pingResult = 0;
  const tBefore = Date.now();
  handleClockPing(tBefore, (serverTime) => {
    pingResult = serverTime;
  });
  const tAfter = Date.now();
  assert.ok(
    pingResult >= tBefore && pingResult <= tAfter,
    "Cristian's algorithm must return current server timestamp"
  );

  // Drift calculation
  const lastPos = 10.0;
  const lastUp = Date.now() - 3000; // 3 seconds ago
  const expectedPos = calculateExpectedPosition(lastPos, lastUp, Date.now());
  assert.ok(
    Math.abs(expectedPos - 13.0) < 0.1,
    `Expected ~13.0s position, got ${expectedPos.toFixed(2)}s`
  );
  console.log("  ✓ Cristian's algorithm ping-pong & position calculation passed");

  // ----------------------------------------------------
  // Test 5: Jamendo Client & Offline Fallback Catalogue
  // ----------------------------------------------------
  console.log('\n[Test 5] Jamendo: offline fallback query matching and catalogue retrieval');
  const curated = getCuratedTracks();
  assert.strictEqual(curated.length, 6, 'Curated tracks must contain 6 fallback tracks');

  // Fallback search matching 'lo-fi'
  const lofiTracks = await searchJamendoTracks('lo-fi');
  assert.ok(lofiTracks.length >= 1, 'Should find lo-fi fallback tracks');
  assert.ok(
    lofiTracks.some((t) => t.genre?.toLowerCase().includes('lo-fi')),
    'Must include lo-fi genre tracks'
  );

  // Search with empty query returns all fallbacks
  const emptyQueryTracks = await searchJamendoTracks('');
  assert.strictEqual(emptyQueryTracks.length, 6, 'Empty query should return all fallbacks');
  console.log('  ✓ Jamendo fallback and query matching passed');

  // ----------------------------------------------------
  // Test 6: HTTP REST Endpoints via Express App
  // ----------------------------------------------------
  console.log('\n[Test 6] HTTP REST endpoints: /api/health, /api/tracks/curated, /api/rooms/:id');
  let testPort = 3000;
  if (!server.listening) {
    testPort = 3099;
    await new Promise<void>((resolve) => {
      server.listen(testPort, '127.0.0.1', () => resolve());
    });
  } else {
    const addr = server.address();
    if (typeof addr === 'object' && addr) {
      testPort = addr.port;
    }
  }

  try {
    // 1. GET /api/health
    const healthData = await makeHttpGet(`http://127.0.0.1:${testPort}/api/health`);
    const healthJson = JSON.parse(healthData.body);
    assert.strictEqual(healthData.statusCode, 200, 'Health check should return 200');
    assert.strictEqual(healthJson.status, 'ok', 'Health status must be ok');
    assert.strictEqual(typeof healthJson.time, 'number', 'Health check must include server time');

    // 2. GET /api/tracks/curated
    const curatedData = await makeHttpGet(`http://127.0.0.1:${testPort}/api/tracks/curated`);
    const curatedJson = JSON.parse(curatedData.body);
    assert.strictEqual(curatedData.statusCode, 200, 'Curated tracks should return 200');
    assert.strictEqual(curatedJson.results.length, 6, 'Should return 6 curated tracks');

    // 3. GET /api/rooms/:id (non-existent -> 404)
    const missingRoom = await makeHttpGet(`http://127.0.0.1:${testPort}/api/rooms/non-existent-room-99`);
    assert.strictEqual(missingRoom.statusCode, 404, 'Non-existent room should return 404');
    console.log('  ✓ HTTP REST routes verified successfully');
  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }

  console.log('\n====================================================');
  console.log('ALL TESTS PASSED SUCCESSFULLY! (6/6 component suites)');
  console.log('====================================================\n');
  process.exit(0);
}

function makeHttpGet(urlStr: string): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    http.get(urlStr, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode || 500, body }));
    }).on('error', reject);
  });
}

runTests().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});

