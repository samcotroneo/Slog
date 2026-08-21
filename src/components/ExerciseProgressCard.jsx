import { useMemo, useState } from 'react';
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';

function formatValue(value, unit) {
  return value == null ? '—' : `${value} ${unit}`.trim();
}

export default function ExerciseProgressCard({ exercises, sessions, setLogs }) {
  const [selectedExerciseId, setSelectedExerciseId] = useState('');

  const completedSessionIds = useMemo(
    () => new Set(sessions.filter(session => session.status === 'completed').map(session => session.id)),
    [sessions]
  );
  const loggedExerciseIds = useMemo(() => {
    const ids = new Set();
    setLogs.forEach(log => {
      if (completedSessionIds.has(log.sessionId)) ids.add(log.exerciseId);
    });
    return Array.from(ids);
  }, [completedSessionIds, setLogs]);
  const exerciseOptions = useMemo(
    () => exercises
      .filter(exercise => loggedExerciseIds.includes(exercise.id))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [exercises, loggedExerciseIds]
  );
  const resolvedExerciseId = exerciseOptions.some(option => option.id === selectedExerciseId)
    ? selectedExerciseId
    : (exerciseOptions[0]?.id ?? '');

  const chartState = useMemo(() => {
    const relevantLogs = setLogs
      .filter(log => log.exerciseId === resolvedExerciseId && completedSessionIds.has(log.sessionId))
      .sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0));

    if (relevantLogs.length === 0) {
      return {
        data: [],
        label: 'Performance',
        unit: '',
        summary: null
      };
    }

    const sessionGroups = new Map();
    relevantLogs.forEach(log => {
      if (!sessionGroups.has(log.sessionId)) sessionGroups.set(log.sessionId, []);
      sessionGroups.get(log.sessionId).push(log);
    });

    const firstType = relevantLogs[0].prescriptionType ?? 'reps';
    const groupedLogs = Array.from(sessionGroups.values());
    const hasAnyWeight = groupedLogs.some(logs => logs.some(log => Number.isFinite(Number(log.weightKg))));
    const label = firstType === 'duration'
      ? 'Best duration'
      : firstType === 'failure'
        ? 'Best reps to failure'
        : hasAnyWeight
          ? 'Best weight'
          : 'Best reps';
    const unit = firstType === 'duration'
      ? 'sec'
      : firstType === 'failure'
        ? 'reps'
        : hasAnyWeight
          ? 'kg'
          : 'reps';

    const data = Array.from(sessionGroups.entries()).map(([sessionId, logs]) => {
      let value = null;

      if (firstType === 'duration') {
        value = Math.max(...logs.map(log => Number(log.durationSeconds) || 0));
      } else if (firstType === 'failure') {
        value = Math.max(...logs.map(log => Number(log.repsToFailure) || 0));
      } else {
        const weights = logs.map(log => Number(log.weightKg)).filter(Number.isFinite);
        if (weights.length > 0) {
          value = Math.max(...weights);
        } else {
          value = Math.max(...logs.map(log => Number(log.reps) || 0));
        }
      }

      const latestLog = logs.at(-1);
      return {
        sessionId,
        date: new Date(latestLog.completedAt).toLocaleDateString(),
        value
      };
    });

    const summary = data.at(-1)?.value ?? null;

    return { data, label, unit, summary };
  }, [completedSessionIds, resolvedExerciseId, setLogs]);

  return (
    <div className="card workout-progress-card">
      <div className="section-heading">
        <h2>Exercise progression</h2>
        <span>{chartState.label}</span>
      </div>

      {exerciseOptions.length === 0 ? (
        <div className="empty-state">
          <p>Once you complete a workout, pick any exercise here to see how its logged performance is moving.</p>
        </div>
      ) : (
        <>
          <label className="field-label">
            Exercise
            <select
              className="workout-select"
              value={resolvedExerciseId}
              onChange={event => setSelectedExerciseId(event.target.value)}
            >
              {exerciseOptions.map(exercise => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </option>
              ))}
            </select>
          </label>

          <div className="workout-progress-summary">
            <strong>{formatValue(chartState.summary, chartState.unit)}</strong>
            <span>Latest session</span>
          </div>

          {chartState.data.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartState.data} margin={{ top: 16, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#e7efe6" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#7c8793' }} axisLine={false} tickLine={false} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#7c8793' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  formatter={value => [formatValue(value, chartState.unit), chartState.label]}
                  contentStyle={{ border: '1px solid #e4e9e6', borderRadius: 10, boxShadow: '0 10px 24px rgba(31, 41, 51, 0.08)' }}
                />
                <Line type="monotone" dataKey="value" stroke="#7f9d77" dot={{ fill: '#7f9d77', r: 3 }} activeDot={{ r: 5 }} strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">
              <p>Add one more completed session for this exercise to see the trend line.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
