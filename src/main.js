import './style.css';
import { auth, isDemoMode, isFirebaseConfigured } from './services/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { getProfile } from './services/storage.js';

const routes = {
  dashboard: () => import('./components/dashboard.js'),
  onboarding: () => import('./components/onboarding.js'),
  log: () => import('./components/quiz.js'),
  insights: () => import('./components/insights.js'),
  export: () => import('./components/export.js'),
  settings: () => import('./components/settings.js'),
  auth: () => import('./components/auth.js'),
  'doctor-dashboard': () => import('./components/doctor-dashboard.js'),
  seed: () => import('./components/seed.js')
};

export async function router() {
  const app = document.getElementById('app');
  let route = window.location.hash.replace('#/', '') || 'dashboard';
  const signedIn = Boolean(auth.currentUser);

  if (!signedIn && route !== 'auth') {
    window.location.hash = '#/auth';
    return;
  }

  if (signedIn) {
    const profile = await getProfile();
    if (!profile && route !== 'auth') {
      window.location.hash = '#/auth';
      return;
    }
    if (profile && route === 'auth') {
      window.location.hash = profile?.role === 'doctor' ? '#/doctor-dashboard' : '#/dashboard';
      return;
    }
    if (profile?.role === 'doctor' && route !== 'doctor-dashboard') {
      window.location.hash = '#/doctor-dashboard';
      return;
    }
    if (profile?.role === 'patient' && route === 'doctor-dashboard') {
      window.location.hash = '#/dashboard';
      return;
    }
    if (profile?.role === 'patient' && !profile.onboardingComplete && route !== 'onboarding') {
      window.location.hash = '#/onboarding';
      return;
    }
  }

  try {
    const module = await (routes[route] || routes.dashboard)();
    app.innerHTML = await module.render();
    await module.init?.();
  } catch (error) {
    console.error(error);
    app.innerHTML = `
      <main class="centered-state">
        <div class="card">
          <p class="eyebrow">Something went wrong</p>
          <h1>We could not open this page.</h1>
          <p class="muted">${error.message}</p>
          <a class="btn btn-primary" href="#/dashboard">Return home</a>
        </div>
      </main>`;
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('healthi-session-change', router);

if (isDemoMode || !isFirebaseConfigured) {
  router();
} else {
  // Log auth state changes for debugging sign-in issues
  onAuthStateChanged(auth, (user) => {
    console.log('[Auth] state changed, user:', user ? { uid: user.uid, email: user.email } : null);
    router();
  });
  // Also check redirect results (useful if redirect flow was used)
  import('firebase/auth').then(({ getRedirectResult }) => {
    getRedirectResult(auth).then((res) => {
      if (res) console.log('[Auth] redirect result:', res?.user?.uid, res?.credential);
    }).catch((err) => console.warn('[Auth] redirect result error', err));
  });
}
