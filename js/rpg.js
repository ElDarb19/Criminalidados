// ===== Contrato 1 · Guerra de Bandas (4 jugadores) =====
// Reglas de la versión anterior: salud 3d6+10, Ráfaga d6, Francotirador d20≥11 + d12 (20 = +2 crítico),
// Médico d8 (3 curaciones seguidas bloquean el médico: hay que usar otra habilidad para desbloquearlo),
// Soplón d4 rondas (1 de daño al final de cada turno) y un disparo que supera la salud restante se anula.
const RPG = {
  ui(G, me) {
    return [
      { type:'quick', label:'⚡ Ráfaga Tommy Gun', sub:'d6 de daño' },
      { type:'strong', label:'🔫 Francotirador', sub:'d20 ≥ 11, luego d12' },
      { type:'heal', label:'🩺 Médico de calle', sub: me.blocked ? '🚫 Bloqueado: usa otra habilidad' : 'd8 de salud · ' + me.heals + '/3 seguidas', disabled:me.blocked },
      { type:'poison', label:'🕵️ Infiltrar Soplón', sub:'1 de daño por turno' }
    ];
  },
  validTargets(G, me, type) { return type === 'heal' ? null : G.players.filter(p => p.alive && p !== me).map(p => p.slot); },
  card(p) {
    return { pct:p.max ? p.hp / Math.max(p.max, p.hp) * 100 : 0, color:p.poison > 0 ? '#9b59b6' : 'var(--theme-accent)',
      label:p.alive ? (p.max ? p.hp + '/' + p.max + ' SALUD' : '— SALUD') + (p.poison > 0 ? ' · 🕵️ soplón ' + p.poison : '') + (p.blocked ? ' · 🚫 médico' : '') : '💀 ELIMINADO',
      state:p.alive ? '' : 'dead', img:p.alive ? 'idle' : 'lose' };
  },
  async init(G) {
    CD.log('🔫 Generando la salud inicial de los Capos…');
    for (const p of G.players) {
      let s = 10; for (let i = 0; i < 3; i++) s += await CD.roll(6, p, 'Salud inicial', 'idle');
      Object.assign(p, { hp:s, max:s, poison:0, heals:0, blocked:false, alive:true }); CD.publish(); render();
    }
    G.turn = Math.floor(Math.random() * G.players.length); G.start = G.turn;                 // sorteo del primer turno
    CD.log('🎲 Sorteo: empieza ' + G.players[G.turn].name + '. ¡Empieza el tiroteo!');
  },

  async act(G, att, type, tSlot) {
    const def = tSlot == null ? null : G.players[tSlot];
    if (type !== 'heal' && (!def || !def.alive || def === att)) return;
    G.focus = { att:att.slot, target:def ? def.slot : att.slot }; CD.publish(); render();   // se marca a quién eligió
    if (type === 'heal') {
      if (att.blocked) return;
      att.heals++;
      const h = await CD.roll(8, att, 'Médico de calle', 'rpg_doctor');
      att.hp += h; CD.float(att.slot, '+' + h, 'heal');
      CD.log(`💚 ${att.name} recupera +${h} de salud (queda con ${att.hp}).`);
      if (att.heals >= 3) { att.blocked = true; att.heals = 0; CD.log('🚫 Médico bloqueado: ' + att.name + ' debe usar otra habilidad en su próximo turno.'); }
    } else {
      att.blocked = false; att.heals = 0;                                // usar otra habilidad desbloquea al médico
      if (type === 'quick') this.hit(att, def, await CD.roll(6, att, 'Ráfaga Tommy Gun → ' + def.name, 'rpg_tommy', 'tommy'), 0, false);
      else if (type === 'strong') {
        const acc = await CD.roll(20, att, 'Francotirador (req. 11+) → ' + def.name, 'rpg_sniper', 'sniper_reload');
        if (acc >= 11) {
          const base = await CD.roll(12, att, 'Daño del Francotirador', 'rpg_sniper', 'sniper_shot');
          let crit = 0;
          if (acc === 20) { if (base + 2 <= def.hp) { crit = 2; CD.log('🎯 ¡Tiro perfecto! +2 de daño crítico.'); } else CD.log('🎯 ¡Tiro perfecto! Daño calibrado para el remate.'); }
          this.hit(att, def, base, crit, true);
        } else { CD.float(def.slot, 'FALLÓ', 'miss'); CD.log(`💨 El francotirador de ${att.name} falló contra ${def.name} (sacó ${acc}).`); }
      } else if (type === 'poison') {
        const t = await CD.roll(4, att, 'Infiltrar Soplón → ' + def.name, 'rpg_rat');
        def.poison = t; CD.float(def.slot, '🕵️ SOPLÓN', 'status'); CD.log(`🕵️ ${att.name} infiltra un soplón en ${def.name} por ${t} rondas.`);
      }
    }
    if (this.check(G)) return;
    for (const p of G.players) if (p.alive && p.poison > 0) {            // el soplón filtra al final de cada turno
      p.hp -= 1; p.poison--; CD.float(p.slot, '-1', 'status');
      CD.log(`🧪 El soplón de ${p.name} filtra información (-1 salud, le quedan ${Math.max(0, p.hp)}). Quedan ${p.poison} rondas.`);
      if (p.hp <= 0) { p.hp = 0; p.alive = false; p.poison = 0; CD.log('💀 ' + p.name + ' cae por el soplón.'); }
    }
    this.check(G);
  },

  hit(att, def, base, crit, strong) {
    const dmg = base + crit;
    if (dmg > def.hp) { CD.float(def.slot, '🛡️ ANULADO', 'miss'); CD.log(`🛡️ Disparo de ${att.name} anulado por sobredaño (${dmg} > ${def.hp}); ${def.name} conserva ${def.hp} de salud.`); return; }
    def.hp -= dmg; CD.float(def.slot, '-' + dmg, strong || dmg >= 8 ? 'crit' : 'dmg');
    CD.log(`💥 ${att.name} acierta e inflige ${dmg} de daño a ${def.name} (le quedan ${def.hp} de salud).`);
    if (def.hp === 0) { def.alive = false; def.poison = 0; CD.log('💀 ' + def.name + ' ha sido eliminado.'); }
  },

  check(G) {                                  // gana el último en pie
    const a = CD.alive();
    if (a.length > 1) return false;
    CD.finish(a.length ? a[0].slot : null); return true;
  }
};
