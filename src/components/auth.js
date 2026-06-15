import { GoogleAuthProvider, signInWithRedirect } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../services/firebase.js';
import { createUserProfile } from '../services/storage.js';
import { showToast } from '../utils/toast.js';

export async function render() {
  const user = auth.currentUser;
  const chooseRole = user
    ? !(await getDoc(doc(db, 'users', user.uid))).exists()
    : false;

  return `
    <main class="centered-state">
      <div class="auth-card">
        <a class="brand centered-brand" href="#/auth"><span class="brand-mark">H</span><span>Healthi</span></a>
        <h1>${chooseRole ? 'How will you use Healthi?' : 'Welcome to Healthi'}</h1>
        ${chooseRole ? `
          <p class="muted">Your account is ready. Choose the role that matches how you will use Healthi.</p>
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
  document.getElementById('google-btn')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = 'Redirecting...';
    const provider = new GoogleAuthProvider();
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (error) {
      showToast(error.message || error.code || 'Redirect sign-in failed');
      button.disabled = false;
      button.textContent = 'Sign in with Google';
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
