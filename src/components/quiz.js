import { parseWellnessLog } from '../services/gemini.js';
import { addLog } from '../services/storage.js';
import { showToast } from '../utils/toast.js';
import { renderLayout } from '../utils/layout.js';

export async function render() {
  return renderLayout(`
    <div class="centered-state" style="align-items:start;padding-top:clamp(24px,7vw,80px)">
      <section style="width:min(100%,760px)">
        <a class="brand" href="#/dashboard" style="margin-bottom:38px"><span class="brand-mark">H</span><span>Healthi</span></a>
        <p class="eyebrow">Daily check-in</p>
        <h1>How are you feeling today?</h1>
        <p class="muted" style="max-width:620px">Use your own words. Mention symptoms, medicines, sleep, food, movement, or anything that felt different.</p>

        <div class="card" style="margin-top:28px">
          <label for="wellness-input">Tell Healthi what happened</label>
          <textarea id="wellness-input" rows="7" style="margin-top:9px;font-size:1.08rem" placeholder="I had a mild headache this morning, slept about five hours, and forgot to drink much water..."></textarea>
          <div class="tag-row" style="margin-top:14px">
            <button class="prompt-chip" type="button" data-text="I slept ">Sleep</button>
            <button class="prompt-chip" type="button" data-text="My pain today was ">Pain</button>
            <button class="prompt-chip" type="button" data-text="My blood pressure was ">Reading</button>
          </div>
          
          <div class="quick-stats" style="margin-top: 24px; display: flex; flex-direction: column; gap: 16px; border-top: 1px solid var(--border-color); padding-top: 20px;">
            <p style="font-weight: 500; margin-bottom: 0;">Quick Stats (Optional)</p>
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;" class="stat-group">
              <span style="font-size: 0.9rem; color: var(--text-secondary); width: 80px;">Mood</span>
              <button class="prompt-chip stat-btn" type="button" data-type="Mood" data-val="Great">Great</button>
              <button class="prompt-chip stat-btn" type="button" data-type="Mood" data-val="Okay">Okay</button>
              <button class="prompt-chip stat-btn" type="button" data-type="Mood" data-val="Poor">Poor</button>
            </div>
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;" class="stat-group">
              <span style="font-size: 0.9rem; color: var(--text-secondary); width: 80px;">Sleep</span>
              <button class="prompt-chip stat-btn" type="button" data-type="Sleep Quality" data-val="Good">Good</button>
              <button class="prompt-chip stat-btn" type="button" data-type="Sleep Quality" data-val="Restless">Restless</button>
              <button class="prompt-chip stat-btn" type="button" data-type="Sleep Quality" data-val="Poor">Poor</button>
            </div>
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;" class="stat-group">
              <span style="font-size: 0.9rem; color: var(--text-secondary); width: 80px;">Appetite</span>
              <button class="prompt-chip stat-btn" type="button" data-type="Appetite" data-val="Good">Good</button>
              <button class="prompt-chip stat-btn" type="button" data-type="Appetite" data-val="Low">Low</button>
            </div>
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;" class="stat-group">
              <span style="font-size: 0.9rem; color: var(--text-secondary); width: 80px;">Hydration</span>
              <button class="prompt-chip stat-btn" type="button" data-type="Hydration" data-val="Well hydrated">Well hydrated</button>
              <button class="prompt-chip stat-btn" type="button" data-type="Hydration" data-val="Could be better">Could be better</button>
            </div>
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;" class="stat-group">
              <span style="font-size: 0.9rem; color: var(--text-secondary); width: 80px;">Energy</span>
              <button class="prompt-chip stat-btn" type="button" data-type="Energy" data-val="High">High</button>
              <button class="prompt-chip stat-btn" type="button" data-type="Energy" data-val="Normal">Normal</button>
              <button class="prompt-chip stat-btn" type="button" data-type="Energy" data-val="Low">Low</button>
            </div>
          </div>
          <div style="display:flex;gap:10px;align-items:center;margin-top:24px;flex-wrap:wrap">
            <button id="submit-log" class="btn btn-primary" style="flex:1">Understand and save</button>
            <button id="voice-btn" class="btn btn-secondary" type="button" aria-label="Start voice input">Use voice</button>
          </div>
          <div id="loading-indicator" class="muted" style="display:none;margin-top:14px;text-align:center">Turning your note into a clear health entry...</div>
        </div>
        <p class="privacy-note">Healthi helps organize your information. It does not diagnose conditions or replace medical advice.</p>
      </section>
    </div>`, 'log');
}

export function init() {
  const input = document.getElementById('wellness-input');
  const submit = document.getElementById('submit-log');
  const loading = document.getElementById('loading-indicator');

  document.querySelectorAll('.prompt-chip').forEach((button) => {
    button.addEventListener('click', () => {
      input.value += button.dataset.text;
      input.focus();
    });
  });

  document.getElementById('voice-btn')?.addEventListener('click', () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      showToast('Voice input is not supported in this browser.');
      return;
    }
    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      input.value = `${input.value} ${event.results[0][0].transcript}`.trim();
    };
    recognition.start();
    showToast('Listening...');
  });

  document.querySelectorAll('.stat-btn').forEach((button) => {
    button.addEventListener('click', () => {
      // Toggle active state within the group
      const parent = button.closest('.stat-group');
      parent.querySelectorAll('.stat-btn').forEach(btn => {
        if (btn !== button) {
          btn.classList.remove('active');
        }
      });
      
      button.classList.toggle('active');
    });
  });

  submit.addEventListener('click', async () => {
    let text = input.value.trim();
    
    // Gather active stats
    const activeStats = {};
    document.querySelectorAll('.stat-btn.active').forEach(btn => {
      activeStats[btn.dataset.type] = btn.dataset.val;
    });
    
    if (!text && Object.keys(activeStats).length === 0) {
      showToast('Please tell us how you are feeling or select a quick stat.');
      input.focus();
      return;
    }

    submit.disabled = true;
    loading.style.display = 'block';
    try {
      const parsed = await parseWellnessLog(text, activeStats);
      const finalRawText = text || "Quick Stats Update";
      parsed.quickStats = activeStats;
      await addLog({ raw_text: finalRawText, parsed_data: parsed });
      showToast('Your health ledger is up to date.');
      window.location.hash = '#/dashboard';
    } catch (error) {
      showToast(error.message);
      submit.disabled = false;
      loading.style.display = 'none';
    }
  });
}
