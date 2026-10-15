import './styles/index.css';
import { AdminPage } from './pages/AdminPage.js';
import { PhonePage } from './pages/PhonePage.js';

let activePage: { destroy?: () => void } | any = null;

function init() {
  const app = document.getElementById('app');
  if (!app) return;

  if (activePage && typeof activePage.destroy === 'function') {
    try {
      activePage.destroy();
    } catch (e) {}
    activePage = null;
  }

  const path = window.location.pathname.toLowerCase();

  if (path.startsWith('/phone')) {
    const page = new PhonePage(app);
    page.mount();
    activePage = page;
  } else {
    // Default to /admin
    if (path === '/' || path === '') {
      window.history.replaceState({}, '', '/admin');
    }
    const page = new AdminPage(app);
    page.mount();
    activePage = page;
  }
}

// Handle browser popstate / back / forward
window.addEventListener('popstate', init);
init();
