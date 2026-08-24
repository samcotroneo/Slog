import { useEffect, useState } from 'react';
import { db } from '../db.js';
import Modal from './Modal.jsx';
import { APP_VERSION } from '../version.js';

const PROFILE_ID = 'user_profile';

export default function ProfileSettingsModal({ onClose }) {
  const [heightCm, setHeightCm] = useState('');
  const [weightGoalKg, setWeightGoalKg] = useState('');
  const [proteinGoalGrams, setProteinGoalGrams] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    db.profile.get(PROFILE_ID).then(profile => {
      setHeightCm(profile?.heightCm ?? '');
      setWeightGoalKg(profile?.weightGoalKg ?? '');
      setProteinGoalGrams(profile?.proteinGoalGrams ?? '');
    });
  }, []);

  async function handleSaveSettings(event) {
    event.preventDefault();
    const heightValue = Number(heightCm);
    const weightGoalValue = Number(weightGoalKg);
    const proteinGoalValue = Number(proteinGoalGrams);

    if (!Number.isFinite(heightValue) || heightValue < 50 || heightValue > 300) {
      setError('Enter a height between 50 and 300 cm.');
      return;
    }
    if (!Number.isFinite(weightGoalValue) || weightGoalValue < 20 || weightGoalValue > 500) {
      setError('Enter a goal weight between 20 and 500 kg.');
      return;
    }
    if (!Number.isInteger(proteinGoalValue) || proteinGoalValue < 1 || proteinGoalValue > 500) {
      setError('Enter a daily protein target between 1 and 500 grams.');
      return;
    }

    setError('');
    const profile = await db.profile.get(PROFILE_ID);
    await db.profile.put({
      ...profile,
      id: PROFILE_ID,
      heightCm: heightValue,
      weightGoalKg: weightGoalValue,
      proteinGoalGrams: proteinGoalValue
    });
    setHeightCm(String(heightValue));
    setWeightGoalKg(String(weightGoalValue));
    setProteinGoalGrams(String(proteinGoalValue));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  }

  return (
    <Modal title="Settings" onClose={onClose}>
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
                  onChange={event => setHeightCm(event.target.value)}
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
                  onChange={event => setWeightGoalKg(event.target.value)}
                  required
                />
                <span>kg</span>
              </div>
            </label>
          </div>
          <div className="profile-setting">
            <div>
              <h2 className="panel-title">Protein target</h2>
              <p className="panel-copy">A daily target for the cumulative protein tracker.</p>
            </div>
            <label className="field-label">
              Daily protein target
              <div className="unit-input">
                <input
                  type="number"
                  min="1"
                  max="500"
                  placeholder="e.g. 140"
                  value={proteinGoalGrams}
                  onChange={event => setProteinGoalGrams(event.target.value)}
                  required
                />
                <span>g</span>
              </div>
            </label>
          </div>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="settings-actions">
          <button type="submit">Save settings</button>
          {settingsSaved && <span className="success-msg">Settings saved</span>}
        </div>
        <p className="app-version">Version {APP_VERSION}</p>
      </form>
    </Modal>
  );
}
