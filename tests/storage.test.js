import { describe, it, expect, beforeEach } from 'vitest';
import { getProfile, setProfile, getLogs, addLog, clearAllData } from '../src/services/storage.js';

// Setup fake IndexedDB environment for tests
import 'fake-indexeddb/auto';

describe('Storage Service', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it('should save and retrieve profile', async () => {
    const profile = { age: 65, conditions: ['Arthritis'] };
    await setProfile(profile);
    const saved = await getProfile();
    expect(saved).toEqual(profile);
  });

  it('should add and retrieve logs', async () => {
    const log = { id: '123', raw_text: 'feeling good', date: new Date().toISOString() };
    await addLog(log);
    const logs = await getLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].id).toBe('123');
  });
});
