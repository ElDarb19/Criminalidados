// ===== Perfil del Capo =====
// Se guarda solo en este dispositivo (localStorage). Tiene tres partes:
//  · Tu Capo: nombre, personaje y color favoritos. Se ponen solos en tu puesto del menú y al unirte a una sala online
//    (siguen pudiéndose cambiar en el menú; si tu color ya está ocupado en la sala, lo conserva quien entró antes).
//  · Historial: partidas, victorias por contrato y totales del Expediente.
//  · Logros: se revisan al terminar cada partida (el tutorial no cuenta, salvo su propio logro).
// Cuenta las partidas del jugador de este dispositivo: en online tu asiento; en local, el Jefe 1.
//  · Oro: cada logro paga según su dificultad (TIERS) y se gasta en la Tienda (skins de CHARACTERS con precio).
//    Regla: el oro de todos los logros debe alcanzar para comprar toda la tienda (lo comprueba tests/).
//    Un logro solo paga una vez, aunque se borre el historial (d.paid).
const TIERS = {
  facil:   { label:'Fácil',      gold:100 },
  media:   { label:'Media',      gold:250 },
  dificil: { label:'Difícil',    gold:500 },
  leyenda: { label:'Legendario', gold:1000 },
  secreto: { label:'Secreto',    gold:0 }       // no paga oro: desbloquea un capo que no se vende
};
const ACHIEVEMENTS = [
  { id:'graduado',     tier:'facil',   icon:'🎓', name:'Graduado',              desc:'Completa el tutorial.',                                  test:() => false },
  { id:'primer_golpe', tier:'facil',   icon:'🥃', name:'Primer Golpe',          desc:'Gana tu primera partida.',                              test:c => c.won },
  { id:'sindicato',    tier:'facil',   icon:'🌐', name:'Socio del Sindicato',   desc:'Termina una partida online.',                            test:c => !!CD.cfg.online },
  { id:'veterano',     tier:'facil',   icon:'📅', name:'Veterano',              desc:'Juega 10 partidas.',                                     test:c => c.d.games >= 10 },
  { id:'guerra',       tier:'media',   icon:'🔫', name:'Señor de la Guerra',    desc:'Gana una Guerra de Bandas (contrato único).',            test:c => c.won && c.single('rpg') },
  { id:'atraco',       tier:'media',   icon:'💰', name:'Golpe Maestro',         desc:'Gana El Gran Atraco (contrato único).',                  test:c => c.won && c.single('exp') },
  { id:'imperio',      tier:'media',   icon:'🏛️', name:'Magnate',               desc:'Gana Imperio Criminal (contrato único).',                test:c => c.won && c.single('maf') },
  { id:'apuestas',     tier:'media',   icon:'🎰', name:'Tahúr de Ley',          desc:'Gana Apuestas Clandestinas (contrato único).',           test:c => c.won && c.single('pok') },
  { id:'party',        tier:'media',   icon:'🎉', name:'Rey de la Fiesta',      desc:'Gana un Modo Party.',                                    test:c => c.won && c.party },
  { id:'huida',        tier:'media',   icon:'🚗', name:'Huida Perfecta',        desc:'Asegura 25 de botín o más en El Gran Atraco.',           test:c => c.single('exp') && (c.p.secured || 0) >= 25 },
  { id:'gato',         tier:'media',   icon:'🐈‍⬛', name:'Gato Negro',            desc:'Saca tres 1 naturales en una misma partida.',            test:c => c.s.nat1 >= 3 },
  { id:'toda_ciudad',  tier:'dificil', icon:'🗺️', name:'Toda la Ciudad',        desc:'Gana los cuatro contratos al menos una vez.',            test:c => GAMES.every(g => c.d.by[g].w > 0) },
  { id:'sin_medico',   tier:'dificil', icon:'💪', name:'Sin Médico',            desc:'Gana una Guerra de Bandas sin curarte.',                 test:c => c.won && c.single('rpg') && c.s.healed === 0 },
  { id:'maquinas',     tier:'dificil', icon:'🤖', name:'Domador de Máquinas',   desc:'Gana contra 3 bots.',                                    test:c => c.won && c.G.players.filter(q => q.bot).length >= 3 },
  { id:'trebol',       tier:'dificil', icon:'🍀', name:'Trébol de Cuatro Hojas', desc:'Saca tres 20 naturales en una misma partida.',          test:c => c.s.nat20 >= 3 },
  { id:'intocable',    tier:'dificil', icon:'🛡️', name:'Intocable',             desc:'Gana una partida sin recibir daño ni pérdidas.',          test:c => c.won && c.s.taken === 0 },
  { id:'coleccionista', tier:'leyenda', icon:'🗂️', name:'Coleccionista',        desc:'Consigue los 8 títulos del Expediente.',                 test:c => FILE.TITLES.every(t => c.d.titles[t.key] > 0) },
  { id:'leyenda',      tier:'leyenda', icon:'👑', name:'Leyenda de la Ciudad',  desc:'Gana 25 partidas.',                                      test:c => c.d.wins >= 25 },
  { id:'juicio_final', tier:'secreto', icon:'⚙️', name:'Juicio Final', hidden:true, unlocks:'Terminator',
    desc:'Gana un Modo Party a 8 o más victorias contra 3 bots.',
    test:c => c.won && c.party && (CD.cfg.winsNeeded || 0) >= 8 && c.G.players.filter(q => q.bot).length >= 3 }
];

const PROFILE = {
  KEY:'cd-profile', d:null, cur:'capo', queue:[],
  blank() {
    return { name:'', color:null, char:null, games:0, wins:0, online:0,
      by:Object.fromEntries(GAMES.map(g => [g, { p:0, w:0 }])), party:{ p:0, w:0 },
      tot:{ dealt:0, gained:0, healed:0, nat20:0, nat1:0, acts:0 }, titles:{}, ach:{}, gold:0, paid:{}, owned:{}, react:null };
  },
  load() {
    if (this.d) return this.d;
    let saved = {}; try { saved = JSON.parse(localStorage.getItem(this.KEY) || '{}') || {}; } catch (e) {}
    const b = this.blank();
    this.d = Object.assign(b, saved, { by:Object.assign(b.by, saved.by), party:Object.assign(b.party, saved.party), tot:Object.assign(b.tot, saved.tot) });
    const back = ACHIEVEMENTS.filter(a => this.d.ach[a.id] && !this.d.paid[a.id]).reduce((n, a) => n + this.pay(a), 0);   // logros de antes de existir el oro
    if (back) { this.save(); setTimeout(() => this.notify('<i class="coin big" aria-hidden="true"></i>', 'ORO POR TUS LOGROS', '+' + back + ' de oro'), 600); }
    return this.d;
  },
  save(local) {                                    // local: solo en el dispositivo (sin subir a la nube)
    try { localStorage.setItem(this.KEY, JSON.stringify(this.d)); } catch (e) {}
    if (!local && typeof ACCOUNT !== 'undefined') ACCOUNT.later();
  },
  reacts() {                                       // reacciones del chat rápido (máx. REACT_MAX, solo del catálogo)
    const r = (this.load().react || []).filter(e => REACTIONS.includes(e)).slice(0, REACT_MAX);
    return r.length ? r : REACT_DEFAULT.slice();
  },
  toggleReact(e) {
    const r = this.reacts(), i = r.indexOf(e);
    if (i >= 0) { if (r.length === 1) return this.reactMsg('Deja al menos una reacción.'); r.splice(i, 1); }
    else { if (r.length >= REACT_MAX) return this.reactMsg('Máximo ' + REACT_MAX + '. Quita una para elegir otra.'); r.push(e); }
    this.d.react = r; this.save(); $$('pf-react').innerHTML = this.reactHtml();
  },
  reactHtml() {
    const r = this.reacts();
    return `<h3 class="pf-h">Chat rápido · ${r.length}/${REACT_MAX}</h3>
      <p class="pf-note pf-react-note">Elige hasta ${REACT_MAX} reacciones para enviar en las partidas online. Salen en el orden en que las elijas: ${r.map(esc).join(' ')}</p>
      <div class="pf-reacts">${REACTIONS.map(e => { const on = r.includes(e);
        return `<button type="button" class="pf-rx ${on ? 'on' : ''} ${e.length > 2 ? 'txt' : ''}" aria-pressed="${on}" aria-label="${on ? 'Quitar' : 'Elegir'} ${esc(e)}" onclick="PROFILE.toggleReact('${e}')">${e}</button>`; }).join('')}</div>
      <p id="pf-react-msg" class="ac-msg" role="status"></p>`;
  },
  reactMsg(t) { const m = $$('pf-react-msg'); if (m) m.textContent = t; },
  prefs() { const d = this.load(); return { name:cleanName(d.name).trim(), color:COLORS[d.color] ? d.color : null, char:this.owns(d.char) ? d.char : null }; },

  // ---------- oro y tienda ----------
  pay(a) {                                         // cobra un logro (una sola vez en la vida del perfil)
    const d = this.d, g = TIERS[a.tier].gold; d.paid[a.id] = true; d.gold += g;
    if (a.unlocks) d.owned[a.unlocks] = true;
    return g;
  },
  goldOf(d) {                                      // oro = lo cobrado por logros − lo gastado en la tienda (sirve para combinar dispositivos)
    const won = ACHIEVEMENTS.filter(a => d.paid[a.id]).reduce((n, a) => n + TIERS[a.tier].gold, 0);
    const spent = CHARACTERS.filter(c => c.price && d.owned[c.key]).reduce((n, c) => n + c.price, 0);
    return Math.max(0, won - spent);
  },
  owns(key) {                                      // los personajes sin precio ni secreto son básicos
    const c = CHARACTERS.find(x => x.key === key); if (!c) return false;
    return !(c.price || c.secret) || !!this.load().owned[key];
  },
  async buy(key) {
    const c = CHARACTERS.find(x => x.key === key), d = this.load(); if (!c || !c.price || this.owns(key)) return;
    if (d.gold < c.price) return;
    if (!(await askConfirm('¿Comprar ' + c.label + '?', 'Cuesta ' + c.price + ' de oro. Te quedarán ' + (d.gold - c.price) + '.', 'COMPRAR'))) return;
    d.gold -= c.price; d.owned[key] = true; this.save(); playSound('coin');
    if (typeof renderAll === 'function') renderAll();
    this.tab('shop');
  },

  // ---------- llevar el perfil al menú ----------
  mySlot() { return online() && S.room ? S.players.findIndex(p => p.uid === uid) : 0; },
  toMenu(field) {                                  // field: 'name' | 'color' | 'char' | undefined (todo)
    if (typeof CD !== 'undefined' && CD.running) return;
    const i = this.mySlot(), p = this.prefs(); if (i < 0) return;
    if ((!field || field === 'name') && p.name) onName(i, p.name);
    if ((!field || field === 'char') && p.char) onChar(i, p.char);
    if ((!field || field === 'color') && p.color) {
      if (!(online() && S.room)) { const j = S.players.findIndex((q, k) => k !== i && q.color === p.color); if (j >= 0) S.players[j].color = S.players[i].color; }   // en local, intercambia con quien lo tuviera
      if (!usedByHumans(i).includes(p.color)) onColor(i, p.color);              // en una sala, solo si sigue libre
    }
    renderAll();
  },

  // ---------- historial y logros ----------
  record(G) {
    const me = CD.cfg.online ? CD.me : G.players.findIndex(q => !q.bot), p = G.players[me];
    if (!p || p.bot) return;
    const d = this.load(), won = G.result.winner === p.slot, party = CD.cfg.mode === 'party';
    const row = FILE.rows(G).find(r => r.p.slot === p.slot), s = row.s;
    d.games++; if (won) d.wins++;
    if (CD.cfg.online) d.online++;
    if (party) { d.party.p++; if (won) d.party.w++; } else { d.by[CD.contract].p++; if (won) d.by[CD.contract].w++; }
    Object.keys(d.tot).forEach(k => { d.tot[k] += s[k] || 0; });
    row.titles.forEach(t => { d.titles[t.key] = (d.titles[t.key] || 0) + 1; });
    const ctx = { G, p, s, d, won, party, single:g => !party && CD.contract === g };
    ACHIEVEMENTS.forEach(a => { if (!d.ach[a.id] && a.test(ctx)) this.unlock(a.id, true); });
    this.save();
  },
  unlock(id, quiet) {
    const d = this.load(), a = ACHIEVEMENTS.find(x => x.id === id); if (!a || d.ach[id]) return;
    d.ach[id] = Date.now();
    const g = d.paid[id] ? 0 : this.pay(a);
    if (!quiet) this.save();
    this.notify(a.icon, 'LOGRO DESBLOQUEADO', a.name + (g ? ' · +' + g + ' de oro' : a.unlocks ? ' · capo secreto' : ''));
  },
  notify(icon, head, text) { this.queue.push({ icon, head, text }); if (this.queue.length === 1) this.toast(); },
  toast() {                                        // avisos de logro y de oro, uno tras otro, por encima de cualquier pantalla
    const a = this.queue[0], t = $$('ach-toast'); if (!a) return;
    document.body.appendChild(t);                  // último del documento: queda sobre cualquier ventana abierta después
    t.innerHTML = `<span class="ach-ic">${a.icon}</span><span><small>${a.head}</small><b>${esc(a.text)}</b></span>`;
    t.className = 'ach-toast in'; playSound('trophy');
    setTimeout(() => { t.className = 'ach-toast out';
      setTimeout(() => { t.className = 'ach-toast hidden'; this.queue.shift(); setTimeout(() => this.toast(), 250); }, 420); }, 3200);
  },

  // ---------- ventana del perfil ----------
  open() { this.load(); settingsToggle(false); this.tab(this.cur); $$('modal-profile').classList.remove('hidden'); },
  close() { $$('modal-profile').classList.add('hidden'); },
  tab(t) {
    this.cur = t;
    document.querySelectorAll('#modal-profile .tab-btn').forEach(b => { const on = b.dataset.tab === t; b.classList.toggle('active', on); b.setAttribute('aria-selected', on); });
    $$('profile-body').innerHTML = t === 'capo' ? this.capoHtml() : t === 'hist' ? this.histHtml() : t === 'shop' ? this.shopHtml() : t === 'top' ? ACCOUNT.topHtml() : this.achHtml();
    $$('pf-gold').textContent = this.d.gold;
    if (t === 'capo') $$('pf-name').addEventListener('input', e => this.set('name', cleanInput(e.target)));
  },
  set(k, v) {
    this.d[k] = v; this.save(); this.toMenu(k);
    if (k !== 'name') this.tab('capo'); else this.avatar();
  },
  avatar() {
    const p = this.prefs(), img = $$('pf-img'); if (!img) return;
    img.src = 'assets/characters/' + (p.char || 'Mafioso') + '/' + (p.color || 'Color_R') + '/idle.png';
    $$('pf-avatar').style.setProperty('--pc', COLORS[p.color || 'Color_R']);
    $$('pf-plate').textContent = p.name || 'Sin nombre';
  },
  capoHtml() {
    const p = this.prefs();
    setTimeout(() => this.avatar());
    return `<div class="pf-capo"><div class="pf-card"><div id="pf-avatar" class="avatar"><img id="pf-img" alt=""></div><span id="pf-plate" class="pf-plate"></span></div>
      <div class="pf-fields"><label class="pf-label" for="pf-name">Nombre</label><input id="pf-name" type="text" maxlength="16" placeholder="Capo 1" value="${esc(p.name)}">
      <span class="pf-label">Personaje</span><div class="chars">${CHARACTERS.filter(c => this.owns(c.key)).map(c => `<button type="button" class="char-btn ${(p.char || 'Mafioso') === c.key ? 'sel' : ''}" aria-pressed="${(p.char || 'Mafioso') === c.key}" onclick="PROFILE.set('char','${c.key}')">${c.label}</button>`).join('')}</div>
      <span class="pf-label">Color favorito</span><div class="swatches">${COLOR_KEYS.map(c => `<button type="button" class="sw ${p.color === c ? 'sel' : ''}" style="--c:${COLORS[c]}" data-tag="${colorTag(c)}" aria-label="${COLOR_LABELS[c]}" onclick="PROFILE.set('color','${c}')"></button>`).join('')}</div></div></div>
      <p class="pf-note">Se usan solos en tu puesto del menú y al unirte a una sala online. Puedes cambiarlos en el menú cuando quieras. Si en una sala tu color ya está ocupado, lo conserva quien entró antes.</p>
      <div id="pf-react">${this.reactHtml()}</div>
      <h3 class="pf-h">Cuenta</h3><div id="ac-zone">${typeof ACCOUNT !== 'undefined' ? ACCOUNT.html() : ''}</div>`;
  },
  histHtml() {
    const d = this.load(), pct = d.games ? Math.round(d.wins / d.games * 100) : 0;
    const fav = FILE.TITLES.filter(t => d.titles[t.key] > 0).sort((a, b) => d.titles[b.key] - d.titles[a.key])[0];
    const box = (n, l) => `<div class="pf-stat"><b>${n}</b><small>${l}</small></div>`;
    return `<div class="pf-stats">${box(d.games, 'partidas')}${box(d.wins, 'victorias')}${box(pct + '%', 'de victorias')}${box(d.online, 'online')}</div>
      <h3 class="pf-h">Por contrato</h3><table class="pf-table"><tr><th></th><th>Jugadas</th><th>Ganadas</th></tr>
      ${GAMES.map(g => `<tr><td>${GAME_NAMES[g]}</td><td>${d.by[g].p}</td><td>${d.by[g].w}</td></tr>`).join('')}<tr><td>🎉 Modo Party</td><td>${d.party.p}</td><td>${d.party.w}</td></tr></table>
      <h3 class="pf-h">Totales del Expediente</h3><div class="pf-stats">${box(d.tot.dealt, 'daño causado')}${box(d.tot.gained, 'botín y ganancias')}${box(d.tot.healed, 'curación')}${box(d.tot.nat20, '20 naturales')}</div>
      <p class="pf-fav">${fav ? 'Título más repetido: <b>' + fav.icon + ' ' + fav.name + '</b> (' + d.titles[fav.key] + ' veces)' : 'Aún no tienes títulos del Expediente.'}</p>
      <button type="button" class="pf-reset" onclick="PROFILE.reset()">🗑️ Borrar historial y logros</button>`;
  },
  achHtml() {
    const d = this.load(), n = ACHIEVEMENTS.filter(a => d.ach[a.id]).length;
    return `<p class="pf-count">${n} de ${ACHIEVEMENTS.length} logros</p><div class="pf-ach">${ACHIEVEMENTS.map(a => { const on = d.ach[a.id], veil = a.hidden && !on, g = TIERS[a.tier].gold;
      const prize = g ? '<i class="coin" aria-hidden="true"></i> ' + g : a.unlocks ? '🎭 Capo secreto' : '';
      return `<div class="ach ${on ? 'on' : ''}"><span class="ach-ic">${on ? a.icon : veil ? '❔' : '🔒'}</span><div><b>${veil ? '???' : esc(a.name)}</b><small>${veil ? 'Logro secreto. Sigue jugando…' : esc(a.desc)}</small>
        <span class="ach-meta"><span class="tier tier-${a.tier}">${TIERS[a.tier].label}</span>${veil ? '' : `<span class="ach-gold">${prize}</span>`}</span>${on ? `<em>${new Date(on).toLocaleDateString('es')}</em>` : ''}</div></div>`; }).join('')}</div>`;
  },
  shopHtml() {
    const d = this.load(), col = this.prefs().color || 'Color_R';
    const items = CHARACTERS.filter(c => c.price);
    return `<p class="pf-note">Gana oro con los logros: cuanto más difícil, más paga. Con todos los logros tendrás oro para comprar toda la tienda.</p>
      <h3 class="pf-h">Capos</h3><div class="shop">${items.map(c => { const own = this.owns(c.key), can = d.gold >= c.price;
        return `<div class="shop-item ${own ? 'own' : ''}" style="--pc:${COLORS[col]}"><div class="avatar"><img src="assets/characters/${c.key}/${col}/idle.png" alt=""></div>
          <b>${esc(c.label)}</b>${own ? '<span class="shop-own">✔ Tuyo</span>'
          : `<button type="button" class="shop-buy" ${can ? '' : 'disabled'} onclick="PROFILE.buy('${c.key}')"><i class="coin" aria-hidden="true"></i> ${c.price}</button>${can ? '' : `<small>Te faltan ${c.price - d.gold}</small>`}`}</div>`; }).join('')}</div>
      <h3 class="pf-h">Dados</h3><p class="pf-note">Próximamente: juegos de dados para personalizar tus tiradas.</p>`;
  },
  async reset() {
    if (!(await askConfirm('¿Borrar historial y logros?', 'Tu nombre, personaje y color se conservan, y también tu oro y lo que compraste. Los logros ya cobrados no vuelven a pagar. Esto no se puede deshacer.', 'SÍ, BORRAR'))) return;
    const d = this.load(), keep = { name:d.name, color:d.color, char:d.char, gold:d.gold, paid:d.paid, owned:d.owned, owner:d.owner };
    this.d = Object.assign(this.blank(), keep); this.save(); this.tab('hist');
  }
};

document.addEventListener('DOMContentLoaded', () => { if (!new URLSearchParams(location.search).get('room')) PROFILE.toMenu(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$$('modal-profile').classList.contains('hidden')) PROFILE.close(); });
