import {
  accessPatientByUid,
  addDoctorRecommendation,
  clearAllData,
  getDoctorRecommendations,
  getPatientInsights,
  getPatientLogs,
  getPatientMetricLogs,
  getProfile
} from '../services/storage.js';
import { showToast } from '../utils/toast.js';
import { safeParseDate, compareDates, formatDate } from '../utils/date.js';

let doctorProfile = null;
let selectedPatient = null;
let patientData = null;

export async function render() {
  doctorProfile = await getProfile();

  return `
    <main class="doctor-shell">
      <header class="doctor-header no-print">
        <a class="brand" href="#/doctor-dashboard"><span class="brand-mark">H</span><span>Healthi Clinical</span></a>
        <div class="doctor-header-actions">
          <div><strong>${escapeHtml(doctorProfile?.name || 'Doctor')}</strong><div class="muted">${escapeHtml(doctorProfile?.specialty || 'Healthcare professional')}</div></div>
          <button id="logout-btn" class="btn btn-secondary" type="button">Sign out</button>
        </div>
      </header>

      <section class="doctor-access no-print" aria-labelledby="doctor-access-title">
        <div>
          <p class="eyebrow">Patient access</p>
          <h1 id="doctor-access-title">Open a patient record</h1>
          <p class="muted">Enter the patient's unique UID. Health records are read-only in this workspace.</p>
        </div>
        <form id="patient-access-form" class="patient-access-form" novalidate>
          <label for="patient-uid">Patient UID</label>
          <div class="patient-access-row">
            <input id="patient-uid" name="patientUid" autocomplete="off" maxlength="128" placeholder="Enter patient UID" required>
            <button id="patient-access-submit" class="btn btn-primary" type="submit">View record</button>
          </div>
          <p id="patient-access-help" class="form-message muted">Ask the patient to share the UID shown in their account.</p>
        </form>
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

export function init() {
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await clearAllData();
    window.location.hash = '#/auth';
    window.dispatchEvent(new Event('healthi-session-change'));
  });

  document.getElementById('patient-access-form')?.addEventListener('submit', handlePatientAccess);
}

async function handlePatientAccess(event) {
  event.preventDefault();
  const input = document.getElementById('patient-uid');
  const submit = document.getElementById('patient-access-submit');
  const message = document.getElementById('patient-access-help');
  const patientUid = input.value.trim();

  message.className = 'form-message muted';
  if (!patientUid || patientUid.length > 128 || patientUid.includes('/')) {
    message.textContent = 'Enter a valid patient UID without slashes.';
    message.className = 'form-message error-message';
    input.focus();
    return;
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

function setWorkspaceLoading() {
  document.getElementById('doctor-workspace').innerHTML = `
    <div class="doctor-empty-state" role="status">
      <span class="loading-spinner" aria-hidden="true"></span>
      <h2>Loading patient record</h2>
      <p class="muted">Fetching the patient profile and health history...</p>
    </div>`;
}

function setWorkspaceError(message) {
  document.getElementById('doctor-workspace').innerHTML = `
    <div class="doctor-empty-state">
      <span class="patient-avatar">!</span>
      <h2>Patient record unavailable</h2>
      <p class="muted">${escapeHtml(message)}</p>
    </div>`;
  document.getElementById('doctor-report').hidden = true;
}

function renderWorkspace() {
  const workspace = document.getElementById('doctor-workspace');
  const entries = buildLedgerEntries(patientData.logs, patientData.metrics);

  workspace.innerHTML = `
    ${renderPatientOverview(selectedPatient)}

    <div class="doctor-dashboard-grid">
      <section class="doctor-section ledger-section">
        <div class="section-heading">
          <div><p class="eyebrow">Health ledger</p><h2>Patient history</h2></div>
          <button id="report-toggle-btn" class="btn btn-secondary" type="button">Report view</button>
        </div>
        <form id="ledger-filter-form" class="ledger-filters">
          <div class="field"><label for="ledger-from">From</label><input id="ledger-from" name="from" type="date"></div>
          <div class="field"><label for="ledger-to">To</label><input id="ledger-to" name="to" type="date"></div>
          <button class="btn btn-secondary" type="submit">Apply dates</button>
          <button id="clear-ledger-filter" class="text-button" type="button">Clear</button>
        </form>
        <div id="ledger-results">${renderLedger(entries)}</div>
      </section>

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

  renderReport();
  bindWorkspaceEvents(entries);
}

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

  document.getElementById('clear-ledger-filter')?.addEventListener('click', () => {
    document.getElementById('ledger-filter-form').reset();
    document.getElementById('ledger-results').innerHTML = renderLedger(allEntries);
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

  button.disabled = true;
  button.textContent = 'Saving...';
  try {
    await addDoctorRecommendation({
      patientId: selectedPatient.id,
      text: data.text,
      doctorName: data.doctorName
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

function renderReport() {
  const report = document.getElementById('doctor-report');
  const entries = buildLedgerEntries(patientData.logs, patientData.metrics).slice(0, 12);
  const conditions = selectedPatient.conditions?.length
    ? selectedPatient.conditions.map(formatLabel).join(', ')
    : 'None recorded';

  report.innerHTML = `
    <div class="report-actions no-print">
      <div><p class="eyebrow">Printable summary</p><h2>Patient report</h2></div>
      <div><button id="close-report-btn" class="btn btn-secondary" type="button">Close</button> <button id="print-report-btn" class="btn btn-primary" type="button">Print report</button></div>
    </div>
    <article class="report-paper">
      <header class="report-header">
        <div><span class="brand-mark">H</span><div><strong>Healthi Patient Summary</strong><p>Generated ${escapeHtml(new Date().toLocaleString())}</p></div></div>
        <span>Confidential health information</span>
      </header>
      <section class="report-section">
        <h2>${escapeHtml(selectedPatient.name || 'Unnamed patient')}</h2>
        <div class="report-facts">
          <p><strong>Patient UID:</strong> ${escapeHtml(selectedPatient.id)}</p>
          <p><strong>Age:</strong> ${escapeHtml(selectedPatient.age ?? 'Not provided')}</p>
          <p><strong>Gender:</strong> ${escapeHtml(selectedPatient.gender || 'Not provided')}</p>
          <p><strong>Conditions:</strong> ${escapeHtml(conditions)}</p>
        </div>
      </section>
      <section class="report-section">
        <h3>Recent health logs</h3>
        ${entries.length ? entries.map((entry) => `
          <div class="report-row"><time>${escapeHtml(formatDate(entry.date, { year: 'numeric', month: 'short', day: 'numeric' }))}</time><div><strong>${escapeHtml(entry.title)}</strong><p>${escapeHtml(entry.description)}</p></div></div>
        `).join('') : '<p>No health logs recorded.</p>'}
      </section>
      <section class="report-section">
        <h3>AI insights</h3>
        ${patientData.insights.length ? `<ul>${patientData.insights.map((insight) => `<li>${escapeHtml(insight.text)}</li>`).join('')}</ul>` : '<p>No saved AI insights.</p>'}
      </section>
      <section class="report-section">
        <h3>Doctor recommendations</h3>
        ${patientData.recommendations.length ? patientData.recommendations.map((item) => `
          <div class="report-row"><time>${escapeHtml(formatDate(item.createdAt, { year: 'numeric', month: 'short', day: 'numeric' }))}</time><div><strong>${escapeHtml(item.doctorName || 'Doctor')}</strong><p>${escapeHtml(item.text)}</p></div></div>
        `).join('') : '<p>No doctor recommendations.</p>'}
      </section>
    </article>`;
}

function friendlyAccessError(error) {
  if (error?.code === 'permission-denied') return 'You do not have permission to open this patient record.';
  if (error?.message?.includes('No patient')) return 'No patient was found with that UID. Check the UID and try again.';
  return 'We could not load this patient record. Please try again.';
}

function dateMillis(value) {
  const date = safeParseDate(value);
  return date ? date.getTime() : 0;
}

function formatLabel(value = '') {
  return String(value).replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function initials(name = '') {
  const value = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('');
  return escapeHtml(value || 'P');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
