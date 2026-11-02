// ===== Tutorial jugable =====
// Una Guerra de Bandas local contra un bot "Instructor", con un panel que guía paso a paso.
// Cada paso se muestra cuando "show" se cumple y avanza con su botón o solo, cuando "done" se cumple.
const TUT = {
  i:0, off:false,
  acts: slot => (CD.G.stats && CD.G.stats[slot] && CD.G.stats[slot].acts) || 0,
  myTurn() { const G = CD.G, cur = G.players[G.turn]; return G.started && !G.wait && !G.over && CD.canAct(cur); },
  STEPS: [
    { text:'Bienvenido a la <b>Guerra de Bandas</b>, Capo. Te enfrentas al bot Instructor: gana el último jefe en pie.', button:'Siguiente' },
    { text:'Estas son las <b>fichas de los jefes</b>. La barra es la salud y el borde dorado marca de quién es el turno.', focus:'#g-players', button:'Siguiente' },
    { show:t => t.myTurn(), text:'Es tu turno. Aquí están tus <b>acciones</b>; la etiqueta indica la probabilidad de éxito de cada una.', focus:'#g-actions', button:'Siguiente' },
    { text:'Usa la <b>⚡ Ráfaga Tommy Gun</b>. Con un solo rival, el objetivo se elige solo.', focus:'#g-actions', done:t => t.acts(0) >= 1 },
    { text:'¡Bien! El <b>dado</b> decide el resultado. Ojo: aquí un disparo mayor que la salud que le queda al rival se <b>anula</b>.', button:'Siguiente' },
    { text:'Ahora juega el bot. Cada bot tiene una <b>personalidad</b> (mira la etiqueta de su ficha) que cambia su estilo.', focus:'#g-players', done:t => t.acts(1) >= 1 && t.myTurn() },
    { text:'Tienes más armas: <b>🔫 Francotirador</b> (50%, mucho daño), <b>🩺 Médico</b> para curarte y <b>🕵️ Soplón</b>, que daña en cada turno. Prueba otra.', focus:'#g-actions', done:t => t.acts(0) >= 2 },
    { text:'¡Ya sabes lo básico! Termina la partida: al final verás el podio y el <b>📁 Expediente</b>. En el menú te esperan 3 contratos más, el Modo Party y el Mercado Negro.', button:'Entendido', last:true }
  ],

  start() {
    if (online()) setMode('local');
    const me = S.players[0], color = me.color;
    const cfg = { room:null, online:false, market:false, events:false, dice:'virtual', mode:'single', contract:'rpg', tutorial:true,
      players:[{ slot:0, bot:false, uid:null, rk:null, char:me.char || 'Mafioso', name:(me.name || '').trim() || 'Capo 1', color },
               { slot:1, bot:true, uid:null, rk:null, char:'Bot', name:'Instructor', color:COLOR_KEYS.find(c => c !== color) }] };
    this.i = 0; this.off = false; this.build(); document.body.classList.add('tutorial');
    emitStart(cfg);
  },
  build() {
    if ($$('coach')) return;
    const c = document.createElement('aside'); c.id = 'coach'; c.className = 'hidden'; c.setAttribute('role', 'status');
    c.innerHTML = '<p class="coach-kicker">🎓 TUTORIAL · <span id="coach-step"></span></p><p id="coach-text"></p><div class="coach-btns"><button id="coach-skip" type="button" class="coach-skip">Saltar tutorial</button><button id="coach-next" type="button" class="coach-next"></button></div>';
    document.body.appendChild(c);
    $$('coach-next').onclick = () => this.advance();
    $$('coach-skip').onclick = () => this.stop();
  },
  advance() { if (this.STEPS[this.i].last) return this.stop(); this.i++; this.update(); },
  stop() { this.off = true; this.focus(null); $$('coach').classList.add('hidden'); document.body.classList.remove('tutorial'); },
  focus(sel) {
    document.querySelectorAll('.coach-focus').forEach(e => e.classList.remove('coach-focus'));
    const el = sel && document.querySelector(sel); if (el) el.classList.add('coach-focus');
  },
  update() {                                              // lo llama render() en cada cambio
    if (this.off || !CD.G) return;
    let s = this.STEPS[this.i];
    while (s.done && s.done(this) && !s.last) { this.i++; s = this.STEPS[this.i]; }
    const box = $$('coach'), visible = !s.show || s.show(this);
    box.classList.toggle('hidden', !visible || CD.G.over && !s.last);
    if (!visible) return this.focus(null);
    $$('coach-step').textContent = (this.i + 1) + ' / ' + this.STEPS.length;
    $$('coach-text').innerHTML = s.text;
    const nb = $$('coach-next'); nb.classList.toggle('hidden', !s.button); nb.textContent = s.button || '';
    this.focus(s.focus);
  }
};
