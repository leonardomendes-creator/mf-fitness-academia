// ============================================================
// admin.js — Admin (Psicóloga) views: dashboard, patients, detail, finance, settings
// ============================================================
import Store from './store.js';
import {
  toast, showModal, closeModal, applyTheme,
  formatDate, formatDateShort, money, readFileAsBase64, downloadBase64,
  computePayment, originBadge, statusBadge, shade,
} from './ui.js';

// ---- Sidebar layout ----
export function adminLayout(container, activeKey, contentHtml) {
  const s = Store.getSettings();
  const navItems = [
    { key: 'dashboard', icon: 'fa-chart-pie', label: 'Dashboard', href: '#/admin' },
    { key: 'patients', icon: 'fa-users', label: 'Pacientes', href: '#/admin/patients' },
    { key: 'finance', icon: 'fa-wallet', label: 'Financeiro', href: '#/admin/finance' },
    { key: 'settings', icon: 'fa-palette', label: 'Aparência', href: '#/admin/settings' },
  ];
  container.innerHTML = `
    <div class="app-layout">
      <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <div class="logo">${s.logo ? `<img src="${s.logo}" alt="logo">` : `<i class="fas fa-spa"></i>`}</div>
          <div>
            <div class="name">${s.officeName}</div>
            <div class="role">Psicóloga (Admin)</div>
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
  // Mobile sidebar toggle
  const sidebar = container.querySelector('#sidebar');
  const backdrop = container.querySelector('#sidebar-backdrop');
  container.querySelector('#mobile-menu-btn')?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    backdrop.classList.toggle('show');
  });
  backdrop?.addEventListener('click', () => { sidebar.classList.remove('open'); backdrop.classList.remove('show'); });
  // Logout
  container.querySelector('#logout-btn').addEventListener('click', (e) => {
    e.preventDefault();
    Store.clearSession();
    toast('Sessão encerrada', 'info');
    location.hash = '#/login';
    window.dispatchEvent(new Event('hashchange'));
  });
}

// ============================================================
// DASHBOARD
// ============================================================
export function viewDashboard(container) {
  const patients = Store.getPatients();
  const settings = Store.getSettings();
  let totalPaid = 0, totalPending = 0, totalDiscount = 0;
  patients.forEach(p => {
    Store.getPayments(p.id).forEach(pay => {
      if (pay.status === 'paid') totalPaid += pay.finalPrice;
      else if (pay.status === 'pending') totalPending += pay.finalPrice;
      totalDiscount += pay.discount || 0;
    });
  });

  adminLayout(container, 'dashboard', `
    <div class="topbar">
      <h2><i class="fas fa-chart-pie" style="color:var(--btn-color)"></i> Dashboard</h2>
      <div class="actions">
        <a href="#/admin/patients" class="btn btn-primary btn-sm"><i class="fas fa-plus"></i> Novo Paciente</a>
      </div>
    </div>
    <div class="grid grid-4 mb-2">
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--btn-color)"><i class="fas fa-users"></i></div>
        <div><div class="stat-value">${patients.length}</div><div class="stat-label">Pacientes</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--success)"><i class="fas fa-check-circle"></i></div>
        <div><div class="stat-value">${money(totalPaid)}</div><div class="stat-label">Recebido</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--warning)"><i class="fas fa-clock"></i></div>
        <div><div class="stat-value">${money(totalPending)}</div><div class="stat-label">Pendente</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--info)"><i class="fas fa-tag"></i></div>
        <div><div class="stat-value">${money(totalDiscount)}</div><div class="stat-label">Descontos Leve Saúde</div></div>
      </div>
    </div>
    <div class="grid grid-2">
      <div class="card">
        <div class="card-title">Pacientes Recentes</div>
        ${patients.length === 0 ? '<div class="empty-state"><i class="fas fa-user-slash"></i><p>Nenhum paciente cadastrado.</p></div>' :
          patients.slice(0, 5).map(p => `
            <a href="#/admin/patient/${p.id}" class="patient-row" style="margin-bottom:.5rem">
              <div class="patient-avatar">${p.fullName.charAt(0).toUpperCase()}</div>
              <div class="patient-info">
                <div class="patient-name">${p.fullName}</div>
                <div class="patient-meta"><span>${p.age} anos</span>${originBadge(p.origin)}</div>
              </div>
              <i class="fas fa-chevron-right text-muted"></i>
            </a>
          `).join('')}
      </div>
      <div class="card">
        <div class="card-title">Pagamentos Recentes</div>
        ${(() => {
          let all = [];
          patients.forEach(p => Store.getPayments(p.id).forEach(pay => all.push({ ...pay, patient: p })));
          all.sort((a, b) => new Date(b.date) - new Date(a.date));
          if (all.length === 0) return '<div class="empty-state"><i class="fas fa-receipt"></i><p>Nenhum pagamento registrado.</p></div>';
          return all.slice(0, 5).map(pay => `
            <div class="flex items-center justify-between" style="padding:.6rem 0;border-bottom:1px solid var(--border-color)">
              <div>
                <div class="font-bold text-sm">${pay.patient.fullName}</div>
                <div class="text-muted text-sm">${pay.packageName}</div>
              </div>
              <div class="text-right">
                <div class="font-bold text-sm">${money(pay.finalPrice)}</div>
                ${statusBadge(pay.status)}
              </div>
            </div>
          `).join('');
        })()}
      </div>
    </div>
  `);
}

// ============================================================
// PATIENT LIST
// ============================================================
export function viewPatients(container) {
  const patients = Store.getPatients();
  adminLayout(container, 'patients', `
    <div class="topbar">
      <h2><i class="fas fa-users" style="color:var(--btn-color)"></i> Pacientes</h2>
      <div class="actions">
        <button class="btn btn-primary btn-sm" id="add-patient-btn"><i class="fas fa-plus"></i> Novo Paciente</button>
      </div>
    </div>
    <div class="field" style="max-width:400px">
      <input type="text" class="input" id="patient-search" placeholder="Buscar por nome, telefone ou e-mail...">
    </div>
    <div id="patient-list">
      ${patients.length === 0
        ? '<div class="empty-state"><i class="fas fa-user-plus"></i><p>Nenhum paciente cadastrado ainda. Clique em "Novo Paciente".</p></div>'
        : patients.map(p => `
          <a href="#/admin/patient/${p.id}" class="patient-row" style="margin-bottom:.6rem">
            <div class="patient-avatar">${p.fullName.charAt(0).toUpperCase()}</div>
            <div class="patient-info">
              <div class="patient-name">${p.fullName}</div>
              <div class="patient-meta"><span><i class="fas fa-phone text-sm"></i> ${p.phone}</span><span>${p.age} anos</span>${originBadge(p.origin)}</div>
            </div>
            <i class="fas fa-chevron-right text-muted"></i>
          </a>
        `).join('')}
    </div>
  `);

  // Search
  container.querySelector('#patient-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = patients.filter(p =>
      p.fullName.toLowerCase().includes(q) || (p.phone || '').includes(q) || (p.email || '').toLowerCase().includes(q)
    );
    const listEl = container.querySelector('#patient-list');
    if (filtered.length === 0) {
      listEl.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><p>Nenhum resultado encontrado.</p></div>';
    } else {
      listEl.innerHTML = filtered.map(p => `
        <a href="#/admin/patient/${p.id}" class="patient-row" style="margin-bottom:.6rem">
          <div class="patient-avatar">${p.fullName.charAt(0).toUpperCase()}</div>
          <div class="patient-info">
            <div class="patient-name">${p.fullName}</div>
            <div class="patient-meta"><span><i class="fas fa-phone text-sm"></i> ${p.phone}</span><span>${p.age} anos</span>${originBadge(p.origin)}</div>
          </div>
          <i class="fas fa-chevron-right text-muted"></i>
        </a>
      `).join('');
    }
  });

  // Add patient
  container.querySelector('#add-patient-btn').addEventListener('click', () => showAddPatientModal(container));
}

function showAddPatientModal(container) {
  showModal(`
    <div class="modal-header">
      <h3><i class="fas fa-user-plus" style="color:var(--btn-color)"></i> Cadastrar Paciente</h3>
      <button class="btn-icon" onclick="document.getElementById('modal-overlay').style.display='none'"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body">
      <div class="field">
        <label>Nome Completo *</label>
        <input type="text" class="input" id="np-name" placeholder="Nome do paciente">
      </div>
      <div class="grid grid-2">
        <div class="field">
          <label>Idade</label>
          <input type="number" class="input" id="np-age" min="0" max="120" placeholder="Ex: 30">
        </div>
        <div class="field">
          <label>Telefone</label>
          <input type="text" class="input" id="np-phone" placeholder="(00) 00000-0000">
        </div>
      </div>
      <div class="field">
        <label>E-mail</label>
        <input type="email" class="input" id="np-email" placeholder="email@exemplo.com">
      </div>
      <div class="field">
        <label>Origem *</label>
        <select class="select" id="np-origin">
          <option value="particular">Particular</option>
          <option value="leve_saude">Convênio Leve Saúde</option>
        </select>
      </div>
      <div class="field">
        <label>Senha do Paciente</label>
        <input type="text" class="input" id="np-pass" value="123456" placeholder="Senha de acesso do paciente">
        <p class="hint">Senha que o paciente usará para entrar no sistema.</p>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" id="cancel-patient">Cancelar</button>
      <button class="btn btn-primary" id="save-patient"><i class="fas fa-check"></i> Cadastrar</button>
    </div>
  `);

  document.getElementById('cancel-patient').addEventListener('click', closeModal);
  document.getElementById('save-patient').addEventListener('click', () => {
    const name = document.getElementById('np-name').value.trim();
    if (!name) { toast('Informe o nome completo', 'error'); return; }
    const data = {
      fullName: name,
      age: parseInt(document.getElementById('np-age').value) || 0,
      phone: document.getElementById('np-phone').value.trim(),
      email: document.getElementById('np-email').value.trim(),
      origin: document.getElementById('np-origin').value,
      patientPassword: document.getElementById('np-pass').value.trim() || '123456',
    };
    Store.addPatient(data);
    closeModal();
    toast('Paciente cadastrado com sucesso!', 'success');
    viewPatients(container);
  });
}

// ============================================================
// PATIENT DETAIL (profile + notes + financial + documents)
// ============================================================
export function viewPatientDetail(container, patientId) {
  const patient = Store.getPatient(patientId);
  if (!patient) {
    adminLayout(container, 'patients', '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Paciente não encontrado.</p></div>');
    return;
  }
  const notes = Store.getNotes(patientId);
  const payments = Store.getPayments(patientId);
  const docs = Store.getDocuments(patientId);
  const settings = Store.getSettings();

  adminLayout(container, 'patients', `
    <div class="topbar">
      <div class="flex items-center gap-1">
        <a href="#/admin/patients" class="btn-icon"><i class="fas fa-arrow-left"></i></a>
        <h2><i class="fas fa-user-circle" style="color:var(--btn-color)"></i> ${patient.fullName}</h2>
      </div>
      <div class="actions">
        <button class="btn btn-outline btn-sm" id="edit-patient-btn"><i class="fas fa-edit"></i> Editar</button>
        <button class="btn btn-danger btn-sm" id="delete-patient-btn"><i class="fas fa-trash"></i> Excluir</button>
      </div>
    </div>

    <!-- Patient info -->
    <div class="card mb-2">
      <div class="flex items-center gap-2 flex-wrap">
        <div class="patient-avatar" style="width:56px;height:56px;font-size:1.4rem">${patient.fullName.charAt(0).toUpperCase()}</div>
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
      <!-- Evolution notes block (psychologist only) -->
      <div class="card">
        <div class="flex items-center justify-between mb-2">
          <div class="card-title" style="margin:0"><i class="fas fa-notes-medical" style="color:var(--btn-color)"></i> Bloco de Notas de Evolução</div>
        </div>
        <div class="field">
          <textarea class="textarea" id="note-text" placeholder="Escreva uma anotação sobre o desenvolvimento clínico..."></textarea>
        </div>
        <button class="btn btn-primary btn-sm mb-2" id="add-note-btn"><i class="fas fa-plus"></i> Adicionar Nota</button>
        <div id="notes-list">
          ${notes.length === 0
            ? '<div class="empty-state"><i class="fas fa-clipboard"></i><p>Nenhuma anotação ainda.</p></div>'
            : notes.slice().reverse().map(n => `
              <div class="note-item">
                <div class="note-date">
                  <span><i class="fas fa-calendar"></i> ${formatDate(n.date)}</span>
                  <button class="btn-icon btn-sm" data-note-del="${n.id}"><i class="fas fa-trash text-sm" style="color:var(--danger)"></i></button>
                </div>
                <div class="note-text">${escapeHtml(n.text)}</div>
              </div>
            `).join('')}
        </div>
      </div>

      <!-- Financial control -->
      <div class="card">
        <div class="card-title"><i class="fas fa-wallet" style="color:var(--btn-color)"></i> Controle Financeiro</div>
        <div class="flex items-center justify-between mb-2" style="padding:.6rem;background:color-mix(in srgb,var(--btn-color) 5%,transparent);border-radius:.5rem">
          <div class="text-sm"><strong>Chave PIX:</strong> ${settings.pixKey || '<span class="text-muted">Não configurada</span>'}</div>
        </div>
        <button class="btn btn-primary btn-sm btn-block mb-2" id="add-payment-btn"><i class="fas fa-plus"></i> Registrar Pacote / Pagamento</button>
        <div id="payments-list">
          ${payments.length === 0
            ? '<div class="empty-state"><i class="fas fa-receipt"></i><p>Nenhum pagamento registrado.</p></div>'
            : payments.slice().reverse().map(pay => `
              <div class="card" style="border-left:3px solid var(--btn-color);margin-bottom:.6rem;padding:.85rem">
                <div class="flex items-center justify-between mb-1">
                  <div class="font-bold text-sm">${pay.packageName}</div>
                  ${statusBadge(pay.status)}
                </div>
                <div class="text-sm text-muted flex justify-between flex-wrap gap-1">
                  <span>Sessões: ${pay.sessions}</span>
                  <span>Base: ${money(pay.basePrice)}</span>
                  ${pay.discount > 0 ? `<span style="color:var(--success)">Desc: -${money(pay.discount)}</span>` : ''}
                  <span class="font-bold">Total: ${money(pay.finalPrice)}</span>
                </div>
                <div class="text-sm text-muted" style="margin-top:.3rem">${formatDateShort(pay.date)}</div>
                ${pay.receipt ? `<a href="${pay.receipt}" download="comprovante" class="receipt-link mt-1" style="display:inline-flex"><i class="fas fa-paperclip"></i> Comprovante</a>` : ''}
                <div class="flex gap-1 mt-1">
                  ${pay.status === 'pending' ? `<button class="btn btn-success btn-sm" data-pay-mark="${pay.id}"><i class="fas fa-check"></i> Marcar Pago</button>` : ''}
                  <button class="btn btn-outline btn-sm" data-pay-receipt="${pay.id}"><i class="fas fa-paperclip"></i> Anexar Comprovante</button>
                  <button class="btn btn-danger btn-sm" data-pay-del="${pay.id}"><i class="fas fa-trash"></i></button>
                </div>
              </div>
            `).join('')}
        </div>
      </div>

      <!-- Documents -->
      <div class="card">
        <div class="card-title"><i class="fas fa-file-medical" style="color:var(--btn-color)"></i> Documentos e Recibos</div>
        <button class="btn btn-primary btn-sm btn-block mb-2" id="upload-doc-btn"><i class="fas fa-upload"></i> Enviar Documento</button>
        <div id="docs-list">
          ${docs.length === 0
            ? '<div class="empty-state"><i class="fas fa-folder-open"></i><p>Nenhum documento enviado.</p></div>'
            : docs.map(d => `
              <div class="flex items-center justify-between" style="padding:.6rem 0;border-bottom:1px solid var(--border-color)">
                <div class="flex items-center gap-1">
                  <i class="fas fa-file-alt text-muted"></i>
                  <div>
                    <div class="text-sm font-bold">${d.name}</div>
                    <div class="text-sm text-muted">${formatDateShort(d.uploadDate)}</div>
                  </div>
                </div>
                <div class="flex gap-1">
                  <button class="btn-icon btn-sm" data-doc-download="${d.id}"><i class="fas fa-download"></i></button>
                  <button class="btn-icon btn-sm" data-doc-del="${d.id}"><i class="fas fa-trash" style="color:var(--danger)"></i></button>
                </div>
              </div>
            `).join('')}
        </div>
      </div>
    </div>
  `);

  // ---- Event wiring ----
  // Edit patient
  container.querySelector('#edit-patient-btn').addEventListener('click', () => showEditPatientModal(container, patient));
  // Delete patient
  container.querySelector('#delete-patient-btn').addEventListener('click', () => {
    if (confirm(`Excluir o paciente "${patient.fullName}" e todos os dados associados?`)) {
      Store.deletePatient(patientId);
      toast('Paciente excluído', 'info');
      location.hash = '#/admin/patients';
      window.dispatchEvent(new Event('hashchange'));
    }
  });
  // Add note
  container.querySelector('#add-note-btn').addEventListener('click', () => {
    const text = container.querySelector('#note-text').value.trim();
    if (!text) { toast('Escreva algo na nota', 'error'); return; }
    Store.addNote(patientId, text);
    toast('Nota adicionada', 'success');
    viewPatientDetail(container, patientId);
  });
  // Delete note
  container.querySelectorAll('[data-note-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      Store.deleteNote(patientId, btn.dataset.noteDel);
      toast('Nota removida', 'info');
      viewPatientDetail(container, patientId);
    });
  });
  // Add payment
  container.querySelector('#add-payment-btn').addEventListener('click', () => showAddPaymentModal(container, patientId));
  // Mark paid
  container.querySelectorAll('[data-pay-mark]').forEach(btn => {
    btn.addEventListener('click', () => {
      Store.updatePayment(patientId, btn.dataset.payMark, { status: 'paid' });
      toast('Pagamento marcado como pago!', 'success');
      viewPatientDetail(container, patientId);
    });
  });
  // Attach receipt
  container.querySelectorAll('[data-pay-receipt]').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,.pdf';
      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        const data = await readFileAsBase64(file);
        Store.updatePayment(patientId, btn.dataset.payReceipt, { receipt: data, receiptName: file.name });
        toast('Comprovante anexado!', 'success');
        viewPatientDetail(container, patientId);
      };
      input.click();
    });
  });
  // Delete payment
  container.querySelectorAll('[data-pay-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      Store.deletePayment(patientId, btn.dataset.payDel);
      toast('Pagamento removido', 'info');
      viewPatientDetail(container, patientId);
    });
  });
  // Upload document
  container.querySelector('#upload-doc-btn').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      const data = await readFileAsBase64(file);
      Store.addDocument(patientId, { name: file.name, data, type: file.type });
      toast('Documento enviado!', 'success');
      viewPatientDetail(container, patientId);
    };
    input.click();
  });
  // Download document
  container.querySelectorAll('[data-doc-download]').forEach(btn => {
    btn.addEventListener('click', () => {
      const doc = Store.getDocuments(patientId).find(d => d.id === btn.dataset.docDownload);
      if (doc) downloadBase64(doc.fileData, doc.name);
    });
  });
  // Delete document
  container.querySelectorAll('[data-doc-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      Store.deleteDocument(patientId, btn.dataset.docDel);
      toast('Documento removido', 'info');
      viewPatientDetail(container, patientId);
    });
  });
}

function showEditPatientModal(container, patient) {
  showModal(`
    <div class="modal-header">
      <h3><i class="fas fa-edit" style="color:var(--btn-color)"></i> Editar Paciente</h3>
      <button class="btn-icon" onclick="document.getElementById('modal-overlay').style.display='none'"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body">
      <div class="field"><label>Nome Completo *</label><input type="text" class="input" id="ep-name" value="${escapeAttr(patient.fullName)}"></div>
      <div class="grid grid-2">
        <div class="field"><label>Idade</label><input type="number" class="input" id="ep-age" value="${patient.age}" min="0" max="120"></div>
        <div class="field"><label>Telefone</label><input type="text" class="input" id="ep-phone" value="${escapeAttr(patient.phone || '')}"></div>
      </div>
      <div class="field"><label>E-mail</label><input type="email" class="input" id="ep-email" value="${escapeAttr(patient.email || '')}"></div>
      <div class="field">
        <label>Origem *</label>
        <select class="select" id="ep-origin">
          <option value="particular" ${patient.origin === 'particular' ? 'selected' : ''}>Particular</option>
          <option value="leve_saude" ${patient.origin === 'leve_saude' ? 'selected' : ''}>Convênio Leve Saúde</option>
        </select>
      </div>
      <div class="field"><label>Senha do Paciente</label><input type="text" class="input" id="ep-pass" value="${escapeAttr(patient.patientPassword || '123456')}"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" id="cancel-edit">Cancelar</button>
      <button class="btn btn-primary" id="save-edit"><i class="fas fa-check"></i> Salvar</button>
    </div>
  `);
  document.getElementById('cancel-edit').addEventListener('click', closeModal);
  document.getElementById('save-edit').addEventListener('click', () => {
    const name = document.getElementById('ep-name').value.trim();
    if (!name) { toast('Informe o nome', 'error'); return; }
    Store.updatePatient(patient.id, {
      fullName: name,
      age: parseInt(document.getElementById('ep-age').value) || 0,
      phone: document.getElementById('ep-phone').value.trim(),
      email: document.getElementById('ep-email').value.trim(),
      origin: document.getElementById('ep-origin').value,
      patientPassword: document.getElementById('ep-pass').value.trim() || '123456',
    });
    closeModal();
    toast('Dados atualizados!', 'success');
    viewPatientDetail(container, patient.id);
  });
}

function showAddPaymentModal(container, patientId) {
  const patient = Store.getPatient(patientId);
  const settings = Store.getSettings();
  const pkgs = settings.packages;

  showModal(`
    <div class="modal-header">
      <h3><i class="fas fa-wallet" style="color:var(--btn-color)"></i> Registrar Pacote</h3>
      <button class="btn-icon" onclick="document.getElementById('modal-overlay').style.display='none'"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body">
      <div class="flex items-center gap-1 mb-2" style="padding:.6rem;background:color-mix(in srgb,var(--btn-color) 5%,transparent);border-radius:.5rem">
        <div class="patient-avatar" style="width:36px;height:36px;font-size:.9rem">${patient.fullName.charAt(0).toUpperCase()}</div>
        <div>
          <div class="font-bold text-sm">${patient.fullName}</div>
          ${originBadge(patient.origin)}
        </div>
      </div>
      <div class="field">
        <label>Selecione o Pacote</label>
        <select class="select" id="pay-pkg">
          ${pkgs.map(p => `<option value="${p.id}">${p.name} — ${money(p.price)}</option>`).join('')}
        </select>
      </div>
      <div id="pay-custom-fields" class="hidden">
        <div class="grid grid-2">
          <div class="field"><label>Nº de Sessões</label><input type="number" class="input" id="pay-sessions" value="1" min="1"></div>
          <div class="field"><label>Valor (R$)</label><input type="number" class="input" id="pay-price" value="100" min="0" step="0.01"></div>
        </div>
      </div>
      <div id="pay-summary"></div>
      <div class="field">
        <label>Status</label>
        <select class="select" id="pay-status">
          <option value="pending">Pendente</option>
          <option value="paid">Pago</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" id="cancel-pay">Cancelar</button>
      <button class="btn btn-primary" id="save-pay"><i class="fas fa-check"></i> Registrar</button>
    </div>
  `);

  function updateSummary() {
    const pkgId = document.getElementById('pay-pkg').value;
    const pkg = pkgs.find(p => p.id === pkgId);
    let sessions, basePrice;
    if (pkg.id === 'pkg4') {
      document.getElementById('pay-custom-fields').classList.remove('hidden');
      sessions = parseInt(document.getElementById('pay-sessions').value) || 1;
      basePrice = parseFloat(document.getElementById('pay-price').value) || 0;
    } else {
      document.getElementById('pay-custom-fields').classList.add('hidden');
      sessions = pkg.sessions;
      basePrice = pkg.price;
    }
    const calc = computePayment({ price: basePrice }, patient, settings);
    document.getElementById('pay-summary').innerHTML = `
      <div class="card" style="background:color-mix(in srgb,var(--btn-color) 5%,transparent)">
        <div class="flex justify-between text-sm mb-1"><span>Valor base:</span><span>${money(calc.basePrice)}</span></div>
        ${calc.discount > 0 ? `<div class="flex justify-between text-sm mb-1" style="color:var(--success)"><span>Desconto Leve Saúde (${settings.leveSaudeDiscount}%):</span><span>-${money(calc.discount)}</span></div>` : ''}
        <div class="flex justify-between font-bold"><span>Total:</span><span>${money(calc.finalPrice)}</span></div>
      </div>
    `;
  }

  document.getElementById('pay-pkg').addEventListener('change', updateSummary);
  document.getElementById('pay-sessions').addEventListener('input', updateSummary);
  document.getElementById('pay-price').addEventListener('input', updateSummary);
  updateSummary();

  document.getElementById('cancel-pay').addEventListener('click', closeModal);
  document.getElementById('save-pay').addEventListener('click', () => {
    const pkgId = document.getElementById('pay-pkg').value;
    const pkg = pkgs.find(p => p.id === pkgId);
    let sessions, basePrice, packageName;
    if (pkg.id === 'pkg4') {
      sessions = parseInt(document.getElementById('pay-sessions').value) || 1;
      basePrice = parseFloat(document.getElementById('pay-price').value) || 0;
      packageName = `Personalizado (${sessions} sessão${sessions > 1 ? 'ões' : 'ão'})`;
    } else {
      sessions = pkg.sessions;
      basePrice = pkg.price;
      packageName = pkg.name;
    }
    const calc = computePayment({ price: basePrice }, patient, settings);
    Store.addPayment(patientId, {
      packageId: pkgId,
      packageName,
      sessions,
      basePrice: calc.basePrice,
      discount: calc.discount,
      finalPrice: calc.finalPrice,
      status: document.getElementById('pay-status').value,
    });
    closeModal();
    toast('Pagamento registrado!', 'success');
    viewPatientDetail(container, patientId);
  });
}

// ============================================================
// FINANCE VIEW
// ============================================================
export function viewFinance(container) {
  const settings = Store.getSettings();
  const patients = Store.getPatients();
  let allPayments = [];
  patients.forEach(p => Store.getPayments(p.id).forEach(pay => allPayments.push({ ...pay, patient: p })));
  allPayments.sort((a, b) => new Date(b.date) - new Date(a.date));

  adminLayout(container, 'finance', `
    <div class="topbar">
      <h2><i class="fas fa-wallet" style="color:var(--btn-color)"></i> Financeiro</h2>
      <div class="actions">
        <button class="btn btn-outline btn-sm" id="edit-packages-btn"><i class="fas fa-box"></i> Pacotes</button>
        <button class="btn btn-outline btn-sm" id="edit-discount-btn"><i class="fas fa-percent"></i> Desconto Leve Saúde</button>
      </div>
    </div>

    <div class="grid grid-3 mb-2">
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--success)"><i class="fas fa-check-circle"></i></div>
        <div><div class="stat-value">${money(allPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.finalPrice, 0))}</div><div class="stat-label">Total Recebido</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--warning)"><i class="fas fa-clock"></i></div>
        <div><div class="stat-value">${money(allPayments.filter(p => p.status === 'pending').reduce((s, p) => s + p.finalPrice, 0))}</div><div class="stat-label">Pendente</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:var(--info)"><i class="fas fa-percent"></i></div>
        <div><div class="stat-value">${settings.leveSaudeDiscount}%</div><div class="stat-label">Desconto Leve Saúde</div></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Todos os Pagamentos</div>
      ${allPayments.length === 0
        ? '<div class="empty-state"><i class="fas fa-receipt"></i><p>Nenhum pagamento registrado.</p></div>'
        : `<div class="table-wrap"><table>
          <thead><tr><th>Paciente</th><th>Pacote</th><th>Base</th><th>Desc.</th><th>Total</th><th>Status</th><th>Data</th></tr></thead>
          <tbody>
            ${allPayments.map(pay => `
              <tr>
                <td class="font-bold">${pay.patient.fullName}</td>
                <td>${pay.packageName}</td>
                <td>${money(pay.basePrice)}</td>
                <td style="color:var(--success)">${pay.discount > 0 ? '-' + money(pay.discount) : '—'}</td>
                <td class="font-bold">${money(pay.finalPrice)}</td>
                <td>${statusBadge(pay.status)}</td>
                <td class="text-sm text-muted">${formatDateShort(pay.date)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table></div>`}
    </div>

    <div class="card mt-2">
      <div class="card-title">Configuração de Pacotes</div>
      <div class="grid grid-4">
        ${settings.packages.map(p => `
          <div class="card" style="border:1px solid var(--border-color)">
            <div class="font-bold text-sm">${p.name}</div>
            <div class="text-lg font-bold" style="color:var(--btn-color)">${money(p.price)}</div>
            <div class="text-sm text-muted">${p.sessions} sessão${p.sessions > 1 ? 'ões' : 'ão'}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `);

  // Edit packages
  container.querySelector('#edit-packages-btn').addEventListener('click', () => showPackagesModal(container));
  // Edit discount
  container.querySelector('#edit-discount-btn').addEventListener('click', () => showDiscountModal(container));
}

function showPackagesModal(container) {
  const settings = Store.getSettings();
  showModal(`
    <div class="modal-header">
      <h3><i class="fas fa-box" style="color:var(--btn-color)"></i> Editar Pacotes</h3>
      <button class="btn-icon" onclick="document.getElementById('modal-overlay').style.display='none'"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body">
      ${settings.packages.map((p, i) => `
        <div class="card" style="border:1px solid var(--border-color);margin-bottom:.6rem">
          <div class="font-bold text-sm mb-1">${p.name}</div>
          <div class="grid grid-2">
            <div class="field" style="margin:0">
              <label>Sessões</label>
              <input type="number" class="input pkg-sessions" data-idx="${i}" value="${p.sessions}" min="1" ${p.id !== 'pkg4' ? 'readonly' : ''}>
            </div>
            <div class="field" style="margin:0">
              <label>Valor (R$)</label>
              <input type="number" class="input pkg-price" data-idx="${i}" value="${p.price}" min="0" step="0.01">
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" id="cancel-pkg">Cancelar</button>
      <button class="btn btn-primary" id="save-pkg"><i class="fas fa-check"></i> Salvar</button>
    </div>
  `);
  document.getElementById('cancel-pkg').addEventListener('click', closeModal);
  document.getElementById('save-pkg').addEventListener('click', () => {
    const pkgs = [...settings.packages];
    document.querySelectorAll('.pkg-sessions').forEach(inp => { pkgs[inp.dataset.idx].sessions = parseInt(inp.value) || 1; });
    document.querySelectorAll('.pkg-price').forEach(inp => { pkgs[inp.dataset.idx].price = parseFloat(inp.value) || 0; });
    Store.saveSettings({ ...settings, packages: pkgs });
    closeModal();
    toast('Pacotes atualizados!', 'success');
    viewFinance(container);
  });
}

function showDiscountModal(container) {
  const settings = Store.getSettings();
  showModal(`
    <div class="modal-header">
      <h3><i class="fas fa-percent" style="color:var(--btn-color)"></i> Desconto Leve Saúde</h3>
      <button class="btn-icon" onclick="document.getElementById('modal-overlay').style.display='none'"><i class="fas fa-times"></i></button>
    </div>
    <div class="modal-body">
      <div class="field">
        <label>Porcentagem de desconto para pacientes Leve Saúde (%)</label>
        <input type="number" class="input" id="discount-val" value="${settings.leveSaudeDiscount}" min="0" max="100" step="1">
        <p class="hint">Este desconto será aplicado automaticamente quando o paciente tiver origem "Leve Saúde".</p>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" id="cancel-disc">Cancelar</button>
      <button class="btn btn-primary" id="save-disc"><i class="fas fa-check"></i> Salvar</button>
    </div>
  `);
  document.getElementById('cancel-disc').addEventListener('click', closeModal);
  document.getElementById('save-disc').addEventListener('click', () => {
    const val = parseInt(document.getElementById('discount-val').value) || 0;
    Store.saveSettings({ ...settings, leveSaudeDiscount: val });
    closeModal();
    toast('Desconto atualizado!', 'success');
    viewFinance(container);
  });
}

// ============================================================
// SETTINGS (White-label appearance)
// ============================================================
export function viewSettings(container) {
  const s = Store.getSettings();
  const fontNames = Object.keys(Store.FONTS);

  adminLayout(container, 'settings', `
    <div class="topbar">
      <h2><i class="fas fa-palette" style="color:var(--btn-color)"></i> Configurações de Aparência</h2>
      <button class="btn btn-primary btn-sm" id="save-settings-btn"><i class="fas fa-save"></i> Salvar Alterações</button>
    </div>
    <div class="grid grid-2">
      <!-- Office name & psicóloga -->
      <div class="card">
        <div class="card-title"><i class="fas fa-id-card" style="color:var(--btn-color)"></i> Identificação</div>
        <div class="field">
          <label>Nome do Consultório</label>
          <input type="text" class="input" id="set-office" value="${escapeAttr(s.officeName)}">
        </div>
        <div class="field">
          <label>Nome da Psicóloga</label>
          <input type="text" class="input" id="set-psico-name" value="${escapeAttr(s.psicoName)}">
        </div>
        <div class="field">
          <label>Senha de Acesso (Psicóloga)</label>
          <input type="text" class="input" id="set-psico-pass" value="${escapeAttr(s.psicoPassword)}">
        </div>
      </div>

      <!-- Logo -->
      <div class="card">
        <div class="card-title"><i class="fas fa-image" style="color:var(--btn-color)"></i> Logotipo / Foto de Perfil</div>
        <div class="flex items-center gap-2 mb-2">
          <div class="logo-preview" style="width:64px;height:64px;border-radius:.6rem;background:var(--btn-color);display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.5rem;overflow:hidden">
            ${s.logo ? `<img src="${s.logo}" style="width:100%;height:100%;object-fit:cover">` : `<i class="fas fa-spa"></i>`}
          </div>
          <div class="flex gap-1">
            <button class="btn btn-outline btn-sm" id="logo-upload-btn"><i class="fas fa-upload"></i> Carregar</button>
            ${s.logo ? '<button class="btn btn-danger btn-sm" id="logo-remove-btn"><i class="fas fa-trash"></i> Remover</button>' : ''}
          </div>
        </div>
        <input type="file" id="logo-input" accept="image/*" class="hidden">
      </div>

      <!-- Background -->
      <div class="card">
        <div class="card-title"><i class="fas fa-fill-drip" style="color:var(--btn-color)"></i> Fundo</div>
        <div class="field">
          <label>Cor de Fundo</label>
          <div class="flex items-center gap-1">
            <input type="color" class="color-preview" id="set-bg-color" value="${s.bgColor}">
            <input type="text" class="input" id="set-bg-color-text" value="${s.bgColor}" style="flex:1">
          </div>
        </div>
        <div class="field">
          <label>Imagem de Fundo (opcional)</label>
          <div class="flex items-center gap-1">
            <button class="btn btn-outline btn-sm" id="bg-upload-btn"><i class="fas fa-upload"></i> Carregar imagem</button>
            ${s.bgImage ? '<button class="btn btn-danger btn-sm" id="bg-remove-btn"><i class="fas fa-trash"></i> Remover</button>' : ''}
          </div>
          <input type="file" id="bg-input" accept="image/*" class="hidden">
        </div>
      </div>

      <!-- Button color & font -->
      <div class="card">
        <div class="card-title"><i class="fas fa-paint-brush" style="color:var(--btn-color)"></i> Cores e Tipografia</div>
        <div class="field">
          <label>Cor Principal dos Botões</label>
          <div class="flex items-center gap-1">
            <input type="color" class="color-preview" id="set-btn-color" value="${s.btnColor}">
            <input type="text" class="input" id="set-btn-color-text" value="${s.btnColor}" style="flex:1">
          </div>
          <div class="mt-1">
            <button class="btn btn-primary btn-sm" id="preview-btn-color">Botão de Exemplo</button>
          </div>
        </div>
        <div class="field">
          <label>Fonte Tipográfica</label>
          <div class="grid grid-2">
            ${fontNames.map(f => `
              <div class="font-option ${s.font === f ? 'selected' : ''}" data-font="${f}" style="font-family:${Store.FONTS[f]}">
                <div style="font-size:1.1rem">${f}</div>
                <div class="font-name">Aa Bb Cc 123</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- PIX key -->
      <div class="card">
        <div class="card-title"><i class="fas fa-key" style="color:var(--btn-color)"></i> Chave PIX</div>
        <div class="field">
          <label>Chave PIX (mostrada aos pacientes)</label>
          <input type="text" class="input" id="set-pix" value="${escapeAttr(s.pixKey)}" placeholder="Ex: email@dominio.com, telefone, CPF...">
          <p class="hint">Esta chave será exibida para os pacientes na área de pagamentos.</p>
        </div>
      </div>
    </div>
  `);

  let pendingLogo = s.logo;
  let pendingBg = s.bgImage;
  let selectedFont = s.font;

  // Logo upload
  container.querySelector('#logo-upload-btn').addEventListener('click', () => container.querySelector('#logo-input').click());
  container.querySelector('#logo-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    pendingLogo = await readFileAsBase64(file);
    const preview = container.querySelector('.logo-preview');
    preview.innerHTML = `<img src="${pendingLogo}" style="width:100%;height:100%;object-fit:cover">`;
    toast('Logotipo carregado', 'info');
  });
  container.querySelector('#logo-remove-btn')?.addEventListener('click', () => {
    pendingLogo = null;
    container.querySelector('.logo-preview').innerHTML = '<i class="fas fa-spa"></i>';
    toast('Logotipo removido', 'info');
  });

  // Background upload
  container.querySelector('#bg-upload-btn').addEventListener('click', () => container.querySelector('#bg-input').click());
  container.querySelector('#bg-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    pendingBg = await readFileAsBase64(file);
    toast('Imagem de fundo carregada', 'info');
  });
  container.querySelector('#bg-remove-btn')?.addEventListener('click', () => {
    pendingBg = null;
    toast('Imagem de fundo removida', 'info');
  });

  // Color inputs sync
  function syncColor(colorId, textId) {
    const colorEl = container.querySelector(colorId);
    const textEl = container.querySelector(textId);
    colorEl.addEventListener('input', () => { textEl.value = colorEl.value; });
    textEl.addEventListener('input', () => { if (/^#[0-9A-Fa-f]{6}$/.test(textEl.value)) colorEl.value = textEl.value; });
  }
  syncColor('#set-bg-color', '#set-bg-color-text');
  syncColor('#set-btn-color', '#set-btn-color-text');

  // Font selection
  container.querySelectorAll('.font-option').forEach(opt => {
    opt.addEventListener('click', () => {
      container.querySelectorAll('.font-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedFont = opt.dataset.font;
    });
  });

  // Save settings
  container.querySelector('#save-settings-btn').addEventListener('click', () => {
    const settings = Store.getSettings();
    Store.saveSettings({
      ...settings,
      officeName: container.querySelector('#set-office').value.trim() || 'Consultório de Psicologia',
      psicoName: container.querySelector('#set-psico-name').value.trim() || 'Psicóloga',
      psicoPassword: container.querySelector('#set-psico-pass').value.trim() || 'admin123',
      logo: pendingLogo,
      bgImage: pendingBg,
      bgColor: container.querySelector('#set-bg-color-text').value || '#F0F4F8',
      btnColor: container.querySelector('#set-btn-color-text').value || '#6366F1',
      btnColorHover: shade(container.querySelector('#set-btn-color-text').value || '#6366F1', -15),
      font: selectedFont,
      pixKey: container.querySelector('#set-pix').value.trim(),
    });
    applyTheme();
    toast('Aparência salva com sucesso!', 'success');
    viewSettings(container);
  });
}

// ---- HTML escaping helpers ----
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}
function escapeAttr(str) {
  return (str || '').replace(/"/g, '"').replace(/</g, '<').replace(/>/g, '>');
}
