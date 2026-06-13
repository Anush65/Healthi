import { parseWellnessLog } from '../services/gemini.js';
import { addLog } from '../services/storage.js';
import { showToast } from '../utils/toast.js';

export async function render() {
  return `
    <div class="card" style="margin-top: 20px;">
      <h2>Daily Wellness Quiz</h2>
      <p style="margin-top: 8px; color: var(--text-secondary);">
        How are you feeling today? Include your sleep, diet, or any pain. We'll handle the rest.
      </p>
      
      <div style="margin-top: 24px;">
        <textarea id="wellness-input" rows="6" placeholder="I slept poorly and my joints are aching..." style="width: 100%; padding: 16px; border: 1px solid var(--border-color); border-radius: var(--radius-button); font-size: 1.1rem; font-family: inherit; resize: vertical;"></textarea>
      </div>
      
      <button id="submit-log" class="btn-primary" style="width: 100%; margin-top: 24px; padding: 16px; font-size: 1.1rem;">
        Log Today
      </button>

      <div id="loading-indicator" style="display: none; margin-top: 16px; text-align: center; color: var(--text-secondary);">
        <p>Analyzing your log...</p>
      </div>
    </div>
    
    ${getBottomNav()}
  `;
}

function getBottomNav() {
  return `
    <nav class="bottom-nav">
      <a href="#/dashboard" class="nav-item">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        Home
      </a>
      <a href="#/log" class="nav-item active">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
        Log
      </a>
      <a href="#/insights" class="nav-item">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 16 16 12 12 8"></polyline><line x1="8" y1="12" x2="16" y2="12"></line></svg>
        Insights
      </a>
      <a href="#/export" class="nav-item">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        Export
      </a>
    </nav>
  `;
}

export function init() {
  const submitBtn = document.getElementById('submit-log');
  const input = document.getElementById('wellness-input');
  const loading = document.getElementById('loading-indicator');
  
  if (!submitBtn) return;

  submitBtn.addEventListener('click', async () => {
    const text = input.value.trim();
    if (!text) {
      showToast("Please enter how you're feeling first.");
      return;
    }
    
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
    loading.style.display = 'block';
    
    try {
      const parsedData = await parseWellnessLog(text);
      
      const logEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        raw_text: text,
        parsed_data: parsedData
      };
      
      await addLog(logEntry);
      
      showToast("Logged successfully!");
      window.location.hash = '#/dashboard';
    } catch (err) {
      showToast(err.message);
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
      loading.style.display = 'none';
    }
  });
}
