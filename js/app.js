// ============================================================
// app.js — Entry point, router
// ============================================================
import Store from './store.js';
import { applyTheme } from './ui.js';
import { renderAuth } from './auth.js';
import {
  viewDashboard, viewPatients, viewPatientDetail,
  viewFinance, viewSettings,
} from './admin.js';
import {
  viewPatientProfile, viewPatientPayments, viewPatientDocuments,
} from './patient.js';

const app = document.getElementById('app');

// Seed demo data on first run
Store.seedIfEmpty();

// Apply saved theme on load
applyTheme();

function router() {
  const hash = location.hash.slice(1) || '/login';
  const session = Store.getSession();
  const parts = hash.split('/').filter(Boolean); // e.g. ['admin', 'patients'] or ['admin', 'patient', 'id']

  // No session → login screen
  if (!session) {
    renderAuth(app);
    return;
  }

  // Admin routes
  if (session.role === 'admin') {
    const section = parts[0] || 'admin'; // 'admin'
    const sub = parts[1];
    const id = parts[2];

    if (!sub || sub === 'dashboard') {
      viewDashboard(app);
    } else if (sub === 'patients' && !id) {
      viewPatients(app);
    } else if (sub === 'patient' && id) {
      viewPatientDetail(app, id);
    } else if (sub === 'finance') {
      viewFinance(app);
    } else if (sub === 'settings') {
      viewSettings(app);
    } else {
      viewDashboard(app);
    }
    return;
  }

  // Patient routes
  if (session.role === 'patient') {
    const sub = parts[1]; // parts[0] === 'patient'
    if (!sub || sub === 'profile') {
      viewPatientProfile(app, session.id);
    } else if (sub === 'payments') {
      viewPatientPayments(app, session.id);
    } else if (sub === 'documents') {
      viewPatientDocuments(app, session.id);
    } else {
      viewPatientProfile(app, session.id);
    }
    return;
  }

  // Fallback
  renderAuth(app);
}

// Re-apply theme on every navigation (settings may have changed)
window.addEventListener('hashchange', () => {
  applyTheme();
  router();
});

window.addEventListener('DOMContentLoaded', router);

// Initial render
router();
