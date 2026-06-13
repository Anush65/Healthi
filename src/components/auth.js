import { auth, isDemoMode } from '../services/firebase.js';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase.js';
import { createUserProfile, startDemo } from '../services/storage.js';
import { showToast } from '../utils/toast.js';

export async function render() {
  if (isDemoMode) {
    return `
      <main class="auth-shell">
        <section class="auth-story">
          <a class="brand" href="#/auth" aria-label="Healthi home">
            <span class="brand-mark">H</span><span>Healthi</span>
          </a>
          <div class="auth-copy">
            <p class="eyebrow light">Your health, understood</p>
            <h1>A calmer way to keep your care connected.</h1>
            <p>Healthi turns everyday notes into a clear health timeline that patients, families, and doctors can understand together.</p>
            <div class="trust-row">
              <span>Private by design</span><span>AI-assisted</span><span>Accessible</span>
            </div>
          </div>
        </section>
        <section class="auth-panel">
          <div class="auth-card">
            <div class="demo-badge">Interactive demo</div>
            <h2>Choose your view</h2>
            <p class="muted">Explore the complete care loop with realistic sample information.</p>
            <button class="role-choice" data-role="patient">
              <span class="role-icon">P</span>
              <span><strong>Continue as Maya</strong><small>Log health, view insights, manage care</small></span>
              <span aria-hidden="true">→</span>
            </button>
            <button class="role-choice" data-role="doctor">
              <span class="role-icon doctor">D</span>
              <span><strong>Continue as Dr. Mehta</strong><small>Review patients and create care plans</small></span>
              <span aria-hidden="true">→</span>
            </button>
            <p class="privacy-note">Demo data stays in this browser and can be reset anytime.</p>
          </div>
        </section>
      </main>`;
  }

  const user = auth.currentUser;
  let chooseRole = false;
  if (user) chooseRole = !(await getDoc(doc(db, 'users', user.uid))).exists();

  return `
    <main class="centered-state">
      <div class="auth-card">
        <a class="brand centered-brand" href="#/auth"><span class="brand-mark">H</span><span>Healthi</span></a>
        <h1>${chooseRole ? 'How will you use Healthi?' : 'Welcome back'}</h1>
        ${chooseRole ? `
          <form id="role-form">
            <label class="role-choice"><input type="radio" name="role" value="patient" checked><span><strong>Patient</strong><small>Track and share my health</small></span></label>
            <label class="role-choice"><input type="radio" name="role" value="doctor"><span><strong>Doctor</strong><small>Support my patients</small></span></label>
            <label style="display:flex; align-items:center; gap:12px; margin-top:16px; cursor:pointer; background: var(--blue-50); padding: 16px; border-radius: var(--radius-button); border: 1px solid var(--blue-100);">
              <input type="checkbox" name="isDemo" value="true" style="width:20px; height:20px; cursor:pointer;">
              <span style="font-size: 15px; font-weight: 500; color: var(--blue-800);">Pre-load Demo Data (Hackathon Judges - Patients only)</span>
            </label>
            <button class="btn btn-primary btn-block" type="submit" style="margin-top:16px;">Complete setup</button>
          </form>` : `
          <p class="muted">Sign in securely to open your health ledger.</p>
          <button id="google-btn" class="btn btn-secondary btn-block">Continue with Google</button>`}
      </div>
    </main>`;
}

export function init() {
  document.querySelectorAll('[data-role]').forEach((button) => {
    button.addEventListener('click', () => {
      startDemo(button.dataset.role);
      window.dispatchEvent(new Event('healthi-session-change'));
    });
  });

  document.getElementById('google-btn')?.addEventListener('click', async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (error) {
      showToast(error.message);
    }
  });

  document.getElementById('role-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const role = formData.get('role');
    const isDemo = formData.get('isDemo') === 'true';
    const user = auth.currentUser;
    await createUserProfile({
      name: user.displayName,
      email: user.email,
      role,
      patientCode: role === 'patient' ? createPatientCode() : null,
      onboardingComplete: role === 'doctor' || isDemo,
      conditions: isDemo && role === 'patient' ? ['hypertension', 'diabetes', 'temperature', 'oxygen_level', 'body_weight'] : []
    });
    
    if (isDemo && role === 'patient') {
      window.location.hash = '#/seed';
    } else {
      window.location.hash = role === 'doctor' ? '#/doctor-dashboard' : '#/onboarding';
    }
  });
}

function createPatientCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const values = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join('');
}
