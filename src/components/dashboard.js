import { addMetricLog, getAppointments, getLogs, getMetricLogs, getProfile, getVisits, updateAppointment, getMedicationLogs, toggleMedicationLog } from '../services/storage.js';
import { getConditionConfig, DefaultMetrics, ConditionRegistry } from '../config/conditions.js';
import { showToast } from '../utils/toast.js';
import { renderLayout, icon } from '../utils/layout.js';




function renderDoctorCare(visits, appointments, doctorName, doctorInitials, medicines, todayMedLogs) {
  const sortedVisits = [...visits].sort((a, b) => new Date(b.date) - new Date(a.date));
  const sortedAppointments = [...appointments].sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

  return `
    <section class="section-block">
      <div class="section-heading"><div><p class="eyebrow">Shared by your doctor</p><h2>Care updates</h2></div></div>

      ${medicines?.length ? `
      <div class="card" style="padding: 12px 24px; margin-bottom: 24px;">
        <h3 style="margin-bottom: 8px;">Daily Medicine Checklist</h3>
        ${medicines.map((med, idx) => {
          const isChecked = todayMedLogs.some(l => l.medicineName === med.name) ? 'checked' : '';
          return `
            <div style="display: flex; align-items: center; gap: 16px; padding: 14px 0; ${idx < medicines.length - 1 ? 'border-bottom: 1px solid var(--line);' : ''}">
              <input type="checkbox" class="med-checkbox" data-med="${med.name}" id="med-${med.id}" ${isChecked} style="width: 28px; height: 28px; padding: 0; margin: 0; cursor: pointer; accent-color: var(--green);">
              <label for="med-${med.id}" style="cursor: pointer; flex: 1; margin: 0;">
                <strong style="font-size: 1.15rem; display: block;">${med.name}</strong>
                <span class="muted" style="font-size: 0.9rem;">${med.instructions || 'Daily tracking'} ${med.timing ? '· ' + med.timing : ''}</span>
              </label>
            </div>
          `;
        }).join('')}
      </div>` : ''}

      <div class="clinical-grid">
        <article class="doctor-note card">
          <p class="eyebrow">From your doctor</p>
          ${sortedVisits[0] ? `
            <h3>${sortedVisits[0].recommendations || sortedVisits[0].diagnosis || 'Follow-up review'}</h3>
            <p>${sortedVisits[0].doctorNotes || sortedVisits[0].diagnosis || ''}</p>
            <div class="doctor-signoff"><span>${doctorInitials}</span><div><strong>${doctorName}</strong><small>Healthcare Provider</small></div></div>
          ` : '<p class="muted">No doctor recommendations yet.</p>'}
        </article>
        <article class="doctor-note card">
          <p class="eyebrow">Appointments</p>
          ${sortedAppointments.length ? sortedAppointments.map((appointment) => `
            <div style="margin-top:12px">
              <h3>${appointment.doctorName || 'Your doctor'}</h3>
              <p>${new Date(appointment.scheduledDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} · ${appointment.reason || 'Clinical follow-up'} · ${appointment.status || 'scheduled'}</p>
            </div>
          `).join('') : '<p class="muted">No appointments shared yet.</p>'}
        </article>
      </div>
    </section>`;
}

export async function render() {
  const todayDateStr = new Date().toISOString().split('T')[0];
  const [profile, logs, metrics, appointments, visits, todayMedLogs] = await Promise.all([
    getProfile(), getLogs(), getMetricLogs(), getAppointments(), getVisits(), getMedicationLogs(null, todayDateStr)
  ]);

  const activeConditions = [];
  Object.values(DefaultMetrics).forEach(c => activeConditions.push(c));
  (profile?.conditions || []).forEach(condId => {
    if (ConditionRegistry[condId]) {
      activeConditions.push(ConditionRegistry[condId]);
    }
  });

  const nextAppointment = appointments
    .filter((item) => ['scheduled', 'rescheduled'].includes(item.status))
    .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))[0];
  const latestVisit = visits.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const recentLogs = logs.sort((a, b) => new Date(b.date) - new Date(a.date));
  const latestBp = metrics.filter((item) => item.condition === 'hypertension').at(-1);
  const latestSugar = metrics.filter((item) => item.condition === 'diabetes').at(-1);
  const latestTemp = metrics.filter((item) => item.condition === 'temperature').at(-1);
  const latestOxygen = metrics.filter((item) => item.condition === 'oxygen_level').at(-1);
  const latestWeight = metrics.filter((item) => item.condition === 'body_weight').at(-1);
  const firstName = profile?.name?.split(' ')[0] || 'there';
  const doctorName = appointments.find(a => a.doctorName)?.doctorName || 'Your doctor';
  const doctorInitials = doctorName.split(' ').filter(w => w !== 'Dr.').map(word => word[0]).join('').slice(0, 2).toUpperCase() || 'MD';

  const cacheRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('healthi_cached_insights') : null;
  const cache = cacheRaw ? JSON.parse(cacheRaw) : null;
  const summaryTitle = cache?.data?.summaryInsight?.title || 'Analyze your health';
  const summaryDesc = cache?.data?.summaryInsight?.description || 'Visit the Insights page to generate a personalized analysis of your recent health data.';

  return renderLayout(`
        <header class="topbar">
          <div>
            <p class="eyebrow">${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <h1>Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, ${firstName}.</h1>
            <p class="muted">Here is your health at a glance.</p>
          </div>
          <div style="background: var(--slate-200); padding: 8px 16px; border-radius: 8px; font-weight: 600; letter-spacing: 1px; color: var(--slate-900);">
            Code: ${profile?.patientCode || 'N/A'}
          </div>
        </header>

        <section class="hero-grid">
          <article class="insight-card">
            <div class="insight-icon">${icon('spark')}</div>
            <p class="eyebrow light">Healthi insight</p>
            <h2>${summaryTitle}</h2>
            <p>${summaryDesc}</p>
            <a href="#/insights">See all insights →</a>
          </article>
          <a class="quick-log-card" href="#/log">
            <span class="quick-log-icon">${icon('plus')}</span>
            <div><strong>How are you feeling?</strong><small>Record symptoms, sleep, medicines, or anything else.</small></div>
            <span aria-hidden="true">→</span>
          </a>
        </section>


    <section class="section-block">
      <div class="section-heading"><div><p class="eyebrow">Today</p><h2>Your care plan</h2></div></div>
      <div class="care-grid">
        ${activeConditions.map(cond => {
          const latestMetric = metrics.filter(m => m.condition === cond.id).at(-1);
          return cond.metrics.map(mDef => {
            let valueStr = '--';
            if (latestMetric && latestMetric.metrics && latestMetric.metrics[mDef.id] !== undefined) {
              valueStr = latestMetric.metrics[mDef.id];
            }
            const unit = mDef.label.includes('(') ? mDef.label.split('(')[1].replace(')', '') : '';
            const title = mDef.label.split('(')[0].trim();
            const loggableIndicator = mDef.patientLoggable ? '<small class="trend positive">+ Log Value</small>' : '<small class="trend">Lab Only</small>';
            
            // Note: We'll make these clickable in a future step.
            return `
            <article class="metric-card" style="cursor: pointer;" data-cond="${cond.id}" data-metric="${mDef.id}" data-loggable="${mDef.patientLoggable}">
              <div class="metric-label"><span class="metric-dot" style="background-color: ${mDef.chartConfig.color}"></span>${title}</div>
              <strong>${valueStr}</strong>
              <span>${unit}</span>${loggableIndicator}
            </article>`;
          }).join('');
        }).join('')}
        
        <article class="appointment-card">
              ${nextAppointment ? `
                <div class="appointment-date"><strong>${new Date(nextAppointment.scheduledDate).getDate()}</strong><span>${new Date(nextAppointment.scheduledDate).toLocaleDateString(undefined, { month: 'short' })}</span></div>
                <div><p class="eyebrow">Next appointment</p><h3>${nextAppointment.doctorName}</h3><p>${new Date(nextAppointment.scheduledDate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · ${nextAppointment.reason}</p></div>
                <button class="text-button" id="reschedule-btn" data-id="${nextAppointment.id}">Reschedule</button>
              ` : '<p class="muted">No upcoming appointments.</p>'}
            </article>
          </div>

        </section>

        ${renderDoctorCare(visits, appointments, doctorName, doctorInitials, profile?.medicines, todayMedLogs)}

        <section class="content-grid">
          <div>
            <div class="section-heading"><div><p class="eyebrow">Health ledger</p><h2>Your recent story</h2></div><a href="#/export">View report</a></div>
            <div class="timeline">
          ${recentLogs.map((log) => `
                <article class="timeline-item">
                  <div class="timeline-date"><strong>${new Date(log.date).getDate()}</strong><span>${new Date(log.date).toLocaleDateString(undefined, { month: 'short' })}</span></div>
                  <div class="timeline-body">
                    <div class="timeline-meta"><span class="severity ${log.parsed_data?.severity || 'medium'}">${log.parsed_data?.severity || 'medium'}</span><time>${new Date(log.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time></div>
                    <h3>${log.parsed_data?.summary || log.raw_text.substring(0, 100)}</h3>
                    <p>${log.raw_text}</p>
                    <div class="tag-row">${
                      (function() {
                        const sleepStr = log.parsed_data.sleep || '';
                        const hasBadSleep = sleepStr && !sleepStr.match(/good|excellent|normal|well|not mentioned/i);
                        const sym = Array.isArray(log.parsed_data.symptoms) ? [...log.parsed_data.symptoms] : [];
                        if (hasBadSleep) sym.push(`Sleep: ${sleepStr}`);
                        return sym.map(item => `<span>${item}</span>`).join('');
                      })()
                    }</div>
                  </div>
                </article>`).join('')}
            </div>
          </div>

        </section>

        <!-- Metric Upload Modal -->
        <dialog id="metric-modal" class="card" style="padding: 24px; border: none; border-radius: var(--radius-card); box-shadow: 0 10px 25px rgba(0,0,0,0.1); max-width: 400px; width: 90%; margin: auto;">
          <form id="metric-form">
            <h3 id="metric-modal-title" style="margin-bottom: 8px;">Log Value</h3>
            <p id="metric-modal-desc" class="muted" style="margin-bottom: 16px;">Enter your latest reading.</p>
            <div class="field" style="margin-bottom: 16px;">
              <input type="number" id="metric-modal-input" required step="any" style="width: 100%; font-size: 1.2rem; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
            </div>
            <input type="hidden" id="metric-modal-cond">
            <input type="hidden" id="metric-modal-metric">
            <div style="display: flex; gap: 12px;">
              <button type="button" class="btn btn-secondary" onclick="document.getElementById('metric-modal').close()" style="flex: 1;">Cancel</button>
              <button type="submit" class="btn btn-primary" style="flex: 1;">Save</button>
            </div>
          </form>
        </dialog>
    `, 'home');
}

export function init() {

  document.querySelectorAll('.med-checkbox').forEach(cb => {
    cb.addEventListener('change', async (e) => {
      const isChecked = e.target.checked;
      const medName = e.target.dataset.med;
      const todayDateStr = new Date().toISOString().split('T')[0];
      try {
        await toggleMedicationLog(null, medName, todayDateStr, isChecked);
      } catch (err) {
        e.target.checked = !isChecked; // revert
        showToast('Failed to update medicine checklist.');
      }
    });
  });

  document.getElementById('reschedule-btn')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    if (!button) {
      console.error('Reschedule button not found');
      return;
    }
    button.disabled = true;
    button.textContent = 'Rescheduling...';
    try {
      const date = new Date();
      date.setDate(date.getDate() + 7);
      date.setHours(10, 0, 0, 0);
      await updateAppointment(button.dataset.id, { scheduledDate: date.toISOString(), status: 'scheduled' });
      showToast('Appointment moved to next week.');
      window.dispatchEvent(new Event('hashchange'));
    } catch (error) {
      showToast(error.message);
      button.disabled = false;
      button.textContent = 'Reschedule';
    }
  });

  document.querySelectorAll('.metric-card').forEach(card => {
    card.addEventListener('click', () => {
      const isLoggable = card.dataset.loggable === 'true';
      if (!isLoggable) {
        showToast('This is a lab test result. Only your doctor can log this metric.');
        return;
      }
      const title = card.querySelector('.metric-label').innerText;
      document.getElementById('metric-modal-title').innerText = `Log ${title}`;
      document.getElementById('metric-modal-cond').value = card.dataset.cond;
      document.getElementById('metric-modal-metric').value = card.dataset.metric;
      document.getElementById('metric-modal-input').value = '';
      document.getElementById('metric-modal').showModal();
    });
  });

  document.getElementById('metric-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cond = document.getElementById('metric-modal-cond').value;
    const metric = document.getElementById('metric-modal-metric').value;
    const val = Number(document.getElementById('metric-modal-input').value);
    
    try {
      await import('../services/storage.js').then(m => m.addMetricLog({ condition: cond, metrics: { [metric]: val } }));
      showToast('Reading saved successfully.');
      document.getElementById('metric-modal').close();
      window.dispatchEvent(new Event('hashchange'));
    } catch (err) {
      showToast('Failed to save reading.');
    }
  });
}
