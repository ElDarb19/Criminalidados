// ===== Pruebas automáticas de Criminal Dice =====
// Carga el juego real en un iframe, cambia el dado por resultados fijos y comprueba reglas, IA y archivos.
// Para añadir una prueba: test('nombre', async () => { ... ok(condición, 'mensaje') ... }).
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
function ok(cond, msg) { if (!cond) throw new Error(msg || 'falló la comprobación'); }
function eq(got, want, what) { if (got !== want) throw new Error(`${what}: se esperaba ${want} y salió ${got}`); }

let W, E;                                          // ventana del juego y acceso a sus variables globales
const COLORS6 = ['Color_R', 'Color_B', 'Color_G', 'Color_P', 'Color_Pu', 'Color_W', 'Color_Y'];   // todos los colores de jugador

// Prepara una partida de prueba sin red ni animaciones. players: [{ bot }, ...]
function game(contract, players, mode) {
  const CD = E('CD');
  CD.cfg = { online:false, mode:mode || 'single', market:false, events:false, dice:'virtual',
    players:players.map((p, i) => Object.assign({ slot:i, name:'Jefe ' + (i + 1), color:COLORS6[i], char:'Mafioso', bot:false }, p)) };
  CD.contract = contract; CD.G = CD.freshGame(CD.cfg.players); CD.G.started = true; CD.G.turn = 0;
  return CD.G;
}
// El dado devuelve estos valores en orden (y falla si se piden más de la cuenta).
function dice(...vals) { E('CD').roll = async (sides, p, desc) => { if (!vals.length) throw new Error('dado de más: ' + desc); return vals.shift(); }; }

// ---------- El Gran Atraco ----------
async function exp() { const G = game('exp', [{}, {}]); await E('EXP').init(G); G.turn = 0; return G; }
test('Atraco · Saquear con 1-2 es trampa: -3 de Cobertura', async () => { const G = await exp(); dice(2); await E('EXP').act(G, G.players[0], 'explore'); eq(G.players[0].hp, 17, 'Cobertura'); eq(G.players[0].temp, 0, 'botín'); });
test('Atraco · Saquear con 3-5 da +1 y con 6 da +3', async () => { const G = await exp(), p = G.players[0]; dice(4); await E('EXP').act(G, p, 'explore'); dice(6); await E('EXP').act(G, p, 'explore'); eq(p.temp, 4, 'botín'); });
test('Atraco · Forzar Bóveda falla con menos de 11: -6', async () => { const G = await exp(); dice(10); await E('EXP').act(G, G.players[0], 'deep'); eq(G.players[0].hp, 14, 'Cobertura'); });
test('Atraco · Forzar Bóveda con 11+ da el d12, y con 20 suma +2', async () => { const G = await exp(), p = G.players[0]; dice(11, 5); await E('EXP').act(G, p, 'deep'); eq(p.temp, 5, 'botín'); dice(20, 5); await E('EXP').act(G, p, 'deep'); eq(p.temp, 12, 'botín con crítico'); });
test('Atraco · El Coche de Escape asegura el botín y saca al jefe', async () => { const G = await exp(), p = G.players[0]; p.temp = 7; dice(); await E('EXP').act(G, p, 'surface'); eq(p.secured, 7, 'asegurado'); eq(p.temp, 0, 'en mano'); eq(p.alive, false, 'sigue dentro'); });
test('Atraco · Con Cobertura 0 lo arrestan y pierde el botín en mano', async () => { const G = await exp(), p = G.players[0]; p.hp = 3; p.temp = 9; dice(1); await E('EXP').act(G, p, 'explore'); ok(p.arrested, 'no fue arrestado'); eq(p.temp, 0, 'botín en mano'); });

// ---------- Apuestas Clandestinas ----------
function pok() { const G = game('pok', [{}, {}, {}]); G.players.forEach(p => Object.assign(p, { tokens:8, tahurUses:0, tahurCD:0 })); return G; }
test('Apuestas · La Apuesta Básica gana 1 ficha con 4+', async () => { const G = pok(); dice(4); await E('POK').act(G, G.players[0], 'bet', 1); eq(G.players[0].tokens, 9, 'atacante'); eq(G.players[1].tokens, 7, 'rival'); });
test('Apuestas · La Apuesta Básica pierde 1 ficha con 3 o menos', async () => { const G = pok(); dice(3); await E('POK').act(G, G.players[0], 'bet', 1); eq(G.players[0].tokens, 7, 'atacante'); eq(G.players[1].tokens, 9, 'rival'); });
test('Apuestas · El Golpe a la Mesa fallido entrega 3 fichas', async () => { const G = pok(); dice(10); await E('POK').act(G, G.players[0], 'slam', 1); eq(G.players[0].tokens, 5, 'atacante'); eq(G.players[1].tokens, 11, 'rival'); });
test('Apuestas · Un golpe mayor que las fichas del rival se anula', async () => { const G = pok(); G.players[1].tokens = 2; dice(15, 5); await E('POK').act(G, G.players[0], 'slam', 1); eq(G.players[0].tokens, 8, 'atacante'); eq(G.players[1].tokens, 2, 'rival'); });

// ---------- Guerra de Bandas ----------
function rpg() { const G = game('rpg', [{}, {}, {}]); G.players.forEach(p => Object.assign(p, { hp:20, max:20, heals:0, blocked:false, poison:0 })); return G; }
test('Bandas · La Ráfaga Tommy Gun quita el d6', async () => { const G = rpg(); dice(4); await E('RPG').act(G, G.players[0], 'quick', 1); eq(G.players[1].hp, 16, 'salud del rival'); });
test('Bandas · Un disparo mayor que la salud restante se anula', async () => { const G = rpg(); G.players[1].hp = 3; dice(5); await E('RPG').act(G, G.players[0], 'quick', 1); eq(G.players[1].hp, 3, 'salud del rival'); });
test('Bandas · El Francotirador falla con menos de 11', async () => { const G = rpg(); dice(10); await E('RPG').act(G, G.players[0], 'strong', 1); eq(G.players[1].hp, 20, 'salud del rival'); });
test('Bandas · El Médico no pasa del tope de 35', async () => { const G = rpg(), p = G.players[0]; p.hp = 33; dice(8); await E('RPG').act(G, p, 'heal'); eq(p.hp, 35, 'salud'); });
test('Bandas · Tres curaciones seguidas bloquean el Médico', async () => { const G = rpg(), p = G.players[0]; p.hp = 5; dice(1, 1, 1); for (let i = 0; i < 3; i++) await E('RPG').act(G, p, 'heal'); ok(p.blocked, 'el médico no quedó bloqueado'); });

// ---------- Imperio Criminal ----------
function maf() { const G = game('maf', [{}, {}]); G.phase = 'roll'; G.winScore = 15; G.players.forEach((p, i) => Object.assign(p, { parcels:[i + 3], raids:{}, coins:0, prestige:0 })); return G; }
test('Imperio · Recaudación d6 en tu distrito cobra 1💵', async () => { const G = maf(); dice(3); await E('MAF').act(G, G.players[0], 'harvest6', null, { egoist:false }); eq(G.players[0].coins, 1, 'efectivo'); });
test('Imperio · Recaudación d12 con 7+ no cobra nadie', async () => { const G = maf(); dice(8); await E('MAF').act(G, G.players[0], 'harvest12', null, { egoist:false }); eq(G.players[0].coins + G.players[1].coins, 0, 'efectivo total'); });

// ---------- IA de los bots ----------
test('IA · Decide una acción válida en los 4 contratos', async () => {
  const AI = E('AI'), valid = { rpg:['quick', 'strong', 'heal', 'poison'], exp:['explore', 'deep', 'repair', 'sabotage', 'surface'], maf:['harvest6', 'harvest12'], pok:['bet', 'slam', 'cheat'] };
  const states = { rpg:rpg(), exp:await exp(), maf:maf(), pok:pok() };
  for (const c of Object.keys(valid)) { E('CD').contract = c; E('CD').G = states[c]; const a = AI.decide(states[c], states[c].players[0], c); ok(a && valid[c].includes(a.type), c + ': acción inválida ' + JSON.stringify(a)); }
});
test('IA · En el Atraco no huye por ir 1 arriba si todos tienen 20 de Cobertura', async () => {
  const G = await exp(); Object.assign(G.players[0], { temp:5, torpedoUses:3, repairUses:1 }); Object.assign(G.players[1], { temp:4, torpedoUses:3 });
  for (let i = 0; i < 30; i++) ok(E('AI').exp(G, G.players[0]).type !== 'surface', 'huyó demasiado pronto');
});
test('IA · El bot cauteloso asegura con 6 de botín; el apostador sigue', async () => {
  const G = await exp(), me = G.players[0]; Object.assign(me, { temp:6, torpedoUses:3, repairUses:1, persona:'cauteloso' }); Object.assign(G.players[1], { temp:2, torpedoUses:3 });
  eq(E('AI').exp(G, me).type, 'surface', 'cauteloso'); me.persona = 'apostador'; ok(E('AI').exp(G, me).type !== 'surface', 'el apostador huyó');
});

// ---------- Modo Party, personalidades y estadísticas ----------
test('Party · Con victorias ≥ contratos, todos se juegan al menos una vez', async () => {
  for (let i = 0; i < 20; i++) { const l = W.makePlaylist(['rpg', 'exp', 'maf']); eq(new Set(l.slice(0, 3)).size, 3, 'contratos distintos en la primera vuelta'); }
});
test('Bots · Tres bots reciben tres personalidades distintas', async () => {
  const G = game('rpg', [{}, { bot:true }, { bot:true }, { bot:true }]); eq(new Set(G.players.filter(p => p.bot).map(p => p.persona)).size, 3, 'personalidades distintas');
});
test('Expediente · El daño se anota a quien ataca y a quien lo recibe', async () => {
  const G = rpg(); G.wait = false; dice(4); await E('CD').exec(0, 'quick', 1); const s = G.stats;
  eq(s[0].dealt, 4, 'daño causado'); eq(s[1].taken, 4, 'daño recibido'); eq(s[0].acts, 1, 'acciones');
});

// ---------- Mercado Negro y Eventos ----------
// Como dice(), pero pasando por los objetos y eventos (MK.modRoll), igual que en una partida real con Mercado Negro.
function diceMk(...vals) { const CD = E('CD'); CD.roll = async (sides, p, desc) => { if (!vals.length) throw new Error('dado de más: ' + desc); const v = vals.shift(); CD.nat = v; return E('MK').modRoll(p, sides, v, false); }; }
function withMarket(G, slot, contacts) { const CD = E('CD'); CD.cfg.market = true; Object.assign(G.players[slot], { contacts, consumable:null, money:0, mult:1 }); return G.players[slot]; }
test('Mercado · Crupier en Imperio: solo cambia tu cobro (sacas 2, tú cobras en el 3, el rival en el 2)', async () => {
  const G = maf(); G.players[0].parcels = [3]; G.players[1].parcels = [2, 3]; withMarket(G, 0, ['contact_crupier']);
  diceMk(2); await E('MAF').act(G, G.players[0], 'harvest6', null, { egoist:false });
  eq(G.players[0].coins, 1, 'efectivo del dueño del Crupier'); eq(G.players[1].coins, 1, 'efectivo del rival (solo el distrito 2)');
});
test('Mercado · Tallador en Apuestas: el 1 se vuelve 4 y gana la apuesta', async () => {
  const G = pok(); withMarket(G, 0, ['contact_tallador']); diceMk(1); await E('POK').act(G, G.players[0], 'bet', 1); eq(G.players[0].tokens, 9, 'fichas');
});
test('Mercado · Whisky: curarse no lo gasta y duplica la granada', async () => {
  const G = await exp(), p = withMarket(G, 0, []); p.hp = 15; p.consumable = 'item_whisky'; await E('MK').use(G, p);
  E('MK').turnEnd(G, p); dice(2); await E('EXP').act(G, p, 'repair'); eq(p.mult, 2, 'el Whisky sigue activo tras reforzar');
  diceMk(3); await E('EXP').act(G, p, 'sabotage', 1); eq(G.players[1].hp, 14, 'Cobertura del rival (granada 3 x2)'); eq(p.mult, 1, 'el Whisky se gastó');
});
test('Mercado · Adrenalina da +4 aunque pase del máximo (escudo)', async () => {
  const G = rpg(), p = withMarket(G, 0, []); p.consumable = 'item_adrenalina'; await E('MK').use(G, p); eq(p.hp, 24, 'salud');
});
test('Mercado · Chófer de Huida baja 2 las trampas con menos del 25%', async () => {
  const G = await exp(), p = withMarket(G, 0, ['contact_chofer']); p.hp = 4; diceMk(1); await E('EXP').act(G, p, 'explore'); eq(p.hp, 3, 'Cobertura (trampa 3 - 2)');
});
test('Eventos · Ley Seca afecta ~40% de los turnos y no cuenta como daño', async () => {
  const G = rpg(), CD = E('CD'), MK = E('MK'); CD.cfg.events = true; G.event = { code:'ley_seca' };
  let n = 0; for (let i = 0; i < 3000; i++) { MK.turnStart(G); if (G.dry) n++; }
  ok(n > 1050 && n < 1350, 'turnos con Ley Seca: ' + n + ' de 3000');
  G.dry = true; G.stats = {}; diceMk(4); const v = await CD.roll(6, G.players[0], 'x'); eq(v, 3, 'd6 con Ley Seca');
  eq((G.stats[0] || { taken:0 }).taken, 0, 'daño recibido');
});
test('IA · Con Soborno en Imperio cobra con la d6', async () => {
  const G = maf(), me = G.players[0]; E('CD').contract = 'maf'; E('CD').G = G; me.force6 = true;
  for (let i = 0; i < 20; i++) eq(E('AI').maf(G, me).type, 'harvest6', 'recaudación');
});

// ---------- Archivos ----------
test('Sprites · Existen las 21 poses de cada personaje del menú y del bot en todos los colores', async () => {
  const poses = ['idle', 'win', 'lose', 'exp_boxes', 'exp_cover', 'exp_getaway', 'exp_grenade', 'exp_vault', 'maf_bribe', 'maf_buy', 'maf_harvest', 'maf_raid', 'maf_risk', 'maf_safe', 'pok_bet', 'pok_cheat', 'pok_slam', 'rpg_doctor', 'rpg_rat', 'rpg_sniper', 'rpg_tommy'];
  const missing = [];
  const who = W.eval('CHARACTERS').map(c => ({ char:c.key })).concat({ bot:true });     // los personajes nuevos entran solos en la prueba
  for (const w of who) for (const color of COLORS6) for (const img of poses) {
    const u = new URL(W.charList(Object.assign({ color }, w), img)[0], W.location.href); const r = await fetch(u, { method:'HEAD' }); if (!r.ok) missing.push(u.pathname);
  }
  ok(!missing.length, 'faltan ' + missing.length + ': ' + missing.slice(0, 5).join(', '));
});

// ---------- Tienda ----------
test('Tienda · El oro de los logros alcanza para casi toda la tienda, pero no toda (el resto se gana online)', async () => {
  const gold = E('ACHIEVEMENTS').reduce((n, a) => n + E('TIERS')[a.tier].gold, 0);
  const cost = E('CHARACTERS').concat(E('DICE_ITEMS')).filter(c => !c.online).reduce((n, c) => n + (c.price || 0), 0);   // capos y dados (sin los nuevos de oro online)
  ok(gold < cost && gold >= cost * 0.85, 'los logros dan ' + gold + ' de oro y la tienda cuesta ' + cost + ' (debe quedar entre el 85% y el 99%)');
});
test('Tienda · Oro online: más bots, menos oro; 2.º solo con 4 capos; Party alto solo a 3+ victorias', async () => {
  const P = E('PROFILE'), cfg = (mode, wins) => ({ online:true, mode, winsNeeded:wins });
  const g = (c, humans, place, total) => P.onlineGold(c, humans, place, total);
  ok(g(cfg('single'), 1, 1, 4) === 0, 'una persona sola con bots no cobra');
  ok(g(cfg('single'), 2, 1, 2) === 60 && g(cfg('single'), 3, 2, 3) === 0, 'sin 4 capos solo cobra el 1.º');
  ok(g(cfg('single'), 4, 2, 4) === 15 && g(cfg('single'), 3, 2, 4) === 10 && g(cfg('single'), 2, 2, 4) === 5, '2.º con 4 capos: 15 / 10 / 5 según los bots');
  ok(g(cfg('single'), 3, 1, 4) === 50 && g(cfg('single'), 2, 1, 4) === 40 && g(cfg('single'), 4, 3, 4) === 0, '1.º: 60 / 50 / 40 según los bots');
  ok(g(cfg('party', 3), 4, 1, 4) === 150 && g(cfg('party', 3), 4, 2, 4) === 40 && g(cfg('party', 3), 2, 1, 4) === 100 && g(cfg('party', 3), 2, 2, 4) === 20, 'Party a 3 victorias: 150/40 sin bots, 100/20 con 2 bots');
  ok(g(cfg('party', 2), 2, 1, 2) === 60, 'Party a menos de 3 victorias paga como un contrato único');
  ok(g({ online:false, mode:'single' }, 4, 1, 4) === 0, 'en local no paga');
});
test('Tienda · Cada dado decorado se dibuja (animado y estático) sin errores', async () => {
  const fx = E('DICEFX'), bad = [], warm = document.createElement('canvas'); warm.width = warm.height = 96; document.body.appendChild(warm);
  for (const fin of [null, 'oro', 'balazo']) fx.show(warm, { sides:20, color:'Color_R', val:20, fin, aura:null });   // que carguen las capas del dado
  await new Promise(r => setTimeout(r, 800)); fx.hide(warm); warm.remove();
  for (const it of E('DICE_ITEMS')) for (const calm of [false, true]) {
    try { const cv = document.createElement('canvas'); cv.width = cv.height = 96; document.body.appendChild(cv);
      E('SET').calm = calm; fx.show(cv, { sides:20, color:'Color_R', val:20, fin:it.kind === 'fin' ? it.id : null, aura:it.kind === 'aura' ? it.id : null }); fx.hide(cv); cv.remove();
    } catch (e) { bad.push(it.key + (calm ? ' (estático)' : '') + ': ' + e.message); } }
  E('SET').calm = false;
  ok(!bad.length, bad.join(' · '));
});
test('Tienda · Los capos secretos tienen un logro que los desbloquea', async () => {
  const sin = E('CHARACTERS').filter(c => c.secret && !E('ACHIEVEMENTS').some(a => a.unlocks === c.key)).map(c => c.key);
  ok(!sin.length, 'sin logro: ' + sin.join(', '));
});

// ---------- ejecución ----------
async function run() {
  const frame = document.getElementById('game');
  try {
    for (let i = 0; i < 100; i++) {                                              // espera a que el juego termine de cargar (hasta 10 s)
      const d = frame.contentDocument; if (d && d.readyState === 'complete' && typeof frame.contentWindow.charList === 'function') break;
      await new Promise(r => setTimeout(r, 100));
    }
    await new Promise(r => setTimeout(r, 300));
    W = frame.contentWindow; E = s => W.eval(s); E('CD');
  }
  catch (e) { document.getElementById('summary').textContent = '⚠️ No se pudo acceder al juego: abre esta página desde el mismo servidor que el juego (no como archivo local).'; return; }
  W.render = () => {}; W.playSound = () => {}; W.musicSet = () => {};          // sin pantalla, sonido ni música
  const list = document.getElementById('results'); let pass = 0;
  for (const t of tests) {
    const li = document.createElement('li');
    try { await t.fn(); li.className = 'ok'; li.textContent = '✓ ' + t.name; pass++; }
    catch (e) { li.className = 'bad'; li.innerHTML = '✗ ' + t.name + '<small></small>'; li.querySelector('small').textContent = e.message; }
    list.appendChild(li);
  }
  const s = document.getElementById('summary'), all = pass === tests.length;
  s.className = all ? 'ok' : 'bad'; s.textContent = (all ? '✅ ' : '❌ ') + pass + ' de ' + tests.length + ' pruebas correctas';
}
run();
