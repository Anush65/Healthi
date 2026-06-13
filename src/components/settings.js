import { clearAllData, getProfile, setProfile } from '../services/storage.js';
import { ConditionRegistry, getConditionConfig } from '../config/conditions.js';

export async function render() {
  const profile = await getProfile();
  
  const registryHtml = Object.values(ConditionRegistry).map(cond => {
    const isChecked = profile?.conditions?.includes(cond.id) ? 'checked' : '';
    return `
      <label style="display: flex; align-items: center; margin-bottom: 8px;">
        <input type="checkbox" name="setting-condition" value="${cond.id}" ${isChecked} style="width: 20px; height: 20px; margin-right: 12px;">
        <span style="font-size: 1.1rem;">${cond.name}</span>
      </label>
    `;
  }).join('');

  const otherConds = profile?.conditions?.filter(c => !getConditionConfig(c)) || [];

  return `
    <div style="margin-top: 20px;">
      <h1>Settings</h1>
      <p style="color: var(--text-secondary); margin-bottom: 24px;">Manage your preferences and data.</p>
      
      <div class="card" style="margin-bottom: 16px;">
        <h3 style="margin-bottom: 16px;">Manage Conditions</h3>
        <form id="conditions-form">
          <div style="margin-bottom: 16px;">
            ${registryHtml}
          </div>
          <label for="other-setting" style="display: block; font-weight: 500; margin-bottom: 8px;">Other Conditions</label>
          <input type="text" id="other-setting" value="${otherConds.join(', ')}" placeholder="e.g., Asthma" style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-button); font-size: 1rem; margin-bottom: 16px;">
          <button type="submit" class="btn-primary" style="width: 100%;">Save Conditions</button>
        </form>
      </div>

      <div class="card">
        <h3 style="margin-bottom: 12px; color: var(--amber-700);">Danger Zone</h3>
        <p style="color: var(--text-secondary); margin-bottom: 16px;">This will permanently delete all your health logs and profile data.</p>
        <button id="reset-btn" class="btn-primary" style="background-color: var(--amber-700); width: 100%;">
          Reset All Data
        </button>
      </div>
      
      <a href="#/dashboard" style="display: block; text-align: center; margin-top: 24px; color: var(--blue-600); text-decoration: none; font-weight: 600;">
        &larr; Back to Dashboard
      </a>
    </div>
  `;
}

export function init() {
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      const confirmReset = confirm("Are you sure you want to delete all your data? This cannot be undone.");
      if (confirmReset) {
        await clearAllData();
        window.location.hash = '#/onboarding';
      }
    });
  }

  const form = document.getElementById('conditions-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const profile = await getProfile();
      
      const selected = Array.from(document.querySelectorAll('input[name="setting-condition"]:checked')).map(cb => cb.value);
      const other = document.getElementById('other-setting').value.split(',').map(c => c.trim()).filter(c => c);
      const newConditions = [...new Set([...selected, ...other])];
      
      await setProfile({ ...profile, conditions: newConditions });
      
      import('../utils/toast.js').then(({ showToast }) => showToast("Conditions updated!"));
    });
  }
}
