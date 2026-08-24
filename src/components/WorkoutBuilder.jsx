import { useMemo, useState } from 'react';
import { db } from '../db.js';
import { nanoid } from '../utils.js';

function createDraftRow(values = {}) {
  return {
    id: nanoid(),
    exerciseName: '',
    prescriptionType: 'reps',
    targetSets: '3',
    targetReps: '10',
    targetDurationSeconds: '45',
    ...values
  };
}

function normaliseText(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function formatDuration(seconds) {
  const wholeSeconds = Number(seconds);
  if (!Number.isFinite(wholeSeconds) || wholeSeconds <= 0) return '';
  if (wholeSeconds < 60) return `${wholeSeconds} sec`;
  const minutes = Math.floor(wholeSeconds / 60);
  const remainder = wholeSeconds % 60;
  return remainder === 0 ? `${minutes} min` : `${minutes}m ${remainder}s`;
}

function describePrescription(row) {
  const sets = Number(row.targetSets);
  if (row.prescriptionType === 'duration') {
    return `${sets} sets × ${formatDuration(row.targetDurationSeconds)}`;
  }
  if (row.prescriptionType === 'failure') {
    return `${sets} ${sets === 1 ? 'set' : 'sets'} to failure`;
  }
  return `${sets} sets × ${row.targetReps} reps`;
}

function validateRow(row) {
  const exerciseName = normaliseText(row.exerciseName);
  const targetSets = Number(row.targetSets);

  if (!exerciseName) return 'Add a name for every exercise.';
  if (!Number.isInteger(targetSets) || targetSets < 1 || targetSets > 12) {
    return 'Choose between 1 and 12 sets for each exercise.';
  }

  if (row.prescriptionType === 'reps') {
    const targetReps = Number(row.targetReps);
    if (!Number.isInteger(targetReps) || targetReps < 1 || targetReps > 100) {
      return 'Choose between 1 and 100 reps for set-and-rep exercises.';
    }
  }

  if (row.prescriptionType === 'duration') {
    const seconds = Number(row.targetDurationSeconds);
    if (!Number.isInteger(seconds) || seconds < 5 || seconds > 3600) {
      return 'Choose a duration between 5 seconds and 60 minutes.';
    }
  }

  return '';
}

export default function WorkoutBuilder({ exercises, workouts, workoutExercises, onChange, onStartWorkout, showStart = true }) {
  const [name, setName] = useState('');
  const [rows, setRows] = useState([createDraftRow()]);
  const [editingWorkoutId, setEditingWorkoutId] = useState(null);
  const [error, setError] = useState('');

  const exerciseMap = useMemo(
    () => Object.fromEntries(exercises.map(exercise => [exercise.id, exercise])),
    [exercises]
  );

  function resetForm() {
    setEditingWorkoutId(null);
    setName('');
    setRows([createDraftRow()]);
    setError('');
  }

  function handleRowChange(id, key, value) {
    setRows(current => current.map(row => (row.id === id ? { ...row, [key]: value } : row)));
  }

  function handleMove(id, direction) {
    setRows(current => {
      const index = current.findIndex(row => row.id === id);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      const [row] = next.splice(index, 1);
      next.splice(targetIndex, 0, row);
      return next;
    });
  }

  function handleEditWorkout(workout) {
    const templateRows = workoutExercises
      .filter(row => row.workoutId === workout.id)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map(row => createDraftRow({
        exerciseName: exerciseMap[row.exerciseId]?.name ?? '',
        prescriptionType: row.prescriptionType ?? 'reps',
        targetSets: String(row.targetSets ?? 3),
        targetReps: String(row.targetReps ?? 10),
        targetDurationSeconds: String(row.targetDurationSeconds ?? 45)
      }));

    setEditingWorkoutId(workout.id);
    setName(workout.name ?? '');
    setRows(templateRows.length ? templateRows : [createDraftRow()]);
    setError('');
  }

  async function handleArchiveWorkout(workoutId) {
    await db.workouts.update(workoutId, { active: 0, updatedAt: Date.now() });
    if (editingWorkoutId === workoutId) resetForm();
    await onChange();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const workoutName = normaliseText(name);

    if (!workoutName) {
      setError('Name the workout before saving it.');
      return;
    }

    if (rows.length === 0) {
      setError('Add at least one exercise to the workout.');
      return;
    }

    const rowError = rows.map(validateRow).find(Boolean);
    if (rowError) {
      setError(rowError);
      return;
    }

    const now = Date.now();

    await db.transaction('rw', [db.exercises, db.workouts, db.workoutExercises], async () => {
      const allExercises = await db.exercises.toArray();
      const exerciseLookup = new Map(allExercises.map(exercise => [exercise.name.trim().toLowerCase(), exercise]));

      const workoutId = editingWorkoutId ?? nanoid();
      const existingWorkout = editingWorkoutId ? await db.workouts.get(editingWorkoutId) : null;
      const preparedRows = [];

      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const exerciseName = normaliseText(row.exerciseName);
        const key = exerciseName.toLowerCase();
        let exercise = exerciseLookup.get(key);

        if (!exercise) {
          exercise = {
            id: nanoid(),
            name: exerciseName,
            active: 1,
            createdAt: now,
            updatedAt: now
          };
          await db.exercises.add(exercise);
          exerciseLookup.set(key, exercise);
        } else if (exercise.active !== 1) {
          await db.exercises.update(exercise.id, { active: 1, updatedAt: now });
        }

        preparedRows.push({
          id: nanoid(),
          workoutId,
          exerciseId: exercise.id,
          order: index,
          prescriptionType: row.prescriptionType,
          targetSets: Number(row.targetSets),
          targetReps: row.prescriptionType === 'reps' ? Number(row.targetReps) : null,
          targetDurationSeconds: row.prescriptionType === 'duration' ? Number(row.targetDurationSeconds) : null
        });
      }

      await db.workouts.put({
        ...existingWorkout,
        id: workoutId,
        name: workoutName,
        active: 1,
        createdAt: existingWorkout?.createdAt ?? now,
        updatedAt: now
      });

      if (editingWorkoutId) {
        await db.workoutExercises.where('workoutId').equals(editingWorkoutId).delete();
      }

      await db.workoutExercises.bulkAdd(preparedRows);
    });

    resetForm();
    await onChange();
  }

  const activeWorkouts = workouts.filter(workout => workout.active === 1);

  return (
    <div className="workout-builder-layout">
      <form className="form-card workout-builder-card" onSubmit={handleSubmit}>
        <div className="section-heading">
          <h2>{editingWorkoutId ? 'Edit workout' : 'Build a workout'}</h2>
          {editingWorkoutId && (
            <button type="button" className="btn-sm" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>

        <label className="field-label">
          Workout name
          <input
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="Push day"
            required
          />
        </label>

        <div className="workout-builder-rows">
          {rows.map((row, index) => (
            <div key={row.id} className="workout-builder-row">
              <label className="field-label">
                Exercise
                <input
                  value={row.exerciseName}
                  onChange={event => handleRowChange(row.id, 'exerciseName', event.target.value)}
                  placeholder="Incline dumbbell press"
                  required
                />
              </label>

              <label className="field-label">
                Track by
                <select
                  className="workout-select"
                  value={row.prescriptionType}
                  onChange={event => handleRowChange(row.id, 'prescriptionType', event.target.value)}
                >
                  <option value="reps">Sets + reps</option>
                  <option value="duration">Sets + duration</option>
                  <option value="failure">Till failure</option>
                </select>
              </label>

              <label className="field-label">
                Sets
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={row.targetSets}
                  onChange={event => handleRowChange(row.id, 'targetSets', event.target.value)}
                  required
                />
              </label>

              {row.prescriptionType === 'reps' ? (
                <label className="field-label">
                  Reps
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={row.targetReps}
                    onChange={event => handleRowChange(row.id, 'targetReps', event.target.value)}
                    required
                  />
                </label>
              ) : row.prescriptionType === 'duration' ? (
                <label className="field-label">
                  Seconds
                  <input
                    type="number"
                    min="5"
                    max="3600"
                    step="5"
                    value={row.targetDurationSeconds}
                    onChange={event => handleRowChange(row.id, 'targetDurationSeconds', event.target.value)}
                    required
                  />
                </label>
              ) : (
                <div className="workout-prescription-pill" aria-label="Track this exercise until failure">
                  Till failure
                </div>
              )}

              <div className="workout-row-actions">
                <button type="button" className="btn-sm" onClick={() => handleMove(row.id, -1)} disabled={index === 0}>
                  ↑
                </button>
                <button type="button" className="btn-sm" onClick={() => handleMove(row.id, 1)} disabled={index === rows.length - 1}>
                  ↓
                </button>
                <button
                  type="button"
                  className="btn-sm danger"
                  onClick={() => setRows(current => current.length === 1 ? [createDraftRow()] : current.filter(item => item.id !== row.id))}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="workout-builder-actions">
          <button type="button" className="modal-secondary" onClick={() => setRows(current => [...current, createDraftRow()])}>
            Add exercise
          </button>
          <button type="submit">{editingWorkoutId ? 'Save workout' : 'Create workout'}</button>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
      </form>

      <div className="card workout-template-card">
        <div className="section-heading">
          <h2>Workout templates</h2>
          <span>{activeWorkouts.length ? `${activeWorkouts.length} saved` : 'None yet'}</span>
        </div>

        {activeWorkouts.length === 0 ? (
          <div className="empty-state">
            <p>Create your first workout template and Slog will keep it ready for gym sessions.</p>
          </div>
        ) : (
          <ul className="workout-template-list">
            {activeWorkouts.map(workout => {
              const templateRows = workoutExercises
                .filter(row => row.workoutId === workout.id)
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

              return (
                <li key={workout.id} className="workout-template-item">
                  <div className="workout-template-header">
                    <div>
                      <strong>{workout.name}</strong>
                      <span>{templateRows.length} {templateRows.length === 1 ? 'exercise' : 'exercises'}</span>
                    </div>
                    <div className="log-actions">
                      {showStart && (
                        <button type="button" className="btn-sm" onClick={() => onStartWorkout(workout.id)}>
                          Start
                        </button>
                      )}
                      <button type="button" className="btn-sm" onClick={() => handleEditWorkout(workout)}>
                        Edit
                      </button>
                      <button type="button" className="btn-sm danger" onClick={() => handleArchiveWorkout(workout.id)}>
                        Archive
                      </button>
                    </div>
                  </div>
                  <ul className="workout-template-exercises">
                    {templateRows.map(row => (
                      <li key={row.id}>
                        <span>{exerciseMap[row.exerciseId]?.name ?? 'Exercise'}</span>
                        <span>{describePrescription(row)}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
