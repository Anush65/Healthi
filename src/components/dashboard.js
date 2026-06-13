import { addMetricLog, getAppointments, getLogs, getMetricLogs, getProfile, getVisits, updateAppointment } from '../services/storage.js';
import { getConditionConfig, DefaultMetrics, ConditionRegistry } from '../config/conditions.js';
import { showToast } from '../utils/toast.js';
import { renderLayout, icon } from '../utils/layout.js';




function renderDoctorCare(visits, appointments, doctorName, doctorInitials) {
  const sortedVisits = [...visits].sort((a, b) => new Date(b.date) - new Date(a.date));
  const sortedAppointments = [...appointments].sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

  return `
    <section class="section-block">
      <div class="section-heading"><div><p class="eyebrow">Shared by your doctor</p><h2>Care updates</h2></div></div>
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
  const [profile, logs, metrics, appointments, visits] = await Promise.all([
    getProfile(), getLogs(), getMetricLogs(), getAppointments(), getVisits()
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

        ${renderDoctorCare(visits, appointments, doctorName, doctorInitials)}

        <section class="content-grid">
          <div>
            <div class="section-heading"><div><p class="eyebrow">Health ledger</p><h2>Your recent story</h2></div><a href="#/export">View report</a></div>
            <div class="timeline">
              ${recentLogs.map((log) => `
                <article class="timeline-item">
                  <div class="timeline-date"><strong>${new Date(log.date).getDate()}</strong><span>${new Date(log.date).toLocaleDateString(undefined, { month: 'short' })}</span></div>
                  <div class="timeline-body">
                    <div class="timeline-meta"><span class="severity ${log.parsed_data.severity}">${log.parsed_data.severity}</span><time>${new Date(log.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time></div>
                    <h3>${log.parsed_data.summary}</h3>
                    <p>${log.raw_text}</p>
                    <div class="tag-row">${(log.parsed_data.symptoms || []).map((item) => `<span>${item}</span>`).join('')}${log.parsed_data.sleep ? `<span>Sleep: ${log.parsed_data.sleep}</span>` : ''}</div>
                  </div>
                </article>`).join('')}
            </div>
          </div>

        </section>
    `, 'home');
}

export function init() {


  document.getElementById('reschedule-btn')?.addEventListener('click', async (event) => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    date.setHours(10, 0, 0, 0);
    await updateAppointment(event.currentTarget.dataset.id, { scheduledDate: date.toISOString(), status: 'scheduled' });
    showToast('Appointment moved to next week.');
    window.dispatchEvent(new Event('hashchange'));
  });
}
