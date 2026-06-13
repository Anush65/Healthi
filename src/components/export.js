import { getAppointments, getLogs, getMetricLogs, getProfile, getVisits } from '../services/storage.js';
import Chart from 'chart.js/auto';
import { renderLayout } from '../utils/layout.js';

export async function render() {
  return renderLayout(`
    <div style="margin-top: 20px; margin-bottom: 24px;" class="no-print">
      <h1>Health Export</h1>
      <p style="color: var(--text-secondary);">A clean view of your health history.</p>
    </div>

    <div id="print-area" class="card" style="border: none; box-shadow: none;">
      <h2 style="margin-bottom: 8px;">Healthi Report</h2>
      <div id="patient-info" style="margin-bottom: 24px; color: var(--text-secondary);"></div>
      
      <h3 style="margin-bottom: 16px;">Symptom Severity (Last 30 Days)</h3>
      <div style="width: 100%; max-width: 600px; margin: 0 auto 32px;">
        <canvas id="severity-chart"></canvas>
      </div>
      
      <h3 style="margin-bottom: 16px;">Chronological Log</h3>
      <div id="table-container"></div>

      <h3 style="margin: 28px 0 16px;">Readings</h3>
      <div id="readings-container"></div>

      <h3 style="margin: 28px 0 16px;">Doctor Care Plan</h3>
      <div id="care-container"></div>

      <h3 style="margin: 28px 0 16px;">Appointments</h3>
      <div id="appointments-container"></div>
    </div>
    
  `, 'export');
}

export async function init() {
  const profile = await getProfile();
  const logs = await getLogs();
  const metrics = await getMetricLogs();
  const visits = await getVisits();
  const appointments = await getAppointments();
  
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
      if (l.parsed_data?.severity === 'high') return 3;
      if (l.parsed_data?.severity === 'medium') return 2;
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
        <td style="padding: 12px 8px; vertical-align: top;">${log.parsed_data?.summary || '-'}</td>
        <td style="padding: 12px 8px; vertical-align: top;">${Array.isArray(log.parsed_data?.symptoms) ? log.parsed_data.symptoms.join(', ') : '-'}</td>
        <td style="padding: 12px 8px; vertical-align: top;">${log.parsed_data?.sleep || '-'}</td>
      </tr>
    `).join('');
    
    tableHtml += `</tbody></table>`;
    tableContainer.innerHTML = tableHtml;
  } else {
    tableContainer.innerHTML = '<p>No entries to display.</p>';
  }

  const readingsContainer = document.getElementById('readings-container');
  readingsContainer.innerHTML = metrics.length ? `
    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
      <thead><tr style="border-bottom: 2px solid var(--border-color);"><th style="padding: 8px;">Date</th><th style="padding: 8px;">Condition</th><th style="padding: 8px;">Reading</th></tr></thead>
      <tbody>
        ${[...metrics].sort((a, b) => new Date(b.date) - new Date(a.date)).map((item) => `
          <tr style="border-bottom: 1px solid var(--slate-200);">
            <td style="padding: 12px 8px;">${new Date(item.date).toLocaleDateString()}</td>
            <td style="padding: 12px 8px;">${item.condition}</td>
            <td style="padding: 12px 8px;">${Object.entries(item.metrics || {}).map(([key, value]) => `${key}: ${value}`).join(', ')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>` : '<p>No readings to display.</p>';

  const careContainer = document.getElementById('care-container');
  careContainer.innerHTML = visits.length ? [...visits].sort((a, b) => new Date(b.date) - new Date(a.date)).map((visit) => `
    <div style="border-bottom: 1px solid var(--slate-200); padding: 12px 0;">
      <p><strong>${new Date(visit.date).toLocaleDateString()}:</strong> ${visit.diagnosis || 'Clinical review'}</p>
      <p>${visit.recommendations || ''}</p>
      <p>${(visit.prescriptions || []).map((item) => `Medicine: ${item.medicine} ${item.dosage || ''}`).join(' · ')}</p>
      <p>${(visit.testsOrdered || []).map((item) => `Test: ${item.name}`).join(' · ')}</p>
    </div>
  `).join('') : '<p>No doctor care plans to display.</p>';

  const appointmentsContainer = document.getElementById('appointments-container');
  appointmentsContainer.innerHTML = appointments.length ? [...appointments].sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate)).map((appointment) => `
    <div style="border-bottom: 1px solid var(--slate-200); padding: 12px 0;">
      <p><strong>${new Date(appointment.scheduledDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</strong></p>
      <p>${appointment.doctorName || 'Your doctor'} · ${appointment.reason || 'Clinical follow-up'} · ${appointment.status || 'scheduled'}</p>
      <p>${appointment.notes || ''}</p>
    </div>
  `).join('') : '<p>No appointments to display.</p>';
}
