// ===== Tutorial jugable =====
// Una Guerra de Bandas local contra un bot "Instructor", con un panel que guía paso a paso, y después un vistazo
// rápido (una jugada) a los otros tres contratos, al Modo Party y al Mercado Negro.
// Cada paso se muestra cuando "show" se cumple y avanza con su botón o solo, cuando "done" se cumple.
//  · allow: acciones que se pueden pulsar en ese paso (los pasos con botón bloquean todas).
//  · bot:true: el único paso en que el bot puede jugar; en los demás espera.
//  · ready: el botón solo aparece cuando se cumple (p. ej. cuando el dado ya se resolvió).
//  · next: qué hace el botón además de avanzar.
const TUT = {
  i:0, off:true, seen:-1, base:0, release:null,
  acts: slot => (CD.G.stats && CD.G.stats[slot] && CD.G.stats[slot].acts) || 0,
  did() { return this.acts(0) > this.base; },                                     // ya jugó desde que empezó este paso
  myTurn() { const G = CD.G, cur = G.players[G.turn]; return G.started && !G.wait && !G.over && CD.canAct(cur); },
  idle: () => !CD.G.wait,
  items(ids) {                                                                     // tarjetas del Mercado Negro con los datos reales
    return '<span class="coach-items">' + ids.map(id => { const it = ITEM_BY_ID[id];
      return `<span class="coach-item"><b>${it.icon} ${esc(it.name)}</b><em>${it.kind === 'c' ? 'Consumible' : 'Contacto'} · ${it.cost}💲</em><small>${esc(it.desc)}</small></span>`; }).join('') + '</span>';
  },
  STEPS: [
    // ---- Guerra de Bandas guiada ----
    { text:'Bienvenido, Capo. Empezamos con una <b>Guerra de Bandas</b> contra el bot Instructor: gana el último jefe en pie. Al final darás un vistazo rápido a los otros contratos, al Modo Party y al Mercado Negro.', button:'Siguiente' },
    { show:t => CD.G.started, text:'Cada jefe lanzó <b>3 dados de 6 caras + 10</b> para su salud. Estas son las <b>fichas de los jefes</b>: la barra es la salud y el borde dorado marca de quién es el turno.', focus:'#g-players', button:'Siguiente' },
    { show:t => t.myTurn(), text:'Es tu turno. Aquí están tus <b>acciones</b>. La etiqueta dorada es la <b>probabilidad de éxito</b> de cada una.', focus:'#g-actions', button:'Siguiente' },
    { show:t => t.myTurn(), text:'Las notas como <b>d6, d20, d8 o d4</b> indican qué dado se lanza: la <b>d</b> es "dado" y el número, sus caras. <b>d6</b> da de 1 a 6, <b>d20</b> de 1 a 20. "<b>d20 ≥ 11</b>" significa que necesitas sacar 11 o más para acertar.', focus:'#g-actions', button:'Siguiente' },
    { show:t => t.myTurn(), text:'Usa la <b>⚡ Ráfaga Tommy Gun</b>: lanza un <b>d6</b> y ese es el daño. Con un solo rival, el objetivo se elige solo.', focus:'#g-actions', allow:['quick'], done:t => t.did() },
    { text:'El <b>dado</b> decide el resultado y el daño aparece sobre la ficha del rival. Ojo: un disparo mayor que la salud que le queda al rival se <b>anula</b>.', focus:'#g-players', ready:t => t.idle(), button:'Siguiente' },
    { text:'Ahora juega el bot. Cada bot tiene una <b>personalidad</b> (mira la etiqueta de su ficha) que cambia su estilo.', focus:'#g-players', bot:true, done:t => t.myTurn() },
    { text:'Tienes más armas: <b>🔫 Francotirador</b> (d20 para acertar y d12 de daño), <b>🩺 Médico</b> (cura un d8) y <b>🕵️ Soplón</b> (1 de daño en cada turno durante un d4 de rondas). Prueba una.', focus:'#g-actions', allow:['strong', 'heal', 'poison'], done:t => t.did() },
    { text:'¡Ya sabes combatir! La Guerra sigue hasta que quede un jefe; al final verás el podio y el <b>📁 Expediente</b> con las estadísticas. Ahora, un vistazo a los demás contratos.', ready:t => t.idle(), button:'Ver El Gran Atraco', next:() => TUT.taste('exp') },
    // ---- El Gran Atraco ----
    { show:TUT_ON('exp'), text:'<b>💰 El Gran Atraco</b>: la barra es tu <b>Cobertura</b>. Saqueas botín (💰) sin asegurar; si la Cobertura llega a 0 te arrestan y lo pierdes. Prueba <b>📦 Saquear Cajas</b> (d6).', focus:'#g-actions', allow:['explore'], done:t => t.did() },
    { text:'Cuando quieras retirarte, el <b>🚗 Coche de Escape</b> asegura tu botín (🔒) y sales del atraco. También puedes forzar la bóveda, reforzarte o lanzar granadas. Gana quien asegure más en 3 atracos.', focus:'#g-players', ready:t => t.idle(), button:'Ver Imperio Criminal', next:() => TUT.taste('maf') },
    // ---- Imperio Criminal ----
    { show:TUT_ON('maf'), text:'<b>🌆 Imperio Criminal</b>: cada jefe controla distritos del 1 al 6. Tu turno tiene 2 fases. Primero, la <b>recaudación</b>: el dado elige un distrito y cobran todos los que lo tengan. Prueba una.', focus:'#g-actions', allow:['harvest6', 'harvest12', 'opt:egoist'], done:t => t.did() },
    { show:TUT_ON('maf'), text:'Ahora tu <b>acción</b>: comprar distritos, <b>sobornar políticos</b> para ganar Influencia o lanzar una redada al rival. Gana quien llegue a <b>15 de Influencia</b>. Si aún no tienes efectivo (💵), <b>pasa el turno</b> y ahorra.', focus:'#g-actions', done:t => t.did() },
    { text:'Más distritos = más cobros, y el dinero compra Influencia. ¡Así se construye un imperio!', ready:t => t.idle(), button:'Ver Apuestas Clandestinas', next:() => TUT.taste('pok') },
    // ---- Apuestas Clandestinas ----
    { show:TUT_ON('pok'), text:'<b>🎰 Apuestas Clandestinas</b>: todos empiezan con <b>8 fichas</b> y se las roban entre sí durante 8 rondas. Prueba una <b>Apuesta Básica</b>: con un d6 de 4 o más le quitas 1 ficha al rival; si no, se la das tú.', focus:'#g-actions', allow:['bet'], done:t => t.did() },
    { text:'El <b>💥 Golpe a la Mesa</b> arriesga más fichas por un gran robo y la <b>🎭 Trampa de Tahúr</b> roba sin riesgo, pero tiene que recargar. Quien se queda sin fichas cae en bancarrota.', focus:'#g-players', ready:t => t.idle(), button:'Siguiente' },
    // ---- Modo Party, Mercado Negro y eventos ----
    { text:'<b>🎉 Modo Party</b>: marcas varios contratos y eliges cuántas victorias hacen falta. Se juegan seguidos; tras cada uno hay podio y recompensa en 💲 según tu puesto. Gana quien llegue primero a esas victorias.', button:'Siguiente' },
    { html:() => 'En el <b>🕶️ Mercado Negro</b> compras <b>contactos</b> (efectos pasivos, máximo ' + ECON.MAX_PASSIVES + ') y un <b>consumible</b> que usas desde tu turno. Empiezas con ' + ECON.START_PARTY + '💲 en Party (' + ECON.START_SINGLE + '💲 en un solo contrato). Algunos objetos:' +
        TUT.items(['contact_armero', 'contact_matasanos', 'item_puro', 'item_soborno']), button:'Siguiente' },
    { text:'Con los <b>📰 Eventos de Ciudad</b>, un titular cambia las reglas del contrato: <b>Noche de Purga</b> (+2 de daño), <b>Ley Seca</b> (menos curación) o un jefe como <b>El Carnicero</b>, que paga el doble a quien lo vence. Se activan en el menú.', button:'Siguiente' },
    { text:'¡Listo, Capo! En el menú elige tu personaje y color, añade amigos o bots y monta tu partida, local u online.', button:'Volver al menú', last:true, next:() => CD.exit() }
  ],

  start() {
    if (online()) setMode('local');
    const me = S.players[0], color = me.color;
    const cfg = { room:null, online:false, market:false, events:false, dice:'virtual', mode:'single', contract:'rpg', tutorial:true,
      players:[{ slot:0, bot:false, uid:null, rk:null, char:me.char || 'Mafioso', name:(me.name || '').trim() || 'Capo 1', color },
               { slot:1, bot:true, uid:null, rk:null, char:'Bot', name:'Instructor', color:COLOR_KEYS.find(c => c !== color) }] };
    this.i = 0; this.seen = -1; this.off = false; this.build();
    emitStart(cfg);
  },
  ready() { return this.off || this.i > 0 ? Promise.resolve() : new Promise(r => { this.release = r; }); },   // la partida arranca tras la bienvenida
  holdBot() { return !this.off && !this.STEPS[this.i].bot; },
  allows(type) { if (this.off) return true; const s = this.STEPS[this.i]; return !s.button && (!s.allow || s.allow.includes(type)); },
  async taste(c) {                                  // una mano rápida de otro contrato, con los mismos jefes
    const G = CD.G;
    CD.contract = c; CD.applyContractUI();
    const N = CD.freshGame(G.players); N.players.forEach((p, k) => { p.persona = G.players[k].persona; });
    N.log = G.log; N.stats = G.stats; CD.G = N;
    CD.log('🎬 ——— Vistazo: ' + GAME_TITLES[c] + ' ———'); render();
    await CD.mod().init(N); MK.contractStart(N);
    N.started = true; N.wait = false; render();
  },
  build() {
    if ($$('coach')) return;
    const c = document.createElement('aside'); c.id = 'coach'; c.className = 'hidden'; c.setAttribute('role', 'status');
    c.innerHTML = '<p class="coach-kicker">🎓 TUTORIAL · <span id="coach-step"></span></p><p id="coach-text"></p><div class="coach-btns"><button id="coach-skip" type="button" class="coach-skip">Saltar tutorial</button><button id="coach-next" type="button" class="coach-next"></button></div>';
    document.body.appendChild(c);
    $$('coach-next').onclick = () => this.advance();
    $$('coach-skip').onclick = () => this.stop();
  },
  advance() {
    const s = this.STEPS[this.i];
    if (s.last) { this.stop(); if (s.next) s.next(); return; }
    this.i++;
    if (this.release) { const r = this.release; this.release = null; r(); }
    if (s.next) s.next();
    this.update(); render(); CD.next();
  },
  stop() {                                          // saltar o terminar: la partida sigue sin ayudas
    this.off = true; this.focus(null); $$('coach').classList.add('hidden'); document.body.classList.remove('tutorial');
    if (this.release) { const r = this.release; this.release = null; r(); }
    if (CD.G) { render(); CD.next(); }
  },
  focus(sel) {
    document.querySelectorAll('.coach-focus').forEach(e => e.classList.remove('coach-focus'));
    const el = sel && document.querySelector(sel); if (el) el.classList.add('coach-focus');
  },
  update() {                                              // lo llama render() en cada cambio
    if (this.off || !CD.G) return;
    let s;
    for (;;) {
      s = this.STEPS[this.i];
      if (this.seen !== this.i) { this.seen = this.i; this.base = this.acts(0); }
      if (s.done && !s.last && s.done(this)) { this.i++; continue; }
      break;
    }
    document.querySelectorAll('#g-actions .opt').forEach(b => { if (!this.allows(b.dataset.type)) b.disabled = true; });
    const box = $$('coach'), visible = !s.show || s.show(this);
    box.classList.toggle('hidden', !visible || CD.G.over && !s.last);
    if (!visible) return this.focus(null);
    $$('coach-step').textContent = (this.i + 1) + ' / ' + this.STEPS.length;
    $$('coach-text').innerHTML = s.html ? s.html() : s.text;
    const nb = $$('coach-next'), btn = s.button && (!s.ready || s.ready(this)); nb.classList.toggle('hidden', !btn); nb.textContent = s.button || '';
    this.focus(s.focus);
  }
};
function TUT_ON(c) { return t => CD.contract === c && t.myTurn(); }
