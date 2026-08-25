import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { db } from '../db.js';
import { todayISO } from '../utils.js';

const PROFILE_ID = 'user_profile';
const METRICS = [
  { id: 'weight', label: 'Weight', unit: 'kg' },
  { id: 'bmi', label: 'BMI', unit: '' },
  { id: 'waist', label: 'Waistline', unit: 'cm' }
];

function metricValue(log, metric, heightCm) {
  if (metric === 'weight') return Number.isFinite(log.weightKg) ? log.weightKg : null;
  if (metric === 'waist') return Number.isFinite(log.waistCm) ? log.waistCm : null;

  const heightM = Number(heightCm) / 100;
  if (!Number.isFinite(log.weightKg) || !Number.isFinite(heightM) || heightM <= 0) return null;
  return Number((log.weightKg / (heightM * heightM)).toFixed(1));
}

function formatValue(value, unit) {
  return value == null ? '—' : `${value} ${unit}`.trim();
}

function formatProteinGrams(grams) {
  const value = Number(grams);
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

function previousDate(date) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}

function shiftDate(date, days) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function completedProteinDates(logs, goal) {
  return new Set(
    logs
      .filter(log => Number(log.grams) >= goal)
      .map(log => log.date)
  );
}

function calculateCurrentProteinStreak(logs, goal, endDate) {
  const completedDates = completedProteinDates(logs, goal);
  let date = endDate;
  let streak = 0;

  while (completedDates.has(date)) {
    streak += 1;
    date = previousDate(date);
  }

  return streak;
}

function calculateBestProteinStreak(logs, goal) {
  const dates = [...completedProteinDates(logs, goal)].sort();
  let best = 0;
  let streak = 0;
  let previous = null;

  dates.forEach(date => {
    if (previous && previousDate(date) === previous) {
      streak += 1;
    } else {
      streak = 1;
    }
    best = Math.max(best, streak);
    previous = date;
  });

  return best;
}

export default function ProgressPage() {
  const [heightCm, setHeightCm] = useState('');
  const [logs, setLogs] = useState([]);
  const [proteinGoalGrams, setProteinGoalGrams] = useState('');
  const [proteinLogs, setProteinLogs] = useState([]);
  const [metric, setMetric] = useState('weight');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ weightKg: '', waistCm: '' });
  const [error, setError] = useState('');

  async function loadData() {
    const [profile, allLogs, allProteinLogs] = await Promise.all([
      db.profile.get(PROFILE_ID),
      db.weightLogs.orderBy('timestamp').toArray(),
      db.proteinLogs.orderBy('date').toArray()
    ]);
    setHeightCm(profile?.heightCm ?? '');
    setProteinGoalGrams(profile?.proteinGoalGrams ?? '');
    setLogs(allLogs);
    setProteinLogs(allProteinLogs);
  }

  useEffect(() => {
    loadData();
  }, []);

  function startEditing(log) {
    setEditingId(log.id);
    setEditForm({
      weightKg: log.weightKg == null ? '' : String(log.weightKg),
      waistCm: log.waistCm == null ? '' : String(log.waistCm)
    });
    setError('');
  }

  function cancelEditing() {
    setEditingId(null);
    setEditForm({ weightKg: '', waistCm: '' });
  }

  async function handleSaveEdit(e, id) {
    e.preventDefault();
    const weightKg = Number(editForm.weightKg);
    const waistCm = editForm.waistCm === '' ? undefined : Number(editForm.waistCm);
    if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 500 || (waistCm !== undefined && (!Number.isFinite(waistCm) || waistCm < 20 || waistCm > 300))) {
      setError('Check the weight and waistline values before saving.');
      return;
    }

    setError('');
    await db.weightLogs.update(id, { weightKg, waistCm });
    cancelEditing();
    await loadData();
  }

  async function handleDelete(id) {
    await db.weightLogs.delete(id);
    await loadData();
  }

  const chartData = useMemo(() => (
    logs
      .map(log => ({
        date: new Date(log.timestamp).toLocaleDateString(),
        value: metricValue(log, metric, heightCm)
      }))
      .filter(point => point.value !== null)
  ), [heightCm, logs, metric]);

  const selectedMetric = METRICS.find(item => item.id === metric);
  const hasHeight = Number.isFinite(Number(heightCm)) && Number(heightCm) > 0;
  const proteinGoal = Number(proteinGoalGrams);
  const hasProteinGoal = Number.isFinite(proteinGoal) && proteinGoal > 0;
  const today = todayISO();
  const proteinHistory = useMemo(() => {
    const byDate = new Map();

    proteinLogs.forEach(log => {
      const grams = Number(log.grams);
      if (!log.date || !Number.isFinite(grams) || grams < 0) return;
      const existing = byDate.get(log.date);
      if (!existing || grams > existing.grams) {
        byDate.set(log.date, { date: log.date, grams });
      }
    });

    return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
  }, [proteinLogs]);
  const currentProteinStreak = hasProteinGoal
    ? calculateCurrentProteinStreak(proteinHistory, proteinGoal, today)
    : null;
  const bestProteinStreak = hasProteinGoal
    ? calculateBestProteinStreak(proteinHistory, proteinGoal)
    : null;
  const weeklyProteinLogs = proteinHistory.filter(log => log.date >= shiftDate(today, -6) && log.date <= today && log.grams > 0);
  const weeklyProteinAverage = weeklyProteinLogs.length > 0
    ? weeklyProteinLogs.reduce((total, log) => total + log.grams, 0) / weeklyProteinLogs.length
    : null;

  return (
    <div className="page page-progress">
      <div className="page-heading">
        <div>
          <h1>Progress</h1>
        </div>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="card chart-card trend-card progress-trend-card">
          <div className="chart-heading">
            <h2>Trend</h2>
            <span>{selectedMetric.label}</span>
          </div>
          <div className="metric-tabs" role="tablist" aria-label="Trend metric">
            {METRICS.map(item => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={metric === item.id}
                className={'metric-tab' + (metric === item.id ? ' active' : '')}
                onClick={() => setMetric(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {metric === 'bmi' && !hasHeight ? (
            <div className="chart-empty"><p>Save your height above to see BMI.</p></div>
          ) : chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={190}>
              <LineChart data={chartData} margin={{ top: 18, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#e7efe6" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#7c8793' }} axisLine={false} tickLine={false} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#7c8793' }} axisLine={false} tickLine={false} width={36} />
                <Tooltip
                  formatter={value => [formatValue(value, selectedMetric.unit), selectedMetric.label]}
                  contentStyle={{ border: '1px solid #e4e9e6', borderRadius: 10, boxShadow: '0 10px 24px rgba(31, 41, 51, 0.08)' }}
                />
                <Line type="monotone" dataKey="value" stroke="#7f9d77" dot={{ fill: '#7f9d77', r: 3 }} activeDot={{ r: 5 }} strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">
              <p>{chartData.length === 0 ? `Your ${selectedMetric.label.toLowerCase()} trend will appear here after you log it.` : 'Add one more log to see your trend.'}</p>
            </div>
          )}
        </div>

      <div className="card list-card protein-progress-card">
        <div className="section-heading">
          <div>
            <h2>Protein progress</h2>
            <p className="panel-copy">
              {hasProteinGoal
                ? `Daily goal ${formatProteinGrams(proteinGoal)}g`
                : 'Set a daily goal in Settings to track streaks.'}
            </p>
          </div>
          <span>{proteinHistory.length ? `${proteinHistory.length} logged days` : 'No history yet'}</span>
        </div>
        <div className="protein-streak-stats" aria-label="Protein streak summary">
          <div className="protein-streak-stat">
            <strong>{currentProteinStreak ?? '—'}</strong>
            <span>current streak</span>
          </div>
          <div className="protein-streak-stat">
            <strong>{bestProteinStreak ?? '—'}</strong>
            <span>best streak</span>
          </div>
          <div className="protein-streak-stat">
            <strong>{weeklyProteinAverage == null ? '—' : `${formatProteinGrams(weeklyProteinAverage)}g`}</strong>
            <span>7-day average (logged days)</span>
          </div>
        </div>
        {proteinHistory.length === 0 ? (
          <div className="empty-state">
            <p>Your protein history will appear here after you log a daily total.</p>
          </div>
        ) : (
          <ul className="protein-history-list">
            {proteinHistory.map(log => {
              const goalMet = hasProteinGoal && log.grams >= proteinGoal;
              const goalStatus = !hasProteinGoal
                ? 'Goal not set'
                : goalMet
                  ? 'Goal met'
                  : `${formatProteinGrams(proteinGoal - log.grams)}g to goal`;

              return (
                <li key={log.date}>
                  <div className="protein-history-row">
                    <span className="protein-history-date">{new Date(`${log.date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <strong>{formatProteinGrams(log.grams)}g</strong>
                    <span className={'protein-history-status' + (goalMet ? ' complete' : '')}>{goalStatus}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="card list-card">
        <div className="section-heading">
          <h2>Progress log</h2>
          <span>{logs.length ? `${logs.length} total` : 'Nothing logged yet'}</span>
        </div>
        {logs.length === 0 ? (
          <div className="empty-state">
            <p>Your measurement entries will appear here. You can edit them whenever you need to.</p>
          </div>
        ) : (
          <ul className="log-list">
            {[...logs].reverse().map(log => (
              <li key={log.id}>
                {editingId === log.id ? (
                  <form className="log-edit-form" onSubmit={e => handleSaveEdit(e, log.id)}>
                    <span className="log-date">{new Date(log.timestamp).toLocaleString()}</span>
                    <div className="edit-fields">
                      <label className="sr-only" htmlFor={`edit-weight-${log.id}`}>Weight in kilograms</label>
                      <input id={`edit-weight-${log.id}`} type="number" step="0.1" min="20" max="500" value={editForm.weightKg} onChange={e => setEditForm(current => ({ ...current, weightKg: e.target.value }))} />
                      <label className="sr-only" htmlFor={`edit-waist-${log.id}`}>Waistline in centimetres</label>
                      <input id={`edit-waist-${log.id}`} type="number" step="0.1" min="20" max="300" placeholder="Waistline" value={editForm.waistCm} onChange={e => setEditForm(current => ({ ...current, waistCm: e.target.value }))} />
                    </div>
                    <div className="log-actions">
                      <button type="submit" className="btn-sm">Save</button>
                      <button type="button" className="btn-sm" onClick={cancelEditing}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="log-row">
                    <span className="log-date">{new Date(log.timestamp).toLocaleString()}</span>
                    <div className="log-measures">
                      <strong>{formatValue(log.weightKg, 'kg')}</strong>
                      <span>{formatValue(log.waistCm, 'cm')} waist</span>
                    </div>
                    <div className="log-actions">
                      <button type="button" className="btn-sm" onClick={() => startEditing(log)}>Edit</button>
                      <button type="button" className="btn-sm danger" onClick={() => handleDelete(log.id)} aria-label={`Delete entry from ${new Date(log.timestamp).toLocaleDateString()}`}>Delete</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
