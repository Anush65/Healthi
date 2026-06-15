const icon = (name) => {
  const icons = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M9.5 20v-6h5v6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    spark: '<path d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/>',
    file: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5M10 13h5M10 17h5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1-2.9 2.9-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5v.1h-4v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1-2.9-2.9.1-.1a1.7 1.7 0 0 0 .3-1.8A1.7 1.7 0 0 0 3.1 14H3v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1 2.9-2.9.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.5V3h4v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1 2.9 2.9-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1h.1v4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
};

function nav(activePage) {
  return `<nav class="app-nav" aria-label="Primary navigation">
    <a class="nav-link ${activePage === 'home' ? 'active' : ''}" href="#/dashboard">${icon('home')}<span>Home</span></a>
    <a class="nav-link ${activePage === 'log' ? 'active' : ''}" href="#/log">${icon('plus')}<span>Log</span></a>
    <a class="nav-link ${activePage === 'insights' ? 'active' : ''}" href="#/insights">${icon('spark')}<span>Insights</span></a>
    <a class="nav-link ${activePage === 'export' ? 'active' : ''}" href="#/export">${icon('file')}<span>Report</span></a>
    <a class="nav-link ${activePage === 'settings' ? 'active' : ''}" href="#/settings">${icon('settings')}<span>Settings</span></a>
  </nav>`;
}

export function renderLayout(contentHtml, activePage) {
  return `
    <div class="app-layout">
      <aside class="sidebar">
        <a class="brand" href="#/dashboard"><span class="brand-mark">H</span><span>Healthi</span></a>
        ${nav(activePage)}
        <div class="sidebar-help"><span>?</span><div><strong>Need help?</strong><small>Call a trusted contact</small></div></div>
      </aside>
      <main class="main-content">
        ${contentHtml}
      </main>
      ${nav(activePage)}
    </div>`;
}

export { icon };
