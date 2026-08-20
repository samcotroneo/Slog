import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { db } from '../db.js';
import { nanoid } from '../utils.js';

export default function WeightLogPage() {
  const [logs, setLogs] = useState([]);
  const [weightKg, setWeightKg] = useState('');

  async function loadLogs() {
    const all = await db.weightLogs.orderBy('timestamp').toArray();
    setLogs(all);
  }

  useEffect(() => { loadLogs(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    await db.weightLogs.add({
      id: nanoid(),
      weightKg: parseFloat(weightKg),
      timestamp: Date.now()
    });
    setWeightKg('');
    loadLogs();
  }

  async function handleDelete(id) {
    await db.weightLogs.delete(id);
    loadLogs();
  }

  const chartData = logs.map(l => ({
    date: new Date(l.timestamp).toLocaleDateString(),
    kg: l.weightKg
  }));

  return (
    <div className="page">
      <h2>Weight Log</h2>

      <form onSubmit={handleAdd} className="card form-card inline-form">
        <input
          type="number"
          step="0.1"
          min="20"
          max="500"
          placeholder="Weight (kg)"
          value={weightKg}
          onChange={e => setWeightKg(e.target.value)}
          required
        />
        <button type="submit">Add Entry</button>
      </form>

      {logs.length > 1 && (
        <div className="card chart-card">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="kg" stroke="#4f46e5" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card">
        {logs.length === 0 && <p className="muted">No entries yet.</p>}
        <ul className="log-list">
          {[...logs].reverse().map(l => (
            <li key={l.id}>
              <span>{new Date(l.timestamp).toLocaleString()}</span>
              <strong>{l.weightKg} kg</strong>
              <button className="btn-sm danger" onClick={() => handleDelete(l.id)}>✕</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
