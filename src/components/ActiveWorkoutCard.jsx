import { useMemo, useState } from 'react';
import { db } from '../db.js';
import { nanoid } from '../utils.js';

const ACTIVE_WORKOUT_STATE_ID = 'active_workout';

function formatDuration(seconds) {
  const totalSeconds = Number(seconds);
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '—';
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const remainder = totalSeconds % 60;
  return remainder === 0 ? `${minutes}m` : `${minutes}m ${remainder}s`;
}

function describeTemplate(row) {
  const sets = row.targetSets ?? 0;
  if (row.prescriptionType === 'duration') return `${sets} sets × ${formatDuration(row.targetDurationSeconds)}`;
  if (row.prescriptionType === 'failure') return `${sets} ${sets === 1 ? 'set' : 'sets'} to failure`;
  return `${sets} sets × ${row.targetReps} reps`;
}

function describeLoggedSet(log) {
  const weight = Number.isFinite(log.weightKg) ? `${log.weightKg} kg` : null;

  if (log.prescriptionType === 'duration') {
    const duration = Number.isFinite(log.durationSeconds) ? formatDuration(log.durationSeconds) : '—';
    return [weight, duration].filter(Boolean).join(' · ');
  }

  if (log.prescriptionType === 'failure') {
    const reps = Number.isFinite(log.repsToFailure) ? `${log.repsToFailure} reps to failure` : 'Failure set';
    return [weight, reps].filter(Boolean).join(' · ');
  }

  const reps = Number.isFinite(log.reps) ? `${log.reps} reps` : '—';
  return [weight, reps].filter(Boolean).join(' · ');
}

function defaultDraftForRow(row, log) {
  return {
    weightKg: log?.weightKg == null ? '' : String(log.weightKg),
    reps: log?.reps == null ? String(row.targetReps ?? '') : String(log.reps),
    durationSeconds: log?.durationSeconds == null ? String(row.targetDurationSeconds ?? '') : String(log.durationSeconds),
    repsToFailure: log?.repsToFailure == null ? '' : String(log.repsToFailure)
  };
}

function validatePositiveNumber(value, max) {
  if (value === '') return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > max) return null;
  return parsed;
}

function getTimestamp() {
  return Date.now();
}

function buildDraftState(sessionExercises, logsBySessionExercise, previousLogsByExercise, activeState, activeSessionId) {
  const baseDrafts = {};

  sessionExercises.forEach(row => {
    const latestCurrentLog = logsBySessionExercise[row.id]?.at(-1);
    const previousLog = latestCurrentLog ?? previousLogsByExercise[row.exerciseId];
    baseDrafts[row.id] = defaultDraftForRow(row, previousLog);
  });

  if (activeState?.sessionId === activeSessionId && activeState.drafts) {
    Object.keys(activeState.drafts).forEach(key => {
      baseDrafts[key] = { ...baseDrafts[key], ...activeState.drafts[key] };
    });
  }

  return baseDrafts;
}

export default function ActiveWorkoutCard({
  activeSession,
  activeState,
  exercises,
  workout,
  sessionExercises,
  setLogs,
  allSetLogs,
  onChange
}) {
  const [error, setError] = useState('');

  const exerciseMap = useMemo(
    () => Object.fromEntries(exercises.map(exercise => [exercise.id, exercise])),
    [exercises]
  );
  const logsBySessionExercise = useMemo(() => {
    const grouped = {};
    setLogs.forEach(log => {
      if (!grouped[log.sessionExerciseId]) grouped[log.sessionExerciseId] = [];
      grouped[log.sessionExerciseId].push(log);
    });
    Object.values(grouped).forEach(list => list.sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0)));
    return grouped;
  }, [setLogs]);
  const previousLogsByExercise = useMemo(() => {
    const grouped = {};

    allSetLogs
      .filter(log => log.sessionId !== activeSession.id && (log.completedAt ?? 0) < (activeSession.startedAt ?? Number.MAX_SAFE_INTEGER))
      .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
      .forEach(log => {
        if (!grouped[log.exerciseId]) grouped[log.exerciseId] = log;
      });

    return grouped;
  }, [activeSession.id, activeSession.startedAt, allSetLogs]);
  const [drafts, setDrafts] = useState(() => buildDraftState(
    sessionExercises,
    logsBySessionExercise,
    previousLogsByExercise,
    activeState,
    activeSession.id
  ));

  async function persistDrafts(nextDrafts) {
    await db.appState.put({
      id: ACTIVE_WORKOUT_STATE_ID,
      sessionId: activeSession.id,
      drafts: nextDrafts,
      updatedAt: getTimestamp()
    });
  }

  async function updateDraft(sessionExerciseId, key, value) {
    const nextDrafts = {
      ...drafts,
      [sessionExerciseId]: {
        ...drafts[sessionExerciseId],
        [key]: value
      }
    };

    setDrafts(nextDrafts);
    await persistDrafts(nextDrafts);
  }

  async function handleLogSet(row) {
    const targetSets = Number(row.targetSets);
    const currentSetCount = logsBySessionExercise[row.id]?.length ?? 0;
    if (!Number.isInteger(targetSets) || targetSets < 1) {
      setError('This exercise has an invalid set target.');
      return;
    }
    if (currentSetCount >= targetSets) {
      setError(`All ${targetSets} planned sets are already logged for this exercise.`);
      return;
    }

    const draft = drafts[row.id] ?? defaultDraftForRow(row);
    const weightKg = validatePositiveNumber(draft.weightKg, 2000);

    if (weightKg === null) {
      setError('Weight needs to be a valid number between 0 and 2000 kg.');
      return;
    }

    let payload = {};

    if (row.prescriptionType === 'duration') {
      const durationSeconds = validatePositiveNumber(draft.durationSeconds, 3600);
      if (durationSeconds == null || durationSeconds < 5) {
        setError('Duration needs to be at least 5 seconds.');
        return;
      }
      payload = { durationSeconds };
    } else if (row.prescriptionType === 'failure') {
      const repsToFailure = validatePositiveNumber(draft.repsToFailure, 500);
      if (repsToFailure == null || repsToFailure < 1) {
        setError('Enter how many reps you managed before failure.');
        return;
      }
      payload = { repsToFailure };
    } else {
      const reps = validatePositiveNumber(draft.reps, 500);
      if (reps == null || reps < 1) {
        setError('Enter a rep count for this set.');
        return;
      }
      payload = { reps };
    }

    let didLogSet = false;
    await db.transaction('rw', db.workoutSetLogs, async () => {
      const loggedSetCount = await db.workoutSetLogs.where('sessionExerciseId').equals(row.id).count();
      if (loggedSetCount >= targetSets) return;

      await db.workoutSetLogs.add({
        id: nanoid(),
        sessionId: activeSession.id,
        sessionExerciseId: row.id,
        exerciseId: row.exerciseId,
        prescriptionType: row.prescriptionType,
        setNumber: loggedSetCount + 1,
        completedAt: getTimestamp(),
        weightKg,
        ...payload
      });
      didLogSet = true;
    });

    if (!didLogSet) {
      setError(`All ${targetSets} planned sets are already logged for this exercise.`);
      await onChange();
      return;
    }

    setError('');
    await onChange();
  }

  async function handleDeleteLastSet(sessionExerciseId) {
    const latestLog = logsBySessionExercise[sessionExerciseId]?.at(-1);
    if (!latestLog) return;
    await db.workoutSetLogs.delete(latestLog.id);
    await onChange();
  }

  async function handlePause() {
    await db.workoutSessions.update(activeSession.id, { status: 'paused' });
    await persistDrafts(drafts);
    await onChange();
  }

  async function handleResume() {
    await db.workoutSessions.update(activeSession.id, { status: 'active' });
    await persistDrafts(drafts);
    await onChange();
  }

  async function handleFinish() {
    await db.workoutSessions.update(activeSession.id, {
      status: 'completed',
      completedAt: getTimestamp()
    });
    await db.appState.delete(ACTIVE_WORKOUT_STATE_ID);
    await onChange();
  }

  return (
    <div className="card active-workout-card">
      <div className="section-heading">
        <div className="active-workout-heading">
          <h2>{workout?.name ?? 'Active workout'}</h2>
          <span className={'workout-status-badge' + (activeSession.status === 'paused' ? ' paused' : '')}>
            {activeSession.status === 'paused' ? 'Paused' : 'In progress'}
          </span>
        </div>
        <span>{new Date(activeSession.startedAt).toLocaleString()}</span>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="active-workout-toolbar">
        <p className="muted">Every tap is saved locally straight away, so you can leave and come back mid-session.</p>
        <div className="log-actions">
          {activeSession.status === 'paused' ? (
            <button type="button" className="btn-sm" onClick={handleResume}>
              Resume
            </button>
          ) : (
            <button type="button" className="btn-sm" onClick={handlePause}>
              Pause
            </button>
          )}
          <button type="button" className="btn-sm danger" onClick={handleFinish}>
            Finish workout
          </button>
        </div>
      </div>

      <ul className="active-workout-list">
        {sessionExercises.map(row => {
          const exerciseLogs = logsBySessionExercise[row.id] ?? [];
          const lastWorkoutLog = previousLogsByExercise[row.exerciseId];
          const nextSet = exerciseLogs.length + 1;
          const draft = drafts[row.id] ?? defaultDraftForRow(row, lastWorkoutLog);
          const setTargetReached = exerciseLogs.length >= (row.targetSets ?? 0);

          return (
            <li key={row.id} className={'active-exercise-card' + (setTargetReached ? ' complete' : '')}>
              <div className="active-exercise-header">
                <div>
                  <strong>{exerciseMap[row.exerciseId]?.name ?? 'Exercise'}</strong>
                  <p>{describeTemplate(row)}</p>
                </div>
                <span>{exerciseLogs.length} / {row.targetSets ?? 0} sets</span>
              </div>

              {lastWorkoutLog && exerciseLogs.length === 0 && (
                <p className="workout-helper-copy">Last time: {describeLoggedSet(lastWorkoutLog)}</p>
              )}

              <div className="active-exercise-inputs">
                <label className="field-label">
                  Weight (kg)
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={draft.weightKg ?? ''}
                    onChange={event => updateDraft(row.id, 'weightKg', event.target.value)}
                    placeholder="Optional"
                  />
                </label>

                {row.prescriptionType === 'duration' ? (
                  <label className="field-label">
                    Seconds
                    <input
                      type="number"
                      min="5"
                      max="3600"
                      step="5"
                      value={draft.durationSeconds ?? ''}
                      onChange={event => updateDraft(row.id, 'durationSeconds', event.target.value)}
                    />
                  </label>
                ) : row.prescriptionType === 'failure' ? (
                  <label className="field-label">
                    Reps to failure
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={draft.repsToFailure ?? ''}
                      onChange={event => updateDraft(row.id, 'repsToFailure', event.target.value)}
                    />
                  </label>
                ) : (
                  <label className="field-label">
                    Reps
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={draft.reps ?? ''}
                      onChange={event => updateDraft(row.id, 'reps', event.target.value)}
                    />
                  </label>
                )}
              </div>

              <div className="active-exercise-actions">
                <button type="button" className="workout-log-set-button" onClick={() => handleLogSet(row)} disabled={setTargetReached}>
                  {setTargetReached ? 'Target reached' : `Log set ${nextSet}`}
                </button>
                {exerciseLogs.length > 0 && (
                  <button type="button" className="btn-sm danger" onClick={() => handleDeleteLastSet(row.id)}>
                    Undo last set
                  </button>
                )}
              </div>

              {exerciseLogs.length > 0 && (
                <ul className="logged-set-list">
                  {exerciseLogs.map(log => (
                    <li key={log.id}>
                      <span>Set {log.setNumber}</span>
                      <span>{describeLoggedSet(log)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
