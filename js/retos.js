// ===== Retos del día y Misiones de la semana =====
// Sin trabajo manual: cada día el juego elige PER_DAY retos de DAILY y cada semana (de lunes a domingo) PER_WEEK misiones
// de WEEKLY. Se sacan al azar SIN repetir hasta agotar la lista; después la lista se baraja de nuevo y vuelve a empezar.
// El sorteo depende solo de la fecha, así que todos los jugadores tienen los mismos ese día (no hace falta servidor).
// Para añadir más: agrega líneas a DAILY o WEEKLY (id único, icono, texto, meta y cuánto suma cada partida).
//  · inc(c) recibe lo mismo que los logros (ver PROFILE.record) más: c.cw(g) = contratos de tipo g que ganaste en esa
//    partida (contrato único o dentro de un Modo Party), c.place = tu puesto y c.bots = cuántos bots había.
// Oro: lo que se gana aquí cuenta como oro "de partidas" (d.earned), aparte del de los logros.
const RETOS = {
  PER_DAY:2, PER_WEEK:3, DAILY_GOLD:10, WEEKLY_GOLD:40,
  DAILY: [
    { id:'d_gana1',    icon:'🏆', text:'Gana una partida',                              goal:1,  inc:c => c.won ? 1 : 0 },
    { id:'d_gana2',    icon:'🏆', text:'Gana dos partidas',                             goal:2,  inc:c => c.won ? 1 : 0 },
    { id:'d_juega2',   icon:'🎲', text:'Juega dos partidas',                            goal:2,  inc:() => 1 },
    { id:'d_juega3',   icon:'🎲', text:'Juega tres partidas',                           goal:3,  inc:() => 1 },
    { id:'d_rpg',      icon:'🔫', text:'Gana una Guerra de Bandas',                     goal:1,  inc:c => c.cw('rpg') },
    { id:'d_exp',      icon:'💰', text:'Gana un Gran Atraco',                           goal:1,  inc:c => c.cw('exp') },
    { id:'d_maf',      icon:'🏛️', text:'Gana un Imperio Criminal',                      goal:1,  inc:c => c.cw('maf') },
    { id:'d_pok',      icon:'🎰', text:'Gana unas Apuestas Clandestinas',               goal:1,  inc:c => c.cw('pok') },
    { id:'d_20',       icon:'🍀', text:'Saca un 20 natural',                            goal:1,  inc:c => c.s.nat20 },
    { id:'d_20x2',     icon:'🍀', text:'Saca dos 20 naturales',                         goal:2,  inc:c => c.s.nat20 },
    { id:'d_20x3',     icon:'🍀', text:'Saca tres 20 naturales',                        goal:3,  inc:c => c.s.nat20 },
    { id:'d_1',        icon:'🐈‍⬛', text:'Saca un 1 natural (alguien tiene que hacerlo)', goal:1,  inc:c => c.s.nat1 },
    { id:'d_dmg30',    icon:'💥', text:'Causa 30 de daño',                              goal:30, inc:c => c.s.dealt },
    { id:'d_dmg60',    icon:'💥', text:'Causa 60 de daño',                              goal:60, inc:c => c.s.dealt },
    { id:'d_bot20',    icon:'💵', text:'Consigue 20 de botín y ganancias',              goal:20, inc:c => c.s.gained },
    { id:'d_cura15',   icon:'🩹', text:'Cúrate 15 en total',                            goal:15, inc:c => c.s.healed },
    { id:'d_acts25',   icon:'⚡', text:'Realiza 25 acciones',                           goal:25, inc:c => c.s.acts },
    { id:'d_online',   icon:'🌐', text:'Juega una partida online',                      goal:1,  inc:c => c.online ? 1 : 0 },
    { id:'d_onwin',    icon:'🌐', text:'Gana una partida online',                       goal:1,  inc:c => c.online && c.won ? 1 : 0 },
    { id:'d_bots2',    icon:'🤖', text:'Gana contra al menos 2 bots',                   goal:1,  inc:c => c.won && c.bots >= 2 ? 1 : 0 },
    { id:'d_bots3',    icon:'🤖', text:'Juega una partida contra 3 bots',               goal:1,  inc:c => c.bots >= 3 ? 1 : 0 },
    { id:'d_podio2',   icon:'🥉', text:'Termina en el podio dos veces',                 goal:2,  inc:c => c.place >= 1 && c.place <= 3 ? 1 : 0 },
    { id:'d_party',    icon:'🎉', text:'Juega un Modo Party',                           goal:1,  inc:c => c.party ? 1 : 0 },
    { id:'d_partyw',   icon:'🎉', text:'Gana un Modo Party',                            goal:1,  inc:c => c.party && c.won ? 1 : 0 },
    { id:'d_asegura',  icon:'🚗', text:'Asegura 15 de botín en El Gran Atraco',         goal:15, inc:c => c.G.contract === 'exp' ? (c.p.secured || 0) : 0 },
    { id:'d_sincura',  icon:'💪', text:'Gana una Guerra de Bandas sin curarte',         goal:1,  inc:c => c.cw('rpg') && c.s.healed === 0 ? 1 : 0 },
    { id:'d_mercado',  icon:'🛒', text:'Gana una partida con el Mercado Negro',         goal:1,  inc:c => c.won && CD.cfg.market ? 1 : 0 },
    { id:'d_eventos',  icon:'📰', text:'Gana una partida con Eventos de Ciudad',        goal:1,  inc:c => c.won && CD.cfg.events ? 1 : 0 },
    { id:'d_ileso',    icon:'🛡️', text:'Gana recibiendo menos de 10 de daño',           goal:1,  inc:c => c.won && c.s.taken < 10 ? 1 : 0 },
    { id:'d_fichas',   icon:'🪙', text:'Gana unas Apuestas con 12 fichas o más',        goal:1,  inc:c => c.cw('pok') && c.G.contract === 'pok' && (c.p.tokens || 0) >= 12 ? 1 : 0 }
  ],
  WEEKLY: [
    { id:'w_rpg3',     icon:'🔫', text:'Gana 3 Guerras de Bandas',                      goal:3,   inc:c => c.cw('rpg') },
    { id:'w_exp3',     icon:'💰', text:'Gana 3 Grandes Atracos',                        goal:3,   inc:c => c.cw('exp') },
    { id:'w_maf3',     icon:'🏛️', text:'Gana 3 Imperios Criminales',                    goal:3,   inc:c => c.cw('maf') },
    { id:'w_pok3',     icon:'🎰', text:'Gana 3 Apuestas Clandestinas',                  goal:3,   inc:c => c.cw('pok') },
    { id:'w_gana5',    icon:'🏆', text:'Gana 5 partidas',                               goal:5,   inc:c => c.won ? 1 : 0 },
    { id:'w_juega10',  icon:'🎲', text:'Juega 10 partidas',                             goal:10,  inc:() => 1 },
    { id:'w_party2',   icon:'🎉', text:'Gana 2 Modos Party',                            goal:2,   inc:c => c.party && c.won ? 1 : 0 },
    { id:'w_pcontr',   icon:'🎉', text:'Gana 5 contratos dentro del Modo Party',        goal:5,   inc:c => c.party ? GAMES.reduce((n, g) => n + c.cw(g), 0) : 0 },
    { id:'w_online5',  icon:'🌐', text:'Juega 5 partidas online',                       goal:5,   inc:c => c.online ? 1 : 0 },
    { id:'w_onwin3',   icon:'🌐', text:'Gana 3 partidas online',                        goal:3,   inc:c => c.online && c.won ? 1 : 0 },
    { id:'w_20x8',     icon:'🍀', text:'Saca 8 veintes naturales',                      goal:8,   inc:c => c.s.nat20 },
    { id:'w_dmg300',   icon:'💥', text:'Causa 300 de daño',                             goal:300, inc:c => c.s.dealt },
    { id:'w_bot150',   icon:'💵', text:'Consigue 150 de botín y ganancias',             goal:150, inc:c => c.s.gained },
    { id:'w_cura100',  icon:'🩹', text:'Cúrate 100 en total',                           goal:100, inc:c => c.s.healed },
    { id:'w_podio6',   icon:'🥉', text:'Termina en el podio 6 veces',                   goal:6,   inc:c => c.place >= 1 && c.place <= 3 ? 1 : 0 },
    { id:'w_bots3',    icon:'🤖', text:'Gana 3 partidas contra 3 bots',                 goal:3,   inc:c => c.won && c.bots >= 3 ? 1 : 0 },
    { id:'w_todos',    icon:'🗺️', text:'Gana los 4 contratos esta semana',              goal:4,   inc:() => 0, set:(c, st) => GAMES.filter(g => (st.seen = st.seen || {})[g] || (c.cw(g) && (st.seen[g] = true))).length },
    { id:'w_ileso',    icon:'🛡️', text:'Gana 2 partidas recibiendo menos de 10 de daño', goal:2,  inc:c => c.won && c.s.taken < 10 ? 1 : 0 }
  ],
  // ---------- fechas (hora local del jugador): día y semana (lunes a domingo) como números ----------
  dayNo(t) { const d = new Date(t || Date.now()); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); },
  weekNo(t) { return Math.floor((this.dayNo(t) + 3) / 7); },             // el día 0 (1-1-1970) fue jueves: +3 hace empezar en lunes
  // ---------- sorteo sin repetir: la lista se baraja por "vueltas" y cada día/semana toma el siguiente grupo ----------
  rand(seed) { return () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; },
  pick(list, n, per, salt) {
    const groups = Math.floor(list.length / per), round = Math.floor(n / groups), k = n % groups;
    const r = this.rand(round * 7919 + salt), ids = list.map(x => x.id);
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    return ids.slice(k * per, k * per + per).map(id => list.find(x => x.id === id));
  },
  today() { return this.pick(this.DAILY, this.dayNo(), this.PER_DAY, 101); },
  thisWeek() { return this.pick(this.WEEKLY, this.weekNo(), this.PER_WEEK, 202); },
  // ---------- avance guardado en el perfil: d.retos = { day, dp, dd, week, wp, wd, ws } ----------
  state(d) {
    const day = this.dayNo(), week = this.weekNo(), r = d.retos = d.retos || {};
    if (r.day !== day) Object.assign(r, { day, dp:{}, dd:{} });
    if (r.week !== week) Object.assign(r, { week, wp:{}, wd:{}, ws:{} });
    return r;
  },
  last:null,                                       // lo que avanzó la última partida (para el final de la partida)
  // Suma una partida terminada. Devuelve [{ kind, def, prog, before, done, now }] y paga el oro de los que se completan.
  track(c, d) {
    const r = this.state(d), out = [];
    const step = (kind, def, prog, done, gold) => {
      const before = prog[def.id] || 0;
      let now = def.set ? def.set(c, (r.ws[def.id] = r.ws[def.id] || {})) : before + Math.max(0, def.inc(c) || 0);
      now = Math.min(def.goal, now); prog[def.id] = now;
      const fresh = now >= def.goal && !done[def.id];
      if (fresh) { done[def.id] = true; d.gold += gold; d.earned = (d.earned || 0) + gold; }
      out.push({ kind, def, before, now, done:!!done[def.id], fresh, gold });
    };
    this.today().forEach(def => step('dia', def, r.dp, r.dd, this.DAILY_GOLD));
    this.thisWeek().forEach(def => step('semana', def, r.wp, r.wd, this.WEEKLY_GOLD));
    this.last = out;
    return out;
  },
  // ---------- dibujo ----------
  row(x) {
    const pct = Math.round(x.now / x.def.goal * 100), up = x.now > x.before;
    return `<li class="reto ${x.done ? 'done' : ''} ${up ? 'up' : ''}"><span class="reto-ic" aria-hidden="true">${x.done ? '✅' : x.def.icon}</span>
      <span class="reto-t">${esc(x.def.text)}<small>${x.kind === 'dia' ? 'Reto del día' : 'Misión de la semana'} · <i class="coin" aria-hidden="true"></i> ${x.gold}${x.done ? ' · completado' : ''}</small></span>
      <span class="reto-n">${x.fresh ? '<span class="reto-up">+' + x.gold + '</span> ' : up && !x.done ? '<span class="reto-up">+' + (x.now - x.before) + '</span> ' : ''}${x.now}/${x.def.goal}</span><span class="reto-bar" aria-hidden="true"><b style="width:${pct}%"></b></span></li>`;
  },
  current(d) {                                     // lista actual (sin sumar nada) para el Perfil
    const r = this.state(d), mk = (kind, def, prog, done, gold) => { const n = prog[def.id] || 0; return { kind, def, before:n, now:n, done:!!done[def.id], fresh:false, gold }; };
    return this.today().map(def => mk('dia', def, r.dp, r.dd, this.DAILY_GOLD)).concat(this.thisWeek().map(def => mk('semana', def, r.wp, r.wd, this.WEEKLY_GOLD)));
  },
  overHtml() {                                     // pequeño, al final de la partida: lo que hay y cuánto avanzaste
    if (!this.last) return '';
    return `<div class="over-retos betbook"><p class="over-retos-h">🎯 Retos del día y misiones · ${this.last.filter(x => x.done).length}/${this.last.length}</p><ul class="retos">${this.last.map(x => this.row(x)).join('')}</ul></div>`;
  },
  tabHtml(d) {                                     // pestaña del Perfil
    const all = this.current(d), now = new Date(), mid = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const h = Math.max(1, Math.ceil((mid - now) / 36e5)), daysLeft = 7 - ((this.dayNo() + 3) % 7);
    return `<p class="pf-note">Cada día salen ${this.PER_DAY} retos nuevos y cada lunes ${this.PER_WEEK} misiones, iguales para todos los capos. Avanzan al terminar cualquier partida (local u online, el tutorial no cuenta). Pagan <i class="coin" aria-hidden="true"></i> ${this.DAILY_GOLD} cada reto y <i class="coin" aria-hidden="true"></i> ${this.WEEKLY_GOLD} cada misión.</p>
      <div class="betbook"><h3 class="bet-h">Retos del día <small class="retos-left">· cambian en ${h} h</small></h3><ul class="retos">${all.filter(x => x.kind === 'dia').map(x => this.row(x)).join('')}</ul>
      <h3 class="bet-h">Misiones de la semana <small class="retos-left">· cambian en ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'}</small></h3><ul class="retos">${all.filter(x => x.kind === 'semana').map(x => this.row(x)).join('')}</ul></div>`;
  }
};
