// ===== Contrato 1 · Guerra de Bandas (4 jugadores) =====
// Reglas de la versión anterior: salud 3d6+10, Ráfaga d6, Francotirador d20≥11 + d12 (20 = +2 crítico),
// Médico d8 (3 seguidos = bloqueado), Soplón d4 rondas (1 de daño al final de cada turno),
// y un disparo que supera la salud restante del objetivo se anula (sobredaño).
const RPG = {
  async init(G) {
    CD.log('🔫 Generando la salud inicial de los Capos…');
    for (const p of G.players) {
      let s = 10; for (let i = 0; i < 3; i++) s += await CD.roll(6, p, 'Salud inicial', 'idle');
      Object.assign(p, { hp:s, max:s, poison:0, heals:0, blocked:false, alive:true }); CD.publish(); render();
    }
    CD.log('🔫 ¡Empieza el tiroteo! Turno de ' + G.players[0].name + '.');
  },

  async act(G, att, type, tSlot) {
    const def = tSlot == null ? null : G.players[tSlot];
    if (type !== 'heal' && (!def || !def.alive || def === att)) return;
    if (type === 'heal') {
      if (att.blocked) return;
      att.heals++;
      const h = await CD.roll(8, att, 'Médico de calle', 'rpg_doctor');
      att.hp += h; CD.log(`💚 ${att.name} recupera +${h} de salud.`);
      if (att.heals >= 3) { att.blocked = true; att.heals = 0; CD.log('🚫 Médico bloqueado (máx. 3 visitas seguidas).'); }
    } else {
      att.blocked = false; att.heals = 0;
      if (type === 'quick') { sfx('tommygun'); this.hit(att, def, await CD.roll(6, att, 'Ráfaga Tommy Gun → ' + def.name, 'rpg_tommy'), 0); }
      else if (type === 'strong') {
        const acc = await CD.roll(20, att, 'Francotirador (req. 11+) → ' + def.name, 'rpg_sniper');
        if (acc >= 11) {
          sfx('snipershoot');
          const base = await CD.roll(12, att, 'Daño del Francotirador', 'rpg_sniper');
          let crit = 0;
          if (acc === 20) { if (base + 2 <= def.hp) { crit = 2; CD.log('🎯 ¡Tiro perfecto! +2 de daño crítico.'); } else CD.log('🎯 ¡Tiro perfecto! Daño calibrado para el remate.'); }
          this.hit(att, def, base, crit);
        } else CD.log(`💨 El francotirador de ${att.name} falló (sacó ${acc}).`);
      } else if (type === 'poison') {
        const t = await CD.roll(4, att, 'Infiltrar Soplón → ' + def.name, 'rpg_rat');
        def.poison = t; CD.log(`🕵️ ${att.name} infiltra un soplón en ${def.name} por ${t} rondas.`);
      }
    }
    if (this.check(G)) return;
    for (const p of G.players) if (p.alive && p.poison > 0) {            // el soplón filtra al final de cada turno
      p.hp -= 1; p.poison--; CD.log(`🧪 El soplón de ${p.name} filtra información (-1 salud). Quedan ${p.poison} rondas.`);
      if (p.hp <= 0) { p.hp = 0; p.alive = false; p.poison = 0; CD.log('💀 ' + p.name + ' cae por el soplón.'); }
    }
    this.check(G);
  },

  hit(att, def, base, crit) {
    const dmg = base + crit;
    if (dmg > def.hp) { CD.log(`🛡️ Disparo anulado por sobredaño (${dmg} > ${def.hp} de salud restante).`); return; }
    def.hp -= dmg; CD.log(`💥 ${att.name} acierta e inflige ${dmg} de daño a ${def.name}.`);
    if (def.hp === 0) { def.alive = false; def.poison = 0; CD.log('💀 ' + def.name + ' ha sido eliminado.'); }
  },

  check(G) {                                  // gana el último en pie
    const a = CD.alive();
    if (a.length > 1) return false;
    CD.finish(a.length ? a[0].slot : null); return true;
  }
};
