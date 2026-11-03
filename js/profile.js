// ===== Perfil del Capo =====
// Se guarda solo en este dispositivo (localStorage). Tiene tres partes:
//  · Tu Capo: nombre, personaje y color favoritos. Se ponen solos en tu puesto del menú y al unirte a una sala online
//    (siguen pudiéndose cambiar en el menú; si tu color ya está ocupado en la sala, lo conserva quien entró antes).
//  · Historial: partidas, victorias por contrato y totales del Expediente.
//  · Logros: se revisan al terminar cada partida (el tutorial no cuenta, salvo su propio logro).
// Cuenta las partidas del jugador de este dispositivo: en online tu asiento; en local, el Jefe 1.
const ACHIEVEMENTS = [
  { id:'primer_golpe', icon:'🥃', name:'Primer Golpe',          desc:'Gana tu primera partida.',                              test:c => c.won },
  { id:'guerra',       icon:'🔫', name:'Señor de la Guerra',    desc:'Gana una Guerra de Bandas (contrato único).',            test:c => c.won && c.single('rpg') },
  { id:'atraco',       icon:'💰', name:'Golpe Maestro',         desc:'Gana El Gran Atraco (contrato único).',                  test:c => c.won && c.single('exp') },
  { id:'imperio',      icon:'🏛️', name:'Magnate',               desc:'Gana Imperio Criminal (contrato único).',                test:c => c.won && c.single('maf') },
  { id:'apuestas',     icon:'🎰', name:'Tahúr de Ley',          desc:'Gana Apuestas Clandestinas (contrato único).',           test:c => c.won && c.single('pok') },
  { id:'toda_ciudad',  icon:'🗺️', name:'Toda la Ciudad',        desc:'Gana los cuatro contratos al menos una vez.',            test:c => GAMES.every(g => c.d.by[g].w > 0) },
  { id:'party',        icon:'🎉', name:'Rey de la Fiesta',      desc:'Gana un Modo Party.',                                    test:c => c.won && c.party },
  { id:'intocable',    icon:'🛡️', name:'Intocable',             desc:'Gana una partida sin recibir daño ni pérdidas.',          test:c => c.won && c.s.taken === 0 },
  { id:'sin_medico',   icon:'💪', name:'Sin Médico',            desc:'Gana una Guerra de Bandas sin curarte.',                 test:c => c.won && c.single('rpg') && c.s.healed === 0 },
  { id:'huida',        icon:'🚗', name:'Huida Perfecta',        desc:'Asegura 25 de botín o más en El Gran Atraco.',           test:c => c.single('exp') && (c.p.secured || 0) >= 25 },
  { id:'trebol',       icon:'🍀', name:'Trébol de Cuatro Hojas', desc:'Saca tres 20 naturales en una misma partida.',          test:c => c.s.nat20 >= 3 },
  { id:'gato',         icon:'🐈‍⬛', name:'Gato Negro',            desc:'Saca tres 1 naturales en una misma partida.',            test:c => c.s.nat1 >= 3 },
  { id:'maquinas',     icon:'🤖', name:'Domador de Máquinas',   desc:'Gana contra 3 bots.',                                    test:c => c.won && c.G.players.filter(q => q.bot).length >= 3 },
  { id:'sindicato',    icon:'🌐', name:'Socio del Sindicato',   desc:'Termina una partida online.',                            test:c => !!CD.cfg.online },
  { id:'coleccionista', icon:'🗂️', name:'Coleccionista',        desc:'Consigue los 8 títulos del Expediente.',                 test:c => FILE.TITLES.every(t => c.d.titles[t.key] > 0) },
  { id:'veterano',     icon:'📅', name:'Veterano',              desc:'Juega 10 partidas.',                                     test:c => c.d.games >= 10 },
  { id:'leyenda',      icon:'👑', name:'Leyenda de la Ciudad',  desc:'Gana 25 partidas.',                                      test:c => c.d.wins >= 25 },
  { id:'graduado',     icon:'🎓', name:'Graduado',              desc:'Completa el tutorial.',                                  test:() => false }
];

const PROFILE = {
  KEY:'cd-profile', d:null, cur:'capo', queue:[],
  blank() {
    return { name:'', color:null, char:null, games:0, wins:0, online:0,
      by:Object.fromEntries(GAMES.map(g => [g, { p:0, w:0 }])), party:{ p:0, w:0 },
      tot:{ dealt:0, gained:0, healed:0, nat20:0, nat1:0, acts:0 }, titles:{}, ach:{} };
  },
  load() {
    if (this.d) return this.d;
    let saved = {}; try { saved = JSON.parse(localStorage.getItem(this.KEY) || '{}') || {}; } catch (e) {}
    const b = this.blank();
    this.d = Object.assign(b, saved, { by:Object.assign(b.by, saved.by), party:Object.assign(b.party, saved.party), tot:Object.assign(b.tot, saved.tot) });
    return this.d;
  },
  save() { try { localStorage.setItem(this.KEY, JSON.stringify(this.d)); } catch (e) {} },
  prefs() { const d = this.load(); return { name:(d.name || '').trim(), color:COLORS[d.color] ? d.color : null, char:CHARACTERS.some(c => c.key === d.char) ? d.char : null }; },

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
    d.ach[id] = Date.now(); if (!quiet) this.save();
    this.queue.push(a); if (this.queue.length === 1) this.toast();
  },
  toast() {                                        // aviso de logro, uno tras otro
    const a = this.queue[0], t = $$('ach-toast'); if (!a) return;
    t.innerHTML = `<span class="ach-ic">${a.icon}</span><span><small>LOGRO DESBLOQUEADO</small><b>${esc(a.name)}</b></span>`;
    t.classList.remove('hidden'); playSound('coin');
    setTimeout(() => { t.classList.add('hidden'); this.queue.shift(); setTimeout(() => this.toast(), 300); }, 3500);
  },

  // ---------- ventana del perfil ----------
  open() { this.load(); settingsToggle(false); this.tab(this.cur); $$('modal-profile').classList.remove('hidden'); },
  close() { $$('modal-profile').classList.add('hidden'); },
  tab(t) {
    this.cur = t;
    document.querySelectorAll('#modal-profile .tab-btn').forEach(b => { const on = b.dataset.tab === t; b.classList.toggle('active', on); b.setAttribute('aria-selected', on); });
    $$('profile-body').innerHTML = t === 'capo' ? this.capoHtml() : t === 'hist' ? this.histHtml() : this.achHtml();
    if (t === 'capo') $$('pf-name').addEventListener('input', e => this.set('name', e.target.value));
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
      <span class="pf-label">Personaje</span><div class="chars">${CHARACTERS.map(c => `<button type="button" class="char-btn ${(p.char || 'Mafioso') === c.key ? 'sel' : ''}" aria-pressed="${(p.char || 'Mafioso') === c.key}" onclick="PROFILE.set('char','${c.key}')">${c.label}</button>`).join('')}</div>
      <span class="pf-label">Color favorito</span><div class="swatches">${COLOR_KEYS.map(c => `<button type="button" class="sw ${p.color === c ? 'sel' : ''}" style="--c:${COLORS[c]}" data-tag="${colorTag(c)}" aria-label="${COLOR_LABELS[c]}" onclick="PROFILE.set('color','${c}')"></button>`).join('')}</div></div></div>
      <p class="pf-note">Se usan solos en tu puesto del menú y al unirte a una sala online. Puedes cambiarlos en el menú cuando quieras. Si en una sala tu color ya está ocupado, lo conserva quien entró antes.</p>`;
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
    return `<p class="pf-count">${n} de ${ACHIEVEMENTS.length} logros</p><div class="pf-ach">${ACHIEVEMENTS.map(a => { const on = d.ach[a.id];
      return `<div class="ach ${on ? 'on' : ''}"><span class="ach-ic">${on ? a.icon : '🔒'}</span><div><b>${esc(a.name)}</b><small>${esc(a.desc)}</small>${on ? `<em>${new Date(on).toLocaleDateString('es')}</em>` : ''}</div></div>`; }).join('')}</div>`;
  },
  async reset() {
    if (!(await askConfirm('¿Borrar historial y logros?', 'Tu nombre, personaje y color se conservan. Esto no se puede deshacer.', 'SÍ, BORRAR'))) return;
    const d = this.load(), keep = { name:d.name, color:d.color, char:d.char };
    this.d = Object.assign(this.blank(), keep); this.save(); this.tab('hist');
  }
};

document.addEventListener('DOMContentLoaded', () => { if (!new URLSearchParams(location.search).get('room')) PROFILE.toMenu(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$$('modal-profile').classList.contains('hidden')) PROFILE.close(); });
