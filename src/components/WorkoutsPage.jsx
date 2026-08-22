import { useEffect, useMemo, useState } from 'react';
import { db } from '../db.js';
import { nanoid } from '../utils.js';
import ActiveWorkoutCard from './ActiveWorkoutCard.jsx';
import ExerciseProgressCard from './ExerciseProgressCard.jsx';
import WorkoutBuilder from './WorkoutBuilder.jsx';
import WorkoutHistoryCard from './WorkoutHistoryCard.jsx';

const ACTIVE_WORKOUT_STATE_ID = 'active_workout';

function byMostRecent(a, b) {
  return (b.startedAt ?? b.completedAt ?? 0) - (a.startedAt ?? a.completedAt ?? 0);
}

export default function WorkoutsPage() {
  const [data, setData] = useState({
    exercises: [],
    workouts: [],
    workoutExercises: [],
    workoutSessions: [],
    workoutSessionExercises: [],
    workoutSetLogs: [],
    activeState: null
  });
  const [error, setError] = useState('');

  async function loadWorkoutData() {
    const [
      exercises,
      workouts,
      workoutExercises,
      workoutSessions,
      workoutSessionExercises,
      workoutSetLogs,
      activeState
    ] = await Promise.all([
      db.exercises.toArray(),
      db.workouts.toArray(),
      db.workoutExercises.toArray(),
      db.workoutSessions.toArray(),
      db.workoutSessionExercises.toArray(),
      db.workoutSetLogs.toArray(),
      db.appState.get(ACTIVE_WORKOUT_STATE_ID)
    ]);

    setData({
      exercises,
      workouts,
      workoutExercises,
      workoutSessions,
      workoutSessionExercises,
      workoutSetLogs,
      activeState
    });
  }

  useEffect(() => {
    loadWorkoutData();
  }, []);

  const sortedWorkouts = useMemo(
    () => [...data.workouts].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)),
    [data.workouts]
  );
  const unfinishedSessions = useMemo(
    () => data.workoutSessions.filter(session => session.status !== 'completed').sort(byMostRecent),
    [data.workoutSessions]
  );
  const activeSession = useMemo(() => {
    const current = data.workoutSessions.find(session => session.id === data.activeState?.sessionId && session.status !== 'completed');
    return current ?? unfinishedSessions[0] ?? null;
  }, [data.activeState?.sessionId, data.workoutSessions, unfinishedSessions]);
  const activeWorkout = useMemo(
    () => data.workouts.find(workout => workout.id === activeSession?.workoutId) ?? null,
    [activeSession?.workoutId, data.workouts]
  );
  const activeSessionExercises = useMemo(
    () => data.workoutSessionExercises
      .filter(row => row.sessionId === activeSession?.id)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [activeSession?.id, data.workoutSessionExercises]
  );
  const activeSetLogs = useMemo(
    () => data.workoutSetLogs
      .filter(log => log.sessionId === activeSession?.id)
      .sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0)),
    [activeSession?.id, data.workoutSetLogs]
  );

  async function handleStartWorkout(workoutId) {
    const workout = data.workouts.find(item => item.id === workoutId);
    if (!workout) return;

    if (unfinishedSessions.length > 0) {
      setError('Finish or resume your current workout before starting another one.');
      return;
    }

    const templateRows = data.workoutExercises
      .filter(row => row.workoutId === workoutId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (templateRows.length === 0) {
      setError('Add at least one exercise before starting this workout.');
      return;
    }

    const sessionId = nanoid();
    const startedAt = Date.now();

    await db.transaction(
      'rw',
      [db.workoutSessions, db.workoutSessionExercises, db.appState],
      async () => {
        await db.workoutSessions.add({
          id: sessionId,
          workoutId,
          status: 'active',
          startedAt,
          completedAt: null
        });
        await db.workoutSessionExercises.bulkAdd(templateRows.map(row => ({
          id: nanoid(),
          sessionId,
          exerciseId: row.exerciseId,
          order: row.order,
          prescriptionType: row.prescriptionType,
          targetSets: row.targetSets ?? null,
          targetReps: row.targetReps ?? null,
          targetDurationSeconds: row.targetDurationSeconds ?? null
        })));
        await db.appState.put({
          id: ACTIVE_WORKOUT_STATE_ID,
          sessionId,
          drafts: {},
          updatedAt: startedAt
        });
      }
    );

    setError('');
    await loadWorkoutData();
  }

  return (
    <div className="page page-workouts">
      <div className="page-heading">
        <div>
          <h1>Workouts</h1>
          <p>Build your own lifting sessions, log them set by set, and keep a private record of how each workout progresses over time.</p>
        </div>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <WorkoutBuilder
        exercises={data.exercises}
        workouts={sortedWorkouts}
        workoutExercises={data.workoutExercises}
        onChange={loadWorkoutData}
        onStartWorkout={handleStartWorkout}
      />

      {activeSession ? (
        <ActiveWorkoutCard
          key={`${activeSession.id}:${activeSetLogs.length}:${activeSession.status}`}
          activeSession={activeSession}
          activeState={data.activeState}
          exercises={data.exercises}
          setLogs={activeSetLogs}
          workout={activeWorkout}
          allSetLogs={data.workoutSetLogs}
          sessionExercises={activeSessionExercises}
          onChange={loadWorkoutData}
        />
      ) : (
        <div className="card workout-empty-card">
          <div className="section-heading">
            <h2>Ready for the gym</h2>
          </div>
          <div className="empty-state">
            <p>Start a workout template above and Slog will keep your set-by-set logging ready for quick phone taps.</p>
          </div>
        </div>
      )}

      <div className="content-grid workout-insights-grid">
        <WorkoutHistoryCard
          exercises={data.exercises}
          sessions={data.workoutSessions}
          setLogs={data.workoutSetLogs}
          sessionExercises={data.workoutSessionExercises}
          workouts={data.workouts}
        />
        <ExerciseProgressCard
          exercises={data.exercises}
          sessions={data.workoutSessions}
          setLogs={data.workoutSetLogs}
        />
      </div>
    </div>
  );
}
