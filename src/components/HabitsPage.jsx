import { useEffect, useState } from 'react';
import { db } from '../db.js';
import { nanoid, todayISO } from '../utils.js';

const FREQUENCIES = ['daily', 'fortnightly', 'weekly', 'monthly'];

export default function HabitsPage() {
  const [habits, setHabits] = useState([]);
  const [todayLogs, setTodayLogs] = useState({});
  const [newHabit, setNewHabit] = useState({ name: '', target: 1, frequency: 'daily' });
  const [habitError, setHabitError] = useState('');

  const today = todayISO();
  const previousTarget = newHabit.target > 1 ? newHabit.target - 1 : null;
  const nextTarget = newHabit.target < 20 ? newHabit.target + 1 : null;

  async function loadHabits() {
    const h = await db.habits.where('active').equals(1).toArray();
    setHabits(h);
  }

  async function loadTodayLogs() {
    const logs = await db.habitLogs.where('date').equals(today).toArray();
    const map = {};
    logs.forEach(l => { map[l.habitId] = l; });
    setTodayLogs(map);
  }

  useEffect(() => {
    loadHabits();
    loadTodayLogs();
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
    loadHabits();
  }

  async function handleArchive(id) {
    await db.habits.update(id, { active: 0 });
    loadHabits();
  }

  async function handleLogValue(habit, value) {
    const existing = todayLogs[habit.id];
    if (existing) {
      await db.habitLogs.update(existing.id, { value: parseFloat(value) });
    } else {
      await db.habitLogs.add({
        id: nanoid(),
        habitId: habit.id,
        value: parseFloat(value),
        date: today
      });
    }
    loadTodayLogs();
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
          <span>{new Date(`${today}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
        </div>
        {habits.length === 0 && <p className="muted">No active habits. Add one above.</p>}
        <ul className="habit-list">
          {habits.map(h => {
            const log = todayLogs[h.id];
            const pct = log ? Math.min(100, Math.round((log.value / h.target) * 100)) : 0;
            return (
              <li key={h.id}>
                <div className="habit-row">
                  <span className="habit-name">{h.name}</span>
                  <span className="habit-target">Target {h.target} · {h.frequency ?? 'daily'}</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0"
                    defaultValue={log?.value ?? ''}
                    key={log?.id ?? h.id}
                    onBlur={e => handleLogValue(h, e.target.value || 0)}
                    className="habit-input"
                    aria-label={`Progress for ${h.name}`}
                  />
                  <button type="button" className="btn-sm danger" onClick={() => handleArchive(h.id)}>Archive</button>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ '--progress-scale': pct / 100 }} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
