import { useEffect, useState } from 'react';
import { db } from '../db.js';
import { nanoid, todayISO } from '../utils.js';

const FREQUENCIES = ['daily', 'weekly', 'fortnightly', 'monthly'];

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
    logs
      .filter(log => loggedCount(log, target) >= target)
      .map(log => log.date)
  );
  let date = endDate;
  let streak = 0;

  while (completedDates.has(date)) {
    streak += 1;
    date = previousDate(date);
  }

  return streak;
}

export default function HabitsPage() {
  const [habits, setHabits] = useState([]);
  const [streaks, setStreaks] = useState({});
  const [completionCounts, setCompletionCounts] = useState({});
  const [newHabit, setNewHabit] = useState({ name: '', target: 1, frequency: 'daily' });
  const [habitError, setHabitError] = useState('');
  const [editingHabits, setEditingHabits] = useState(false);

  const today = todayISO();
  const previousTarget = newHabit.target > 1 ? newHabit.target - 1 : null;
  const nextTarget = newHabit.target < 20 ? newHabit.target + 1 : null;

  async function loadHabitData() {
    const [activeHabits, logs] = await Promise.all([
      db.habits.where('active').equals(1).toArray(),
      db.habitLogs.toArray()
    ]);
    const logsByHabit = {};

    logs.forEach(log => {
      if (!logsByHabit[log.habitId]) logsByHabit[log.habitId] = [];
      logsByHabit[log.habitId].push(log);
    });

    const streakMap = {};
    activeHabits.forEach(habit => {
      streakMap[habit.id] = calculateStreak(logsByHabit[habit.id] ?? [], habit.target, today);
    });

    setHabits(activeHabits);
    setStreaks(streakMap);
    setCompletionCounts(Object.fromEntries(
      activeHabits.map(habit => [
        habit.id,
        (logsByHabit[habit.id] ?? []).reduce((total, log) => total + loggedCount(log, habit.target), 0)
      ])
    ));
  }

  useEffect(() => {
    loadHabitData();
  }, []);

  async function handleAddHabit(e) {
    e.preventDefault();
    const target = Number(newHabit.target);
    if (!newHabit.name.trim() || !Number.isInteger(target) || target < 1 || target > 20) {
      setHabitError('Enter a habit and choose a number from 1 to 20.');
      return;
    }

    setHabitError('');
    await db.habits.add({
      id: nanoid(),
      name: newHabit.name,
      target,
      frequency: newHabit.frequency,
      active: 1
    });
    setNewHabit({ name: '', target: 1, frequency: 'daily' });
    await loadHabitData();
  }

  async function handleArchive(id) {
    await db.habits.update(id, { active: 0 });
    await loadHabitData();
  }

  return (
    <div className="page page-habits">
      <div className="page-heading">
        <div>
          <h1>Habits</h1>
        </div>
      </div>

      <form onSubmit={handleAddHabit} className="form-card habit-builder">
        <p className="habit-prompt">I want to</p>
        <label className="habit-intention-field">
          <span className="sr-only">Habit intention</span>
          <input
            value={newHabit.name}
            onChange={e => setNewHabit(f => ({ ...f, name: e.target.value }))}
            placeholder="Walk 8k steps a day"
            required
          />
        </label>
        <div className="habit-picker-block">
          <div className="times-picker">
            <div className="number-carousel" role="radiogroup" aria-label="How many times">
              <button
                type="button"
                className="carousel-control"
                onClick={() => setNewHabit(f => ({ ...f, target: Math.max(1, f.target - 1) }))}
                disabled={!previousTarget}
                aria-label="Decrease number of times"
              >
                -
              </button>
              <div className="carousel-window">
                {previousTarget ? (
                  <button
                    type="button"
                    role="radio"
                    aria-checked="false"
                    className="carousel-option adjacent"
                    onClick={() => setNewHabit(f => ({ ...f, target: previousTarget }))}
                  >
                    {previousTarget}
                  </button>
                ) : <span className="carousel-option adjacent placeholder" aria-hidden="true" />}
                <span
                  role="radio"
                  aria-checked="true"
                  className="carousel-option selected"
                  aria-label={`${newHabit.target} times`}
                >
                  {newHabit.target}
                </span>
                {nextTarget ? (
                  <button
                    type="button"
                    role="radio"
                    aria-checked="false"
                    className="carousel-option adjacent"
                    onClick={() => setNewHabit(f => ({ ...f, target: nextTarget }))}
                  >
                    {nextTarget}
                  </button>
                ) : <span className="carousel-option adjacent placeholder" aria-hidden="true" />}
              </div>
              <button
                type="button"
                className="carousel-control"
                onClick={() => setNewHabit(f => ({ ...f, target: Math.min(20, f.target + 1) }))}
                disabled={!nextTarget}
                aria-label="Increase number of times"
              >
                +
              </button>
            </div>
            <span className="times-suffix" aria-hidden="true">times</span>
          </div>
        </div>
        <div className="habit-picker-block">
          <div className="frequency-picker" role="radiogroup" aria-label="How often">
            {FREQUENCIES.map(frequency => (
              <button
                key={frequency}
                type="button"
                role="radio"
                aria-checked={newHabit.frequency === frequency}
                className={'frequency-option' + (newHabit.frequency === frequency ? ' active' : '')}
                onClick={() => setNewHabit(f => ({ ...f, frequency }))}
              >
                {frequency}
              </button>
            ))}
          </div>
        </div>
        <button type="submit">Add habit</button>
        {habitError && <p className="form-error" role="alert">{habitError}</p>}
      </form>

      <div className="card habit-card habit-library-card">
        <div className="section-heading">
          <div>
            <h2>Habit library</h2>
            <p className="panel-copy">Configure the routines that appear in your daily check-in.</p>
          </div>
          <div className="today-heading-actions">
            <span>{habits.length} active</span>
            <button
              type="button"
              className={'today-edit-button' + (editingHabits ? ' active' : '')}
              onClick={() => setEditingHabits(value => !value)}
              aria-pressed={editingHabits}
            >
              <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {editingHabits ? <path d="m6 12 4 4 8-8" /> : <><path d="m5 19 3.5-.8L19 7.7a2.1 2.1 0 0 0-3-3L5.8 15.5z" /><path d="m14.5 5.5 4 4" /></>}
              </svg>
              {editingHabits ? 'Done' : 'Edit'}
            </button>
          </div>
        </div>
        {habits.length === 0 && <p className="muted">No active habits. Add one above.</p>}
        <ul className="habit-list">
          {habits.map(h => {
            return (
              <li key={h.id} className="habit-config-row">
                <div className="habit-config-copy">
                  <strong>{h.name}</strong>
                  <span>{h.frequency ?? 'daily'} · {h.target} {h.target === 1 ? 'time' : 'times'} per period</span>
                </div>
                <div className="habit-config-stats">
                  <span><strong>{streaks[h.id] ?? 0}</strong> day streak</span>
                  <span><strong>{completionCounts[h.id] ?? 0}</strong> completions</span>
                </div>
                <div className="habit-card-actions habit-config-actions">
                  {editingHabits && (
                   <button type="button" className="btn-sm danger" onClick={() => handleArchive(h.id)} aria-label={`Archive ${h.name}`}>
                     Archive
                   </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
