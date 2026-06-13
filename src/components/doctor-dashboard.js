import { getPatientProfile, getPatientLogs, getPatientMetricLogs } from '../services/storage.js';
import { getConditionConfig } from '../config/conditions.js';
import { auth } from '../services/firebase.js';
import Chart from 'chart.js/auto';

export async function render() {
  return `
    <div style="margin-top: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <h1>Doctor Dashboard</h1>
        <button id="logout-btn" class="btn-primary" style="background: var(--slate-200); color: var(--text-primary); padding: 8px 16px;">Logout</button>
      </div>

      <div class="card" style="margin-bottom: 24px;">
        <h3 style="margin-bottom: 12px;">Load Patient</h3>
        <div style="display: flex; gap: 8px;">
          <input type="text" id="patient-uid" placeholder="Enter Patient UID" style="flex: 1; padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-button); font-size: 1rem;">
          <button id="load-patient-btn" class="btn-primary" style="padding: 12px 24px;">Load</button>
        </div>
      </div>
      
      <div id="patient-view" style="display: none;">
        <div class="card" style="margin-bottom: 24px;">
          <h2 style="margin-bottom: 16px;">Patient Profile</h2>
          <div id="patient-info"></div>
        </div>
        
        <div id="patient-widgets"></div>
        
        <div class="card">
          <h3 style="margin-bottom: 16px;">General Health Logs</h3>
          <div id="patient-logs"></div>
        </div>
      </div>
    </div>
  `;
}

export function init() {
  document.getElementById('logout-btn').addEventListener('click', () => {
    auth.signOut();
  });

  document.getElementById('load-patient-btn').addEventListener('click', async () => {
    const uid = document.getElementById('patient-uid').value.trim();
    if (!uid) return;
    
    const view = document.getElementById('patient-view');
    view.style.display = 'block';
    
    try {
      const profile = await getPatientProfile(uid);
      const logs = await getPatientLogs(uid);
      const metricLogs = await getPatientMetricLogs(uid);
      
      if (!profile) {
        document.getElementById('patient-info').innerHTML = '<p>Patient not found.</p>';
        return;
      }
      
      document.getElementById('patient-info').innerHTML = `
        <p><strong>Age:</strong> ${profile.age || 'N/A'}</p>
        <p><strong>Conditions:</strong> ${(profile.conditions || []).join(', ') || 'None'}</p>
        <p><strong>UID:</strong> ${uid}</p>
      `;
      
      // Render logs
      const logsContainer = document.getElementById('patient-logs');
      if (logs.length === 0) {
        logsContainer.innerHTML = '<p>No general entries.</p>';
      } else {
        logsContainer.innerHTML = logs.map(log => {
          const severityColor = log.parsed_data.severity === 'high' ? 'var(--amber-700)' : 
                               log.parsed_data.severity === 'medium' ? 'var(--amber-400)' : 'var(--teal-500)';
          return `
            <div style="border-left: 3px solid ${severityColor}; padding: 12px 16px; margin-bottom: 12px; background: var(--slate-50); border-radius: 0 var(--radius-button) var(--radius-button) 0;">
              <div style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 500; margin-bottom: 4px;">${new Date(log.date).toLocaleDateString()}</div>
              <div style="font-weight: 600; margin-bottom: 4px;">${log.parsed_data.summary || 'Logged entry'}</div>
              <div style="font-size: 0.9rem; color: var(--text-secondary);">
                <strong>Symptoms:</strong> ${Array.isArray(log.parsed_data.symptoms) ? log.parsed_data.symptoms.join(', ') : '-'} <br/>
                <strong>Sleep:</strong> ${log.parsed_data.sleep || 'N/A'}
              </div>
            </div>
          `;
        }).join('');
      }

      // Render widgets
      const widgetsContainer = document.getElementById('patient-widgets');
      let widgetsHtml = '';
      
      if (profile.conditions) {
        profile.conditions.forEach(condName => {
          const config = getConditionConfig(condName);
          if (config) {
            widgetsHtml += `
              <div class="card" style="margin-bottom: 24px;">
                <h3 style="margin-bottom: 16px;">${config.name} Tracker</h3>
                <div style="width: 100%; max-width: 600px;">
                  <canvas id="doctor-chart-${config.id}"></canvas>
                </div>
              </div>
            `;
          }
        });
      }
      widgetsContainer.innerHTML = widgetsHtml;

      // Initialize charts
      if (profile.conditions) {
        profile.conditions.forEach(condName => {
          const config = getConditionConfig(condName);
          if (!config) return;

          const conditionLogs = metricLogs
            .filter(l => l.condition === config.id)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

          const ctx = document.getElementById(`doctor-chart-${config.id}`);
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
        });
      }
      
    } catch (err) {
      console.error(err);
      document.getElementById('patient-info').innerHTML = '<p>Error loading patient data.</p>';
    }
  });
}
