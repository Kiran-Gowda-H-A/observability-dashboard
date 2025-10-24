// utils.js - popup and freeze helpers (ES module)
export function createOverlayElement() {
  let overlay = document.getElementById('__popup_overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = '__popup_overlay';
    overlay.className = 'popup-overlay';
    document.body.appendChild(overlay);
  }
  return overlay;
}

export function showPopup(message, title = 'Notice', { type = 'info', autoClose = 0 } = {}) {
  const overlay = createOverlayElement();
  overlay.innerHTML = '';
  overlay.classList.add('show');

  const popup = document.createElement('div');
  popup.className = 'popup';

  const header = document.createElement('div');
  header.className = 'popup-header';

  const icon = document.createElement('div');
  icon.className = 'icon ' + (type || 'info');
  icon.innerText = (type === 'success') ? '✓' : (type === 'error' ? '!' : 'i');

  const titleEl = document.createElement('div');
  titleEl.className = 'popup-title';
  titleEl.innerText = title;

  header.appendChild(icon);
  header.appendChild(titleEl);

  const body = document.createElement('div');
  body.className = 'popup-body';
  body.innerText = message || '';

  const actions = document.createElement('div');
  actions.className = 'popup-actions';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'btn-ghost';
  closeBtn.innerText = 'Close';

  actions.appendChild(closeBtn);

  popup.appendChild(header);
  popup.appendChild(body);
  popup.appendChild(actions);
  overlay.appendChild(popup);

  requestAnimationFrame(() => popup.classList.add('show'));

  function hide() {
    popup.classList.remove('show');
    overlay.classList.remove('show');
    setTimeout(() => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 200);
    document.removeEventListener('keydown', onKey);
    overlay.removeEventListener('click', onOverlayClick);
  }

  function onKey(ev) { if (ev.key === 'Escape') hide(); }
  function onOverlayClick(ev) { if (ev.target === overlay) hide(); }

  document.addEventListener('keydown', onKey);
  overlay.addEventListener('click', onOverlayClick);
  closeBtn.addEventListener('click', hide);

  if (autoClose && Number(autoClose) > 0) setTimeout(hide, Number(autoClose));

  return { close: hide };
}

export function freezeUi() {
  try {
    document.documentElement.classList.add('no-anim');
    const sbw = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    document.documentElement.style.setProperty('--sbw', sbw + 'px');
    document.body.style.paddingRight = sbw ? (sbw + 'px') : '';
  } catch (e) { console.warn('freezeUi failed', e); }
}

export function unfreezeUi() {
  try {
    document.documentElement.classList.remove('no-anim');
    document.body.style.paddingRight = '';
  } catch (e) { console.warn('unfreezeUi failed', e); }
}
