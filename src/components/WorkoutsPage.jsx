import { useEffect, useMemo, useState } from 'react';
import { db } from '../db.js';
import ExerciseProgressCard from './ExerciseProgressCard.jsx';
import WorkoutBuilder from './WorkoutBuilder.jsx';
import WorkoutHistoryCard from './WorkoutHistoryCard.jsx';

export default function WorkoutsPage() {
  const [data, setData] = useState({
    exercises: [],
    workouts: [],
    workoutExercises: [],
    workoutSessions: [],
    workoutSessionExercises: [],
    workoutSetLogs: []
  });
  async function loadWorkoutData() {
    const [
      exercises,
      workouts,
      workoutExercises,
      workoutSessions,
      workoutSessionExercises,
      workoutSetLogs
    ] = await Promise.all([
      db.exercises.toArray(),
      db.workouts.toArray(),
      db.workoutExercises.toArray(),
      db.workoutSessions.toArray(),
      db.workoutSessionExercises.toArray(),
      db.workoutSetLogs.toArray()
    ]);

    setData({
      exercises,
      workouts,
      workoutExercises,
      workoutSessions,
      workoutSessionExercises,
      workoutSetLogs
    });
  }

  useEffect(() => {
    loadWorkoutData();
  }, []);

  const sortedWorkouts = useMemo(
    () => [...data.workouts].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)),
    [data.workouts]
  );
  return (
    <div className="page page-workouts">
      <div className="page-heading">
        <div>
          <h1>Workouts</h1>
          <p>Build your own lifting sessions, then review a private record of how each workout progresses over time.</p>
        </div>
      </div>

      <WorkoutBuilder
        exercises={data.exercises}
        workouts={sortedWorkouts}
        workoutExercises={data.workoutExercises}
        onChange={loadWorkoutData}
        showStart={false}
      />

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
