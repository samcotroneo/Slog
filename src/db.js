import Dexie from 'dexie';

export const db = new Dexie('HealthTrackerDB');

db.version(1).stores({
  profile: 'id',
  weightLogs: 'id, timestamp',
  habits: 'id, name, active',
  habitLogs: 'id, habitId, date'
});

db.version(2).stores({
  profile: 'id',
  weightLogs: 'id, timestamp',
  habits: 'id, name, active',
  habitLogs: 'id, habitId, date',
  exercises: 'id, name, active, createdAt, updatedAt',
  workouts: 'id, name, active, createdAt, updatedAt',
  workoutExercises: 'id, workoutId, exerciseId, order',
  workoutSessions: 'id, workoutId, status, startedAt, completedAt',
  workoutSessionExercises: 'id, sessionId, exerciseId, order',
  workoutSetLogs: 'id, sessionId, sessionExerciseId, exerciseId, completedAt',
  appState: 'id'
});

db.version(3).stores({
  profile: 'id',
  weightLogs: 'id, timestamp',
  proteinLogs: 'id, date',
  habits: 'id, name, active',
  habitLogs: 'id, habitId, date',
  exercises: 'id, name, active, createdAt, updatedAt',
  workouts: 'id, name, active, createdAt, updatedAt',
  workoutExercises: 'id, workoutId, exerciseId, order',
  workoutSessions: 'id, workoutId, status, startedAt, completedAt',
  workoutSessionExercises: 'id, sessionId, exerciseId, order',
  workoutSetLogs: 'id, sessionId, sessionExerciseId, exerciseId, completedAt',
  appState: 'id'
});

db.version(4).stores({
  profile: 'id',
  weightLogs: 'id, timestamp',
  proteinLogs: 'id, date',
  proteinPresets: 'id, grams, lastUsedAt',
  habits: 'id, name, active',
  habitLogs: 'id, habitId, date',
  exercises: 'id, name, active, createdAt, updatedAt',
  workouts: 'id, name, active, createdAt, updatedAt',
  workoutExercises: 'id, workoutId, exerciseId, order',
  workoutSessions: 'id, workoutId, status, startedAt, completedAt',
  workoutSessionExercises: 'id, sessionId, exerciseId, order',
  workoutSetLogs: 'id, sessionId, sessionExerciseId, exerciseId, completedAt',
  appState: 'id'
});

/**
 * Serializes local IndexedDB into a JSON snapshot payload.
 */
export async function getLocalSnapshot() {
  const profile = await db.profile.toArray();

  return {
    version: 6,
    timestamp: Date.now(),
    profile: profile.map(({ id, heightCm, weightGoalKg, proteinGoalGrams, setupComplete }) => ({ id, heightCm, weightGoalKg, proteinGoalGrams, setupComplete })),
    weightLogs: await db.weightLogs.toArray(),
    proteinLogs: await db.proteinLogs.toArray(),
    proteinPresets: await db.proteinPresets.toArray(),
    habits: await db.habits.toArray(),
    habitLogs: await db.habitLogs.toArray(),
    exercises: await db.exercises.toArray(),
    workouts: await db.workouts.toArray(),
    workoutExercises: await db.workoutExercises.toArray(),
    workoutSessions: await db.workoutSessions.toArray(),
    workoutSessionExercises: await db.workoutSessionExercises.toArray(),
    workoutSetLogs: await db.workoutSetLogs.toArray(),
    appState: await db.appState.toArray()
  };
}

/**
 * Atomically overwrites local database with remote JSON data.
 */
export async function restoreLocalSnapshot(data) {
  await db.transaction(
    'rw',
    [
      db.profile,
      db.weightLogs,
      db.proteinLogs,
      db.proteinPresets,
      db.habits,
      db.habitLogs,
      db.exercises,
      db.workouts,
      db.workoutExercises,
      db.workoutSessions,
      db.workoutSessionExercises,
      db.workoutSetLogs,
      db.appState
    ],
    async () => {
      await db.profile.clear();
      await db.weightLogs.clear();
      await db.proteinLogs.clear();
      await db.proteinPresets.clear();
      await db.habits.clear();
      await db.habitLogs.clear();
      await db.exercises.clear();
      await db.workouts.clear();
      await db.workoutExercises.clear();
      await db.workoutSessions.clear();
      await db.workoutSessionExercises.clear();
      await db.workoutSetLogs.clear();
      await db.appState.clear();

      if (data.profile?.length) {
        const profile = data.profile.map(({ id, heightCm, weightGoalKg, proteinGoalGrams, setupComplete }) => ({ id, heightCm, weightGoalKg, proteinGoalGrams, setupComplete }));
        await db.profile.bulkAdd(profile);
      }
      if (data.weightLogs?.length) await db.weightLogs.bulkAdd(data.weightLogs);
      if (data.proteinLogs?.length) await db.proteinLogs.bulkAdd(data.proteinLogs);
      if (data.proteinPresets?.length) await db.proteinPresets.bulkAdd(data.proteinPresets);
      if (data.habits?.length) await db.habits.bulkAdd(data.habits);
      if (data.habitLogs?.length) await db.habitLogs.bulkAdd(data.habitLogs);
      if (data.exercises?.length) await db.exercises.bulkAdd(data.exercises);
      if (data.workouts?.length) await db.workouts.bulkAdd(data.workouts);
      if (data.workoutExercises?.length) await db.workoutExercises.bulkAdd(data.workoutExercises);
      if (data.workoutSessions?.length) await db.workoutSessions.bulkAdd(data.workoutSessions);
      if (data.workoutSessionExercises?.length) await db.workoutSessionExercises.bulkAdd(data.workoutSessionExercises);
      if (data.workoutSetLogs?.length) await db.workoutSetLogs.bulkAdd(data.workoutSetLogs);
      if (data.appState?.length) await db.appState.bulkAdd(data.appState);
    }
  );
}
