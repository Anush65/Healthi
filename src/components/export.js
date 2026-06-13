import { getLogs, getProfile } from '../services/storage.js';
import Chart from 'chart.js/auto';

export async function render() {
  return `
    <div style="margin-top: 20px; margin-bottom: 24px;" class="no-print">
      <h1>Health Export</h1>
      <p style="color: var(--text-secondary);">A clean view of your health history.</p>
    </div>

    <div id="print-area" class="card" style="border: none; box-shadow: none;">
      <h2 style="margin-bottom: 8px;">Healthi Report</h2>
      <div id="patient-info" style="margin-bottom: 24px; color: var(--text-secondary);"></div>
      
      <h3 style="margin-bottom: 16px;">Symptom Severity (Last 30 Days)</h3>
      <div style="width: 100%; max-width: 600px; margin-bottom: 32px;">
        <canvas id="severity-chart"></canvas>
      </div>
      
      <h3 style="margin-bottom: 16px;">Chronological Log</h3>
      <div id="table-container"></div>
    </div>
    
    <div class="no-print">
      ${getBottomNav()}
    </div>
  `;
}

function getBottomNav() {
  return `
    <nav class="bottom-nav">
      <a href="#/dashboard" class="nav-item">
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
      <a href="#/export" class="nav-item active">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        Export
      </a>
    </nav>
  `;
}

export async function init() {
  const profile = await getProfile();
  const logs = await getLogs();
  
  if (profile) {
    document.getElementById('patient-info').innerHTML = `
      <p><strong>Age:</strong> ${profile.age || 'N/A'}</p>
      <p><strong>Conditions:</strong> ${(profile.conditions || []).join(', ') || 'None'}</p>
      <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
    `;
  }

  // Sort logs oldest to newest for the chart
  logs.sort((a, b) => new Date(a.date) - new Date(b.date));
  const recentLogs = logs.slice(-30); // Last 30 days

  // Chart setup
  const ctx = document.getElementById('severity-chart');
  if (ctx && recentLogs.length > 0) {
    const labels = recentLogs.map(l => new Date(l.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    const dataPoints = recentLogs.map(l => {
      if (l.parsed_data.severity === 'high') return 3;
      if (l.parsed_data.severity === 'medium') return 2;
      return 1;
    });

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Symptom Severity (1=Low, 3=High)',
          data: dataPoints,
          borderColor: '#14b8a6', // Teal 500
          backgroundColor: 'rgba(20, 184, 166, 0.1)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, max: 3, ticks: { stepSize: 1 } }
        }
      }
    });
  } else if (ctx) {
    ctx.parentElement.innerHTML = '<p style="color: var(--text-secondary);">No data for chart.</p>';
  }

  // Table setup
  const tableContainer = document.getElementById('table-container');
  if (recentLogs.length > 0) {
    // Reverse for table (newest first)
    const reversed = [...recentLogs].reverse();
    
    let tableHtml = `
      <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
        <thead>
          <tr style="border-bottom: 2px solid var(--border-color);">
            <th style="padding: 8px;">Date</th>
            <th style="padding: 8px;">Summary</th>
            <th style="padding: 8px;">Symptoms</th>
            <th style="padding: 8px;">Sleep</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    tableHtml += reversed.map(log => `
      <tr style="border-bottom: 1px solid var(--slate-200);">
        <td style="padding: 12px 8px; vertical-align: top; white-space: nowrap;">${new Date(log.date).toLocaleDateString()}</td>
        <td style="padding: 12px 8px; vertical-align: top;">${log.parsed_data.summary || '-'}</td>
        <td style="padding: 12px 8px; vertical-align: top;">${Array.isArray(log.parsed_data.symptoms) ? log.parsed_data.symptoms.join(', ') : '-'}</td>
        <td style="padding: 12px 8px; vertical-align: top;">${log.parsed_data.sleep || '-'}</td>
      </tr>
    `).join('');
    
    tableHtml += `</tbody></table>`;
    tableContainer.innerHTML = tableHtml;
  } else {
    tableContainer.innerHTML = '<p>No entries to display.</p>';
  }
}
