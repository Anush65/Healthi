import { setProfile } from '../services/storage.js';

export async function render() {
  return `
    <div class="card" style="margin-top: 40px; animation: slideDown 0.4s ease-out;">
      <h2>Welcome to Healthi</h2>
      <p style="margin-top: 16px; color: var(--text-secondary);">
        Let's set up your profile. It only takes a few seconds.
      </p>
      
      <form id="onboarding-form" style="margin-top: 24px;">
        <label for="age" style="display: block; font-weight: 500; margin-bottom: 8px;">Your Age (Optional)</label>
        <input type="number" id="age" style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-button); font-size: 1rem; margin-bottom: 16px;">
        
        <label for="conditions" style="display: block; font-weight: 500; margin-bottom: 8px;">Pre-existing Conditions (Comma separated, optional)</label>
        <input type="text" id="conditions" placeholder="e.g., Arthritis, Diabetes" style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-button); font-size: 1rem; margin-bottom: 24px;">
        
        <button type="submit" class="btn-primary" style="width: 100%; font-size: 1.1rem; padding: 16px;">
          Continue
        </button>
      </form>
    </div>
  `;
}

export function init() {
  const form = document.getElementById('onboarding-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const age = document.getElementById('age').value;
    const conditions = document.getElementById('conditions').value.split(',').map(c => c.trim()).filter(c => c);
    
    await setProfile({
      age: age ? parseInt(age) : null,
      conditions,
      createdAt: new Date().toISOString(),
      onboardingComplete: true
    });
    
    window.location.hash = '#/dashboard';
  });
}
