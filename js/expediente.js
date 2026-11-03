// ===== Expediente de fin de partida =====
// Una ficha policial por jefe con sus estadísticas (las cuenta core.js en G.stats), títulos y némesis.
// En Modo Party suma todos los contratos jugados.
const FILE = {
  // Títulos: se los lleva quien tenga el valor más alto (si es mayor que 0; en empate, todos).
  TITLES: [
    { key:'dealt',  icon:'🔫', name:'Gatillo Fácil',   tip:'más daño causado' },
    { key:'taken',  icon:'🥊', name:'Saco de Boxeo',   tip:'más daño recibido' },
    { key:'gained', icon:'💰', name:'Bolsillos Llenos', tip:'más botín y ganancias' },
    { key:'healed', icon:'🩹', name:'Duro de Matar',   tip:'más curación' },
    { key:'nat20',  icon:'🍀', name:'Suertudo',        tip:'más 20 naturales' },
    { key:'nat1',   icon:'🐈‍⬛', name:'Gafe',            tip:'más 1 naturales' },
    { key:'hits',   icon:'🎯', name:'Blanco Favorito', tip:'el más atacado' },
    { key:'misses', icon:'💨', name:'Mala Puntería',   tip:'más disparos fallidos o anulados' }
  ],
  STATS: [['acts', 'acciones'], ['rolls', 'tiradas'], ['dealt', 'daño causado'], ['taken', 'daño recibido'], ['gained', 'botín y ganancias'], ['healed', 'curación'], ['nat20', '20 naturales'], ['nat1', '1 naturales']],

  rows(G) {
    const st = G.stats || {}, place = {};
    ((G.result && G.result.podium) || []).forEach(e => { place[e.slot] = e.place; });
    const rows = G.players.map(p => {
      const s = Object.assign({ acts:0, rolls:0, nat20:0, nat1:0, dealt:0, taken:0, gained:0, healed:0, misses:0 }, st[p.slot] || {}), by = s.hitBy || {};
      s.hits = Object.values(by).reduce((a, b) => a + b, 0);
      const nem = Object.keys(by).sort((a, b) => by[b] - by[a])[0];
      return { p, s, place:place[p.slot], nemesis:nem != null && by[nem] > 0 ? { name:G.players[nem].name, n:by[nem] } : null, titles:[] };
    });
    this.TITLES.forEach(t => {
      const max = Math.max(...rows.map(r => r.s[t.key])); if (max <= 0) return;
      rows.filter(r => r.s[t.key] === max).forEach(r => r.titles.push(t));
    });
    return rows.sort((a, b) => (a.place || 9) - (b.place || 9));
  },
  open() {
    const G = CD.G; if (!G) return;
    const rows = this.rows(G), last = Math.max(...rows.map(r => r.place || 0)), medal = { 1:'🥇', 2:'🥈', 3:'🥉' };
    $$('file-cards').innerHTML = rows.map(r => {
      const img = r.place === 1 ? 'win' : rows.length > 2 && r.place === last ? 'lose' : 'idle', L = charList(r.p, img);
      const who = r.p.bot ? 'Bot' + (PERSONAS[r.p.persona] ? ' · ' + PERSONAS[r.p.persona].label : '') : ((CHARACTERS.find(c => c.key === r.p.char) || CHARACTERS[0]).label);
      return `<article class="mug" style="--pc:${COLORS[r.p.color]}">
        <div class="mug-photo"><img src="${L[0]}" data-c="${L.join('|')}" onerror="charNext(this)" alt=""><span class="mug-plate">Nº 1946-0${r.p.slot + 1}</span></div>
        <div class="mug-body"><h3>${r.place ? (medal[r.place] || r.place + 'º') + ' ' : ''}${esc(r.p.name)}</h3><small>${esc(who)}</small>
          <ul class="mug-stats">${this.STATS.map(([k, label]) => `<li><b>${r.s[k]}</b> ${label}</li>`).join('')}</ul>
          ${r.titles.length ? `<div class="mug-titles">${r.titles.map(t => `<span title="${t.tip}">${t.icon} ${t.name}</span>`).join('')}</div>` : ''}
          <p class="mug-nemesis">${r.nemesis ? '🗡️ Némesis: ' + esc(r.nemesis.name) + ' (' + r.nemesis.n + ' ataque' + (r.nemesis.n > 1 ? 's' : '') + ')' : '🕊️ Nadie se atrevió con este jefe'}</p></div></article>`;
    }).join('');
    $$('file-msg').textContent = '';
    $$('modal-file').classList.remove('hidden');
  },
  close() { $$('modal-file').classList.add('hidden'); },
  text() {
    const G = CD.G, rows = this.rows(G), name = CD.cfg.mode === 'party' ? 'MODO PARTY' : GAME_TITLES[CD.contract];
    return ['🕵️ CRIMINAL DICE · EXPEDIENTE · ' + name].concat(rows.map(r =>
      `${r.place ? r.place + 'º ' : ''}${r.p.name}: ${r.s.dealt} de daño, ${r.s.gained} de botín, ${r.s.nat20}×20` + (r.titles.length ? ' · ' + r.titles.map(t => t.icon + ' ' + t.name).join(', ') : '')
    )).join('\n');
  },
  copy() {
    const t = this.text(), ok = () => { $$('file-msg').textContent = '¡Resumen copiado! Pégalo en tu chat.'; };
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(ok, () => { prompt('Copia el resumen:', t); });
  }
};
