import { getLogs, getProfile, getMetricLogs, addMetricLog } from '../services/storage.js';
import { getConditionConfig } from '../config/conditions.js';
import Chart from 'chart.js/auto';

export async function render() {
  const profile = await getProfile();
  const logs = await getLogs();
  
  // Sort logs descending (newest first)
  logs.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const recentLogs = logs.slice(0, 7); // Show last 7 days max

  let ledgerHtml = '';
  
  if (recentLogs.length === 0) {
    ledgerHtml = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-secondary);">
        <p>No entries yet. How are you feeling today?</p>
      </div>
    `;
  } else {
    ledgerHtml = recentLogs.map(log => {
      const dateStr = new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      const severityColor = log.parsed_data.severity === 'high' ? 'var(--amber-700)' : 
                           log.parsed_data.severity === 'medium' ? 'var(--amber-400)' : 'var(--teal-500)';
      
      const symptoms = Array.isArray(log.parsed_data.symptoms) && log.parsed_data.symptoms.length > 0 
        ? log.parsed_data.symptoms.join(', ') 
        : 'No specific symptoms';

      return `
        <div style="border-left: 3px solid ${severityColor}; padding: 12px 16px; margin-bottom: 12px; background: var(--slate-50); border-radius: 0 var(--radius-button) var(--radius-button) 0;">
          <div style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 500; margin-bottom: 4px;">${dateStr}</div>
          <div style="font-weight: 600; margin-bottom: 4px;">${log.parsed_data.summary || 'Logged entry'}</div>
          <div style="font-size: 0.9rem; color: var(--text-secondary);">
            <strong>Symptoms:</strong> ${symptoms} <br/>
            <strong>Sleep:</strong> ${log.parsed_data.sleep || 'N/A'}
          </div>
        </div>
      `;
    }).join('');
  }

  let widgetsHtml = '';
  if (profile && profile.conditions) {
    for (const condName of profile.conditions) {
      const config = getConditionConfig(condName);
      if (config) {
        widgetsHtml += `
          <div class="card condition-widget" data-condition="${config.id}" style="margin-bottom: 24px;">
            <h3 style="margin-bottom: 16px;">${config.name} Tracker</h3>
            
            <div style="width: 100%; max-width: 600px; margin-bottom: 16px;">
              <canvas id="chart-${config.id}"></canvas>
            </div>
            
            <form class="widget-form" data-condition="${config.id}" style="display: flex; gap: 8px; align-items: flex-end;">
              ${config.metrics.map(m => `
                <div style="flex: 1;">
                  <label style="display: block; font-size: 0.85rem; font-weight: 500; margin-bottom: 4px;">${m.label}</label>
                  <input type="${m.type}" name="${m.id}" placeholder="${m.placeholder}" required style="width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: var(--radius-button); font-size: 1rem;">
                </div>
              `).join('')}
              <button type="submit" class="btn-primary" style="padding: 10px 16px; height: 42px;">Log</button>
            </form>
          </div>
        `;
      }
    }
  }

  return `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 20px; margin-bottom: 24px;">
      <div>
        <h1>Health Ledger</h1>
        <p style="color: var(--text-secondary);">Hello${profile && profile.age ? ', welcome back' : ''}. Here is your recent health trajectory.</p>
      </div>
      <a href="#/settings" style="color: var(--text-secondary); text-decoration: none; padding: 8px;" aria-label="Settings">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
      </a>
    </div>
    
    ${widgetsHtml}
    
    <div class="card">
      <h3 style="margin-bottom: 16px;">Recent General Entries</h3>
      ${ledgerHtml}
      
      <a href="#/log" style="display: block; width: 100%; text-align: center; padding: 16px; background: var(--blue-50); color: var(--blue-600); font-weight: 600; border-radius: var(--radius-button); text-decoration: none; margin-top: 24px;">
        + Log Today's Wellness
      </a>
    </div>
    
    ${getBottomNav()}
  `;
}

function getBottomNav() {
  return `
    <nav class="bottom-nav">
      <a href="#/dashboard" class="nav-item active">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        Home
      </a>
      <a href="#/log" class="nav-item">
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

export async function init() {
  const profile = await getProfile();
  const allMetricLogs = await getMetricLogs();

  if (profile && profile.conditions) {
    for (const condName of profile.conditions) {
      const config = getConditionConfig(condName);
      if (!config) continue;

      const conditionLogs = allMetricLogs
        .filter(l => l.condition === config.id)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-30);

      const ctx = document.getElementById(`chart-${config.id}`);
      if (ctx) {
        const labels = conditionLogs.map(l => new Date(l.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
        const datasets = config.metrics.map(m => {
          return {
            label: m.chartConfig.label,
            data: conditionLogs.map(l => l.metrics[m.id] || null),
            borderColor: m.chartConfig.color,
            backgroundColor: m.chartConfig.bgColor,
            fill: true,
            tension: 0.3
          };
        });

        new Chart(ctx, {
          type: 'line',
          data: { labels, datasets },
          options: {
            responsive: true,
            scales: { y: { beginAtZero: false } }
          }
        });
      }

      const form = document.querySelector(`form[data-condition="${config.id}"]`);
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const metricsData = {};
          config.metrics.forEach(m => {
            metricsData[m.id] = Number(form.elements[m.id].value);
          });
          
          await addMetricLog({
            condition: config.id,
            metrics: metricsData
          });
          
          import('../utils/toast.js').then(({ showToast }) => showToast(`Logged ${config.name} data!`));
          
          const app = document.getElementById('app');
          app.innerHTML = await render();
          init();
        });
      }
    }
  }
}
