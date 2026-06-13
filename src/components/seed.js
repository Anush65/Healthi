import { seedCurrentPatient } from '../services/storage.js';
import { showToast } from '../utils/toast.js';

export async function render() {
  return `
    <main class="centered-state">
      <div class="card" style="text-align: center; max-width: 400px; margin: 0 auto;">
        <div class="brand-mark" style="margin: 0 auto 16px;">H</div>
        <h2>Seed patient data</h2>
        <p class="muted" style="margin-bottom: 24px;">This will generate 14 days of realistic health logs and condition metrics for your current patient profile. This operation cannot be undone easily.</p>
        <button id="run-seed-btn" class="btn btn-primary" style="width: 100%;">Generate 14-day history</button>
        <p id="seed-message" class="form-message" style="margin-top: 16px;"></p>
      </div>
    </main>
  `;
}

export function init() {
  const btn = document.getElementById('run-seed-btn');
  const msg = document.getElementById('seed-message');

  btn?.addEventListener('click', async () => {
    try {
      btn.disabled = true;
      btn.textContent = 'Generating...';
      msg.className = 'form-message';
      msg.textContent = 'Creating logs and metrics...';

      await seedCurrentPatient();

      msg.className = 'form-message success-message';
      msg.textContent = 'Data seeded successfully! Redirecting to dashboard...';
      showToast('Seeded 14 days of history.');
      
      setTimeout(() => {
        window.location.hash = '#/dashboard';
      }, 1500);
    } catch (error) {
      console.error(error);
      msg.className = 'form-message error-message';
      msg.textContent = error.message;
      btn.disabled = false;
      btn.textContent = 'Try again';
    }
  });
}
