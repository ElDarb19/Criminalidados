// ===== Cuenta del Capo (Google o correo) =====
// Guarda el Perfil en la nube para tenerlo en cualquier dispositivo y publica tu fila en el TOP global.
// Usa una app de Firebase aparte ('cuenta') con sesión guardada en el dispositivo, así no se mezcla con el
// acceso anónimo por pestaña que usan las salas online (esas siguen exactamente igual).
// Base de datos: users/{uid} = tu perfil (solo tú lo lees y escribes) · ranking/{uid} = tu fila del TOP (todos la leen).
// Reglas: Versiones/reglas_firebase.json.
// Al iniciar sesión se combinan el progreso de este dispositivo y el de la nube sin duplicar nada:
//  logros, cobros y compras se suman (unión); los contadores del historial se quedan con el mayor; el oro se recalcula.
const ACCOUNT = {
  app:null, auth:null, db:null, user:null, ready:false, busy:false, timer:null, top:null,
  init() {
    if (typeof firebase === 'undefined') return;
    try { this.app = firebase.initializeApp(firebaseConfig, 'cuenta'); this.auth = this.app.auth(); this.db = this.app.database(); }
    catch (e) { console.warn('Cuenta no disponible', e); return; }
    this.auth.getRedirectResult().catch(e => this.fail(e));                   // vuelta del inicio con Google por redirección
    this.auth.onAuthStateChanged(u => { this.user = u; this.ready = true; if (u) this.pull(); this.refresh(); });
  },
  label() { const u = this.user; return u ? (u.email || u.displayName || 'tu cuenta') : ''; },

  // ---------- entrar y salir ----------
  async google() {
    if (!this.auth || this.busy) return;
    const p = new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({ prompt:'select_account' });
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;   // app instalada: las ventanas emergentes fallan
    this.wait(true);
    try { if (standalone) await this.auth.signInWithRedirect(p); else await this.auth.signInWithPopup(p); }
    catch (e) {
      if (/popup-blocked|operation-not-supported/.test(e.code || '')) { try { await this.auth.signInWithRedirect(p); return; } catch (e2) { e = e2; } }
      this.fail(e);
    }
    this.wait(false);
  },
  async email(create) {
    if (!this.auth || this.busy) return;
    const mail = ($$('ac-mail').value || '').trim(), pass = $$('ac-pass').value || '';
    if (!mail || !pass) return this.msg('Escribe tu correo y una contraseña.');
    this.wait(true);
    try { if (create) await this.auth.createUserWithEmailAndPassword(mail, pass); else await this.auth.signInWithEmailAndPassword(mail, pass); }
    catch (e) { this.fail(e); }
    this.wait(false);
  },
  async reset() {
    const mail = ($$('ac-mail').value || '').trim(); if (!mail) return this.msg('Escribe tu correo y vuelve a pulsar "Olvidé mi contraseña".');
    try { this.auth.languageCode = 'es'; await this.auth.sendPasswordResetEmail(mail); this.msg('Te enviamos un correo para crear una contraseña nueva.', true); }
    catch (e) { this.fail(e); }
  },
  async logout() {
    if (!(await askConfirm('¿Cerrar sesión?', 'Tu progreso queda guardado en la nube y también en este dispositivo.', 'CERRAR SESIÓN'))) return;
    await this.auth.signOut();
  },
  fail(e) {
    const c = (e && e.code) || '';
    if (/popup-closed|cancelled-popup/.test(c)) return this.msg('');
    const m = {
      'auth/invalid-email':'Ese correo no es válido.',
      'auth/invalid-credential':'Correo o contraseña incorrectos.',
      'auth/wrong-password':'Correo o contraseña incorrectos.',
      'auth/user-not-found':'No hay ninguna cuenta con ese correo. Pulsa "Crear cuenta".',
      'auth/email-already-in-use':'Ese correo ya tiene cuenta. Pulsa "Entrar".',
      'auth/weak-password':'La contraseña debe tener al menos 6 caracteres.',
      'auth/too-many-requests':'Demasiados intentos. Espera un momento y vuelve a probar.',
      'auth/network-request-failed':'Sin conexión. Revisa tu internet.',
      'auth/unauthorized-domain':'Esta página no está autorizada en Firebase (Authentication → Configuración → Dominios autorizados).',
      'auth/operation-not-allowed':'Este método de acceso no está activado en Firebase (Authentication → Método de acceso).',
      'auth/account-exists-with-different-credential':'Ese correo ya entró con otro método. Usa el que usaste la primera vez.'
    }[c];
    this.msg(m || 'No se pudo iniciar sesión (' + (c || (e && e.message) || 'error') + ').');
  },
  msg(t, good) { const el = $$('ac-msg'); if (el) { el.textContent = t; el.classList.toggle('good', !!good); } },
  wait(on) { this.busy = on; document.querySelectorAll('.ac-box button').forEach(b => { b.disabled = on; }); },

  // ---------- sincronizar ----------
  async pull() {                                   // al iniciar sesión: combinar nube + dispositivo
    const u = this.user;
    try {
      const snap = await this.db.ref('users/' + u.uid).once('value');
      if (this.user !== u) return;
      const here = PROFILE.load(), mine = !here.owner || here.owner === u.uid;   // si este dispositivo era de otra cuenta, no se mezcla
      PROFILE.d = this.merge(mine ? here : PROFILE.blank(), snap.val());
      PROFILE.d.owner = u.uid;
      PROFILE.save(true);
      await this.push();
      if (typeof renderAll === 'function') PROFILE.toMenu();
      if (!$$('modal-profile').classList.contains('hidden')) PROFILE.tab(PROFILE.cur);
    } catch (e) { console.warn('No se pudo leer el perfil de la nube', e); this.msg('No se pudo sincronizar. Revisa las reglas de Firebase.'); }
  },
  merge(a, b) {
    if (!b) return a;
    const d = PROFILE.blank(), max = (x, y) => Math.max(x || 0, y || 0);
    d.name = b.name || a.name || ''; d.color = b.color || a.color || null; d.char = b.char || a.char || null; d.react = b.react || a.react || null;
    d.fin = b.fin || a.fin || null; d.aura = b.aura || a.aura || null; d.goldv = Math.max(b.goldv || 1, a.goldv || 1);   // dados elegidos y versión de las recompensas
    ['games', 'wins', 'online', 'earned'].forEach(k => { d[k] = max(a[k], b[k]); });   // earned: oro ganado en partidas online
    GAMES.forEach(g => ['p', 'w'].forEach(k => { d.by[g][k] = max(a.by && a.by[g] && a.by[g][k], b.by && b.by[g] && b.by[g][k]); }));
    ['p', 'w'].forEach(k => { d.party[k] = max(a.party && a.party[k], b.party && b.party[k]); });
    Object.keys(d.tot).forEach(k => { d.tot[k] = max(a.tot && a.tot[k], b.tot && b.tot[k]); });
    [a.titles, b.titles].forEach(t => Object.keys(t || {}).forEach(k => { d.titles[k] = max(d.titles[k], t[k]); }));
    [a.ach, b.ach].forEach(t => Object.keys(t || {}).forEach(k => { d.ach[k] = d.ach[k] ? Math.min(d.ach[k], t[k]) : t[k]; }));   // la fecha más antigua
    [a.paid, b.paid].forEach(t => Object.keys(t || {}).forEach(k => { d.paid[k] = true; }));
    [a.owned, b.owned].forEach(t => Object.keys(t || {}).forEach(k => { d.owned[k] = true; }));
    d.gold = PROFILE.goldOf(d);
    return d;
  },
  later() {                                        // tras cada guardado del perfil (agrupa varios seguidos)
    if (!this.user) return;
    clearTimeout(this.timer); this.timer = setTimeout(() => this.push(), 1500);
  },
  async push() {
    const u = this.user; if (!u) return;
    const d = PROFILE.load(), p = PROFILE.prefs();
    try {
      await this.db.ref('users/' + u.uid).set(JSON.parse(JSON.stringify(d)));
      await this.db.ref('ranking/' + u.uid).set({ name:(p.name || 'Capo sin nombre').slice(0, 16), wins:d.wins, games:d.games,
        char:p.char || 'Mafioso', color:p.color || 'Color_R', t:firebase.database.ServerValue.TIMESTAMP });
      this.top = null;                             // el TOP se vuelve a pedir con tu fila nueva
    } catch (e) { console.warn('No se pudo guardar en la nube', e); }
  },

  // ---------- TOP global ----------
  // Orden: más victorias; si empatan, menos partidas jugadas (mejor efectividad).
  async loadTop() {
    if (!this.db) throw new Error('sin-firebase');
    const snap = await this.db.ref('ranking').orderByChild('wins').limitToLast(100).once('value');
    const rows = []; snap.forEach(s => { rows.push(Object.assign({ uid:s.key }, s.val())); });
    rows.sort((x, y) => (y.wins - x.wins) || (x.games - y.games) || (x.t - y.t));
    this.top = rows.slice(0, 50);
    return this.top;
  },

  // ---------- en la ventana del Perfil ----------
  refresh() {
    const el = $$('ac-zone'); if (el) el.innerHTML = this.html();
    if (PROFILE.cur === 'top' && !$$('modal-profile').classList.contains('hidden')) PROFILE.tab('top');
  },
  html() {
    if (!this.auth) return `<p class="pf-note">La cuenta en la nube no está disponible sin conexión.</p>`;
    if (!this.ready) return `<p class="pf-note">Conectando…</p>`;
    if (this.user) return `<div class="ac-box ac-on"><p>☁️ Sincronizado como <b>${esc(this.label())}</b></p>
      <button type="button" class="btn-cancel" onclick="ACCOUNT.logout()">CERRAR SESIÓN</button></div>`;
    return `<div class="ac-box"><p class="pf-note">Inicia sesión para guardar tu progreso en la nube, tenerlo en cualquier dispositivo y aparecer en el TOP.</p>
      <button type="button" class="ac-google" onclick="ACCOUNT.google()"><span class="g-logo" aria-hidden="true">G</span> Continuar con Google</button>
      <div class="ac-or"><span>o con tu correo</span></div>
      <label class="pf-label" for="ac-mail">Correo</label><input id="ac-mail" type="email" autocomplete="email" inputmode="email">
      <label class="pf-label" for="ac-pass">Contraseña</label><input id="ac-pass" type="password" autocomplete="current-password" minlength="6">
      <div class="ac-row"><button type="button" class="start" onclick="ACCOUNT.email(false)">ENTRAR</button><button type="button" class="btn-cancel" onclick="ACCOUNT.email(true)">CREAR CUENTA</button></div>
      <button type="button" class="ac-link" onclick="ACCOUNT.reset()">Olvidé mi contraseña</button>
      <p id="ac-msg" class="ac-msg" role="status"></p></div>`;
  },
  topHtml() {
    setTimeout(async () => {
      const box = $$('top-list'); if (!box) return;
      try { const rows = this.top || await this.loadTop(); if ($$('top-list')) $$('top-list').innerHTML = this.rowsHtml(rows); }
      catch (e) { if ($$('top-list')) $$('top-list').innerHTML = '<p class="pf-note">No se pudo cargar el TOP. Revisa tu conexión.</p>'; }
    });
    return `<p class="pf-note">Los mejores capos del mundo: manda quien tenga más victorias y, si empatan, quien las logró en menos partidas.
      ${this.user ? '' : '<b>Inicia sesión en la pestaña TU CAPO para aparecer.</b>'}</p><div id="top-list" class="top-list"><p class="pf-note">Cargando…</p></div>`;
  },
  rowsHtml(rows) {
    if (!rows.length) return '<p class="pf-note">Aún no hay nadie. ¡Sé el primero!</p>';
    const me = this.user && this.user.uid, medal = ['🥇', '🥈', '🥉'];
    return `<ol class="top">${rows.map((r, i) => `<li class="${r.uid === me ? 'me' : ''}"><span class="top-n">${medal[i] || i + 1}</span>
      <span class="avatar" style="--pc:${COLORS[r.color] || '#555'}"><img src="assets/characters/${CHARACTERS.some(c => c.key === r.char) ? r.char : 'Mafioso'}/${COLORS[r.color] ? r.color : 'Color_R'}/idle.png" alt=""></span>
      <b class="top-name">${esc(r.name)}${r.uid === me ? ' <small>(tú)</small>' : ''}</b><span class="top-w">${r.wins}<small>victorias</small></span><span class="top-g">${r.games}<small>partidas</small></span></li>`).join('')}</ol>`;
  }
};

document.addEventListener('DOMContentLoaded', () => ACCOUNT.init());
