import { useState } from 'react';
import { db } from '../db.js';

const PROFILE_ID = 'user_profile';

export default function ProfileSetupPage({ onComplete }) {
  const [heightCm, setHeightCm] = useState('');
  const [weightGoalKg, setWeightGoalKg] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const height = Number(heightCm);
    const weightGoal = Number(weightGoalKg);

    if (!Number.isFinite(height) || height < 50 || height > 300) {
      setError('Enter a height between 50 and 300 cm.');
      return;
    }

    if (!Number.isFinite(weightGoal) || weightGoal < 20 || weightGoal > 500) {
      setError('Enter a goal weight between 20 and 500 kg.');
      return;
    }

    setError('');
    await db.profile.put({
      id: PROFILE_ID,
      heightCm: height,
      weightGoalKg: weightGoal,
      setupComplete: true
    });
    onComplete();
  }

  return (
    <div className="setup-page">
      <div className="setup-intro">
        <h1>Let&apos;s make it about you.</h1>
        <p>We know taking control of your health can be a slog, the first step is to start taking notice. Let&apos;s set a couple of baselines to make logging easier.</p>
      </div>

      <form className="card setup-card" onSubmit={handleSubmit}>
        <div className="setup-fields">
          <label className="field-label">
            Height
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

          <label className="field-label">
            Weight goal
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

        <button type="submit">Continue to Slog</button>
        {error && <p className="form-error" role="alert">{error}</p>}
        <p className="setup-note">Your details are saved locally in this browser.</p>
      </form>
    </div>
  );
}
