// ============================================================
// patient.js — Patient views: profile, payments, documents
// ============================================================
import Store from './store.js';
import {
  toast, formatDate, formatDateShort, money, readFileAsBase64, downloadBase64,
  originBadge, statusBadge,
} from './ui.js';

export function patientLayout(container, activeKey, contentHtml) {
  const s = Store.getSettings();
  const navItems = [
    { key: 'profile', icon: 'fa-user', label: 'Meu Perfil', href: '#/patient' },
    { key: 'payments', icon: 'fa-wallet', label: 'Pagamentos', href: '#/patient/payments' },
    { key: 'documents', icon: 'fa-file-medical', label: 'Documentos', href: '#/patient/documents' },
  ];
  container.innerHTML = `
    <div class="app-layout">
      <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <div class="logo">${s.logo ? `<img src="${s.logo}" alt="logo">` : `<i class="fas fa-spa"></i>`}</div>
          <div>
            <div class="name">${s.officeName}</div>
            <div class="role">Paciente</div>
          </div>
        </div>
        ${navItems.map(n => `
          <a href="${n.href}" class="nav-item ${n.key === activeKey ? 'active' : ''}">
            <i class="fas ${n.icon}"></i> ${n.label}
          </a>
        `).join('')}
        <div class="sidebar-spacer"></div>
        <a href="#" class="nav-item" id="logout-btn"><i class="fas fa-sign-out-alt"></i> Sair</a>
      </aside>
      <main class="main-content">
        <button class="mobile-menu-btn" id="mobile-menu-btn"><i class="fas fa-bars"></i></button>
        ${contentHtml}
      </main>
    </div>
  `;
  const sidebar = container.querySelector('#sidebar');
  const backdrop = container.querySelector('#sidebar-backdrop');
  container.querySelector('#mobile-menu-btn')?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    backdrop.classList.toggle('show');
  });
  backdrop?.addEventListener('click', () => { sidebar.classList.remove('open'); backdrop.classList.remove('show'); });
  container.querySelector('#logout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    Store.clearSession();
    toast('Sessão encerrada', 'info');
    location.hash = '#/login';
    window.dispatchEvent(new Event('hashchange'));
  });
}

// ============================================================
// PATIENT PROFILE
// ============================================================
export function viewPatientProfile(container, patientId) {
  const patient = Store.getPatient(patientId);
  if (!patient) { patientLayout(container, 'profile', '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Paciente não encontrado.</p></div>'); return; }
  const settings = Store.getSettings();
  const payments = Store.getPayments(patientId);
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.finalPrice, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.finalPrice, 0);

  patientLayout(container, 'profile', `
    <div class="topbar">
      <h2><i class="fas fa-user-circle" style="color:var(--btn-color)"></i> Meu Perfil</h2>
    </div>
    <div class="card mb-2">
      <div class="flex items-center gap-2 flex-wrap">
        <div class="patient-avatar" style="width:60px;height:60px;font-size:1.5rem">${patient.fullName.charAt(0).toUpperCase()}</div>
        <div class="flex-1">
          <div class="font-bold text-lg">${patient.fullName}</div>
          <div class="text-muted text-sm flex gap-2 flex-wrap">
            <span><i class="fas fa-birthday-cake"></i> ${patient.age} anos</span>
            <span><i class="fas fa-phone"></i> ${patient.phone || '—'}</span>
            <span><i class="fas fa-envelope"></i> ${patient.email || '—'}</span>
          </div>
        </div>
        ${originBadge(patient.origin)}
      </div>
    </div>
    <div class="grid grid-2">
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--success)"><i class="fas fa-check-circle"></i></div>
        <div><div class="stat-value">${money(totalPaid)}</div><div class="stat-label">Total Pago</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--warning)"><i class="fas fa-clock"></i></div>
        <div><div class="stat-value">${money(totalPending)}</div><div class="stat-label">Pendente</div></div>
      </div>
    </div>
    <div class="card mt-2">
      <div class="card-title"><i class="fas fa-key" style="color:var(--btn-color)"></i> Chave PIX para Pagamentos</div>
      <div class="flex items-center justify-between" style="padding:.85rem;background:color-mix(in srgb,var(--btn-color) 5%,transparent);border-radius:.5rem">
        <div>
          <div class="text-sm text-muted">Use a chave abaixo para realizar seus pagamentos:</div>
          <div class="font-bold text-lg" style="color:var(--btn-color)">${settings.pixKey || 'Não configurada'}</div>
        </div>
        ${settings.pixKey ? `<button class="btn btn-outline btn-sm" id="copy-pix-btn"><i class="fas fa-copy"></i> Copiar</button>` : ''}
      </div>
    </div>
  `);

  container.querySelector('#copy-pix-btn')?.addEventListener('click', () => {
    navigator.clipboard.writeText(settings.pixKey).then(() => toast('Chave PIX copiada!', 'success')).catch(() => toast('Não foi possível copiar', 'error'));
  });
}

// ============================================================
// PATIENT PAYMENTS
// ============================================================
export function viewPatientPayments(container, patientId) {
  const patient = Store.getPatient(patientId);
  if (!patient) { patientLayout(container, 'payments', '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Paciente não encontrado.</p></div>'); return; }
  const settings = Store.getSettings();
  const payments = Store.getPayments(patientId).slice().reverse();

  patientLayout(container, 'payments', `
    <div class="topbar">
      <h2><i class="fas fa-wallet" style="color:var(--btn-color)"></i> Meus Pagamentos</h2>
    </div>
    <div class="card mb-2">
      <div class="flex items-center justify-between" style="padding:.6rem;background:color-mix(in srgb,var(--btn-color) 5%,transparent);border-radius:.5rem">
        <div class="text-sm"><strong>Chave PIX:</strong> <span style="color:var(--btn-color);font-weight:600">${settings.pixKey || 'Não configurada'}</span></div>
        ${settings.pixKey ? `<button class="btn btn-outline btn-sm" id="copy-pix-btn"><i class="fas fa-copy"></i> Copiar</button>` : ''}
      </div>
    </div>
    <div id="payments-list">
      ${payments.length === 0
        ? '<div class="empty-state"><i class="fas fa-receipt"></i><p>Nenhum pagamento registrado ainda.</p></div>'
        : payments.map(pay => `
          <div class="card" style="border-left:3px solid var(--btn-color);margin-bottom:.6rem">
            <div class="flex items-center justify-between mb-1">
              <div class="font-bold">${pay.packageName}</div>
              ${statusBadge(pay.status)}
            </div>
            <div class="text-sm text-muted flex justify-between flex-wrap gap-1">
              <span>Sessões: ${pay.sessions}</span>
              <span>Base: ${money(pay.basePrice)}</span>
              ${pay.discount > 0 ? `<span style="color:var(--success)">Desc: -${money(pay.discount)}</span>` : ''}
              <span class="font-bold">Total: ${money(pay.finalPrice)}</span>
            </div>
            <div class="text-sm text-muted" style="margin-top:.3rem"><i class="fas fa-calendar"></i> ${formatDateShort(pay.date)}</div>
            ${pay.receipt ? `<a href="${pay.receipt}" download="comprovante" class="receipt-link" style="margin-top:.4rem"><i class="fas fa-paperclip"></i> Ver comprovante</a>` : ''}
            ${pay.status === 'pending' ? `
              <div class="mt-1" style="padding-top:.6rem;border-top:1px solid var(--border-color)">
                <p class="text-sm text-muted mb-1">Anexe o comprovante de pagamento:</p>
                <button class="btn btn-outline btn-sm" data-attach-receipt="${pay.id}"><i class="fas fa-paperclip"></i> Anexar Comprovante</button>
              </div>
            ` : ''}
          </div>
        `).join('')}
    </div>
  `);

  container.querySelector('#copy-pix-btn')?.addEventListener('click', () => {
    navigator.clipboard.writeText(settings.pixKey).then(() => toast('Chave PIX copiada!', 'success')).catch(() => toast('Não foi possível copiar', 'error'));
  });

  container.querySelectorAll('[data-attach-receipt]').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,.pdf';
      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        const data = await readFileAsBase64(file);
        Store.updatePayment(patientId, btn.dataset.attachReceipt, { receipt: data, receiptName: file.name });
        toast('Comprovante anexado com sucesso!', 'success');
        viewPatientPayments(container, patientId);
      };
      input.click();
    });
  });
}

// ============================================================
// PATIENT DOCUMENTS
// ============================================================
export function viewPatientDocuments(container, patientId) {
  const patient = Store.getPatient(patientId);
  if (!patient) { patientLayout(container, 'documents', '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Paciente não encontrado.</p></div>'); return; }
  const docs = Store.getDocuments(patientId);

  patientLayout(container, 'documents', `
    <div class="topbar">
      <h2><i class="fas fa-file-medical" style="color:var(--btn-color)"></i> Meus Documentos</h2>
    </div>
    <div class="card">
      <p class="text-muted text-sm mb-2">Aqui você encontra recibos e documentos enviados pela sua psicóloga.</p>
      ${docs.length === 0
        ? '<div class="empty-state"><i class="fas fa-folder-open"></i><p>Nenhum documento disponível.</p></div>'
        : docs.map(d => {
          const isImage = (d.fileType || '').startsWith('image/');
          return `
            <div class="flex items-center justify-between" style="padding:.85rem 0;border-bottom:1px solid var(--border-color)">
              <div class="flex items-center gap-1">
                <i class="fas ${isImage ? 'fa-image' : 'fa-file-alt'} text-muted" style="font-size:1.3rem"></i>
                <div>
                  <div class="font-bold text-sm">${d.name}</div>
                  <div class="text-sm text-muted">${formatDateShort(d.uploadDate)}</div>
                </div>
              </div>
              <button class="btn btn-primary btn-sm" data-doc-download="${d.id}">
                <i class="fas fa-download"></i> Baixar
              </button>
            </div>
          `;
        }).join('')}
    </div>
  `);

  container.querySelectorAll('[data-doc-download]').forEach(btn => {
    btn.addEventListener('click', () => {
      const doc = Store.getDocuments(patientId).find(d => d.id === btn.dataset.docDownload);
      if (doc) downloadBase64(doc.fileData, doc.name);
    });
  });
}
