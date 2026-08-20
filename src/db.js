import Dexie from 'dexie';

export const db = new Dexie('HealthTrackerDB');

db.version(1).stores({
  profile: 'id',
  weightLogs: 'id, timestamp',
  habits: 'id, name, active',
  habitLogs: 'id, habitId, date'
});

/**
 * Serializes local IndexedDB into a JSON snapshot payload.
 */
export async function getLocalSnapshot() {
  return {
    version: 1,
    timestamp: Date.now(),
    profile: await db.profile.toArray(),
    weightLogs: await db.weightLogs.toArray(),
    habits: await db.habits.toArray(),
    habitLogs: await db.habitLogs.toArray()
  };
}

/**
 * Atomically overwrites local database with remote JSON data.
 */
export async function restoreLocalSnapshot(data) {
  await db.transaction('rw', [db.profile, db.weightLogs, db.habits, db.habitLogs], async () => {
    await db.profile.clear();
    await db.weightLogs.clear();
    await db.habits.clear();
    await db.habitLogs.clear();

    if (data.profile?.length) await db.profile.bulkAdd(data.profile);
    if (data.weightLogs?.length) await db.weightLogs.bulkAdd(data.weightLogs);
    if (data.habits?.length) await db.habits.bulkAdd(data.habits);
    if (data.habitLogs?.length) await db.habitLogs.bulkAdd(data.habitLogs);
  });
}
