export function showToast(message, { duration = 4000 } = {}) {
  if (typeof document === 'undefined') return;

  let root = document.getElementById('medaid-toast-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'medaid-toast-root';
    root.style.cssText =
      'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none;';
    document.body.appendChild(root);
  }

  const el = document.createElement('div');
  el.textContent = message;
  el.style.cssText =
    'background:#1A1A2E;color:#fff;padding:10px 18px;border-radius:14px;font:600 13px sans-serif;box-shadow:0 4px 16px rgba(0,0,0,0.2);opacity:0;transition:opacity 0.25s ease;max-width:280px;text-align:center;';
  root.appendChild(el);

  requestAnimationFrame(() => {
    el.style.opacity = '1';
  });

  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, duration);
}
