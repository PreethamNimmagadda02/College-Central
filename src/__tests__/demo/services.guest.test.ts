import { beforeEach, describe, expect, it, vi } from 'vitest';

const firebaseMock = vi.hoisted(() => ({
  db: { collection: vi.fn(), batch: vi.fn() },
  auth: {},
  storage: {},
}));
vi.mock('@lib/firebase', () => firebaseMock);

import { DEMO_UID, endDemo, startDemo } from '@features/demo/demoSession';
import { getDemoState, resetDemoStoreForTests } from '@features/demo/demoStore';
import { cleanupOldActivities, logActivity } from '@services/activityService';
import {
  DEFAULT_CAMPUS_ZONES,
  getRealTimeCrowdLevels,
  getUserLocationState,
  getUserStats,
  getZonePopularTimes,
  recordLocationVisit,
  updateUserLocation,
  updateUserLocationState,
} from '@services/locationAnalyticsService';

describe('services in guest mode', () => {
  beforeEach(() => {
    localStorage.clear();
    resetDemoStoreForTests();
    endDemo();
    vi.clearAllMocks();
  });

  it('logs guest activity to the demo store', async () => {
    await logActivity(DEMO_UID, {
      type: 'update',
      title: 'Profile Updated',
      description: 'Changed bio',
      icon: '✏️',
    });
    await cleanupOldActivities(DEMO_UID);

    expect(getDemoState().activity[0]!.title).toBe('Profile Updated');
    expect(firebaseMock.db.collection).not.toHaveBeenCalled();
  });

  it('never records location analytics for the guest', async () => {
    const zone = DEFAULT_CAMPUS_ZONES[0]!;

    expect(await getUserLocationState(DEMO_UID)).toBeNull();
    expect(await updateUserLocationState(DEMO_UID, zone.id, 'visit-1')).toBe(false);
    expect(await recordLocationVisit(DEMO_UID, zone)).toBeNull();
    await updateUserLocation(DEMO_UID, { lat: 23.81, lng: 86.44 }, zone.id);
    expect(await getUserStats(DEMO_UID)).toBeNull();

    expect(firebaseMock.db.collection).not.toHaveBeenCalled();
  });

  it('shows sample crowd data while the demo is active', async () => {
    startDemo();

    const levels = await getRealTimeCrowdLevels();
    expect(levels).toHaveLength(DEFAULT_CAMPUS_ZONES.length);
    expect(new Set(levels.map((l) => l.level)).size).toBeGreaterThan(1);
    expect(await getZonePopularTimes(DEFAULT_CAMPUS_ZONES[0]!.id)).toHaveLength(24);

    expect(firebaseMock.db.collection).not.toHaveBeenCalled();
  });
});
