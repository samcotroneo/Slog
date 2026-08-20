import { useEffect, useState } from 'react';
import { db } from '../db.js';
import { nanoid, todayISO } from '../utils.js';

const FREQUENCIES = ['daily', 'fortnightly', 'weekly', 'monthly'];

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

function formatStreak(streak) {
  return `${streak} ${streak === 1 ? 'day' : 'days'} streak`;
}

export default function HabitsPage() {
  const [habits, setHabits] = useState([]);
  const [todayLogs, setTodayLogs] = useState({});
  const [streaks, setStreaks] = useState({});
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
    const todayMap = {};
    const logsByHabit = {};

    logs.forEach(log => {
      if (log.date === today) todayMap[log.habitId] = log;
      if (!logsByHabit[log.habitId]) logsByHabit[log.habitId] = [];
      logsByHabit[log.habitId].push(log);
    });

    const streakMap = {};
    activeHabits.forEach(habit => {
      streakMap[habit.id] = calculateStreak(logsByHabit[habit.id] ?? [], habit.target, today);
    });

    setHabits(activeHabits);
    setTodayLogs(todayMap);
    setStreaks(streakMap);
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

  async function handleLogHabit(habit) {
    const existing = todayLogs[habit.id];
    const currentValue = loggedCount(existing, habit.target);
    if (currentValue >= habit.target) return;

    if (existing) {
      await db.habitLogs.update(existing.id, { value: currentValue + 1 });
    } else {
      await db.habitLogs.add({
        id: nanoid(),
        habitId: habit.id,
        value: 1,
        date: today
      });
    }
    await loadHabitData();
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
    await loadHabitData();
  }

  return (
    <div className="page page-habits">
      <div className="page-heading">
        <div>
          <h1>Habits</h1>
          <p>Small actions become useful when they are easy to return to. Keep today’s list clear and doable.</p>
        </div>
        <p className="heading-note">Log progress by entering what you have done today.</p>
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
          <span className="picker-label">How many times?</span>
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
          <span className="picker-label">How often?</span>
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

      <div className="card habit-card">
        <div className="section-heading">
          <h2>Today</h2>
          <div className="today-heading-actions">
            <span>{new Date(`${today}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
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
            const log = todayLogs[h.id];
            const count = loggedCount(log, h.target);
            const isComplete = count >= h.target;
            return (
              <li key={h.id}>
                <div className={'habit-tap-card' + (isComplete ? ' complete' : '')}>
                  <button
                    type="button"
                    className="habit-log-button"
                    onClick={() => handleLogHabit(h)}
                    aria-pressed={isComplete}
                    aria-label={`${h.name}: ${count} of ${h.target} completed today`}
                  >
                    <span className="habit-card-copy">
                      <span className="habit-name">{h.name}</span>
                      <span className="habit-meta">
                        <span className="habit-frequency">{h.frequency ?? 'daily'}</span>
                        <span
                          className={'habit-streak' + ((streaks[h.id] ?? 0) === 0 ? ' inactive' : '')}
                          aria-label={formatStreak(streaks[h.id] ?? 0)}
                          title={formatStreak(streaks[h.id] ?? 0)}
                        >
                          <svg aria-hidden="true" viewBox="0 0 24 24">
                            <path d="M12 22c4.4 0 7-2.9 7-6.7 0-3-1.7-5.2-4.2-7.4.1 2.1-.7 3.5-2.1 4.6.3-2.8-1.2-5.8-4.6-8.5.3 3.8-4.1 6.2-4.1 10.1C4 18.4 7.4 22 12 22Z" />
                          </svg>
                          <span className="streak-value">{streaks[h.id] ?? 0}</span>
                        </span>
                      </span>
                    </span>
                    {h.target > 1 && (
                      <span className="segmented-progress" role="img" aria-label={`${count} of ${h.target} completed`}>
                        {Array.from({ length: h.target }, (_, index) => (
                          <span
                            key={index}
                            className={'progress-segment' + (index < count ? ' filled' : '')}
                            aria-hidden="true"
                          />
                        ))}
                      </span>
                    )}
                  </button>
                  <div className="habit-card-actions">
                    {count > 0 && (
                      <button
                        type="button"
                        className="habit-icon-button habit-undo"
                        onClick={() => handleUndoHabit(h)}
                        aria-label={`Undo last ${h.name} log`}
                        title="Undo last log"
                      >
                        <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 7 5 11l4 4" />
                          <path d="M5 11h8a6 6 0 0 1 0 12h-2" />
                        </svg>
                      </button>
                    )}
                    {editingHabits && (
                      <button
                        type="button"
                        className="habit-icon-button habit-archive"
                        onClick={() => handleArchive(h.id)}
                        aria-label={`Archive ${h.name}`}
                        title="Archive habit"
                      >
                        <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 8h16v11H4z" />
                          <path d="m3 8 2-4h14l2 4" />
                          <path d="M9 12h6" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
