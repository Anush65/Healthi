import { auth, db } from '../services/firebase.js';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { showToast } from '../utils/toast.js';

export async function render() {
  const user = auth.currentUser;
  let showRole = false;
  
  if (user) {
    const docRef = await getDoc(doc(db, "users", user.uid));
    if (!docRef.exists()) {
      showRole = true;
    }
  }

  return `
    <div style="margin-top: 40px; animation: slideDown 0.4s ease-out; max-width: 400px; margin-left: auto; margin-right: auto;">
      <div class="card" id="auth-card" style="display: ${showRole ? 'none' : 'block'};">
        <h2 style="text-align: center; margin-bottom: 24px;">Welcome to Healthi</h2>
        <p style="text-align: center; color: var(--text-secondary); margin-bottom: 24px;">
          Please sign in to access your dashboard.
        </p>
        
        <button id="google-btn" class="btn-primary" style="width: 100%; padding: 16px; font-size: 1.1rem; background-color: #fff; color: #444; border: 1px solid #ccc; display: flex; align-items: center; justify-content: center; gap: 12px;">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>
      </div>

      <div class="card" id="role-card" style="display: ${showRole ? 'block' : 'none'};">
        <h2 style="text-align: center; margin-bottom: 24px;">Complete Registration</h2>
        <p style="text-align: center; color: var(--text-secondary); margin-bottom: 24px;">
          Are you setting up this account as a Patient or a Doctor?
        </p>

        <form id="role-form">
          <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px;">
            <label style="display: flex; align-items: center; padding: 16px; border: 1px solid var(--border-color); border-radius: var(--radius-button); cursor: pointer;">
              <input type="radio" name="role" value="patient" checked style="margin-right: 12px; transform: scale(1.2);">
              <span style="font-size: 1.1rem; font-weight: 500;">Patient</span>
            </label>
            <label style="display: flex; align-items: center; padding: 16px; border: 1px solid var(--border-color); border-radius: var(--radius-button); cursor: pointer;">
              <input type="radio" name="role" value="doctor" style="margin-right: 12px; transform: scale(1.2);">
              <span style="font-size: 1.1rem; font-weight: 500;">Doctor</span>
            </label>
          </div>
          
          <button type="submit" id="submit-role-btn" class="btn-primary" style="width: 100%; padding: 16px; font-size: 1.1rem;">Complete Setup</button>
        </form>
      </div>
    </div>
  `;
}

export function init() {
  const googleBtn = document.getElementById('google-btn');
  const roleForm = document.getElementById('role-form');
  const submitRoleBtn = document.getElementById('submit-role-btn');

  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      try {
        googleBtn.disabled = true;
        googleBtn.style.opacity = '0.5';
        showToast('Opening Google Sign-In...');
        
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        // onAuthStateChanged in main.js handles the rest
      } catch (err) {
        console.error(err);
        showToast('Error: ' + err.message, 5000);
        googleBtn.disabled = false;
        googleBtn.style.opacity = '1';
      }
    });
  }

  if (roleForm) {
    roleForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = auth.currentUser;
      if (!user) return;

      try {
        submitRoleBtn.disabled = true;
        submitRoleBtn.style.opacity = '0.5';

        const role = document.querySelector('input[name="role"]:checked').value;
        
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          role: role,
          createdAt: new Date().toISOString(),
          onboardingComplete: false
        });
        
        // Force router navigation
        if (role === 'doctor') {
          window.location.hash = '#/doctor-dashboard';
        } else {
          window.location.hash = '#/onboarding';
        }
      } catch (err) {
        showToast(err.message);
        submitRoleBtn.disabled = false;
        submitRoleBtn.style.opacity = '1';
      }
    });
  }
}
