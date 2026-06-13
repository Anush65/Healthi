import { getLogs, getProfile } from '../services/storage.js';

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

  return `
    <div style="margin-top: 20px; margin-bottom: 24px;">
      <h1>Health Ledger</h1>
      <p style="color: var(--text-secondary);">Hello${profile && profile.age ? ', welcome back' : ''}. Here is your recent health trajectory.</p>
    </div>
    
    <div class="card">
      <h3 style="margin-bottom: 16px;">Recent Entries</h3>
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

export function init() {
  // Any event listeners for dashboard
}
