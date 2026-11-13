// ============================================================
// store.js — Data layer using localStorage
// ============================================================

const PREFIX = 'psico_';

function get(key, defaultValue) {
  try {
    const val = localStorage.getItem(PREFIX + key);
    return val ? JSON.parse(val) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function set(key, value) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const DEFAULT_SETTINGS = {
  officeName: 'Consultório de Psicologia',
  logo: null,
  bgImage: null,
  bgColor: '#F0F4F8',
  btnColor: '#6366F1',
  btnColorHover: '#4F46E5',
  font: 'Poppins',
  pixKey: '',
  psicoName: 'Dra. Exemplo',
  psicoPassword: 'admin123',
  leveSaudeDiscount: 10,
  packages: [
    { id: 'pkg1', name: 'Avulso / 1 sessão', sessions: 1, price: 150 },
    { id: 'pkg2', name: '2 sessões', sessions: 2, price: 280 },
    { id: 'pkg3', name: '4 sessões', sessions: 4, price: 520 },
    { id: 'pkg4', name: 'Personalizado', sessions: 1, price: 100 },
  ],
};

const FONTS = {
  Poppins: "'Poppins', sans-serif",
  Montserrat: "'Montserrat', sans-serif",
  Roboto: "'Roboto', sans-serif",
  'Playfair Display': "'Playfair Display', serif",
};

const Store = {
  uid,
  FONTS,

  // ---- Settings ----
  getSettings() {
    return { ...DEFAULT_SETTINGS, ...get('settings', {}) };
  },
  saveSettings(settings) {
    set('settings', settings);
  },

  // ---- Patients ----
  getPatients() {
    return get('patients', []);
  },
  getPatient(id) {
    return this.getPatients().find(p => p.id === id);
  },
  addPatient(data) {
    const patients = this.getPatients();
    const patient = { id: uid(), createdAt: new Date().toISOString(), patientPassword: '123456', ...data };
    patients.push(patient);
    set('patients', patients);
    return patient;
  },
  updatePatient(id, data) {
    const patients = this.getPatients();
    const idx = patients.findIndex(p => p.id === id);
    if (idx >= 0) {
      patients[idx] = { ...patients[idx], ...data };
      set('patients', patients);
      return patients[idx];
    }
  },
  deletePatient(id) {
    set('patients', this.getPatients().filter(p => p.id !== id));
    const notes = get('notes', {});
    delete notes[id];
    set('notes', notes);
    const payments = get('payments', {});
    delete payments[id];
    set('payments', payments);
    const docs = get('documents', {});
    delete docs[id];
    set('documents', docs);
  },

  // ---- Notes ----
  getNotes(patientId) {
    const notes = get('notes', {});
    return notes[patientId] || [];
  },
  addNote(patientId, text) {
    const notes = get('notes', {});
    if (!notes[patientId]) notes[patientId] = [];
    const note = { id: uid(), date: new Date().toISOString(), text };
    notes[patientId].push(note);
    set('notes', notes);
    return note;
  },
  deleteNote(patientId, noteId) {
    const notes = get('notes', {});
    if (notes[patientId]) {
      notes[patientId] = notes[patientId].filter(n => n.id !== noteId);
      set('notes', notes);
    }
  },

  // ---- Payments ----
  getPayments(patientId) {
    const payments = get('payments', {});
    return payments[patientId] || [];
  },
  addPayment(patientId, data) {
    const payments = get('payments', {});
    if (!payments[patientId]) payments[patientId] = [];
    const payment = { id: uid(), date: new Date().toISOString(), ...data };
    payments[patientId].push(payment);
    set('payments', payments);
    return payment;
  },
  updatePayment(patientId, paymentId, data) {
    const payments = get('payments', {});
    if (payments[patientId]) {
      const idx = payments[patientId].findIndex(p => p.id === paymentId);
      if (idx >= 0) {
        payments[patientId][idx] = { ...payments[patientId][idx], ...data };
        set('payments', payments);
        return payments[patientId][idx];
      }
    }
  },
  deletePayment(patientId, paymentId) {
    const payments = get('payments', {});
    if (payments[patientId]) {
      payments[patientId] = payments[patientId].filter(p => p.id !== paymentId);
      set('payments', payments);
    }
  },

  // ---- Documents ----
  getDocuments(patientId) {
    const docs = get('documents', {});
    return docs[patientId] || [];
  },
  addDocument(patientId, file) {
    const docs = get('documents', {});
    if (!docs[patientId]) docs[patientId] = [];
    const doc = {
      id: uid(),
      name: file.name,
      fileData: file.data,
      fileType: file.type,
      uploadDate: new Date().toISOString(),
    };
    docs[patientId].push(doc);
    set('documents', docs);
    return doc;
  },
  deleteDocument(patientId, docId) {
    const docs = get('documents', {});
    if (docs[patientId]) {
      docs[patientId] = docs[patientId].filter(d => d.id !== docId);
      set('documents', docs);
    }
  },

  // ---- Session ----
  getSession() {
    return get('session', null);
  },
  setSession(session) {
    set('session', session);
  },
  clearSession() {
    localStorage.removeItem(PREFIX + 'session');
  },

  // ---- Seed demo data ----
  seedIfEmpty() {
    if (this.getPatients().length === 0) {
      const p1 = this.addPatient({
        fullName: 'Ana Costa',
        age: 28,
        phone: '(11) 98888-7777',
        email: 'ana.costa@email.com',
        origin: 'particular',
      });
      const p2 = this.addPatient({
        fullName: 'Bruno Lima',
        age: 35,
        phone: '(11) 97777-6666',
        email: 'bruno.lima@email.com',
        origin: 'leve_saude',
      });
      this.addNote(p1.id, 'Primeira sessão. Paciente relata ansiedade social. Iniciamos abordagem TCC.');
      this.addNote(p2.id, 'Paciente encaminhado pelo convênio Leve Saúde. Avaliação inicial favorável.');
      this.addPayment(p1.id, {
        packageId: 'pkg1', packageName: 'Avulso / 1 sessão', sessions: 1,
        basePrice: 150, discount: 0, finalPrice: 150, status: 'paid',
      });
      this.addPayment(p2.id, {
        packageId: 'pkg2', packageName: '2 sessões', sessions: 2,
        basePrice: 280, discount: 28, finalPrice: 252, status: 'pending',
      });
    }
  },
};

export default Store;
