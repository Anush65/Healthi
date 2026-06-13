import './style.css';

const routes = {
  '': () => import('./components/dashboard.js'),
  'dashboard': () => import('./components/dashboard.js'),
  'onboarding': () => import('./components/onboarding.js'),
  'log': () => import('./components/quiz.js'),
  'insights': () => import('./components/insights.js'),
  'export': () => import('./components/export.js'),
  'settings': () => import('./components/settings.js')
};

async function router() {
  const app = document.getElementById('app');
  let hash = window.location.hash.replace('#/', '') || 'dashboard';
  
  if (window.location.hash === '' || window.location.hash === '#') {
    hash = 'dashboard';
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

window.addEventListener('hashchange', router);
window.addEventListener('load', router);
