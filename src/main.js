import './style.css';
import { auth } from './services/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { getProfile } from './services/storage.js';

const routes = {
  '': () => import('./components/dashboard.js'),
  'dashboard': () => import('./components/dashboard.js'),
  'onboarding': () => import('./components/onboarding.js'),
  'log': () => import('./components/quiz.js'),
  'insights': () => import('./components/insights.js'),
  'export': () => import('./components/export.js'),
  'settings': () => import('./components/settings.js'),
  'auth': () => import('./components/auth.js'),
  'doctor-dashboard': () => import('./components/doctor-dashboard.js')
};

async function router() {
  const app = document.getElementById('app');
  let hash = window.location.hash.replace('#/', '') || 'dashboard';
  
  if (window.location.hash === '' || window.location.hash === '#') {
    hash = 'dashboard';
  }

  const user = auth.currentUser;
  
  if (!user && hash !== 'auth') {
    window.location.hash = '#/auth';
    return;
  }
  
  if (user && hash === 'auth') {
    window.location.hash = '#/dashboard';
    return;
  }

  // Check onboarding status and roles
  if (user && hash !== 'auth') {
    try {
      const profile = await getProfile();
      if (profile && profile.role === 'doctor' && hash !== 'doctor-dashboard') {
        window.location.hash = '#/doctor-dashboard';
        return;
      }
      
      if (profile && profile.role !== 'doctor' && !profile.onboardingComplete && hash !== 'onboarding') {
        window.location.hash = '#/onboarding';
        return;
      }
    } catch (err) {
      console.error(err);
    }
  }

  const loadModule = routes[hash] || routes['dashboard'];
  
  try {
    const module = await loadModule();
    app.innerHTML = await module.render();
    if (module.init) {
      module.init();
    }
  } catch (err) {
    console.error('Error loading route:', err);
    app.innerHTML = `<div class="card" style="margin-top: 40px; text-align: center;">
      <h2>Coming Soon</h2>
      <p>The ${hash} feature is being built.</p>
      <a href="#/dashboard" style="display:inline-block; margin-top:20px; color:var(--blue-600); text-decoration:none; font-weight:bold;">Return Home</a>
    </div>`;
  }
}

// Wait for Firebase Auth to initialize before first route
let isFirstLoad = true;
onAuthStateChanged(auth, (user) => {
  if (isFirstLoad) {
    isFirstLoad = false;
    router();
  } else {
    router();
  }
});

window.addEventListener('hashchange', router);
