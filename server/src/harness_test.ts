/**
 * server/src/harness_test.ts
 * Challenger M1_2 Stress Harness & Resilience Test Suite
 * Rigorously challenges:
 * 1. Jamendo fallback handling under network failure, corruption, and invalid queries.
 * 2. Queue boundary values, deduplication, auto-advance edge cases, bulk load.
 * 3. Clock synchronization & position calculation boundary values.
 * 4. Real-time Socket.IO malformed payload fuzzing & crash resistance.
 * 5. HTTP REST route fuzzing (invalid room IDs, array query crash, object query crash).
 */

process.env.NODE_ENV = 'test';

import http from 'http';
import https from 'https';
import fs from 'fs';
import { EventEmitter } from 'events';
import { RoomManager } from './rooms';
import { addToQueue, advanceTrack, clearQueue, removeFromQueue } from './queue';
import { calculateExpectedPosition, handleClockPing } from './clockSync';
import { FALLBACK_TRACKS, getCuratedTracks, searchJamendoTracks } from './jamendo';
import { app, io, roomManager, server } from './index';
import { Track } from './types';

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  error?: string;
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
}

const results: TestResult[] = [];

let unhandledRejectionCount = 0;
let lastUnhandledRejection: any = null;

process.on('unhandledRejection', (reason: any) => {
  unhandledRejectionCount++;
  lastUnhandledRejection = reason;
});

function record(
  suite: string,
  name: string,
  passed: boolean,
  expected: string,
  actual: string,
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' = 'MEDIUM',
  error?: string
) {
  results.push({ suite, name, passed, expected, actual, criticality, error });
  const mark = passed ? '✓' : '✗';
  console.log(`  ${mark} [${criticality}] ${name}`);
  if (!passed) {
    console.log(`     Expected: ${expected}`);
    console.log(`     Actual:   ${actual}`);
    if (error) console.log(`     Error:    ${error}`);
  }
}

function makeHttpGet(urlStr: string, timeoutMs = 2000): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(urlStr, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode || 500, body }));
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`HTTP request timeout after ${timeoutMs}ms (server hung or unhandled async rejection)`));
    });
  });
}

class MockSocket extends EventEmitter {
  id: string;
  rooms: Set<string> = new Set();
  emittedEvents: { event: string; data: any }[] = [];

  constructor(id: string) {
    super();
    this.id = id;
  }

  join(room: string) {
    this.rooms.add(room);
  }

  leave(room: string) {
    this.rooms.delete(room);
  }

  emit(event: string, ...args: any[]): boolean {
    this.emittedEvents.push({ event, data: args[0] });
    return super.emit(event, ...args);
  }
}

async function runHarness() {
  console.log('================================================================');
  console.log('  CHALLENGER M1_2 EMPIRICAL RESILIENCE & BOUNDARY TEST HARNESS');
  console.log('================================================================\n');

  // ====================================================================
  // SUITE 1: Jamendo Proxy Resilience & Offline Fallback Handling
  // ====================================================================
  console.log('[Suite 1] Jamendo Fallback & Network Error Handling');

  // 1.1: Empty and whitespace queries
  try {
    const emptyRes = await searchJamendoTracks('');
    record('Jamendo', 'Empty query returns 6 fallback tracks', emptyRes.length === 6, '6 fallback tracks', `${emptyRes.length} tracks`, 'HIGH');
  } catch (e: any) {
    record('Jamendo', 'Empty query returns fallback tracks', false, '6 tracks', 'Threw exception', 'HIGH', e.message);
  }

  try {
    const whitespaceRes = await searchJamendoTracks('   \t\n  ');
    record('Jamendo', 'Whitespace-only query returns 6 fallback tracks', whitespaceRes.length === 6, '6 fallback tracks', `${whitespaceRes.length} tracks`, 'HIGH');
  } catch (e: any) {
    record('Jamendo', 'Whitespace query', false, '6 tracks', 'Threw exception', 'HIGH', e.message);
  }

  // 1.2: Fallback query matching
  try {
    const chillRes = await searchJamendoTracks('chill');
    const hasMatch = chillRes.some(t => t.name.toLowerCase().includes('chill') || t.artist_name.toLowerCase().includes('chill') || t.genre?.toLowerCase().includes('chill'));
    record('Jamendo', 'Query matching fallback catalogue returns filtered subset', hasMatch && chillRes.length >= 1, 'At least 1 matching track', `${chillRes.length} matches found`, 'MEDIUM');
  } catch (e: any) {
    record('Jamendo', 'Fallback query matching', false, 'Filtered tracks', 'Threw exception', 'MEDIUM', e.message);
  }

  // 1.3: Non-matching query falls back to full catalogue
  try {
    const noMatchRes = await searchJamendoTracks('nonexistent-genre-xyz-98765');
    record('Jamendo', 'Non-matching query falls back cleanly to complete 6-track catalogue', noMatchRes.length === 6, '6 fallback tracks', `${noMatchRes.length} tracks`, 'MEDIUM');
  } catch (e: any) {
    record('Jamendo', 'Non-matching query', false, '6 tracks', 'Threw exception', 'MEDIUM', e.message);
  }

  // 1.4: Simulated Network Outage (DNS failure / ECONNREFUSED)
  const originalHttpsGet = https.get;
  try {
    (https as any).get = function (_url: any, _options: any, _cb: any) {
      const emitter = new EventEmitter();
      process.nextTick(() => {
        emitter.emit('error', new Error('ENOTFOUND api.jamendo.com'));
      });
      return emitter;
    };

    const offlineRes = await searchJamendoTracks('electronic');
    record('Jamendo', 'Network outage (ENOTFOUND) gracefully falls back without throwing', Array.isArray(offlineRes) && offlineRes.length > 0, 'Fallback tracks returned', `${offlineRes.length} tracks returned`, 'CRITICAL');
  } catch (e: any) {
    record('Jamendo', 'Network outage handling', false, 'Clean fallback', 'Exception thrown', 'CRITICAL', e.message);
  } finally {
    (https as any).get = originalHttpsGet;
  }

  // 1.5: Simulated Corrupted Jamendo Response (Invalid JSON / 503 HTML)
  try {
    (https as any).get = function (_url: any, cb: any) {
      const emitter = new EventEmitter();
      const resEmitter: any = new EventEmitter();
      process.nextTick(() => {
        if (typeof cb === 'function') cb(resEmitter);
        resEmitter.emit('data', '<html><body>503 Service Unavailable</body></html>');
        resEmitter.emit('end');
      });
      return emitter;
    };

    const corruptRes = await searchJamendoTracks('jazz');
    record('Jamendo', 'Corrupted non-JSON response (HTML/503) caught and handled cleanly', Array.isArray(corruptRes) && corruptRes.length > 0, 'Fallback tracks returned', `${corruptRes.length} tracks returned`, 'HIGH');
  } catch (e: any) {
    record('Jamendo', 'Corrupted response handling', false, 'Clean fallback', 'Exception thrown', 'HIGH', e.message);
  } finally {
    (https as any).get = originalHttpsGet;
  }

  // 1.6: Jamendo response with malformed / missing audio fields
  try {
    (https as any).get = function (_url: any, cb: any) {
      const emitter = new EventEmitter();
      const resEmitter: any = new EventEmitter();
      process.nextTick(() => {
        if (typeof cb === 'function') cb(resEmitter);
        resEmitter.emit('data', JSON.stringify({
          results: [
            { id: 'bad-1', name: 'No Audio', audio: '' },
            { id: 'bad-2', name: 'Null Audio', audio: null },
            { id: 'good-1', name: 'Valid Track', audio: 'https://example.com/audio.mp3', duration: 120 }
          ]
        }));
        resEmitter.emit('end');
      });
      return emitter;
    };

    const filterRes = await searchJamendoTracks('valid');
    const onlyValid = filterRes.every(t => t.audio && t.audio.length > 0);
    record('Jamendo', 'Malformed tracks without valid audio URLs are filtered out', onlyValid && filterRes.some(t => t.id === 'good-1'), 'Only tracks with audio URL returned', `Returned ${filterRes.length} tracks, all have audio: ${onlyValid}`, 'MEDIUM');
  } catch (e: any) {
    record('Jamendo', 'Missing audio field filtering', false, 'Filtered tracks', 'Exception thrown', 'MEDIUM', e.message);
  } finally {
    (https as any).get = originalHttpsGet;
  }

  // ====================================================================
  // SUITE 2: Queue Boundary & Mutation Stress Testing
  // ====================================================================
  console.log('\n[Suite 2] Queue Boundary & Mutation Stress Testing');

  const qRoom = {
    roomId: 'boundary-queue-room',
    hostId: 'host-bound',
    currentTrack: FALLBACK_TRACKS[0] as Track | null,
    isPlaying: false,
    position: 0,
    lastUpdated: Date.now(),
    queue: [] as any[],
    participants: [],
  };

  // 2.1: Duplicate track rejection
  const add1 = addToQueue(qRoom, FALLBACK_TRACKS[1]);
  const add1Dup = addToQueue(qRoom, FALLBACK_TRACKS[1]);
  record('Queue', 'Adding duplicate track is rejected (returns false)', add1 === true && add1Dup === false && qRoom.queue.length === 1, 'add1: true, add1Dup: false, queue len: 1', `add1: ${add1}, add1Dup: ${add1Dup}, len: ${qRoom.queue.length}`, 'MEDIUM');

  // 2.2: Duplicate with same ID but different metadata
  const modifiedDup = { ...FALLBACK_TRACKS[1], name: 'Modified Title' };
  const addModDup = addToQueue(qRoom, modifiedDup);
  record('Queue', 'Adding duplicate with same ID but different metadata rejected by ID', addModDup === false && qRoom.queue.length === 1, 'addModDup: false, queue len: 1', `addModDup: ${addModDup}, len: ${qRoom.queue.length}`, 'MEDIUM');

  // 2.3: Non-existent track removal
  const remMissing = removeFromQueue(qRoom, 'non-existent-track-id');
  record('Queue', 'Removing non-existent track ID returns false without modifying queue', remMissing === false && qRoom.queue.length === 1, 'false, queue len unchanged', `returned: ${remMissing}, len: ${qRoom.queue.length}`, 'MEDIUM');

  // 2.4: Clear queue
  clearQueue(qRoom);
  const lenAfterFirstClear = qRoom.queue.length;
  clearQueue(qRoom);
  const lenAfterSecondClear = qRoom.queue.length;
  record('Queue', 'clearQueue on populated and already empty queue operates safely', lenAfterFirstClear === 0 && lenAfterSecondClear === 0, 'queue length 0 in both cases', `first: ${lenAfterFirstClear}, second: ${lenAfterSecondClear}`, 'LOW');

  // 2.5: Advance track on empty queue
  const advEmpty = advanceTrack(qRoom);
  record('Queue', 'advanceTrack on empty queue pauses playback and caps position to track duration', advEmpty.finished === true && advEmpty.nextTrack === null && qRoom.isPlaying === false && qRoom.position === FALLBACK_TRACKS[0].duration, `finished: true, nextTrack: null, isPlaying: false, pos: ${FALLBACK_TRACKS[0].duration}`, `finished: ${advEmpty.finished}, isPlaying: ${qRoom.isPlaying}, pos: ${qRoom.position}`, 'HIGH');

  // 2.6: Advance track when currentTrack is null and queue is empty
  qRoom.currentTrack = null;
  qRoom.position = 50;
  const advNull = advanceTrack(qRoom);
  record('Queue', 'advanceTrack when currentTrack is null and queue empty does not throw', advNull.finished === true && advNull.nextTrack === null && qRoom.isPlaying === false, 'finished: true, no exception', `finished: ${advNull.finished}, isPlaying: ${qRoom.isPlaying}`, 'HIGH');

  // 2.7: Bulk stress queue (1,000 items)
  clearQueue(qRoom);
  for (let i = 0; i < 1000; i++) {
    addToQueue(qRoom, {
      id: `bulk-track-${i}`,
      name: `Bulk Track ${i}`,
      artist_name: 'Stress Test',
      album_name: 'Stress Album',
      duration: 100,
      image: 'img.jpg',
      audio: 'audio.mp3',
    });
  }
  record('Queue', 'Bulk addition of 1,000 unique tracks succeeds without memory issues', qRoom.queue.length === 1000, 'queue length 1000', `queue length: ${qRoom.queue.length}`, 'LOW');

  // Pop 1,000 tracks via advanceTrack
  let advanceCount = 0;
  while (qRoom.queue.length > 0) {
    const res = advanceTrack(qRoom);
    if (res.nextTrack) advanceCount++;
  }
  record('Queue', 'Bulk sequential advance through 1,000 tracks empties cleanly', advanceCount === 1000 && qRoom.queue.length === 0, '1000 tracks advanced, queue empty', `${advanceCount} advanced, queue len: ${qRoom.queue.length}`, 'LOW');

  // ====================================================================
  // SUITE 3: Clock Synchronization & Position Math Boundaries
  // ====================================================================
  console.log('\n[Suite 3] Clock Synchronization & Position Math Boundaries');

  let pingInvoked = false;
  handleClockPing(12345, (_st) => {
    pingInvoked = true;
  });
  record('ClockSync', 'handleClockPing invokes callback with server timestamp', pingInvoked, 'callback invoked', `invoked: ${pingInvoked}`, 'LOW');

  let pingSafe = true;
  try {
    handleClockPing(12345, undefined as any);
    handleClockPing(12345, null as any);
    handleClockPing(12345, 'not-a-fn' as any);
  } catch {
    pingSafe = false;
  }
  record('ClockSync', 'handleClockPing handles undefined / non-function callback without throwing', pingSafe, 'no exception thrown', `pingSafe: ${pingSafe}`, 'MEDIUM');

  const now = Date.now();
  const normalPos = calculateExpectedPosition(10.0, now - 4000, now);
  record('ClockSync', 'calculateExpectedPosition forward playback: 10.0s + 4.0s elapsed = ~14.0s', Math.abs(normalPos - 14.0) < 0.05, '14.0s', `${normalPos.toFixed(3)}s`, 'MEDIUM');

  const skewPos = calculateExpectedPosition(10.0, now + 5000, now);
  record('ClockSync', 'calculateExpectedPosition negative elapsed time clamped to 0 (no backward jump)', skewPos === 10.0, '10.0s (clamped)', `${skewPos.toFixed(3)}s`, 'MEDIUM');

  const nanPos = calculateExpectedPosition(NaN, now - 2000, now);
  record('ClockSync', 'calculateExpectedPosition with NaN lastPosition produces NaN (detectable)', Number.isNaN(nanPos), 'NaN', `${nanPos}`, 'LOW');

  // ====================================================================
  // SUITE 4: Socket.IO Malformed Payload Fuzzing & Event Destructuring
  // ====================================================================
  console.log('\n[Suite 4] Socket.IO Malformed Payload Fuzzing & Event Destructuring');

  const mockClient = new MockSocket('mock-socket-fuzz-1');
  // Connect mock socket via Socket.IO connection listener
  const connectionListeners = io.sockets.listeners('connection');
  record('Socket.IO', "io.sockets has 'connection' listener registered", connectionListeners.length > 0, 'At least 1 connection listener', `${connectionListeners.length} found`, 'HIGH');

  if (connectionListeners.length > 0) {
    connectionListeners[0](mockClient as any);
  }

  // Helper to test if a socket event handler throws an uncaught exception on malformed payload
  function testSocketDestructuring(eventName: string, payload: any, testDescription: string, crit: 'CRITICAL' | 'HIGH' | 'MEDIUM' = 'CRITICAL') {
    const listeners = mockClient.listeners(eventName);
    if (listeners.length === 0) {
      record('Socket.IO', `${testDescription} (listener missing)`, false, 'Listener attached', 'No listener found', crit);
      return false;
    }
    const handler = listeners[0];
    let threw = false;
    let errMsg = '';
    try {
      handler(payload);
    } catch (err: any) {
      threw = true;
      errMsg = err.message;
    }
    record(
      'Socket.IO',
      testDescription,
      !threw,
      'Handled cleanly without uncaught exception',
      threw ? `CRASH VULNERABILITY: Uncaught ${errMsg}` : 'Safe (no exception)',
      crit,
      threw ? errMsg : undefined
    );
    return !threw;
  }

  // First join a room properly
  const joinHandler = mockClient.listeners('room:join')[0];
  if (joinHandler) {
    joinHandler({ roomId: 'fuzz-room-1', username: 'Fuzzer' });
  }

  // Test null / undefined payloads (parameter destructuring vulnerability)
  testSocketDestructuring('room:join', null, "socket 'room:join' with null payload (destructure crash check)", 'CRITICAL');
  testSocketDestructuring('room:join', undefined, "socket 'room:join' with undefined payload (destructure crash check)", 'CRITICAL');
  testSocketDestructuring('host:play', null, "socket 'host:play' with null payload (destructure crash check)", 'CRITICAL');
  testSocketDestructuring('host:pause', null, "socket 'host:pause' with null payload (destructure crash check)", 'CRITICAL');
  testSocketDestructuring('host:seek', null, "socket 'host:seek' with null payload (destructure crash check)", 'CRITICAL');
  testSocketDestructuring('host:track_change', null, "socket 'host:track_change' with null payload (destructure crash check)", 'CRITICAL');
  testSocketDestructuring('host:queue_add', null, "socket 'host:queue_add' with null payload (destructure crash check)", 'CRITICAL');
  testSocketDestructuring('host:queue_remove', null, "socket 'host:queue_remove' with null payload (destructure crash check)", 'CRITICAL');
  testSocketDestructuring('host:queue_clear', null, "socket 'host:queue_clear' with null payload (destructure crash check)", 'CRITICAL');
  testSocketDestructuring('room:reaction', null, "socket 'room:reaction' with null payload (destructure crash check)", 'CRITICAL');
  testSocketDestructuring('room:chat', null, "socket 'room:chat' with null payload (destructure crash check)", 'CRITICAL');
  testSocketDestructuring('user:update_profile', null, "socket 'user:update_profile' with null payload (destructure crash check)", 'CRITICAL');

  // Test missing nested properties (e.g. queue_add with track = undefined)
  const queueAddHandler = mockClient.listeners('host:queue_add')[0];
  if (queueAddHandler) {
    let qAddThrew = false;
    let qAddErr = '';
    try {
      queueAddHandler({ roomId: 'fuzz-room-1', track: undefined as any });
    } catch (e: any) {
      qAddThrew = true;
      qAddErr = e.message;
    }
    record(
      'Socket.IO',
      "host:queue_add with track = undefined (missing track object)",
      !qAddThrew,
      'Handled cleanly without uncaught exception',
      qAddThrew ? `CRASH VULNERABILITY: ${qAddErr}` : 'Safe',
      'HIGH',
      qAddThrew ? qAddErr : undefined
    );
  }

  // Test NaN position in host:play and host:seek
  const playHandler = mockClient.listeners('host:play')[0];
  if (playHandler) {
    playHandler({ roomId: 'fuzz-room-1', position: NaN });
    const fuzzRoom = roomManager.get('fuzz-room-1');
    const nanCheck = !Number.isNaN(fuzzRoom?.position);
    record(
      'Socket.IO',
      "host:play position NaN does not corrupt room.position to NaN",
      nanCheck,
      'Clamped to valid number (e.g. 0)',
      `room.position is ${fuzzRoom?.position}`,
      'HIGH',
      !nanCheck ? 'room.position became NaN (causes freeze in auto-advance)' : undefined
    );
    if (fuzzRoom) fuzzRoom.position = 0;
  }

  // Test negative position clamping in host:seek
  const seekHandler = mockClient.listeners('host:seek')[0];
  if (seekHandler) {
    seekHandler({ roomId: 'fuzz-room-1', position: -50 });
    const fuzzRoom = roomManager.get('fuzz-room-1');
    record(
      'Socket.IO',
      "host:seek with negative position is clamped to >= 0",
      fuzzRoom ? fuzzRoom.position >= 0 : false,
      'position >= 0',
      `position: ${fuzzRoom?.position}`,
      'MEDIUM'
    );
  }

  // Test non-string in room:chat
  const chatHandler = mockClient.listeners('room:chat')[0];
  if (chatHandler) {
    let chatThrew = false;
    let chatError = '';
    try {
      chatHandler({ roomId: 'fuzz-room-1', text: 12345 as any });
    } catch (e: any) {
      chatThrew = true;
      chatError = e.message;
    }
    record(
      'Socket.IO',
      "room:chat with non-string text (e.g. number) handled without throwing",
      !chatThrew,
      'Handled without uncaught exception',
      chatThrew ? `CRASH VULNERABILITY: ${chatError}` : 'Safe',
      'HIGH',
      chatThrew ? chatError : undefined
    );
  }

  // Test non-string in user:update_profile
  const profileHandler = mockClient.listeners('user:update_profile')[0];
  if (profileHandler) {
    let profThrew = false;
    let profError = '';
    try {
      profileHandler({ roomId: 'fuzz-room-1', username: 12345 as any, avatar: '🎧' });
    } catch (e: any) {
      profThrew = true;
      profError = e.message;
    }
    record(
      'Socket.IO',
      "user:update_profile with non-string username handled without throwing",
      !profThrew,
      'Handled without uncaught exception',
      profThrew ? `CRASH VULNERABILITY: ${profError}` : 'Safe',
      'HIGH',
      profThrew ? profError : undefined
    );
  }

  // ====================================================================
  // SUITE 5: HTTP REST Route Fuzzing & Boundaries
  // ====================================================================
  console.log('\n[Suite 5] HTTP REST Route Fuzzing & Boundaries');

  let testPort = 3000;
  if (!server.listening) {
    testPort = 3198;
    await new Promise<void>((resolve) => {
      server.listen(testPort, '127.0.0.1', () => resolve());
    });
  } else {
    const addr = server.address();
    if (typeof addr === 'object' && addr) {
      testPort = addr.port;
    }
  }

  const baseUrl = `http://127.0.0.1:${testPort}`;

  // 5.1: Health Endpoint Telemetry
  try {
    const health = await makeHttpGet(`${baseUrl}/api/health`);
    const json = JSON.parse(health.body);
    record('REST API', 'GET /api/health returns 200 with activeRooms and time', health.statusCode === 200 && json.status === 'ok' && typeof json.activeRooms === 'number', 'HTTP 200, status: ok', `HTTP ${health.statusCode}, activeRooms: ${json.activeRooms}`, 'LOW');
  } catch (e: any) {
    record('REST API', 'GET /api/health', false, 'HTTP 200', 'Request failed', 'MEDIUM', e.message);
  }

  // 5.2: Curated Tracks
  try {
    const curated = await makeHttpGet(`${baseUrl}/api/tracks/curated`);
    const json = JSON.parse(curated.body);
    record('REST API', 'GET /api/tracks/curated returns 200 with 6 tracks', curated.statusCode === 200 && Array.isArray(json.results) && json.results.length === 6, 'HTTP 200 with 6 tracks', `HTTP ${curated.statusCode}, ${json.results?.length} tracks`, 'LOW');
  } catch (e: any) {
    record('REST API', 'GET /api/tracks/curated', false, 'HTTP 200', 'Request failed', 'LOW', e.message);
  }

  // 5.3: Non-existent room ID
  try {
    const notFound = await makeHttpGet(`${baseUrl}/api/rooms/completely-nonexistent-room-404`);
    const json = JSON.parse(notFound.body);
    record('REST API', 'GET /api/rooms/:id with non-existent ID returns 404', notFound.statusCode === 404 && json.error === 'Room not found', 'HTTP 404, error: "Room not found"', `HTTP ${notFound.statusCode}, error: "${json.error}"`, 'HIGH');
  } catch (e: any) {
    record('REST API', 'GET /api/rooms/:id non-existent', false, 'HTTP 404', 'Request failed', 'HIGH', e.message);
  }

  // 5.4: Prototype pollution attempt on room ID
  try {
    const protoReq = await makeHttpGet(`${baseUrl}/api/rooms/__proto__`);
    record('REST API', 'GET /api/rooms/__proto__ returns 404 without polluting Object.prototype', protoReq.statusCode === 404 && ({} as any).hostId === undefined, 'HTTP 404, Object.prototype unpolluted', `HTTP ${protoReq.statusCode}, polluted: ${({} as any).hostId !== undefined}`, 'CRITICAL');
  } catch (e: any) {
    record('REST API', 'GET /api/rooms/__proto__', false, 'HTTP 404', 'Request failed', 'CRITICAL', e.message);
  }

  // 5.5: Extremely long room ID (10,000 characters)
  try {
    const longId = 'a'.repeat(10000);
    const longReq = await makeHttpGet(`${baseUrl}/api/rooms/${longId}`);
    record('REST API', 'GET /api/rooms/:id with 10k characters returns 404 without crashing', longReq.statusCode === 404, 'HTTP 404', `HTTP ${longReq.statusCode}`, 'MEDIUM');
  } catch (e: any) {
    record('REST API', 'GET /api/rooms/:id long ID', false, 'HTTP 404', 'Request failed', 'MEDIUM', e.message);
  }

  // 5.6: Malformed URI percent encoding (GET /api/rooms/%)
  try {
    const malformedUri = await makeHttpGet(`${baseUrl}/api/rooms/%`);
    record('REST API', 'GET /api/rooms/% handles malformed URI encoding without crashing', malformedUri.statusCode === 400 || malformedUri.statusCode === 404, 'HTTP 400 or 404', `HTTP ${malformedUri.statusCode}`, 'HIGH');
  } catch (e: any) {
    record('REST API', 'GET /api/rooms/%', false, 'HTTP 400 or 404', 'Request failed', 'HIGH', e.message);
  }

  // 5.7: Search with empty query param (?q=)
  try {
    const emptySearch = await makeHttpGet(`${baseUrl}/api/tracks/search?q=`);
    const json = JSON.parse(emptySearch.body);
    record('REST API', 'GET /api/tracks/search?q= returns curated fallback tracks', emptySearch.statusCode === 200 && json.results?.length === 6, 'HTTP 200 with 6 tracks', `HTTP ${emptySearch.statusCode}, ${json.results?.length} tracks`, 'MEDIUM');
  } catch (e: any) {
    record('REST API', 'GET /api/tracks/search?q=', false, 'HTTP 200', 'Request failed', 'MEDIUM', e.message);
  }

  // 5.8: Array query parameters (?q=foo&q=bar) - testing for q.trim crash
  const rejectionsBefore = unhandledRejectionCount;
  try {
    const dupQuery = await makeHttpGet(`${baseUrl}/api/tracks/search?q=foo&q=bar`, 1000);
    record(
      'REST API',
      'GET /api/tracks/search?q=foo&q=bar (array param) handled gracefully',
      dupQuery.statusCode === 200,
      'HTTP 200 with results or fallback',
      `HTTP ${dupQuery.statusCode}`,
      'CRITICAL'
    );
  } catch (e: any) {
    const causedRejection = unhandledRejectionCount > rejectionsBefore;
    record(
      'REST API',
      'GET /api/tracks/search?q=foo&q=bar (array param) handled gracefully',
      false,
      'HTTP 200 without unhandled rejection',
      causedRejection
        ? `CRASH VULNERABILITY: Unhandled Promise Rejection (${lastUnhandledRejection?.message})`
        : 'Request timed out / connection reset',
      'CRITICAL',
      e.message
    );
  }

  // 5.9: Object query parameters (?q[name]=lofi)
  const rejectionsBeforeObj = unhandledRejectionCount;
  try {
    const objQuery = await makeHttpGet(`${baseUrl}/api/tracks/search?q[name]=lofi`, 1000);
    record(
      'REST API',
      'GET /api/tracks/search?q[name]=lofi (object param) handled gracefully',
      objQuery.statusCode === 200,
      'HTTP 200 with results or fallback',
      `HTTP ${objQuery.statusCode}`,
      'HIGH'
    );
  } catch (e: any) {
    const causedRejection = unhandledRejectionCount > rejectionsBeforeObj;
    record(
      'REST API',
      'GET /api/tracks/search?q[name]=lofi (object param) handled gracefully',
      false,
      'HTTP 200 without unhandled rejection',
      causedRejection
        ? `CRASH VULNERABILITY: Unhandled Promise Rejection (${lastUnhandledRejection?.message})`
        : 'Request timed out / connection reset',
      'HIGH',
      e.message
    );
  }

  // Close server
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });

  // ====================================================================
  // SUMMARY REPORT
  // ====================================================================
  console.log('\n================================================================');
  console.log('                 TEST EXECUTION SUMMARY');
  console.log('================================================================');
  const passed = results.filter(r => r.passed);
  const failed = results.filter(r => !r.passed);
  console.log(`Total Checks:  ${results.length}`);
  console.log(`Passed Checks: ${passed.length}`);
  console.log(`Failed Checks: ${failed.length}`);

  if (failed.length > 0) {
    console.log('\nFAILED CHECKS (VULNERABILITIES & FAILURE MODES DETECTED):');
    for (const f of failed) {
      console.log(`- [${f.criticality}] ${f.suite} -> ${f.name}`);
      console.log(`    Expected: ${f.expected}`);
      console.log(`    Actual:   ${f.actual}`);
      if (f.error) console.log(`    Details:  ${f.error}`);
    }
  }

  console.log('================================================================\n');

  // Save to JSON
  fs.writeFileSync(
    'C:\\Users\\USER\\antigravity\\PoySic\\.agents\\challenger_m1_2\\test_results.json',
    JSON.stringify({ total: results.length, passed: passed.length, failed: failed.length, results }, null, 2)
  );

  return { total: results.length, passed: passed.length, failed: failed.length, results };
}

runHarness()
  .then((summary) => {
    console.log(`Harness completed with ${summary.failed} failures.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal Harness Error:', err);
    process.exit(2);
  });
