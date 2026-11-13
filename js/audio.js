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
// Si falta alguno, ese momento queda en silencio.
// Reproductor con Web Audio (no <audio loop>, que deja un hueco al repetir):
//  · Al cargar cada pista se recorta el silencio del principio y del final (los mp3 lo traen).
//  · El bucle no se nota: unos segundos antes del final empieza otra copia desde el principio y las dos se funden (LOOP_XF).
//  · Cambios de escena: menú y contratos entran a los ~2 s (MUSIC_DELAY) con fundido, mientras la anterior se apaga;
//    la de victoria entra al instante (ya está cargada desde que empieza la partida) cortando la anterior con un fundido rápido.
const MUSIC = { menu:'menu', rpg:'rpg', exp:'exp', maf:'maf', pok:'pok', victoria:'victoria' };
const MUSIC_DELAY = 1.8, MUSIC_FADE_IN = 1.6, MUSIC_FADE_OUT = 1.4, VICTORY_FADE_OUT = .5, LOOP_XF = 3;
// Volumen de la música: lo elige cada jugador con la barra de Ajustes (0-100, se recuerda en su navegador).
// MUSIC_VOL_DEFAULT es el de quien nunca la tocó: suave, por debajo de los efectos. MUSIC_VOL_MAX es el tope de la barra al 100%.
const MUSIC_DIR = 'assets/audios/musica/', MUSIC_VOL_DEFAULT = 25, MUSIC_VOL_MAX = 0.6;
const MUS = { key:null, want:null, on:true, avail:{}, vol:MUSIC_VOL_DEFAULT, bufs:{}, loading:{}, track:null, master:null, seq:0 };
try { MUS.on = localStorage.getItem('cd-music') !== 'off'; const v = parseInt(localStorage.getItem('cd-music-vol'), 10); if (v >= 0 && v <= 100) MUS.vol = v; } catch (e) {}
const musicLevel = () => MUS.on ? MUS.vol / 100 * MUSIC_VOL_MAX : 0;
Object.keys(MUSIC).forEach(k => {                                 // detecta qué pistas existen
  MUS.avail[k] = null;
  fetch(MUSIC_DIR + MUSIC[k] + '.mp3', { method:'HEAD' }).then(r => { MUS.avail[k] = r.ok; if (r.ok && MUS.want === k && !MUS.track) musicStart(k, false); }).catch(() => { MUS.avail[k] = false; });
});
function musicOut() {                                             // salida de la música (con el volumen de Ajustes)
  const ctx = audioCtx(); if (!ctx) return null;
  if (!MUS.master) { MUS.master = ctx.createGain(); MUS.master.gain.value = musicLevel(); MUS.master.connect(ctx.destination); }
  return ctx;
}
// Carga y decodifica una pista, y recorta el silencio de los bordes (para que el bucle encaje).
function musicLoad(key) {
  if (MUS.bufs[key]) return Promise.resolve(MUS.bufs[key]);
  if (MUS.loading[key]) return MUS.loading[key];
  const ctx = musicOut(); if (!ctx) return Promise.resolve(null);
  return (MUS.loading[key] = fetch(MUSIC_DIR + MUSIC[key] + '.mp3').then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); })
    .then(b => new Promise((ok, no) => ctx.decodeAudioData(b, ok, no)))
    .then(buf => {
      const ch = [...Array(buf.numberOfChannels)].map((_, i) => buf.getChannelData(i)), loud = i => ch.some(c => Math.abs(c[i]) > .003);
      let a = 0, z = buf.length - 1; while (a < z && !loud(a)) a++; while (z > a && !loud(z)) z--;
      const t = { buf, from:a / buf.sampleRate, to:(z + 1) / buf.sampleRate };
      MUS.bufs[key] = t; delete MUS.loading[key];
      Object.keys(MUS.bufs).forEach(k => { if (k !== key && k !== 'victoria' && k !== MUS.key) delete MUS.bufs[k]; });   // no guardar pistas viejas (pesan en memoria)
      return t;
    }).catch(() => { delete MUS.loading[key]; MUS.avail[key] = false; return null; }));
}
// Una copia de la pista que suena desde `when`; programa la siguiente copia para que se funda con esta antes del final.
function musicVoice(tr, when, first) {
  const ctx = musicOut(), t = MUS.bufs[tr.key]; if (!ctx || !t || tr.dead) return;
  const len = t.to - t.from, xf = Math.min(LOOP_XF, len / 4), src = ctx.createBufferSource(), g = ctx.createGain();
  src.buffer = t.buf; src.connect(g); g.connect(tr.gain);
  g.gain.setValueAtTime(first ? 1 : 0, when); if (!first) g.gain.linearRampToValueAtTime(1, when + xf);
  g.gain.setValueAtTime(1, when + len - xf); g.gain.linearRampToValueAtTime(0, when + len);
  src.start(when, t.from, len); src.stop(when + len + .05);
  tr.voices.push(src); src.onended = () => { tr.voices = tr.voices.filter(v => v !== src); };
  const next = when + len - xf;                                     // la siguiente copia ya queda programada al momento exacto
  const wait = Math.max(0, (next - ctx.currentTime) * 1000 - 8000);
  tr.timer = setTimeout(() => musicVoice(tr, Math.max(next, ctx.currentTime + .05), false), wait);
}
function musicStop(tr, secs) {                                    // apaga una pista con fundido
  if (!tr || tr.dead) return; tr.dead = true; clearTimeout(tr.timer);
  const ctx = musicOut(); if (!ctx) return; const now = ctx.currentTime;
  tr.gain.gain.cancelScheduledValues(now); tr.gain.gain.setValueAtTime(tr.gain.gain.value, now); tr.gain.gain.linearRampToValueAtTime(0, now + secs);
  tr.voices.forEach(v => { try { v.stop(now + secs + .05); } catch (e) {} });
}
// Arranca una pista: `quick` (victoria) entra al instante; las demás, a los ~2 s del cambio de escena, con fundido.
async function musicStart(key, quick) {
  const seq = ++MUS.seq, ctx = musicOut(); if (!ctx) return;
  const asked = ctx.currentTime;
  musicStop(MUS.track, quick ? VICTORY_FADE_OUT : MUSIC_FADE_OUT); MUS.track = null; MUS.key = key; radioDial();
  const t = await musicLoad(key); if (!t || seq !== MUS.seq) return;           // si mientras cargaba se pidió otra escena, se descarta
  const when = Math.max(ctx.currentTime + .05, quick ? 0 : asked + MUSIC_DELAY);
  const tr = { key, gain:ctx.createGain(), voices:[], dead:false };
  tr.gain.connect(MUS.master); tr.gain.gain.setValueAtTime(0, when); tr.gain.gain.linearRampToValueAtTime(1, when + (quick ? .25 : MUSIC_FADE_IN));
  MUS.track = tr; musicVoice(tr, when, true);
}
// Pide la música de un momento del juego ('menu', un contrato o 'victoria'). Si esa pista no existe, sigue la actual.
function musicSet(key) {
  if (MUS.avail[key] === false) return;
  MUS.want = key;
  if (!MUS.on || MUS.key === key || MUS.avail[key] !== true) return;        // ya suena (o aún no se sabe si existe: lo arranca la detección)
  musicStart(key, key === 'victoria');
}
function musicPreload(key) { if (MUS.on && MUS.avail[key] !== false) musicLoad(key); }   // p. ej. la de victoria, para que entre al instante
function musicToggle() {
  MUS.on = !MUS.on; try { localStorage.setItem('cd-music', MUS.on ? 'on' : 'off'); } catch (e) {}
  if (!MUS.on) { MUS.seq++; musicStop(MUS.track, .4); MUS.track = null; MUS.key = null; }
  else if (MUS.want) musicSet(MUS.want);
  musicButton();
}
function musicButton() { const b = document.getElementById('set-music'); if (b) settingsRow(b, MUS.on, MUS.on ? '🎵 Música' : '🔇 Música');
  const k = document.getElementById('set-music-knob'), o = document.getElementById('set-music-out');
  if (k) { k.style.setProperty('--turn', (-135 + MUS.vol * 2.7) + 'deg'); k.setAttribute('aria-valuenow', MUS.vol); k.setAttribute('aria-valuetext', MUS.vol + '%');
    k.setAttribute('aria-disabled', !MUS.on); k.classList.toggle('off', !MUS.on); }
  if (o) o.textContent = MUS.vol + '%';
  radioDial(); }
// Dial de la radio de Ajustes: la aguja marca la canción que suena.
function radioDial() {
  const n = document.getElementById('radio-needle'); if (!n) return;
  const s = document.querySelector('.radio-dial span[data-k="' + (MUS.on ? MUS.key : '') + '"]');
  n.classList.toggle('off', !s); if (s) n.style.left = (s.offsetLeft + s.offsetWidth / 2) + 'px';
}
// Perilla del volumen: se gira arrastrando (o con la rueda del ratón y las flechas del teclado).
function knobSetup() {
  const k = document.getElementById('set-music-knob'); if (!k) return;
  const fromPoint = e => { const r = k.getBoundingClientRect(), a = Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180 / Math.PI;
    return Math.round(Math.max(0, Math.min(100, (a + 135) / 2.7)) / 5) * 5; };
  k.addEventListener('pointerdown', e => { if (!MUS.on) return; k.setPointerCapture(e.pointerId); musicVolume(fromPoint(e)); e.preventDefault(); });
  k.addEventListener('pointermove', e => { if (k.hasPointerCapture(e.pointerId)) musicVolume(fromPoint(e)); });
  k.addEventListener('wheel', e => { if (!MUS.on) return; e.preventDefault(); musicVolume(MUS.vol + (e.deltaY < 0 ? 5 : -5)); }, { passive:false });
  k.addEventListener('keydown', e => { if (!MUS.on) return; const d = { ArrowUp:5, ArrowRight:5, ArrowDown:-5, ArrowLeft:-5, PageUp:20, PageDown:-20 }[e.key];
    if (d) { e.preventDefault(); musicVolume(MUS.vol + d); } else if (e.key === 'Home') musicVolume(0); else if (e.key === 'End') musicVolume(100); });
}
document.addEventListener('DOMContentLoaded', knobSetup);
function musicVolume(v) {                                         // barra de volumen de Ajustes (0-100)
  MUS.vol = Math.max(0, Math.min(100, parseInt(v, 10) || 0)); try { localStorage.setItem('cd-music-vol', MUS.vol); } catch (e) {}
  if (MUS.master && SND.ctx) { const g = MUS.master.gain, now = SND.ctx.currentTime; g.cancelScheduledValues(now); g.setTargetAtTime(musicLevel(), now, .05); }
  musicButton();
}
// Los navegadores solo dejan sonar audio después de que el usuario toca la pantalla: la música queda programada
// y empieza en cuanto se activa el audio (el primer toque llama a audioCtx(), que lo reanuda).
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
