import {
  accessPatientByUid,
  addDoctorRecommendation,
  clearAllData,
  getDoctorRecommendations,
  getPatientInsights,
  getPatientLogs,
  getPatientMetricLogs,
  getPatientProfile,
  getProfile,
  getVisits,
  linkPatientToDoctor,
  addMetricLog
} from '../services/storage.js';
import { getConditionConfig } from '../config/conditions.js';
import { showToast } from '../utils/toast.js';
import { safeParseDate, compareDates, formatDate } from '../utils/date.js';

let doctorProfile = null;
let selectedPatient = null;
let patientData = null;

export async function render() {
  doctorProfile = await getProfile();

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0,0,0,0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);

  let appointmentsThisWeekCount = 0;
  let newHealthEntriesCount = 0;

  if (patients.length > 0) {
    await Promise.all(patients.map(async (p) => {
      const [appointments, logs] = await Promise.all([
        getAppointments(p.id),
        getPatientLogs(p.id)
      ]);
      appointments.forEach(a => {
        const d = new Date(a.scheduledDate);
        if (d >= startOfWeek && d < endOfWeek) appointmentsThisWeekCount++;
      });
      logs.forEach(l => {
        const d = new Date(l.date);
        if (d >= oneWeekAgo) newHealthEntriesCount++;
      });
    }));
  }

  return `
    <main class="doctor-shell">
      <header class="doctor-header no-print">
        <a class="brand" href="#/doctor-dashboard"><span class="brand-mark">H</span><span>Healthi Clinical</span></a>
        <div class="doctor-header-actions">
          <div><strong>${doctor?.name || 'Doctor'}</strong><div class="muted">${doctor?.specialty || 'Healthcare professional'}</div></div>
          ${patients.length === 0 ? '<button id="delete-doctor-btn" class="btn" style="background-color: #ef4444; color: white;">Delete Account</button>' : ''}
          <button id="logout-btn" class="btn btn-secondary">Sign out</button>
        </div>
      </header>

      <div class="topbar">
        <div><p class="eyebrow">Clinical workspace</p><h1>Good morning, Doctor.</h1><p class="muted">Review changes, update care plans, and keep patients moving forward.</p></div>
      </div>

      <section class="doctor-overview">
        <article class="overview-card"><span>Active patients</span><strong>${patients.length}</strong></article>
        <article class="overview-card"><span>Appointments this week</span><strong>${appointmentsThisWeekCount}</strong></article>
        <article class="overview-card"><span>New health entries</span><strong>${newHealthEntriesCount}</strong></article>
      </section>

      <section id="doctor-workspace" class="doctor-workspace no-print" aria-live="polite">
        <div class="doctor-empty-state">
          <span class="patient-avatar">ID</span>
          <h2>No patient selected</h2>
          <p class="muted">Enter a patient UID above to view their overview, ledger, insights, and recommendations.</p>
        </div>
      </section>

      <section id="doctor-report" class="doctor-report" hidden></section>
    </main>`;
}

async function renderPatient(patientId) {
  const [profile, logs, metrics, visits, appointments] = await Promise.all([
    getPatientProfile(patientId),
    getPatientLogs(patientId),
    getPatientMetricLogs(patientId),
    getVisits(patientId),
    getAppointments(patientId)
  ]);
  const latestBp = metrics.filter((item) => item.condition === 'hypertension').at(-1);
  const latestSugar = metrics.filter((item) => item.condition === 'diabetes').at(-1);
  const latestTemp = metrics.filter((item) => item.condition === 'temperature').at(-1);
  const latestOxygen = metrics.filter((item) => item.condition === 'oxygen_level').at(-1);
  const latestWeight = metrics.filter((item) => item.condition === 'body_weight').at(-1);
  const sortedAppointments = [...appointments].sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
  const nextAppointment = sortedAppointments.filter(a => new Date(a.scheduledDate) >= new Date())[0] || sortedAppointments.at(-1);

  if (!profile) {
    return `
      <div class="centered-state">
        <div class="card">
          <p class="eyebrow">Patient unavailable</p>
          <h2>We could not load this patient profile.</h2>
          <p class="muted">Try adding the patient again with their current access code.</p>
        </div>
      </div>`;
  }

  submit.disabled = true;
  submit.textContent = 'Loading...';
  setWorkspaceLoading();

  try {
    selectedPatient = await accessPatientByUid(patientUid);
    const [logs, metrics, insights, recommendations] = await Promise.all([
      getPatientLogs(selectedPatient.id),
      getPatientMetricLogs(selectedPatient.id),
      getPatientInsights(selectedPatient.id),
      getDoctorRecommendations(selectedPatient.id)
    ]);
    patientData = { logs, metrics, insights, recommendations };
    message.textContent = `Viewing ${selectedPatient.name || 'patient'} (${selectedPatient.id}).`;
    renderWorkspace();
  } catch (error) {
    selectedPatient = null;
    patientData = null;
    message.textContent = friendlyAccessError(error);
    message.className = 'form-message error-message';
    setWorkspaceError(message.textContent);
  } finally {
    submit.disabled = false;
    submit.textContent = 'View record';
  }
}

    <section data-tab-panel="overview">
      <div class="clinical-grid">
        <article class="clinical-card"><p class="eyebrow">Blood pressure</p><h3>${latestBp ? `${latestBp.metrics.systolic}/${latestBp.metrics.diastolic} mmHg` : 'No reading'}</h3><p>Latest recorded reading</p></article>
        <article class="clinical-card"><p class="eyebrow">Blood sugar</p><h3>${latestSugar ? `${latestSugar.metrics.blood_sugar} mg/dL` : 'No reading'}</h3><p>Latest recorded reading</p></article>
        <article class="clinical-card"><p class="eyebrow">Temperature</p><h3>${latestTemp ? `${latestTemp.metrics.temperature} °F` : 'No reading'}</h3><p>Latest recorded reading</p></article>
        <article class="clinical-card"><p class="eyebrow">Oxygen Level</p><h3>${latestOxygen ? `${latestOxygen.metrics.spo2} %` : 'No reading'}</h3><p>Latest recorded reading</p></article>
        <article class="clinical-card"><p class="eyebrow">Body Weight</p><h3>${latestWeight ? `${latestWeight.metrics.weight} lbs` : 'No reading'}</h3><p>Latest recorded reading</p></article>
        <article class="clinical-card"><p class="eyebrow">Next appointment</p><h3>${nextAppointment ? new Date(nextAppointment.scheduledDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Not scheduled'}</h3><p>${nextAppointment?.reason || 'Create a follow-up below'}</p></article>
        <article class="clinical-card" style="grid-column: 1 / -1;"><p class="eyebrow">Recent symptom</p><h3>${logs[0]?.parsed_data.summary || 'No recent symptoms'}</h3><p>${logs[0] ? new Date(logs[0].date).toLocaleDateString() : ''}</p></article>
      </div>
      <div class="action-form">
        <p class="eyebrow">Appointments</p>
        ${renderAppointmentList(appointments)}
      </div>
    </section>

    <section data-tab-panel="timeline" hidden>
      <div class="action-form">
        <p class="eyebrow">Health timeline</p>
        ${renderTimeline(logs, visits)}
      </div>
    </section>

    <section data-tab-panel="care-plan" hidden>
      <form id="clinical-form">
        <div class="action-form">
          <div class="section-heading"><div><p class="eyebrow">Readings</p><h2>Add a reading</h2></div></div>
          <div class="form-grid">
            ${renderReadingForms(profile)}
          </div>
        </div>

        <div class="action-form">
          <div class="section-heading"><div><p class="eyebrow">Clinical action</p><h2>Update care plan</h2></div></div>
          <div class="form-grid">
            <div class="field"><label for="diagnosis">Assessment / diagnosis</label><input id="diagnosis" name="diagnosis" placeholder="e.g. Blood pressure improving"></div>
            <div class="field full" style="margin-top: 10px; padding: 16px; background: var(--sage); border-radius: 14px; border: 1px solid var(--line);">
              <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 12px;">
                <label style="margin: 0;">Medicines to track daily</label>
                <button type="button" class="text-button" id="add-medicine-btn" style="padding: 0;">+ Add Medicine</button>
              </div>
              <div id="medicine-list" style="display:grid; gap:8px;">
                ${(profile.medicines || []).map(med => `
                  <div class="med-item" style="display:flex; gap:8px;">
                    <input name="medicine_name[]" value="${med.name}" placeholder="Medicine name" style="flex:2" required>
                    <input name="medicine_dosage[]" value="${med.instructions || ''}" placeholder="Dosage" style="flex:1">
                    <input name="medicine_timing[]" value="${med.timing || ''}" placeholder="Timing (e.g. 1-0-1)" style="flex:1">
                    <button type="button" class="btn btn-secondary" onclick="this.parentElement.remove()" style="min-height:auto; padding: 12px; color: var(--danger);">Remove</button>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="field full"><label for="test">Test or procedure</label><input id="test" name="test" placeholder="e.g. HbA1c"></div>
            <div class="field"><label for="appointment">Next appointment</label><input id="appointment" name="appointment" type="datetime-local"></div>
            <div class="field full"><label for="recommendation">Recommendation for patient</label><textarea id="recommendation" name="recommendation" rows="3" placeholder="Write a clear next step for the patient"></textarea></div>
            <div class="field full"><button class="btn btn-primary" type="submit">Save care plan & readings</button></div>
          </div>
        </div>
      </form>

      <aside class="doctor-side-column">
        <section class="doctor-section">
          <p class="eyebrow">AI insights</p>
          <h2>Recorded observations</h2>
          <p class="muted section-note">These insights were generated in the patient experience. No analysis is run here.</p>
          <div class="insights-list">${renderInsights(patientData.insights)}</div>
        </section>

        <section class="doctor-section">
          <p class="eyebrow">Doctor recommendation</p>
          <h2>Add a note</h2>
          <form id="recommendation-form" class="recommendation-form">
            <div class="field">
              <label for="recommendation-text">Recommendation</label>
              <textarea id="recommendation-text" name="text" rows="4" maxlength="1000" placeholder="e.g. Monitor sleep quality." required></textarea>
            </div>
            <div class="field">
              <label for="doctor-name">Doctor name <span class="muted">(optional)</span></label>
              <input id="doctor-name" name="doctorName" maxlength="100" value="${escapeHtml(doctorProfile?.name || '')}">
            </div>
            <button id="save-recommendation" class="btn btn-primary" type="submit">Save recommendation</button>
          </form>
        </section>
      </aside>
    </div>

    <section class="doctor-section recommendations-section">
      <p class="eyebrow">History</p>
      <h2>Previous recommendations</h2>
      <div id="recommendations-history">${renderRecommendations(patientData.recommendations)}</div>
    </section>`;

function renderReadingForms(profile) {
  const requiredConditions = ['temperature', 'oxygen_level', 'body_weight', ...(profile.conditions || [])];
  
  // We need to deduplicate in case default metrics are in profile.conditions
  const uniqueConditions = [...new Set(requiredConditions)];
  
  const conditions = uniqueConditions
    .map((condition) => getConditionConfig(condition))
    .filter(Boolean);

  if (!conditions.length) {
    return '<p class="muted">Patient has no conditions configured for structured readings.</p>';
  }

  return conditions.flatMap((condition) => 
    condition.metrics.map((metric) => `
      <div class="field">
        <label for="${condition.id}-${metric.id}">${metric.label}</label>
        <input id="${condition.id}-${metric.id}" name="metric_${condition.id}_${metric.id}" type="${metric.type}" min="0" placeholder="${metric.placeholder}" step="any">
      </div>
    `)
  ).join('');
}

function renderAppointmentList(appointments) {
  const sortedAppointments = [...appointments].sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
  if (!sortedAppointments.length) return '<p class="muted">No appointments scheduled yet.</p>';

function renderPatientOverview(profile) {
  const conditions = profile.conditions?.length ? profile.conditions.map(formatLabel).join(', ') : 'None recorded';
  return `
    <section class="patient-overview-card">
      <div class="patient-identity">
        <span class="patient-avatar">${initials(profile.name)}</span>
        <div><p class="eyebrow">Patient overview</p><h2>${escapeHtml(profile.name || 'Unnamed patient')}</h2><p class="muted">UID: <span class="patient-uid">${escapeHtml(profile.id)}</span></p></div>
      </div>
      <dl class="patient-facts">
        <div><dt>Age</dt><dd>${escapeHtml(profile.age ?? 'Not provided')}</dd></div>
        <div><dt>Gender</dt><dd>${escapeHtml(profile.gender || 'Not provided')}</dd></div>
        <div><dt>Pre-existing conditions</dt><dd>${escapeHtml(conditions)}</dd></div>
      </dl>
    </section>`;
}

function buildLedgerEntries(logs, metrics) {
  return [
    ...logs.map((log) => ({
      id: log.id,
      type: 'Health log',
      date: log.date,
      title: log.parsed_data?.summary || 'Patient health entry',
      description: log.raw_text || '',
      tags: [
        ...(log.parsed_data?.symptoms || []),
        log.parsed_data?.sleep ? `Sleep: ${log.parsed_data.sleep}` : '',
        log.parsed_data?.severity ? `Severity: ${log.parsed_data.severity}` : ''
      ].filter(Boolean)
    })),
    ...metrics.map((metric) => ({
      id: metric.id,
      type: 'Reading',
      date: metric.date,
      title: `${formatLabel(metric.condition)} reading`,
      description: Object.entries(metric.metrics || {})
        .map(([key, value]) => `${formatLabel(key)}: ${value}`)
        .join(', '),
      tags: []
    }))
  ].sort((a, b) => dateMillis(b.date) - dateMillis(a.date));
}

function renderLedger(entries) {
  if (!entries.length) return '<div class="empty-list"><p>No health entries were found for this date range.</p></div>';

  const groups = entries.reduce((result, entry) => {
    const day = formatDate(entry.date, { year: 'numeric', month: 'long', day: 'numeric' });
    (result[day] ||= []).push(entry);
    return result;
  }, {});

  return Object.entries(groups).map(([day, dayEntries]) => `
    <section class="ledger-day">
      <h3>${escapeHtml(day)}</h3>
      ${dayEntries.map((entry) => `
        <article class="ledger-entry">
          <div class="timeline-meta">
            <span class="severity low">${escapeHtml(entry.type)}</span>
            <time>${escapeHtml(formatDate(entry.date, { hour: 'numeric', minute: '2-digit' }))}</time>
          </div>
          <h4>${escapeHtml(entry.title)}</h4>
          ${entry.description ? `<p>${escapeHtml(entry.description)}</p>` : ''}
          ${entry.tags.length ? `<div class="tag-row">${entry.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
        </article>`).join('')}
    </section>`).join('');
}

function renderInsights(insights) {
  if (!insights.length) return '<div class="empty-list"><p>No saved AI insights are available.</p></div>';
  return insights.map((insight) => `
    <article class="stored-insight">
      <p>${escapeHtml(insight.text)}</p>
      <time>${escapeHtml(formatDate(insight.createdAt, { year: 'numeric', month: 'short', day: 'numeric' }))}</time>
    </article>`).join('');
}

function renderRecommendations(recommendations) {
  if (!recommendations.length) return '<div class="empty-list"><p>No doctor recommendations have been added.</p></div>';
  return recommendations.map((recommendation) => `
    <article class="recommendation-item">
      <div>
        <p>${escapeHtml(recommendation.text)}</p>
        <span>${escapeHtml(recommendation.doctorName || 'Doctor')}</span>
      </div>
      <time>${escapeHtml(formatDate(recommendation.createdAt, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))}</time>
    </article>`).join('');
}

function bindWorkspaceEvents(allEntries) {
  document.getElementById('ledger-filter-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const from = values.from ? new Date(`${values.from}T00:00:00`) : null;
    const to = values.to ? new Date(`${values.to}T23:59:59.999`) : null;
    if (from && to && from > to) {
      showToast('The start date must be before the end date.');
      return;
    }
    const filtered = allEntries.filter((entry) => {
      const date = new Date(entry.date);
      return (!from || date >= from) && (!to || date <= to);
    });
    document.getElementById('ledger-results').innerHTML = renderLedger(filtered);
  });

  document.getElementById('delete-doctor-btn')?.addEventListener('click', async () => {
    const confirmDelete = confirm("Are you sure you want to PERMANENTLY delete your account? This cannot be undone.");
    if (confirmDelete) {
      try {
        await import('../services/storage.js').then(m => m.deleteAccount());
        window.location.hash = '#/auth';
      } catch (err) {
        if (err.code === 'auth/requires-recent-login') {
           alert('For security reasons, you must log out and log back in before deleting your account.');
        } else {
           alert('Failed to delete account: ' + err.message);
        }
      }
    }
  });

  document.getElementById('link-patient-btn')?.addEventListener('click', async () => {
    const input = document.getElementById('patient-code');
    try {
      await linkPatientToDoctor(input.value.trim().toUpperCase());
      showToast('Patient linked successfully.');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } catch (error) {
      showToast(error.message);
    }
  });

  document.getElementById('recommendation-form')?.addEventListener('submit', handleRecommendation);

  document.getElementById('report-toggle-btn')?.addEventListener('click', () => {
    const report = document.getElementById('doctor-report');
    report.hidden = !report.hidden;
    if (!report.hidden) report.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.getElementById('print-report-btn')?.addEventListener('click', () => window.print());
  document.getElementById('close-report-btn')?.addEventListener('click', () => {
    document.getElementById('doctor-report').hidden = true;
  });
}

async function handleRecommendation(event) {
  event.preventDefault();
  const button = document.getElementById('save-recommendation');
  const data = Object.fromEntries(new FormData(event.currentTarget));
  if (!data.text.trim()) {
    showToast('Enter a recommendation before saving.');
    return;
  }



function bindPatientTabs() {
  const detail = document.getElementById('patient-detail');
  detail?.querySelectorAll('[data-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      const tab = button.dataset.tab;
      detail.querySelectorAll('[data-tab]').forEach((item) => {
        const isActive = item === button;
        item.classList.toggle('active', isActive);
        item.setAttribute('aria-selected', String(isActive));
      });
      detail.querySelectorAll('[data-tab-panel]').forEach((panel) => {
        panel.hidden = panel.dataset.tabPanel !== tab;
      });
    });
    patientData.recommendations = await getDoctorRecommendations(selectedPatient.id);
    document.getElementById('recommendations-history').innerHTML = renderRecommendations(patientData.recommendations);
    event.currentTarget.reset();
    document.getElementById('doctor-name').value = doctorProfile?.name || '';
    renderReport();
    document.getElementById('print-report-btn')?.addEventListener('click', () => window.print());
    document.getElementById('close-report-btn')?.addEventListener('click', () => {
      document.getElementById('doctor-report').hidden = true;
    });
    showToast('Recommendation saved.');
  } catch (error) {
    showToast(error.message);
  } finally {
    button.disabled = false;
    button.textContent = 'Save recommendation';
  }
}

function bindClinicalForm() {
  document.getElementById('add-medicine-btn')?.addEventListener('click', () => {
    const list = document.getElementById('medicine-list');
    const div = document.createElement('div');
    div.className = 'med-item';
    div.style.display = 'flex';
    div.style.gap = '8px';
    div.innerHTML = `
      <input name="medicine_name[]" placeholder="Medicine name" style="flex:2" required>
      <input name="medicine_dosage[]" placeholder="Dosage" style="flex:1">
      <input name="medicine_timing[]" placeholder="Timing (e.g. 1-0-1)" style="flex:1">
      <button type="button" class="btn btn-secondary" onclick="this.parentElement.remove()" style="min-height:auto; padding: 12px; color: var(--danger);">Remove</button>
    `;
    list.appendChild(div);
  });

  document.getElementById('clinical-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const formData = new FormData(event.currentTarget);
      const data = Object.fromEntries(formData);

      const metricGroups = {};
      for (const key in data) {
        if (key.startsWith('metric_') && data[key] !== '') {
          const parts = key.split('_');
          const metricId = parts.pop();
          parts.shift(); // remove 'metric'
          const conditionId = parts.join('_');
          
          if (!metricGroups[conditionId]) metricGroups[conditionId] = {};
          metricGroups[conditionId][metricId] = Number(data[key]);
        }
      }

      const metricPromises = Object.entries(metricGroups).map(([conditionId, metrics]) => {
        return addMetricLog({ patientId: selectedPatientId, condition: conditionId, metrics });
      });
      await Promise.all(metricPromises);

      const medNames = formData.getAll('medicine_name[]');
      const medDosages = formData.getAll('medicine_dosage[]');
      const medTimings = formData.getAll('medicine_timing[]');
      
      const medicines = medNames.map((name, i) => ({
        id: name.replace(/\\s+/g, '').toLowerCase() + Date.now().toString().slice(-4),
        name,
        instructions: medDosages[i] || '',
        timing: medTimings[i] || ''
      })).filter(m => m.name.trim());
      
      // Update patient profile with new medicines
      await import('../services/storage.js').then(m => m.updatePatientProfile(selectedPatientId, { medicines }));

      const prescriptions = medicines.map(m => ({ medicine: m.name, dosage: m.instructions, frequency: 'Daily tracking', duration: '' }));
      const testsOrdered = data.test ? [{ name: data.test, description: '', status: 'pending' }] : [];

      await addVisit({
        patientId: selectedPatientId,
        diagnosis: data.diagnosis || 'Follow-up review',
        prescriptions,
        testsOrdered,
        recommendations: data.recommendation || 'Continue the current care plan.',
        doctorNotes: data.recommendation || ''
      });

      if (data.appointment) {
        await addAppointment({
          patientId: selectedPatientId,
          scheduledDate: new Date(data.appointment).toISOString(),
          status: 'scheduled',
          reason: data.diagnosis || 'Clinical follow-up',
          notes: data.recommendation || ''
        });
      }

      showToast('Care plan saved and shared with the patient.');
      document.getElementById('patient-detail').innerHTML = await renderPatient(selectedPatientId);
      bindPatientDetail();
    } catch (error) {
      console.error('Error saving care plan:', error);
      showToast('Error saving care plan: ' + error.message);
    }
  });
}
