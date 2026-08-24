import { useEffect, useMemo, useState } from 'react';
import { db } from '../db.js';
import { nanoid, todayISO } from '../utils.js';
import ActiveWorkoutCard from './ActiveWorkoutCard.jsx';

const PROFILE_ID = 'user_profile';
const ACTIVE_WORKOUT_STATE_ID = 'active_workout';
const PROTEIN_PRESETS = [10, 15, 20, 30];

function loggedCount(log, target) {
  const value = Number(log?.value);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(target, Math.max(1, Math.round(value)));
}

function previousDate(date) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}

function calculateStreak(logs, target, endDate) {
  const completedDates = new Set(
    logs.filter(log => loggedCount(log, target) >= target).map(log => log.date)
  );
  let date = endDate;
  let streak = 0;

  while (completedDates.has(date)) {
    streak += 1;
    date = previousDate(date);
  }

  return streak;
}

function byMostRecent(a, b) {
  return (b.startedAt ?? b.completedAt ?? 0) - (a.startedAt ?? a.completedAt ?? 0);
}

function formatProteinGrams(grams) {
  const value = Number(grams);
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

export default function TodayPage({ onNavigate }) {
  const today = todayISO();
  const [data, setData] = useState({
    profile: null,
    weightLogs: [],
    proteinLog: null,
    proteinPresets: [],
    habits: [],
    habitLogs: [],
    exercises: [],
    workouts: [],
    workoutExercises: [],
    workoutSessions: [],
    workoutSessionExercises: [],
    workoutSetLogs: [],
    activeState: null
  });
  const [progress, setProgress] = useState({ weightKg: '', waistCm: '' });
  const [customProteinGrams, setCustomProteinGrams] = useState('');
  const [showCustomProtein, setShowCustomProtein] = useState(false);
  const [error, setError] = useState('');

  async function loadData() {
    const [
      profile,
      weightLogs,
      proteinLog,
      proteinPresets,
      habits,
      habitLogs,
      exercises,
      workouts,
      workoutExercises,
      workoutSessions,
      workoutSessionExercises,
      workoutSetLogs,
      activeState
    ] = await Promise.all([
      db.profile.get(PROFILE_ID),
      db.weightLogs.orderBy('timestamp').toArray(),
      db.proteinLogs.where('date').equals(today).first(),
      db.proteinPresets.orderBy('lastUsedAt').reverse().toArray(),
      db.habits.where('active').equals(1).toArray(),
      db.habitLogs.toArray(),
      db.exercises.toArray(),
      db.workouts.toArray(),
      db.workoutExercises.toArray(),
      db.workoutSessions.toArray(),
      db.workoutSessionExercises.toArray(),
      db.workoutSetLogs.toArray(),
      db.appState.get(ACTIVE_WORKOUT_STATE_ID)
    ]);

    setData({
      profile,
      weightLogs,
      proteinLog: proteinLog ?? null,
      proteinPresets,
      habits,
      habitLogs,
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
    loadData();
  }, []);

  const todayLogs = useMemo(
    () => Object.fromEntries(data.habitLogs.filter(log => log.date === today).map(log => [log.habitId, log])),
    [data.habitLogs, today]
  );
  const logsByHabit = useMemo(
    () => data.habitLogs.reduce((groups, log) => {
      groups[log.habitId] = groups[log.habitId] ?? [];
      groups[log.habitId].push(log);
      return groups;
    }, {}),
    [data.habitLogs]
  );
  const latestProgress = data.weightLogs.at(-1);
  const activeWorkouts = useMemo(
    () => data.workouts.filter(workout => workout.active === 1).sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)),
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

  async function handleLogProgress(event) {
    event.preventDefault();
    const weightKg = Number(progress.weightKg);
    const waistCm = Number(progress.waistCm);
    if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 500 || !Number.isFinite(waistCm) || waistCm < 20 || waistCm > 300) {
      setError('Enter a weight between 20 and 500 kg and a waistline between 20 and 300 cm.');
      return;
    }

    await db.weightLogs.add({ id: nanoid(), weightKg, waistCm, timestamp: Date.now() });
    setProgress({ weightKg: '', waistCm: '' });
    setError('');
    await loadData();
  }

  async function handleAddProtein(value, rememberCustom = false) {
    const grams = Number(value);
    if (!Number.isFinite(grams) || grams <= 0 || grams > 1000) {
      setError('Enter a protein amount between 1 and 1000 grams.');
      return;
    }

    let nextTotal = grams;
    await db.transaction('rw', [db.proteinLogs, db.proteinPresets], async () => {
      const existing = await db.proteinLogs.where('date').equals(today).first();
      const currentTotal = Number(existing?.grams);
      nextTotal = (Number.isFinite(currentTotal) && currentTotal >= 0 ? currentTotal : 0) + grams;
      if (nextTotal > 1000) return;

      if (existing) {
        await db.proteinLogs.update(existing.id, { grams: nextTotal, updatedAt: Date.now() });
      } else {
        await db.proteinLogs.add({ id: nanoid(), date: today, grams: nextTotal, updatedAt: Date.now() });
      }

      if (rememberCustom && !PROTEIN_PRESETS.includes(grams)) {
        const presetId = String(grams);
        const existingPreset = await db.proteinPresets.get(presetId);
        if (existingPreset) {
          await db.proteinPresets.update(presetId, { lastUsedAt: Date.now() });
        } else {
          const oldestPreset = await db.proteinPresets.orderBy('lastUsedAt').first();
          const presetCount = await db.proteinPresets.count();
          if (presetCount >= 5 && oldestPreset) {
            await db.proteinPresets.delete(oldestPreset.id);
          }
          await db.proteinPresets.add({ id: presetId, grams, lastUsedAt: Date.now() });
        }
      }
    });

    if (nextTotal > 1000) {
      setError('Today’s protein total cannot exceed 1000 grams.');
      return;
    }

    setCustomProteinGrams('');
    setShowCustomProtein(false);
    setError('');
    await loadData();
  }

  function handleAddCustomProtein(event) {
    event.preventDefault();
    return handleAddProtein(customProteinGrams, true);
  }

  async function handleClearProtein() {
    await db.proteinLogs.where('date').equals(today).delete();
    setCustomProteinGrams('');
    setShowCustomProtein(false);
    setError('');
    await loadData();
  }

  async function handleLogHabit(habit) {
    const existing = todayLogs[habit.id];
    const currentValue = loggedCount(existing, habit.target);
    if (currentValue >= habit.target) return;

    if (existing) {
      await db.habitLogs.update(existing.id, { value: currentValue + 1 });
    } else {
      await db.habitLogs.add({ id: nanoid(), habitId: habit.id, value: 1, date: today });
    }
    await loadData();
  }

  async function handleUndoHabit(habit) {
    const existing = todayLogs[habit.id];
    if (!existing) return;

    const currentValue = loggedCount(existing, habit.target);
    if (currentValue <= 1) {
      await db.habitLogs.delete(existing.id);
    } else {
      await db.habitLogs.update(existing.id, { value: currentValue - 1 });
    }
    await loadData();
  }

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
    await db.transaction('rw', [db.workoutSessions, db.workoutSessionExercises, db.appState], async () => {
      await db.workoutSessions.add({ id: sessionId, workoutId, status: 'active', startedAt, completedAt: null });
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
      await db.appState.put({ id: ACTIVE_WORKOUT_STATE_ID, sessionId, drafts: {}, updatedAt: startedAt });
    });

    setError('');
    await loadData();
  }

  return (
    <div className="page page-today">
      <div className="page-heading">
        <div>
          <h1>Today</h1>
          <p>A quick check-in for the things you want to carry through the day.</p>
        </div>
        <span className="today-date">{new Date(`${today}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="card daily-checkin">
        <div className="section-heading">
          <div>
            <h2>Daily check-in</h2>
            <p className="panel-copy">Capture today’s signals in one place. Everything saves locally as you go.</p>
          </div>
          <span>{data.habits.length} {data.habits.length === 1 ? 'habit' : 'habits'}</span>
        </div>

        <section className="checkin-section checkin-habits">
          <div className="checkin-section-heading">
            <div>
              <h3>Habits</h3>
              <p>Tap each habit as you complete it.</p>
            </div>
            <button type="button" className="btn-sm" onClick={() => onNavigate('habits')}>Configure habits</button>
          </div>
          {data.habits.length === 0 ? (
            <div className="checkin-empty">
              <p>No habits are ready for today.</p>
              <button type="button" className="modal-secondary" onClick={() => onNavigate('habits')}>Add your first habit</button>
            </div>
          ) : (
            <ul className="today-habit-list">
              {data.habits.map(habit => {
                const log = todayLogs[habit.id];
                const count = loggedCount(log, habit.target);
                const isComplete = count >= habit.target;
                return (
                  <li key={habit.id} className="today-habit-row">
                    <div className={'habit-tap-card' + (isComplete ? ' complete' : '')}>
                      <button type="button" className="habit-log-button" onClick={() => handleLogHabit(habit)} aria-pressed={isComplete} aria-label={`${habit.name}: ${count} of ${habit.target} completed today`}>
                        <span className="habit-card-copy">
                          <span className="habit-card-topline">
                            <span className="habit-name">{habit.name}</span>
                          </span>
                          <span className="habit-frequency">{habit.frequency ?? 'daily'}</span>
                        </span>
                        {habit.target > 1 && (
                          <span className="segmented-progress" role="img" aria-label={`${count} of ${habit.target} completed`}>
                            {Array.from({ length: habit.target }, (_, index) => (
                              <span key={index} className={'progress-segment' + (index < count ? ' filled' : '')} aria-hidden="true" />
                            ))}
                          </span>
                        )}
                      </button>
                      <div className="habit-card-actions">
                        {count > 0 && (
                          <button type="button" className="habit-icon-button habit-undo" onClick={() => handleUndoHabit(habit)} aria-label={`Undo last ${habit.name} log`} title="Undo last log">
                            <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M9 7 5 11l4 4" />
                              <path d="M5 11h8a6 6 0 0 1 0 12h-2" />
                            </svg>
                          </button>
                        )}
                        <span className={'habit-streak' + (calculateStreak(logsByHabit[habit.id] ?? [], habit.target, today) === 0 ? ' inactive' : '')} aria-label={`${calculateStreak(logsByHabit[habit.id] ?? [], habit.target, today)} day streak`}>
                          <svg aria-hidden="true" viewBox="0 0 24 24">
                            <path d="M12 22c4.4 0 7-2.9 7-6.7 0-3-1.7-5.2-4.2-7.4.1 2.1-.7 3.5-2.1 4.6.3-2.8-1.2-5.8-4.6-8.5.3 3.8-4.1 6.2-4.1 10.1C4 18.4 7.4 22 12 22Z" />
                          </svg>
                          <span className="streak-value">{calculateStreak(logsByHabit[habit.id] ?? [], habit.target, today)}</span>
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <form className="checkin-section checkin-protein" onSubmit={handleAddCustomProtein}>
          <div className="checkin-section-heading">
            <div>
              <h3>Protein</h3>
              <p>Add servings as you go and build today’s total.</p>
            </div>
            <button
              type="button"
              className="btn-sm danger protein-clear-button"
              onClick={handleClearProtein}
              disabled={!data.proteinLog || Number(data.proteinLog.grams) <= 0}
              aria-label="Clear today’s protein total"
            >
              Clear
            </button>
          </div>
          <div className="protein-total" aria-live="polite">
            <strong>{data.proteinLog?.grams ?? 0}</strong>
            <span>g today</span>
          </div>
          <div className="protein-quick-add" role="group" aria-label="Add protein">
            {PROTEIN_PRESETS.map(grams => (
              <button key={grams} type="button" className="protein-preset" onClick={() => handleAddProtein(grams)}>+{grams}g</button>
            ))}
            <button type="button" className="btn-sm protein-custom-toggle" onClick={() => setShowCustomProtein(current => !current)}>
              {showCustomProtein ? 'Cancel custom' : 'Custom amount'}
            </button>
          </div>
          {data.proteinPresets.length > 0 && (
            <div className="protein-recent">
              <span className="protein-recent-label">Recent custom</span>
              <div className="protein-quick-add" role="group" aria-label="Recent custom protein amounts">
                {data.proteinPresets.map(preset => (
                  <button key={preset.id} type="button" className="protein-preset protein-preset-recent" onClick={() => handleAddProtein(preset.grams, true)}>
                    +{formatProteinGrams(preset.grams)}g
                  </button>
                ))}
              </div>
            </div>
          )}
          {showCustomProtein && (
            <div className="protein-custom-entry">
              <label className="field-label">
                Custom grams
                <div className="unit-input">
                  <input type="number" min="1" max="1000" step="0.1" placeholder="e.g. 22.5" value={customProteinGrams} onChange={event => setCustomProteinGrams(event.target.value)} required />
                  <span>g</span>
                </div>
              </label>
              <button type="submit">Add protein</button>
            </div>
          )}
        </form>

        <section className="checkin-section checkin-workouts">
          <div className="checkin-section-heading">
            <div>
              <h3>Workout</h3>
              <p>{activeSession ? 'Continue the session you have in progress.' : 'Start a saved workout when you are ready.'}</p>
            </div>
            <button type="button" className="btn-sm" onClick={() => onNavigate('workouts')}>Manage workouts</button>
          </div>
          {activeSession ? (
            <div className="workout-session-callout">
              <strong>{activeWorkout?.name ?? 'Current workout'}</strong>
              <span>{activeSession.status === 'paused' ? 'Paused and ready to resume' : 'In progress'}</span>
            </div>
          ) : activeWorkouts.length > 0 ? (
            <div className="today-workout-options">
              {activeWorkouts.map(workout => (
                <div key={workout.id} className="today-workout-option">
                  <div>
                    <strong>{workout.name}</strong>
                    <span>{data.workoutExercises.filter(row => row.workoutId === workout.id).length} exercises</span>
                  </div>
                  <button type="button" className="btn-sm" onClick={() => handleStartWorkout(workout.id)}>Start workout</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="checkin-empty">
              <p>No workout templates yet.</p>
              <button type="button" className="modal-secondary" onClick={() => onNavigate('workouts')}>Build a workout</button>
            </div>
          )}
        </section>
      </div>

      {activeSession && (
        <ActiveWorkoutCard
          key={`${activeSession.id}:${activeSetLogs.length}:${activeSession.status}`}
          activeSession={activeSession}
          activeState={data.activeState}
          exercises={data.exercises}
          setLogs={activeSetLogs}
          workout={activeWorkout}
          allSetLogs={data.workoutSetLogs}
          sessionExercises={activeSessionExercises}
          onChange={loadData}
        />
      )}

      <form className="card measurements-panel" onSubmit={handleLogProgress}>
        <div className="section-heading">
          <div>
            <h2>Measurements</h2>
            <p className="panel-copy">{latestProgress ? `Last logged ${new Date(latestProgress.timestamp).toLocaleDateString()}` : 'A baseline for your progress, whenever it makes sense to log.'}</p>
          </div>
        </div>
        <div className="progress-fields">
          <label className="field-label">
            Weight
            <div className="unit-input">
              <input type="number" step="0.1" min="20" max="500" placeholder="72.4" value={progress.weightKg} onChange={event => setProgress(current => ({ ...current, weightKg: event.target.value }))} required />
              <span>kg</span>
            </div>
          </label>
          <label className="field-label">
            Waistline
            <div className="unit-input">
              <input type="number" step="0.1" min="20" max="300" placeholder="84" value={progress.waistCm} onChange={event => setProgress(current => ({ ...current, waistCm: event.target.value }))} required />
              <span>cm</span>
            </div>
          </label>
        </div>
        <button type="submit">Log measurements</button>
      </form>

    </div>
  );
}
