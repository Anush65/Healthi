import { getLogs, getVisits, getAppointments } from '../services/storage.js';
import { getPredictiveInsights } from '../services/gemini.js';
import { renderLayout, icon } from '../utils/layout.js';

export async function render() {
  return renderLayout(`
    <div style="margin-top: 20px;">
      <h1>Smart Insights</h1>
      <p style="color: var(--text-secondary); margin-bottom: 24px;">AI pattern recognition across your health data.</p>
      
      <div id="insights-container" style="display: grid; gap: 16px;">
        <div class="card" style="min-height: 150px; display: flex; align-items: center; justify-content: center;">
          <p style="color: var(--text-secondary);">Analyzing your health history...</p>
        </div>
      </div>
      <p style="margin-top: 24px; font-size: 0.85rem; color: var(--text-secondary); text-align: center;">
        Note: This is pattern recognition, not medical advice.
      </p>
    </div>
  `, 'insights');
}

export async function init() {
  const container = document.getElementById('insights-container');
  
  try {
    const [logs, visits, appointments] = await Promise.all([
      getLogs(),
      getVisits(),
      getAppointments()
    ]);

    // Calculate max timestamp of data
    const getTs = (arr, dateField) => arr.length ? Math.max(...arr.map(x => new Date(x.createdAt?.seconds ? x.createdAt.seconds * 1000 : (x.createdAt || x[dateField] || x.date || 0)).getTime())) : 0;
    const maxTs = Math.max(getTs(logs, 'date'), getTs(visits, 'date'), getTs(appointments, 'scheduledDate'));

    // Check cache
    const cacheRaw = localStorage.getItem('healthi_cached_insights');
    const cache = cacheRaw ? JSON.parse(cacheRaw) : null;
    const isNewSession = !sessionStorage.getItem('healthi_insights_session');

    let insightsArray = [];

    if (!cache || maxTs > cache.timestamp || isNewSession) {
      // Regenerate
      const recentLogs = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 14);
      const data = await getPredictiveInsights(recentLogs, visits, appointments);
      
      localStorage.setItem('healthi_cached_insights', JSON.stringify({
        timestamp: maxTs,
        data: data
      }));
      sessionStorage.setItem('healthi_insights_session', 'true');
      insightsArray = data.insights || [];
    } else {
      // Use cache
      insightsArray = cache.data?.insights || cache.insights || [];
    }

    if (!Array.isArray(insightsArray)) insightsArray = [];

    container.innerHTML = insightsArray.map(insight => {
      let colorClass = 'var(--blue)';
      let bgClass = '#e8eff5';
      let iconName = 'spark';
      
      if (insight.type === 'positive') {
        colorClass = 'var(--green)';
        bgClass = 'var(--mint)';
      } else if (insight.type === 'warning') {
        colorClass = 'var(--danger)';
        bgClass = '#fce7e2';
      }

      return `
        <article class="card" style="display: flex; gap: 16px; align-items: flex-start; padding: 24px;">
          <div style="display: grid; width: 44px; height: 44px; place-items: center; border-radius: 12px; background: ${bgClass}; color: ${colorClass}; flex-shrink: 0;">
            ${icon(iconName)}
          </div>
          <div>
            <h3 style="margin-bottom: 6px; font-size: 1.1rem; color: ${colorClass};">${insight.title || 'Observation'}</h3>
            <p style="margin: 0; color: var(--text-secondary); line-height: 1.5;">${insight.description}</p>
          </div>
        </article>
      `;
    }).join('');

  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <div class="card" style="padding: 24px; text-align: center;">
        <p style="color: var(--danger); margin: 0;">Could not load insights at this time.</p>
      </div>
    `;
  }
}
