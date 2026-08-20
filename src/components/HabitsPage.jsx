import { useEffect, useState } from 'react';
import { db } from '../db.js';
import { nanoid, todayISO } from '../utils.js';

export default function HabitsPage() {
  const [habits, setHabits] = useState([]);
  const [todayLogs, setTodayLogs] = useState({});
  const [newHabit, setNewHabit] = useState({ name: '', target: '' });

  const today = todayISO();

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
    await db.habits.add({
      id: nanoid(),
      name: newHabit.name,
      target: parseFloat(newHabit.target) || 1,
      active: 1
    });
    setNewHabit({ name: '', target: '' });
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
    <div className="page">
      <h2>Habits</h2>

      <form onSubmit={handleAddHabit} className="card form-card">
        <label>
          Habit Name
          <input
            value={newHabit.name}
            onChange={e => setNewHabit(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Water (L)"
            required
          />
        </label>
        <label>
          Daily Target
          <input
            type="number"
            step="0.1"
            min="0"
            value={newHabit.target}
            onChange={e => setNewHabit(f => ({ ...f, target: e.target.value }))}
            placeholder="e.g. 3"
            required
          />
        </label>
        <button type="submit">Add Habit</button>
      </form>

      <div className="card">
        <h3>Today — {today}</h3>
        {habits.length === 0 && <p className="muted">No active habits. Add one above.</p>}
        <ul className="habit-list">
          {habits.map(h => {
            const log = todayLogs[h.id];
            const pct = log ? Math.min(100, Math.round((log.value / h.target) * 100)) : 0;
            return (
              <li key={h.id}>
                <div className="habit-row">
                  <span className="habit-name">{h.name}</span>
                  <span className="habit-target">Target: {h.target}</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0"
                    defaultValue={log?.value ?? ''}
                    key={log?.id ?? h.id}
                    onBlur={e => handleLogValue(h, e.target.value || 0)}
                    className="habit-input"
                  />
                  <button className="btn-sm danger" onClick={() => handleArchive(h.id)}>Archive</button>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: pct + '%' }} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
