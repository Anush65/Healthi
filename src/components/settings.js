import { clearAllData, getProfile } from '../services/storage.js';

export async function render() {
  const profile = await getProfile();
  
  return `
    <div style="margin-top: 20px;">
      <h1>Settings</h1>
      <p style="color: var(--text-secondary); margin-bottom: 24px;">Manage your preferences and data.</p>
      
      <div class="card">
        <h3 style="margin-bottom: 12px;">Your Profile</h3>
        <p><strong>Age:</strong> ${profile?.age || 'Not set'}</p>
        <p><strong>Conditions:</strong> ${profile?.conditions?.join(', ') || 'None'}</p>
        
        <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 24px 0;" />
        
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
  const btn = document.getElementById('reset-btn');
  if (btn) {
    btn.addEventListener('click', async () => {
      const confirmReset = confirm("Are you sure you want to delete all your data? This cannot be undone.");
      if (confirmReset) {
        await clearAllData();
        window.location.hash = '#/onboarding';
      }
    });
  }
}
