// ============================================================
// auth.js — Login / authentication views
// ============================================================
import Store from './store.js';
import { toast, applyTheme } from './ui.js';

export function renderAuth(container) {
  const s = Store.getSettings();
  container.innerHTML = `
    <div class="login-screen">
      <div class="login-card">
        <div class="login-header">
          <div class="login-logo">
            ${s.logo ? `<img src="${s.logo}" alt="logo">` : `<i class="fas fa-spa"></i>`}
          </div>
          <h1>${s.officeName}</h1>
          <p>Sistema de Gestão Psicológica</p>
        </div>
        <div class="login-tabs">
          <button class="login-tab active" data-tab="psico">Psicóloga</button>
          <button class="login-tab" data-tab="patient">Paciente</button>
        </div>
        <div class="login-body">
          <!-- Psicóloga form -->
          <div data-panel="psico">
            <div class="field">
              <label>Senha de acesso</label>
              <input type="password" class="input" id="psico-pass" placeholder="Digite sua senha" autocomplete="current-password">
            </div>
            <button class="btn btn-primary btn-block" id="psico-login-btn">
              <i class="fas fa-lock"></i> Entrar como Psicóloga
            </button>
            <p class="hint text-center mt-1 text-muted text-sm">Senha padrão: admin123</p>
          </div>
          <!-- Patient form -->
          <div data-panel="patient" class="hidden">
            <div class="field">
              <label>Selecione seu nome</label>
              <select class="select" id="patient-select">
                <option value="">— Escolha —</option>
                ${Store.getPatients().map(p => `<option value="${p.id}">${p.fullName}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label>Senha do paciente</label>
              <input type="password" class="input" id="patient-pass" placeholder="Digite sua senha" autocomplete="current-password">
            </div>
            <button class="btn btn-primary btn-block" id="patient-login-btn">
              <i class="fas fa-user"></i> Entrar como Paciente
            </button>
            <p class="hint text-center mt-1 text-muted text-sm">Senha padrão do paciente: 123456</p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Tab switching
  container.querySelectorAll('.login-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      container.querySelectorAll('[data-panel]').forEach(p => p.classList.add('hidden'));
      container.querySelector(`[data-panel="${target}"]`).classList.remove('hidden');
    });
  });

  // Psicóloga login
  container.querySelector('#psico-login-btn').addEventListener('click', () => {
    const pass = container.querySelector('#psico-pass').value.trim();
    const settings = Store.getSettings();
    if (pass === settings.psicoPassword) {
      Store.setSession({ role: 'admin', id: null, name: settings.psicoName });
      toast('Bem-vinda, ' + settings.psicoName + '!', 'success');
      location.hash = '#/admin';
      applyTheme();
      window.dispatchEvent(new Event('hashchange'));
    } else {
      toast('Senha incorreta', 'error');
    }
  });

  // Patient login
  container.querySelector('#patient-login-btn').addEventListener('click', () => {
    const pid = container.querySelector('#patient-select').value;
    const pass = container.querySelector('#patient-pass').value.trim();
    if (!pid) { toast('Selecione seu nome', 'error'); return; }
    const patient = Store.getPatient(pid);
    if (pass === (patient.patientPassword || '123456')) {
      Store.setSession({ role: 'patient', id: pid, name: patient.fullName });
      toast('Bem-vindo, ' + patient.fullName + '!', 'success');
      location.hash = '#/patient';
      window.dispatchEvent(new Event('hashchange'));
    } else {
      toast('Senha incorreta', 'error');
    }
  });

  // Enter key
  container.querySelector('#psico-pass').addEventListener('keydown', e => { if (e.key === 'Enter') container.querySelector('#psico-login-btn').click(); });
  container.querySelector('#patient-pass').addEventListener('keydown', e => { if (e.key === 'Enter') container.querySelector('#patient-login-btn').click(); });
}
