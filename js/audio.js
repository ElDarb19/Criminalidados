// ===== Audio · Web Audio (sonidos sintetizados, sin archivos) + tus mp3 de assets/audios =====
// Si falta un mp3, el sonido sintetizado suena igual. Para añadir un sonido nuevo con archivo:
// copia el .mp3 a assets/audios/ y agrégalo a MP3 (nombre, ruta y duración en segundos).
const MP3 = {
  tommy:         { url:'assets/audios/tommygun.mp3',    dur:0.44 },
  sniper_reload: { url:'assets/audios/sniperreload.mp3', dur:0.22 },
  sniper_shot:   { url:'assets/audios/snipershoot.mp3', dur:0.50 },
  fuse:          { url:'assets/audios/tnttss.mp3',      dur:0.65 },
  dynamite:      { url:'assets/audios/tntboom.mp3',     dur:0.70 },
  heartbeat:     { url:'assets/audios/heartbeat.mp3',   dur:1.10 },
  car:           { url:'assets/audios/car.mp3',         dur:1.20 }
};
const SND = { ctx:null, buf:{}, muted:false };

function audioCtx() {
  if (!SND.ctx) {
    try { SND.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    Object.keys(MP3).forEach(k => fetch(MP3[k].url).then(r => r.arrayBuffer()).then(b => SND.ctx.decodeAudioData(b)).then(d => { SND.buf[k] = d; }).catch(() => {}));
  }
  if (SND.ctx.state === 'suspended') SND.ctx.resume();
  return SND.ctx;
}
// Los navegadores bloquean el audio hasta que el usuario toca la pantalla: se activa con el primer toque.
['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, () => audioCtx(), { once:true, passive:true }));

// Una nota: tipo de onda, frecuencias [inicio, ..., fin], duración y volumen.
function tone(ctx, type, freqs, dur, vol, delay = 0) {
  const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freqs[0], t);
  if (freqs.length === 2) o.frequency.exponentialRampToValueAtTime(freqs[1], t + dur);
  else freqs.forEach((f, i) => o.frequency.setValueAtTime(f, t + i * dur / freqs.length));
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + dur);
}

// ===== Música ambiente =====
// Guarda los archivos en assets/audios/musica/ con ESTOS nombres exactos (mp3) y el juego los usa solo:
//   menu.mp3      → menú principal            rpg.mp3 → Guerra de Bandas      exp.mp3 → El Gran Atraco
//   maf.mp3       → Imperio Criminal          pok.mp3 → Apuestas Clandestinas
//   victoria.mp3  → pantalla final (opcional: si no está, sigue la música del contrato)
// Si falta alguno, ese momento queda en silencio. Suenan en bucle y cambian con un fundido suave.
const MUSIC = { menu:'menu', rpg:'rpg', exp:'exp', maf:'maf', pok:'pok', victoria:'victoria' };
const MUSIC_DIR = 'assets/audios/musica/', MUSIC_VOL = 0.35;
const MUS = { el:null, key:null, want:null, on:true, unlocked:false, avail:{} };
try { MUS.on = localStorage.getItem('cd-music') !== 'off'; } catch (e) {}
Object.keys(MUSIC).forEach(k => {                                 // detecta qué pistas existen
  MUS.avail[k] = null;
  fetch(MUSIC_DIR + MUSIC[k] + '.mp3', { method:'HEAD' }).then(r => { MUS.avail[k] = r.ok; if (r.ok && MUS.want === k) musicPlay(k); }).catch(() => { MUS.avail[k] = false; });
});
function musicFade(el, to, ms, done) {
  const from = el.volume, t0 = performance.now();
  const step = () => { const p = Math.min(1, (performance.now() - t0) / ms); el.volume = from + (to - from) * p; if (p < 1) requestAnimationFrame(step); else if (done) done(); };
  requestAnimationFrame(step);
}
function musicPlay(key) {
  if (!MUS.on || !MUS.unlocked || MUS.avail[key] !== true || MUS.key === key) return;
  const old = MUS.el; if (old) musicFade(old, 0, 900, () => old.pause());
  const el = new Audio(MUSIC_DIR + MUSIC[key] + '.mp3'); el.loop = true; el.volume = 0;
  MUS.el = el; MUS.key = key; el.play().then(() => musicFade(el, MUSIC_VOL, 1200)).catch(() => { MUS.key = null; });
}
// Pide la música de un momento del juego ('menu', un contrato o 'victoria'). Si esa pista no existe, sigue la actual.
function musicSet(key) {
  if (MUS.avail[key] === false) return;
  MUS.want = key; musicPlay(key);
}
function musicToggle() {
  MUS.on = !MUS.on; try { localStorage.setItem('cd-music', MUS.on ? 'on' : 'off'); } catch (e) {}
  if (!MUS.on && MUS.el) { const el = MUS.el; MUS.el = null; MUS.key = null; musicFade(el, 0, 400, () => el.pause()); }
  if (MUS.on && MUS.want) musicPlay(MUS.want);
  musicButton();
}
function musicButton() { const b = document.getElementById('set-music'); if (b) settingsRow(b, MUS.on, MUS.on ? '🎵 Música' : '🔇 Música'); }
// Los navegadores solo dejan sonar música después de que el usuario toca la pantalla.
['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, () => { if (!MUS.unlocked) { MUS.unlocked = true; if (MUS.want) musicPlay(MUS.want); } }, { passive:true }));
document.addEventListener('DOMContentLoaded', () => { musicButton(); if (!MUS.want) musicSet('menu'); });

function playSound(name) {
  if (SND.muted) return;
  const ctx = audioCtx(); if (!ctx) return;
  try {
    if (SND.buf[name]) {                                   // mp3 cargado
      const s = ctx.createBufferSource(), g = ctx.createGain(), d = MP3[name].dur, t = ctx.currentTime;
      s.buffer = SND.buf[name]; s.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(1, t); g.gain.setValueAtTime(1, t + Math.max(0, d - .05)); g.gain.linearRampToValueAtTime(0, t + d);
      s.start(t); s.stop(t + d); return;
    }
    switch (name) {                                         // sintetizados
      case 'roll':          tone(ctx, 'triangle', [180 + Math.random() * 80, 120], .05, .08); break;
      case 'diceLanding':   tone(ctx, 'square', [520, 880], .15, .15); break;
      case 'hit':           tone(ctx, 'sawtooth', [150, 40], .2, .3); break;
      case 'crit':          tone(ctx, 'square', [300, 60], .35, .4); break;
      case 'heal':          tone(ctx, 'sine', [330, 660], .25, .2); break;
      case 'coin':          tone(ctx, 'sine', [987.77, 1318.51], .25, .15); break;
      case 'win':           tone(ctx, 'triangle', [523.25, 659.25, 783.99, 1046.5], .6, .2); break;
      case 'trophy':        // propio de los logros: campanitas que suben (sol-si-re-sol) y un destello agudo al final
        [783.99, 987.77, 1174.66, 1567.98].forEach((f, i) => { tone(ctx, 'triangle', [f], .38, .14, i * .08); tone(ctx, 'sine', [f * 2], .26, .05, i * .08); });
        tone(ctx, 'sine', [2093, 3136], .5, .06, .36); break;
      case 'grand':         // todos los logros: fanfarria de tres acordes que suben, redoble de monedas y un brillo final
        [[523.25, 659.25, 783.99], [587.33, 739.99, 880], [783.99, 987.77, 1174.66, 1567.98]].forEach((ch, i) => ch.forEach(f => { tone(ctx, 'triangle', [f], i === 2 ? 1.4 : .32, .1, i * .3); tone(ctx, 'sawtooth', [f / 2], i === 2 ? 1.2 : .3, .025, i * .3); }));
        for (let i = 0; i < 10; i++) tone(ctx, 'sine', [1318.51 + i * 90, 1975.53], .18, .05, .95 + i * .07);
        tone(ctx, 'sine', [2093, 4186], 1.1, .05, 1.7); break;
      case 'tommy':       for (let i = 0; i < 6; i++) tone(ctx, 'sawtooth', [75 + Math.random() * 25, 60], .05, .3, i * .065); break;
      case 'sniper_reload': tone(ctx, 'sine', [1200, 400], .08, .2); break;
      case 'sniper_shot':   tone(ctx, 'square', [900, 60], .3, .35); break;
    }
  } catch (e) {}
}
