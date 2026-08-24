import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { db } from '../db.js';

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

export default function ProgressPage() {
  const [heightCm, setHeightCm] = useState('');
  const [logs, setLogs] = useState([]);
  const [metric, setMetric] = useState('weight');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ weightKg: '', waistCm: '' });
  const [error, setError] = useState('');

  async function loadData() {
    const [profile, allLogs] = await Promise.all([
      db.profile.get(PROFILE_ID),
      db.weightLogs.orderBy('timestamp').toArray()
    ]);
    setHeightCm(profile?.heightCm ?? '');
    setLogs(allLogs);
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

  return (
    <div className="page page-progress">
      <div className="page-heading">
        <div>
          <h1>Progress</h1>
          <p>Review the measures that help you understand your progress, and keep your private target in view.</p>
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
