import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';
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
            <button class="btn btn-primary btn-block" type="submit">Complete setup</button>
          </form>` : isFirebaseConfigured ? `
          <p class="muted">Sign in or create an account first. New users choose Patient or Doctor after authentication.</p>
          <button id="google-btn" class="btn btn-secondary btn-block">Sign in with Google</button>` : `
          <div class="auth-config-message" role="status">
            <strong>Authentication is not configured.</strong>
            <p>Add the Firebase environment variables to enable account sign-in and creation.</p>
          </div>`}
      </div>
    </main>`;
}

export function init() {
  document.getElementById('google-btn')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = 'Signing in...';
    const provider = new GoogleAuthProvider();
    // Use a timeout so the UI doesn't hang indefinitely if the popup is blocked
    const popupPromise = signInWithPopup(auth, provider);
    const timeoutMs = 20000;
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('popup_timeout')), timeoutMs));
    try {
      await Promise.race([popupPromise, timeoutPromise]);
      // If popup succeeds, log the current user for debugging
      console.log('[Auth] popup sign-in success', { uid: auth.currentUser?.uid, email: auth.currentUser?.email });
    } catch (error) {
      if (error && error.message === 'popup_timeout') {
        showToast('Sign-in popup timed out — attempting redirect flow.');
        try {
          await signInWithRedirect(auth, provider);
          return; // redirect will navigate away
        } catch (errRedirect) {
          showToast(errRedirect.message || 'Redirect sign-in failed');
        }
      } else {
        showToast(error.message || error.code || 'Sign-in failed');
      }
      button.disabled = false;
      button.textContent = 'Sign in with Google';
    }
  });

  document.getElementById('role-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = event.currentTarget.querySelector('button[type="submit"]');
    const role = new FormData(event.currentTarget).get('role');
    const user = auth.currentUser;

    if (!user) {
      showToast('Please sign in before choosing a role.');
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Saving...';
    try {
      await createUserProfile({
        name: user.displayName,
        email: user.email,
        role,
        patientCode: role === 'patient' ? createPatientCode() : null,
        onboardingComplete: role === 'doctor'
      });
      window.location.hash = role === 'doctor' ? '#/doctor-dashboard' : '#/onboarding';
    } catch (error) {
      showToast(error.message);
      submit.disabled = false;
      submit.textContent = 'Complete setup';
    }
  });
}

function createPatientCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const values = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join('');
}
