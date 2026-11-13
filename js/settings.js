// ===== Ajustes (botón arriba a la izquierda) =====
// Panel desplegable: música (audio.js), efectos, velocidad de los bots, animaciones, modo daltónico, pantalla completa,
// instalar como app, Manual del Capo, repetir tutorial y salir de la partida. Se recuerdan en este dispositivo.
const SET = { sfx:true, fast:false, calm:false, cb:false };
try { Object.assign(SET, JSON.parse(localStorage.getItem('cd-settings') || '{}')); } catch (e) {}
// Modo daltónico: cada color lleva además una letra (en fichas, dados y muestras de color).
const COLOR_TAGS = { Color_R:'R', Color_B:'A', Color_G:'V', Color_P:'Ro', Color_Pu:'M', Color_W:'B', Color_Y:'Am' };
const COLOR_LABELS = { Color_R:'Rojo', Color_B:'Azul', Color_G:'Verde', Color_P:'Rosa', Color_Pu:'Morado', Color_W:'Blanco', Color_Y:'Amarillo' };
const colorTag = c => COLOR_TAGS[c] || '';

function settingsRow(b, on, label) {
  b.setAttribute('aria-checked', on); b.querySelector('span').textContent = label; b.querySelector('.set-state').textContent = on ? 'SÍ' : 'NO';
}
function settingsApply() {                            // lleva cada ajuste al juego y a los interruptores
  SND.muted = !SET.sfx;
  document.documentElement.classList.toggle('calm', SET.calm);
  document.documentElement.classList.toggle('cb', SET.cb);
  settingsRow($$('set-sfx'), SET.sfx, SET.sfx ? '🔊 Efectos de sonido' : '🔈 Efectos de sonido');
  settingsRow($$('set-fast'), SET.fast, '⏩ Bots rápidos');
  settingsRow($$('set-calm'), SET.calm, '🎞️ Reducir animaciones');
  settingsRow($$('set-cb'), SET.cb, '🎨 Modo daltónico');
}
function settingsFlip(k) {
  SET[k] = !SET[k]; try { localStorage.setItem('cd-settings', JSON.stringify(SET)); } catch (e) {}
  settingsApply();
  if (k === 'cb' && typeof CD !== 'undefined' && CD.G) render();
}
function settingsToggle(open) {
  const p = $$('settings-panel'), b = $$('btn-settings');
  const show = open === undefined ? p.classList.contains('hidden') : open;
  p.classList.toggle('hidden', !show); b.setAttribute('aria-expanded', show);
  if (!show) return;
  const playing = !!(typeof CD !== 'undefined' && CD.running);   // en partida: "Salir al menú"; en el menú: "Repetir tutorial" (!!: con undefined, toggle alternaba)
  $$('set-exit').classList.toggle('hidden', !playing);
  $$('set-tutorial').classList.toggle('hidden', playing);
  $$('set-install-msg').classList.add('hidden');
  installButton(); if (typeof radioDial === 'function') requestAnimationFrame(radioDial);   // la aguja del dial necesita el panel visible
}
const reducedMotion = () => SET.calm || matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- pantalla completa ----------
const FS = {
  el: () => document.fullscreenElement || document.webkitFullscreenElement,
  can: () => !!(document.fullscreenEnabled || document.webkitFullscreenEnabled)
};
function fullscreenToggle() {
  const d = document.documentElement;
  try {
    if (FS.el()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else { const r = (d.requestFullscreen || d.webkitRequestFullscreen).call(d); if (r && r.catch) r.catch(() => {}); }
  } catch (e) {}
}
function fullscreenButton() {
  const b = $$('set-full'); if (!b) return;
  b.classList.toggle('hidden', !FS.can());                 // iPhone no permite pantalla completa en páginas web: se oculta
  settingsRow(b, !!FS.el(), '⛶ Pantalla completa');
}
['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => document.addEventListener(ev, fullscreenButton));

// ---------- instalar como app ----------
let installPrompt = null;
const installed = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; installButton(); });
window.addEventListener('appinstalled', () => { installPrompt = null; installButton(); });
function installButton() { const b = $$('set-install'); if (b) b.classList.toggle('hidden', installed()); }
function installApp() {
  const msg = $$('set-install-msg'), say = t => { msg.innerHTML = t; msg.classList.remove('hidden'); };
  if (installPrompt) { installPrompt.prompt(); installPrompt.userChoice.finally(() => { installPrompt = null; installButton(); }); return; }
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return say('En iPhone/iPad: abre el juego en <b>Safari</b>, toca <b>Compartir</b> (□↑) y elige <b>"Añadir a pantalla de inicio"</b>.');
  say('Abre el menú del navegador (⋮) y elige <b>"Instalar app"</b> o <b>"Añadir a pantalla de inicio"</b>. Si no aparece, recarga la página e inténtalo de nuevo.');
}
if ('serviceWorker' in navigator && location.protocol !== 'file:') window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

// ---------- confirmación ----------
// Ventana propia de "¿seguro?": devuelve una promesa con true (aceptar) o false (cancelar).
function askConfirm(title, text, ok) {
  const m = $$('modal-confirm');
  $$('confirm-title').textContent = title; $$('confirm-text').textContent = text; $$('confirm-ok').textContent = ok;
  m.classList.remove('hidden'); $$('confirm-no').focus();
  return new Promise(res => {
    const done = v => { m.classList.add('hidden'); $$('confirm-ok').onclick = $$('confirm-no').onclick = null; res(v); };
    $$('confirm-ok').onclick = () => done(true); $$('confirm-no').onclick = () => done(false);
  });
}

document.addEventListener('DOMContentLoaded', () => { settingsApply(); fullscreenButton(); installButton(); });
document.addEventListener('pointerdown', e => { if (!e.target.closest('#settings')) settingsToggle(false); });   // se cierra al tocar fuera
document.addEventListener('keydown', e => { if (e.key === 'Escape') settingsToggle(false); });
