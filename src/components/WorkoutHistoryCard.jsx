import { useMemo } from 'react';

function formatDuration(startedAt, completedAt) {
  if (!startedAt || !completedAt || completedAt <= startedAt) return null;
  const totalMinutes = Math.round((completedAt - startedAt) / 60000);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours} hr` : `${hours}h ${minutes}m`;
}

export default function WorkoutHistoryCard({ exercises, sessions, sessionExercises, setLogs, workouts }) {
  const exerciseMap = useMemo(
    () => Object.fromEntries(exercises.map(exercise => [exercise.id, exercise])),
    [exercises]
  );
  const workoutMap = useMemo(
    () => Object.fromEntries(workouts.map(workout => [workout.id, workout])),
    [workouts]
  );
  const sessionExerciseMap = useMemo(() => {
    const grouped = {};
    sessionExercises.forEach(row => {
      if (!grouped[row.sessionId]) grouped[row.sessionId] = [];
      grouped[row.sessionId].push(row);
    });
    return grouped;
  }, [sessionExercises]);
  const setCountMap = useMemo(() => {
    const grouped = {};
    setLogs.forEach(log => {
      grouped[log.sessionId] = (grouped[log.sessionId] ?? 0) + 1;
    });
    return grouped;
  }, [setLogs]);
  const completedSessions = useMemo(
    () => sessions
      .filter(session => session.status === 'completed')
      .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
      .slice(0, 8),
    [sessions]
  );

  return (
    <div className="card workout-history-card">
      <div className="section-heading">
        <h2>Recent sessions</h2>
        <span>{completedSessions.length ? `${completedSessions.length} shown` : 'Nothing completed yet'}</span>
      </div>

      {completedSessions.length === 0 ? (
        <div className="empty-state">
          <p>Completed workouts will appear here with a quick snapshot of what you got through.</p>
        </div>
      ) : (
        <ul className="workout-history-list">
          {completedSessions.map(session => {
            const rows = sessionExerciseMap[session.id] ?? [];
            const exerciseNames = rows
              .slice()
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map(row => exerciseMap[row.exerciseId]?.name ?? 'Exercise');
            const duration = formatDuration(session.startedAt, session.completedAt);
            return (
              <li key={session.id}>
                <div className="workout-history-topline">
                  <strong>{workoutMap[session.workoutId]?.name ?? 'Workout'}</strong>
                  <span>{new Date(session.completedAt ?? session.startedAt).toLocaleDateString()}</span>
                </div>
                <div className="workout-history-meta">
                  <span>{rows.length} {rows.length === 1 ? 'exercise' : 'exercises'}</span>
                  <span>{setCountMap[session.id] ?? 0} sets</span>
                  {duration && <span>{duration}</span>}
                </div>
                {exerciseNames.length > 0 && (
                  <p>{exerciseNames.slice(0, 3).join(' · ')}{exerciseNames.length > 3 ? '…' : ''}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
