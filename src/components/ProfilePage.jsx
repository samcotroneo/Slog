import { useEffect, useState } from 'react';
import { db } from '../db.js';

const PROFILE_ID = 'user_profile';

export default function ProfilePage() {
  const [form, setForm] = useState({ heightCm: '', birthYear: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    db.profile.get(PROFILE_ID).then(p => {
      if (p) setForm({ heightCm: p.heightCm ?? '', birthYear: p.birthYear ?? '' });
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    await db.profile.put({
      id: PROFILE_ID,
      heightCm: Number(form.heightCm),
      birthYear: Number(form.birthYear)
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="page">
      <h2>Profile</h2>
      <form onSubmit={handleSubmit} className="card form-card">
        <label>
          Height (cm)
          <input
            type="number"
            min="50"
            max="300"
            value={form.heightCm}
            onChange={e => setForm(f => ({ ...f, heightCm: e.target.value }))}
            required
          />
        </label>
        <label>
          Birth Year
          <input
            type="number"
            min="1900"
            max={new Date().getFullYear()}
            value={form.birthYear}
            onChange={e => setForm(f => ({ ...f, birthYear: e.target.value }))}
            required
          />
        </label>
        <button type="submit">Save Profile</button>
        {saved && <span className="success-msg">Saved ✓</span>}
      </form>
    </div>
  );
}
