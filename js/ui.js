// ============================================================
// ui.js — UI utilities: theme, toast, modal, file helpers
// ============================================================
import Store from './store.js';

export function applyTheme() {
  const s = Store.getSettings();
  const root = document.documentElement;
  root.style.setProperty('--bg-color', s.bgColor);
  root.style.setProperty('--bg-image', s.bgImage ? `url(${s.bgImage})` : 'none');
  root.style.setProperty('--btn-color', s.btnColor);
  root.style.setProperty('--btn-color-hover', s.btnColorHover || shade(s.btnColor, -15));
  root.style.setProperty('--font-family', Store.FONTS[s.font] || Store.FONTS['Poppins']);
  document.title = `${s.officeName} — Gestão Psicológica`;
}

// Darken/lighten a hex color by a percentage
export function shade(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  let r = (num >> 16) + Math.round(255 * percent / 100);
  let g = ((num >> 8) & 0xff) + Math.round(255 * percent / 100);
  let b = (num & 0xff) + Math.round(255 * percent / 100);
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

export function toast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(100%)';
    el.style.transition = 'all .3s';
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

export function showModal(html) {
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-content').innerHTML = html;
  overlay.style.display = 'flex';
}

export function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
}

export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateShort(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function money(v) {
  return 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
}

// Read a File object as base64 data URL
export function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function downloadBase64(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Compute payment with Leve Saúde discount
export function computePayment(pkg, patient, settings) {
  const basePrice = pkg.price;
  let discount = 0;
  if (patient.origin === 'leve_saude' && settings.leveSaudeDiscount > 0) {
    discount = Math.round(basePrice * settings.leveSaudeDiscount) / 100;
  }
  return {
    basePrice,
    discount,
    finalPrice: basePrice - discount,
  };
}

export function originBadge(origin) {
  if (origin === 'leve_saude') return '<span class="badge badge-info"><i class="fas fa-hospital"></i> Leve Saúde</span>';
  return '<span class="badge badge-neutral"><i class="fas fa-user"></i> Particular</span>';
}

export function statusBadge(status) {
  const map = {
    paid: '<span class="badge badge-success"><i class="fas fa-check-circle"></i> Pago</span>',
    pending: '<span class="badge badge-warning"><i class="fas fa-clock"></i> Pendente</span>',
    cancelled: '<span class="badge badge-danger"><i class="fas fa-times-circle"></i> Cancelado</span>',
  };
  return map[status] || map.pending;
}
