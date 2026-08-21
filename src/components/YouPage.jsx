import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { db } from '../db.js';
import { nanoid } from '../utils.js';
import Modal from './Modal.jsx';

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

export default function YouPage({ settingsOpen, onCloseSettings }) {
  const [heightCm, setHeightCm] = useState('');
  const [weightGoalKg, setWeightGoalKg] = useState('');
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState({ weightKg: '', waistCm: '' });
  const [metric, setMetric] = useState('weight');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ weightKg: '', waistCm: '' });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [error, setError] = useState('');

  async function loadData() {
    const [profile, allLogs] = await Promise.all([
      db.profile.get(PROFILE_ID),
      db.weightLogs.orderBy('timestamp').toArray()
    ]);
    setHeightCm(profile?.heightCm ?? '');
    setWeightGoalKg(profile?.weightGoalKg ?? '');
    setLogs(allLogs);
  }

  async function handleSaveSettings(e) {
    e.preventDefault();
    const heightValue = Number(heightCm);
    const goalValue = Number(weightGoalKg);
    if (!Number.isFinite(heightValue) || heightValue < 50 || heightValue > 300) {
      setError('Enter a height between 50 and 300 cm.');
      return;
    }
    if (!Number.isFinite(goalValue) || goalValue < 20 || goalValue > 500) {
      setError('Enter a goal weight between 20 and 500 kg.');
      return;
    }

    setError('');
    const profile = await db.profile.get(PROFILE_ID);
    await db.profile.put({ ...profile, id: PROFILE_ID, heightCm: heightValue, weightGoalKg: goalValue });
    setHeightCm(String(heightValue));
    setWeightGoalKg(String(goalValue));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleLogProgress(e) {
    e.preventDefault();
    const weightKg = Number(progress.weightKg);
    const waistCm = Number(progress.waistCm);
    if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 500 || !Number.isFinite(waistCm) || waistCm < 20 || waistCm > 300) {
      setError('Enter a weight between 20 and 500 kg and a waistline between 20 and 300 cm.');
      return;
    }

    setError('');
    await db.weightLogs.add({
      id: nanoid(),
      weightKg,
      waistCm,
      timestamp: Date.now()
    });
    setProgress({ weightKg: '', waistCm: '' });
    await loadData();
  }

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
    <div className="page page-you">
      <div className="page-heading">
        <div>
          <h1>You</h1>
          <p>Keep the measures that help you understand your progress, all in one calm place.</p>
        </div>
      </div>

      {settingsOpen && (
        <Modal title="Settings" onClose={onCloseSettings}>
          <form onSubmit={handleSaveSettings} className="settings-form">
            <div id="profile-settings" className="profile-panel settings-panel">
              <div className="profile-setting">
                <div>
                  <h2 className="panel-title">Your height</h2>
                  <p className="panel-copy">Saved locally and used to calculate BMI on your trend graph.</p>
                </div>
                <label className="field-label">
                  Height in centimetres
                  <div className="unit-input">
                    <input
                      type="number"
                      min="50"
                      max="300"
                      placeholder="e.g. 178"
                      value={heightCm}
                      onChange={e => setHeightCm(e.target.value)}
                      required
                    />
                    <span>cm</span>
                  </div>
                </label>
              </div>
              <div className="profile-setting">
                <div>
                  <h2 className="panel-title">Weight goal</h2>
                  <p className="panel-copy">A private target to keep your progress pointed in the right direction.</p>
                </div>
                <label className="field-label">
                  Goal weight
                  <div className="unit-input">
                    <input
                      type="number"
                      step="0.1"
                      min="20"
                      max="500"
                      placeholder="e.g. 72.0"
                      value={weightGoalKg}
                      onChange={e => setWeightGoalKg(e.target.value)}
                      required
                    />
                    <span>kg</span>
                  </div>
                </label>
              </div>
            </div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="settings-actions">
              <button type="submit">Save settings</button>
              {settingsSaved && <span className="success-msg">Settings saved</span>}
            </div>
          </form>
        </Modal>
      )}

      {!settingsOpen && error && <p className="form-error" role="alert">{error}</p>}

      <div className="content-grid">
        <form onSubmit={handleLogProgress} className="entry-panel progress-panel">
          <div>
            <h2 className="panel-title">Log my progress</h2>
            <p className="panel-copy">Record your weight and waistline together so the trend tells a fuller story.</p>
          </div>
          <div className="progress-fields">
            <label className="field-label">
              Weight
              <div className="unit-input">
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="500"
                  placeholder="e.g. 72.4"
                  value={progress.weightKg}
                  onChange={e => setProgress(current => ({ ...current, weightKg: e.target.value }))}
                  required
                />
                <span>kg</span>
              </div>
            </label>
            <label className="field-label">
              Waistline
              <div className="unit-input">
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="300"
                  placeholder="e.g. 84"
                  value={progress.waistCm}
                  onChange={e => setProgress(current => ({ ...current, waistCm: e.target.value }))}
                  required
                />
                <span>cm</span>
              </div>
            </label>
          </div>
          <button type="submit">Log progress</button>
        </form>

        <div className="card chart-card trend-card">
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
      </div>

      <div className="card list-card">
        <div className="section-heading">
          <h2>Progress log</h2>
          <span>{logs.length ? `${logs.length} total` : 'Nothing logged yet'}</span>
        </div>
        {logs.length === 0 ? (
          <div className="empty-state">
            <p>Start with today’s progress. You can edit the entry whenever you need to.</p>
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
