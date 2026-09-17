/* GAMEtime — SNES game room: Mode 7 finish line, modern TV reveal, pokedex. */

"use strict";

/* ================= tiny seeded random (stable pixel art per game) ================= */

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const esc = s => String(s ?? "").replace(/[&<>"']/g,
  c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ================= pixel-map renderer (the POV hands) ================= */

const SKIN = {
  o: "#3a2418", s: "#e8a878", d: "#c47e52", l: "#f7c9a0",
  v: "#4a3a8c", w: "#32285e",
};

function pixelRects(rows, cell, palette) {
  let out = "";
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      if (c === ".") { x++; continue; }
      let x2 = x + 1;
      while (x2 < row.length && row[x2] === c) x2++;
      out += `<rect x="${x * cell}" y="${y * cell}" width="${(x2 - x) * cell}" height="${cell}" fill="${palette[c]}"/>`;
      x = x2;
    }
  });
  return out;
}

const HAND_MAP = [
  "....oooooo......",
  "..oossssssoo....",
  ".osslsslsslso...",
  ".oslsslsslsso...",
  "oslssssssssso...",
  "ossssssssssso...",
  "osssssssssssso..",
  "osssssssssssso..",
  ".odsssssssssso..",
  ".odsssssssssso..",
  "..odssssssssoo..",
  "..vvvvvvvvvvvv..",
  ".vwvvvvvvvvvvwv.",
  ".vvvvvvvvvvvvvv.",
  ".vvvvvvvvvvvvvv.",
];

const THUMB_MAP = [
  "..ooo..",
  ".osslo.",
  "osssslo",
  "ossssso",
  "ossssso",
  "ossssso",
  ".osssso",
  ".osssso",
  "..osso.",
  "..osso.",
  "..oooo.",
];

const DEXHAND_MAP = [
  "..oo.oo.oo..",
  ".ossossosso.",
  ".osssssssso.",
  "oosssssssso.",
  "ossssssssso.",
  "ossssssssso.",
  "ossssssssso.",
  ".ossssssso..",
  ".ossssssso..",
  "..ossssso...",
  "..ossssso...",
  "...vvvvv....",
  "...vvvvv....",
];

function drawDexHand() {
  document.getElementById("dexHand").innerHTML =
    `<g transform="translate(0 5)">${pixelRects(DEXHAND_MAP, 10, SKIN)}</g>`;
}

/* ================= pixel placeholder covers (only when IGDB has no art) ================= */

const PLACE_HUES = [265, 340, 195, 150, 30, 0];

function pixelPoster(item) {
  const rnd = mulberry(hashSeed(item.id));
  const hue = PLACE_HUES[Math.floor(rnd() * PLACE_HUES.length)];
  const c = (l, s = 60) => `hsl(${hue}, ${s}%, ${l}%)`;
  const W = 66, H = 93, P = 6;
  let px = "";
  const put = (x, y, w, h, fill) =>
    px += `<rect x="${x * P}" y="${y * P}" width="${w * P}" height="${h * P}" fill="${fill}"/>`;
  for (let y = 0; y < 9; y++) put(0, y, 11, 1, c(14 + y * 4, 50));
  for (let i = 0; i < 10; i++) put(Math.floor(rnd() * 11), Math.floor(rnd() * 6), 1, 1, c(85, 30));
  const sx = 2 + Math.floor(rnd() * 6);
  put(sx, 2, 2, 2, `hsl(${(hue + 60) % 360}, 85%, 70%)`);
  put(sx - 1, 3, 1, 1, `hsl(${(hue + 60) % 360}, 85%, 60%)`);
  put(sx + 2, 3, 1, 1, `hsl(${(hue + 60) % 360}, 85%, 60%)`);
  for (let x = 0; x < 11; x++) {
    const h = 2 + Math.floor(rnd() * 3);
    put(x, 9 - h + 2, 1, h, c(24, 45));
  }
  for (let y = 11; y < 16; y++) put(0, y, 11, 1, c(30 - (y - 11) * 4, 40));
  const initials = item.title.split(/\s+/).slice(0, 2).map(s => s[0] || "").join("").toUpperCase();
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(item.title)}">
    <rect width="${W}" height="${H}" fill="${c(12, 40)}"/>${px}
    <text x="${W / 2}" y="${H - 22}" text-anchor="middle" font-family="'Pixelify Sans', sans-serif"
      font-size="15" font-weight="700" fill="#f4efe0" stroke="#191922" stroke-width="1">${esc(initials)}</text>
  </svg>`;
}

const COVER_BASE = "";   // the site now lives at the repo root
function posterMarkup(item) {
  return item.cover
    ? `<img src="${COVER_BASE + esc(item.cover)}" alt="${esc(item.title)} cover" loading="lazy">`
    : pixelPoster(item);
}

/* ================= pixel hearts (score 0-10 -> 5 hearts) ================= */

const HEART_PATH = "M2 3h2V1h3v1h1v1h1V2h1V1h3v2h2v4h-1v1h-1v1h-1v1h-1v1h-1v1h-2v-1H7v-1H6V9H5V8H4V7H3V6H2z";

function heartSvg(kind) {
  if (kind === "half") {
    return `<svg class="heart-half" viewBox="0 0 17 13">
      <path class="hh-r" d="${HEART_PATH}"/>
      <path class="hh-l" d="${HEART_PATH}" style="clip-path: inset(0 52% 0 0)"/></svg>`;
  }
  return `<svg class="heart-${kind}" viewBox="0 0 17 13"><path d="${HEART_PATH}"/></svg>`;
}

function heartsMarkup(score) {
  let out = "";
  for (let i = 0; i < 5; i++) {
    const v = score - i * 2;
    out += heartSvg(v >= 2 ? "full" : v >= 1 ? "half" : "empty");
  }
  return out;
}

/* ================= sound (WebAudio synth, no files) ================= */

const Sound = (() => {
  let ctx = null;
  let muted = localStorage.getItem("gt-sound") === "off";

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function tone(freq, dur, type = "square", vol = 0.06, when = 0, slide = 0) {
    if (muted) return;
    try {
      const a = ac(), t = a.currentTime + when;
      const o = a.createOscillator(), g = a.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(a.destination);
      o.start(t); o.stop(t + dur + 0.02);
    } catch (e) { /* no audio */ }
  }
  function noise(dur, vol = 0.05, when = 0) {
    if (muted) return;
    try {
      const a = ac(), t = a.currentTime + when;
      const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
      src.buffer = buf; f.type = "lowpass"; f.frequency.value = 1200;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f).connect(g).connect(a.destination);
      src.start(t);
    } catch (e) { /* no audio */ }
  }
  return {
    get muted() { return muted; },
    toggle() {
      muted = !muted;
      localStorage.setItem("gt-sound", muted ? "off" : "on");
      if (!muted) this.bleep();
      return muted;
    },
    press()   { tone(196, 0.09); tone(131, 0.1, "square", 0.05, 0.06); },
    bleep()   { tone(880, 0.06); },
    blip()    { tone(660, 0.05, "square", 0.045); },
    tick()    { tone(1245, 0.03, "square", 0.025); },
    nav()     { tone(392, 0.12, "square", 0.05, 0, -200); tone(523, 0.1, "square", 0.04, 0.1); },
    zap()     { noise(0.35, 0.04); tone(140, 0.35, "sawtooth", 0.03, 0, 460); },
    spin()    { tone(523, 0.08); tone(659, 0.08, "square", 0.05, 0.09); tone(784, 0.08, "square", 0.05, 0.18); },
    clunk()   { noise(0.07, 0.09); tone(98, 0.1, "square", 0.07, 0.02); },
    tune()    { noise(0.25, 0.05); tone(200, 0.3, "square", 0.05, 0.1, 1000); },
    fanfare() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, "square", 0.05, i * 0.09)); },
    dex()     { tone(523, 0.1); tone(784, 0.14, "square", 0.05, 0.12); },
    error()   { tone(147, 0.2, "sawtooth", 0.06); },
  };
})();

/* ================= shared state ================= */

const state = {
  query: "",
  genres: new Set(),
  platforms: new Set(),
  length: "any",                     // any | short | mid | long
  sortLib: "new",                    // new | len | az
  sortDex: "top",                    // top | len | az
  view: "landing",
};

const byStatus = s => LIBRARY.filter(g => g.status === s);
const mainHours = g => (g.ttb && g.ttb.normally) || null;

// only the platforms the user cares about — the rest is IGDB noise
const PLATFORM_ALLOW = new Set(["linux", "mac", "pc", "ps3", "ps4", "ps5", "psp",
  "x360", "switch", "switch 2", "android", "wii"]);
const relPlatforms = g => (g.platforms || []).filter(p => PLATFORM_ALLOW.has(p.toLowerCase()));

function lengthBucket(g) {
  const h = mainHours(g);
  if (h == null) return null;
  return h < 10 ? "short" : h <= 40 ? "mid" : "long";
}

function matchesFilters(g) {
  if (state.genres.size && !g.genres.some(x => state.genres.has(x))) return false;
  if (state.platforms.size && !relPlatforms(g).some(x => state.platforms.has(x))) return false;
  if (state.length !== "any" && lengthBucket(g) !== state.length) return false;
  const q = state.query.trim().toLowerCase();
  if (q) {
    const hay = (g.title + " " + g.genres.join(" ") + " " + relPlatforms(g).join(" ")).toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function sorted(items, mode) {
  const arr = [...items];
  if (mode === "az") arr.sort((a, b) => a.title.localeCompare(b.title));
  else if (mode === "len") arr.sort((a, b) => (mainHours(a) ?? 1e9) - (mainHours(b) ?? 1e9));
  else if (mode === "top") arr.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  else arr.sort((a, b) => b.date.localeCompare(a.date));   // "new"
  return arr;
}

const fmtDate = iso =>
  new Date(iso + "T00:00").toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
const fmtH = h => (h >= 10 ? Math.round(h) : h) + "H";

// a "night" is one realistic sitting: 2 hours. Nights are the headline unit;
// raw hours survive in the detail modal.
const NIGHT_HOURS = 2;
const nights = h => Math.max(1, Math.ceil(h / NIGHT_HOURS));
const fmtN = h => nights(h) + "N";
const fmtNights = h => nights(h) + (nights(h) === 1 ? " NIGHT" : " NIGHTS");

/* ================= vertical filter docks (shared state, one per division) ================= */

function allOf(key, pool) {
  return [...new Set(pool.flatMap(g => g[key] || []))].sort();
}

function renderFilters() {
  const defs = [
    { host: "filtersLib", pool: byStatus("toplay"), sortKey: "sortLib",
      sorts: [["new", "NEW"], ["len", "SHORT→LONG"], ["az", "A-Z"]] },
    { host: "filtersDex", pool: byStatus("played"), sortKey: "sortDex",
      sorts: [["top", "TOP RATED"], ["len", "SHORT→LONG"], ["az", "A-Z"]] },
  ];
  const sec = (title, chips) =>
    `<div class="fd-sec"><div class="fd-title">${title}</div><div class="fd-chips">${chips}</div></div>`;
  for (const d of defs) {
    const host = document.getElementById(d.host);
    const wasOpen = host.classList.contains("open");
    let sortChips = "", lenChips = "", platChips = "", genreChips = "";
    for (const [val, label] of d.sorts)
      sortChips += `<button class="chip-btn ${state[d.sortKey] === val ? "active" : ""}" data-sort="${val}">${label}</button>`;
    for (const [val, label] of [["any", "ANY"], ["short", "&lt;10H"], ["mid", "10-40H"], ["long", "40H+"]])
      lenChips += `<button class="chip-btn ${state.length === val ? "active" : ""}" data-len="${val}">${label}</button>`;
    for (const p of [...new Set(d.pool.flatMap(relPlatforms))].sort())
      platChips += `<button class="chip-btn ${state.platforms.has(p) ? "active" : ""}" data-plat="${esc(p)}">${esc(p)}</button>`;
    for (const g of allOf("genres", d.pool))
      genreChips += `<button class="chip-btn ${state.genres.has(g) ? "active" : ""}" data-genre="${esc(g)}">${esc(g)}</button>`;
    host.innerHTML = sec("SORT", sortChips) + sec("LENGTH", lenChips) +
      sec("PLATFORM", platChips) + sec("GENRE", genreChips);
    host.classList.toggle("open", wasOpen);
    host.onclick = e => {
      const b = e.target.closest(".chip-btn");
      if (!b) return;
      Sound.blip();
      if (b.dataset.sort) state[d.sortKey] = b.dataset.sort;
      if (b.dataset.len) state.length = b.dataset.len;
      if (b.dataset.plat) state.platforms.has(b.dataset.plat) ? state.platforms.delete(b.dataset.plat) : state.platforms.add(b.dataset.plat);
      if (b.dataset.genre) state.genres.has(b.dataset.genre) ? state.genres.delete(b.dataset.genre) : state.genres.add(b.dataset.genre);
      refreshCollections();
    };
  }
  document.querySelectorAll(".fd-toggle").forEach(btn => {
    btn.onclick = () => {
      Sound.blip();
      document.getElementById(btn.dataset.dock).classList.toggle("open");
    };
  });
}

function refreshCollections() {
  renderFilters();
  Storm.rebuild();
  Dex.render();
}

/* ================= landing decor: shelf boxes, static, stars ================= */

/* Every empty channel renders its own per-frame snow, the same fine grain the
   full-screen static had. Stretching one low-res texture across a cell (what
   this used to do) upscales into smeared blocks — that was the ugly part. */
function initStatic() {
  const grid = document.getElementById("tvGrid");
  let ctxs = [], img = null;

  function collect() {
    const canvases = [...grid.querySelectorAll(".ch-snow")];
    ctxs = canvases.map(c => c.getContext("2d"));
    img = canvases.length ? ctxs[0].createImageData(canvases[0].width, canvases[0].height) : null;
  }
  new MutationObserver(collect).observe(grid, { childList: true });
  collect();

  (function frame() {
    if (!document.hidden && !grid.hidden && state.view === "landing" && img) {
      const d = img.data;
      for (let n = 0; n < ctxs.length; n++) {
        for (let i = 0; i < d.length; i += 4) {
          const v = (Math.random() * 255) | 0;
          d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
        }
        ctxs[n].putImageData(img, 0, 0);
      }
    }
    setTimeout(() => requestAnimationFrame(frame), 90);
  })();
}

/* ================= the backlog storm (tornado funnel) =================
   Cards are projected through an actual pitched camera, so apparent size and
   paint order come from the SAME depth value. Deriving z-index from anything
   else (the old code used sin(theta) and ignored the ring radius) is what made
   covers flip in front of each other for no visible reason.                   */

const SESSION_SEED = (Math.random() * 4294967295) | 0;

const Storm = (() => {
  const host = document.getElementById("funnel");
  const TAU = Math.PI * 2;
  const FOCAL = 1800, PITCH = 0.26;         // long lens keeps the nearest cards sane
  let cards = [], ringCount = 5;
  let rot = 0, vel = 0, camY = 0, camYT = 0;
  let speed = 1, speedTarget = 1, hoverId = null, running = false, lastTs = 0;
  let dragging = false, lastX = 0, dragMoved = false;

  function ambience() {
    let h = "";
    for (let i = 0; i < 9; i++)
      h += `<i class="st-streak" style="top:${(8 + Math.random() * 80).toFixed(1)}%;
        width:${(18 + Math.random() * 26).toFixed(1)}vw;
        animation-duration:${(3.4 + Math.random() * 4).toFixed(1)}s;
        animation-delay:-${(Math.random() * 6).toFixed(1)}s;
        opacity:${(0.22 + Math.random() * 0.35).toFixed(2)}"></i>`;
    for (let i = 0; i < 20; i++)
      h += `<i class="st-dust" style="left:${(Math.random() * 100).toFixed(1)}%;bottom:0;
        animation-duration:${(7 + Math.random() * 9).toFixed(1)}s;
        animation-delay:-${(Math.random() * 14).toFixed(1)}s"></i>`;
    document.getElementById("stormFx").innerHTML = h;
  }

  function build() {
    cards.forEach(c => c.el.remove());
    cards = [];
    const all = byStatus("toplay");
    document.getElementById("countToplay").textContent = all.length;
    let pool = sorted(all.filter(matchesFilters), state.sortLib);
    // with no filter or sort chosen, scatter the games across the funnel differently
    // each visit — otherwise Doom lives at the top forever. Seeded once per page
    // load so resizing or re-rendering never reshuffles mid-session.
    const arranged = state.genres.size || state.platforms.size ||
      state.length !== "any" || state.query.trim() !== "" || state.sortLib !== "new";
    if (!arranged) {
      const rnd = mulberry(SESSION_SEED);
      pool = pool.slice();
      for (let i = pool.length - 1; i > 0; i--) {
        const k = Math.floor(rnd() * (i + 1));
        [pool[i], pool[k]] = [pool[k], pool[i]];
      }
    }
    if (!pool.length) return;
    ringCount = 4;
    const per = Math.ceil(pool.length / ringCount);
    pool.forEach((g, i) => {
      const block = Math.min(ringCount - 1, Math.floor(i / per));
      const ring = ringCount - 1 - block;          // first sorted item -> top ring
      const idx = i % per, cnt = Math.min(per, pool.length - block * per);
      const len = state.sortLib === "len" ? mainHours(g) : null;
      const el = document.createElement("div");
      el.className = "sc";
      el.innerHTML = `${len ? `<span class="n">${fmtH(len)}</span>` : ""}
        <div class="sc-in">${posterMarkup(g)}</div>`;
      el.addEventListener("click", ev => {
        if (dragMoved) return;                 // a spin must never open a game
        ev.stopPropagation();
        openModal(g);
      });
      el.addEventListener("mouseenter", () => { speedTarget = 0.07; hoverId = g.id; Sound.tick(); });
      el.addEventListener("mouseleave", () => { speedTarget = 1; hoverId = null; });
      host.appendChild(el);
      cards.push({ g, el, ring, ang: (idx / cnt) * TAU });
    });
    place();
  }

  function place() {
    const W = host.clientWidth || innerWidth, H = host.clientHeight || innerHeight;
    const small = W < 760;
    // only shift off-centre while the filter dock is actually occupying the left edge
    const dockOpen = document.getElementById("filtersLib").classList.contains("open");
    const cx = (small || !dockOpen) ? W / 2 : (W + 228) / 2;
    const horizon = H * 0.76;
    const rBase = small ? W * 0.15 : Math.min(W * 0.09, 110);
    const rTop  = small ? W * 0.36 : Math.min(W * 0.26, 400);
    const gap   = small ? H * 0.145 : H * 0.160;
    const sinP = Math.sin(PITCH), cosP = Math.cos(PITCH);
    const maxZ = rTop * cosP + (ringCount - 1) * gap * sinP || 1;
    const wantBlur = W >= 900;
    let best = null, bestScore = -1e9;

    for (const c of cards) {
      const f = ringCount > 1 ? c.ring / (ringCount - 1) : 0;
      const r = rBase + f * (rTop - rBase);
      const dir = c.ring % 2 ? -1 : 1;                    // rings counter-rotate
      const th = c.ang + rot * (0.55 + c.ring * 0.14) * dir;

      // world space: the funnel stands on the floor, y grows upward (negative screen-wise)
      const wx = r * Math.cos(th);
      const wz = r * Math.sin(th);
      const wy = -c.ring * gap + camY;

      // pitch the camera down, then project
      const y1 = wy * cosP - wz * sinP;
      const z1 = wy * sinP + wz * cosP;
      const persp = FOCAL / (FOCAL + z1);
      const x = cx + wx * persp;
      const y = horizon + y1 * persp;
      const k = Math.max(-1, Math.min(1, z1 / maxZ));     // -1 nearest … +1 farthest

      c.el.style.transform =
        `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-50%) ` +
        `rotateY(${(Math.cos(th) * 20).toFixed(1)}deg) scale(${persp.toFixed(4)})`;
      // same depth drives size AND stacking, so a crossing always looks right
      c.el.style.zIndex = Math.round(3000 - z1 * 2);
      c.el.style.filter = wantBlur
        ? `brightness(${(1 - Math.max(0, k) * 0.34).toFixed(2)}) blur(${(Math.max(0, k) * 1.5).toFixed(2)}px)`
        : `brightness(${(1 - Math.max(0, k) * 0.34).toFixed(2)})`;
      let op = 1;
      if (y < 200) op = Math.min(op, Math.max(0, (y - 132) / 68));
      if (y > H - 26) op = Math.min(op, Math.max(0, (H + 44 - y) / 70));
      c.el.style.opacity = op.toFixed(2);

      const score = -z1 - Math.abs(y - horizon) * 0.6;
      if (score > bestScore) { bestScore = score; best = c; }
    }

    const hovered = hoverId && cards.find(c => c.g.id === hoverId);
    const f = hovered || best;
    if (f) cards.forEach(c => c.el.classList.toggle("focus", c === f));
  }

  function frame(ts) {
    const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0);
    lastTs = ts;
    if (state.view === "library" && !document.hidden) {
      speed += (speedTarget - speed) * 0.08;
      vel *= 0.94;
      rot += dt * 0.30 * speed + vel;
      camY += (camYT - camY) * 0.1;
      place();
    }
    requestAnimationFrame(frame);
  }

  function start() {
    if (REDUCED) { place(); return; }
    if (running) return;
    running = true; lastTs = performance.now();
    requestAnimationFrame(frame);
  }

  const div = () => document.getElementById("divLibrary");
  addEventListener("pointerdown", e => {
    if (state.view !== "library" || !modal.hidden) return;
    if (e.target.closest(".topbar,.filter-dock,.fd-toggle,.back-nav,.division-head,.search-overlay")) return;
    dragging = true; dragMoved = false; lastX = e.clientX;
    div().classList.add("grabbing");
  });
  addEventListener("pointermove", e => {
    if (!dragging) return;
    const dx = e.clientX - lastX; lastX = e.clientX;
    if (Math.abs(dx) > 1) dragMoved = true;
    vel += dx * 0.00020;
    rot += dx * 0.0015;
  });
  addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    div().classList.remove("grabbing");
    setTimeout(() => { dragMoved = false; }, 60);
  });
  addEventListener("wheel", e => {
    if (state.view !== "library" || !modal.hidden) return;
    camYT = Math.max(-innerHeight * 0.34, Math.min(innerHeight * 0.34, camYT + e.deltaY * 0.5));
  }, { passive: true });

  let rt = 0;
  addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      place();
    }, 180);
  });

  ambience();
  return { rebuild: build, start };
})();

/* ================= the TV: power -> 4x3 channels -> a game ================= */

const TV = (() => {
  const tv = document.getElementById("tv");
  const grid = document.getElementById("tvGrid");
  const show = document.getElementById("tvShow");
  const screen = document.getElementById("tvScreen");
  let on = false;

  function buildGrid() {
    const playing = byStatus("playing");
    let html = "";
    for (let i = 0; i < 12; i++) {
      const g = playing[i];
      if (!g) { html += `<div class="ch dead"><canvas class="ch-snow" width="72" height="54"></canvas></div>`; continue; }
      const len = mainHours(g);
      html += `<button class="ch" data-id="${esc(g.id)}" title="${esc(g.title)}">
        ${g.cover ? `<img src="${COVER_BASE + esc(g.cover)}" alt="">` : ""}
        <span class="ch-lb">${esc(g.title)}<span class="ch-hr">${len ? "~" + fmtH(len) : "IN PROGRESS"}</span></span>
      </button>`;
    }
    grid.innerHTML = html;
  }

  function showGame(g) {
    const cover = document.getElementById("tvCover");
    if (g.cover) { cover.src = COVER_BASE + g.cover; cover.hidden = false; }
    else cover.hidden = true;
    document.getElementById("tvTitle").textContent = g.title;
    const progHost = document.getElementById("tvProgress");
    const hrs = g.progress && g.progress.hours;
    const main = mainHours(g);
    if (hrs != null && main) {
      const pct = Math.min(100, Math.round((hrs / main) * 100));
      progHost.innerHTML = `<span>${fmtH(hrs)} / ${fmtH(main)}</span><div class="tv-bar"><i></i></div><span>${pct}%</span>`;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        progHost.querySelector(".tv-bar i").style.width = pct + "%";
      }));
    } else if (main) {
      progHost.innerHTML = `<span>QUEST LENGTH ~${fmtH(main)}</span>`;
    } else {
      progHost.innerHTML = `<span>IN PROGRESS…</span>`;
    }
    grid.hidden = true;
    show.hidden = false;
  }

  function openChannel(g) {
    Sound.tune();
    screen.classList.add("tv-flash");
    setTimeout(() => screen.classList.remove("tv-flash"), 260);
    showGame(g);
    Sound.fanfare();
  }

  function power() {
    on = !on;
    if (on) {
      Sound.tune();
      tv.classList.remove("off"); tv.classList.add("on");
      buildGrid();
      grid.hidden = false; show.hidden = true;
      screen.classList.add("tv-flash");
      setTimeout(() => screen.classList.remove("tv-flash"), 260);
    } else {
      Sound.blip();
      tv.classList.add("off"); tv.classList.remove("on");
      grid.hidden = true; show.hidden = true;
    }
  }

  document.getElementById("tvKnob").addEventListener("click", power);
  document.getElementById("tvBack").addEventListener("click", () => {
    Sound.blip(); show.hidden = true; grid.hidden = false;
  });
  grid.addEventListener("click", e => {
    const b = e.target.closest(".ch:not(.dead)");
    if (!b) return;
    const g = LIBRARY.find(x => x.id === b.dataset.id);
    if (g) openChannel(g);
  });

  return { buildGrid };
})();

/* ================= landing navigation ================= */

function initLanding() {
  const sel = document.getElementById("btnSelect");
  const sta = document.getElementById("btnStart");
  const press = (btn, view) => {
    Sound.press();
    btn.classList.add("pressed");
    setTimeout(() => setView(view), 110);
    setTimeout(() => btn.classList.remove("pressed"), 380);
  };
  sel.addEventListener("click", () => press(sel, "library"));
  sta.addEventListener("click", () => press(sta, "pokedex"));
  document.querySelectorAll("[data-goto]").forEach(b =>
    b.addEventListener("click", () => { Sound.press(); setView(b.dataset.goto); }));
  document.getElementById("lblToplay").textContent = byStatus("toplay").length;
}

/* ================= pokedex ================= */

const Dex = (() => {
  const dex = document.getElementById("dex");
  const grid = document.getElementById("dexGrid");
  let selectedId = null, opened = false;

  function open() {
    if (opened) return;
    opened = true;
    Sound.dex();
    const hand = document.getElementById("dexHand");
    if (!REDUCED) {
      hand.classList.add("flipping");
      setTimeout(() => dex.dataset.open = "true", 320);
      setTimeout(() => hand.classList.remove("flipping"), 1600);
    } else {
      dex.dataset.open = "true";
    }
  }

  function select(g, quiet) {
    selectedId = g.id;
    grid.querySelectorAll(".dex-card").forEach(c =>
      c.classList.toggle("selected", c.dataset.id === g.id));
    document.getElementById("dexScreenEmpty").hidden = true;
    const body = document.getElementById("dexScreenBody");
    body.hidden = true;
    document.getElementById("dexCoverWrap").innerHTML = posterMarkup(g);
    document.getElementById("dexName").textContent = g.title;
    document.getElementById("dexHearts").innerHTML =
      g.score != null ? heartsMarkup(g.score) : `<span style="font-family:var(--px);font-size:13px;color:#3ba7d8">UNRATED</span>`;
    const bits = [g.year, mainHours(g) ? "~" + fmtH(mainHours(g)) : null, g.genres.slice(0, 2).join(" · ")];
    document.getElementById("dexMeta").textContent = bits.filter(Boolean).join("  ·  ");
    requestAnimationFrame(() => { body.hidden = false; });
    document.getElementById("dexMore").onclick = () => openModal(g);
    if (!quiet) Sound.blip();
  }

  function render() {
    const played = byStatus("played");
    document.getElementById("countPlayed").textContent = played.length;
    document.getElementById("lblPlayed").textContent = played.length;
    const items = sorted(played.filter(matchesFilters), state.sortDex);
    grid.innerHTML = items.length
      ? items.map(g => `
        <div class="dex-card" data-id="${esc(g.id)}" tabindex="0" role="button" aria-label="${esc(g.title)}">
          <div class="dc-poster">${posterMarkup(g)}</div>
          <div class="dc-hearts">${g.score != null ? heartsMarkup(g.score) : ""}</div>
        </div>`).join("")
      : `<div style="grid-column:1/-1;font-family:var(--px);font-size:15px;line-height:1.8;text-align:center;color:#ffd9d0;padding:20px 6px">
          ${played.length ? "NO GAMES MATCH THE FILTERS" : "NOTHING BEATEN YET —<br>GO PLAY SOMETHING!"}</div>`;
    const rated = played.filter(g => g.score != null);
    document.getElementById("dexAvg").innerHTML = rated.length
      ? `AVG ${(rated.reduce((s, g) => s + g.score, 0) / rated.length).toFixed(1)}<br>${played.length} GAMES`
      : `${played.length} GAMES`;
    const sel = items.find(g => g.id === selectedId) || items[0];
    if (sel) select(sel, true);
    else {
      document.getElementById("dexScreenEmpty").hidden = false;
      document.getElementById("dexScreenBody").hidden = true;
    }
  }

  dex.addEventListener("click", e => {
    if (dex.dataset.open === "false") { open(); return; }
    const card = e.target.closest(".dex-card");
    if (card) {
      const g = LIBRARY.find(x => x.id === card.dataset.id);
      if (g) select(g);
    }
  });
  grid.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      const card = e.target.closest(".dex-card");
      const g = card && LIBRARY.find(x => x.id === card.dataset.id);
      if (g) select(g);
    }
  });

  return { render, open };
})();

/* ================= detail modal (RPG dialog) ================= */

const modal = document.getElementById("modal");

function openModal(g) {
  Sound.bleep();
  const ttb = g.ttb || {};
  const cell = (label, v, active) =>
    `<div class="ttb-cell ${active ? "ttb-active" : ""}"><b>${v ? fmtH(v) : "—"}</b><span>${label}</span></div>`;
  const statusTag = { playing: "NOW PLAYING", toplay: "BACKLOG", played: "BEATEN" }[g.status];
  const hrs = g.progress && g.progress.hours;
  const main = mainHours(g);
  let progress = "";
  if (g.status === "playing" && hrs != null && main) {
    const pct = Math.min(100, Math.round((hrs / main) * 100));
    progress = `<div class="modal-progress"><span>${fmtH(hrs)}</span>
      <div class="tv-bar"><i style="width:${pct}%"></i></div><span>${pct}%</span></div>`;
  }
  // no verdict until the credits roll
  const scoreRow = g.status === "playing" ? "" :
    g.score != null
      ? `<div class="modal-hearts">${heartsMarkup(g.score)}<span class="hearts-num">${g.score}/10</span></div>`
      : `<div class="modal-unrated">UNRATED</div>`;
  document.getElementById("modalBody").innerHTML = `
    <div class="modal-poster">${posterMarkup(g)}</div>
    <div class="modal-info">
      <div class="modal-title">${esc(g.title)}</div>
      <div class="modal-meta">
        <span class="tag">${statusTag}</span>
        <span class="tag">${g.year ?? "????"}</span>
        ${relPlatforms(g).slice(0, 5).map(p => `<span class="tag plat">${esc(p)}</span>`).join("")}
        ${g.genres.slice(0, 3).map(x => `<span class="tag">${esc(x)}</span>`).join("")}
      </div>
      ${scoreRow}
      ${progress}
      ${(ttb.hastily || ttb.normally || ttb.completely)
        ? `${main ? `<div class="nights-line">≈ <b>${fmtNights(main)}</b> at 2h a night</div>` : ""}
           <div class="ttb-row">${cell("RUSH", ttb.hastily)}${cell("MAIN", ttb.normally, true)}${cell("100%", ttb.completely)}</div>`
        : `<div class="modal-unrated">QUEST LENGTH UNKNOWN</div>`}
      <div class="modal-synopsis">${esc(g.synopsis || "No synopsis on record.")}</div>
      ${g.notes ? `<div class="modal-notes">${esc(g.notes)}</div>` : ""}
      <div class="modal-date">${g.status === "played" ? "BEATEN " : "ADDED "}${fmtDate(g.date).toUpperCase()}</div>
    </div>`;
  modal.hidden = false;
}

function closeModal() { modal.hidden = true; }

document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("modalBackdrop").addEventListener("click", closeModal);

/* ================= search overlay ================= */

const searchBox = document.getElementById("searchBox");
const searchOverlay = document.getElementById("searchOverlay");

function renderSearch() {
  const q = state.query.trim();
  if (!q) { searchOverlay.hidden = true; return; }
  const hits = LIBRARY.filter(matchesFilters).slice(0, 12);
  searchOverlay.innerHTML = hits.length
    ? hits.map(g => `
      <button class="search-row" data-id="${esc(g.id)}">
        ${g.cover ? `<img src="${COVER_BASE + esc(g.cover)}" alt="">` : `<span class="ph-mini">${pixelPoster(g)}</span>`}
        <span><span class="sr-name">${esc(g.title)}</span><br>
        <span class="sr-sub">${g.year ?? ""}${mainHours(g) ? " · ~" + fmtH(mainHours(g)) : ""}</span></span>
        <span class="sr-tag ${g.status}">${{ playing: "PLAYING", toplay: "TO PLAY", played: "PLAYED" }[g.status]}</span>
      </button>`).join("")
    : `<div class="search-empty">NO GAMES FOUND FOR “${esc(q.toUpperCase())}”</div>`;
  searchOverlay.hidden = false;
}

searchBox.addEventListener("input", () => {
  state.query = searchBox.value;
  renderSearch();
  refreshCollections();
});
searchOverlay.addEventListener("click", e => {
  const row = e.target.closest(".search-row");
  if (!row) return;
  const g = LIBRARY.find(x => x.id === row.dataset.id);
  if (g) openModal(g);
});
document.addEventListener("click", e => {
  if (!searchOverlay.hidden && !e.target.closest(".search-overlay, .search-wrap")) searchOverlay.hidden = true;
});

/* ================= camera + controller ================= */

const world = document.getElementById("world");

function setView(v) {
  if (state.view === v) return;
  state.view = v;
  world.dataset.view = v;
  Sound.nav();
  if (v === "library") Storm.start();
}

function pressAndGo(btnId, thumbId, view) {
  const btn = document.getElementById(btnId);
  const thumb = document.getElementById(thumbId);
  Sound.press();
  btn.classList.add("pressed");
  thumb.classList.add("press");
  setTimeout(() => setView(view), 240);
  setTimeout(() => {
    btn.classList.remove("pressed");
    thumb.classList.remove("press");
  }, 650);
}

/* ================= topbar toggles + keyboard ================= */

function initChrome() {
  const soundBtn = document.getElementById("soundBtn");
  const syncSound = () => {
    soundBtn.classList.toggle("off", Sound.muted);
    soundBtn.setAttribute("aria-pressed", String(!Sound.muted));
  };
  soundBtn.addEventListener("click", () => { Sound.toggle(); syncSound(); });
  syncSound();

  // CRT button now governs the TV-glass effect only
  const crtBtn = document.getElementById("crtBtn");
  if (localStorage.getItem("gt-tvfx") === "off") document.body.classList.add("tvfx-off");
  const syncCrt = () => {
    crtBtn.classList.toggle("off", document.body.classList.contains("tvfx-off"));
    crtBtn.setAttribute("aria-pressed", String(!document.body.classList.contains("tvfx-off")));
  };
  crtBtn.addEventListener("click", () => {
    Sound.blip();
    document.body.classList.toggle("tvfx-off");
    localStorage.setItem("gt-tvfx", document.body.classList.contains("tvfx-off") ? "off" : "on");
    syncCrt();
  });
  syncCrt();

  document.getElementById("homeBtn").addEventListener("click", () => setView("landing"));

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      if (!modal.hidden) closeModal();
      else if (!searchOverlay.hidden) { searchOverlay.hidden = true; searchBox.blur(); }
      else if (state.view !== "landing") setView("landing");
      return;
    }
    if (e.target.closest("input")) return;
    if (e.key === "ArrowLeft") setView(state.view === "pokedex" ? "landing" : "library");
    if (e.key === "ArrowRight") setView(state.view === "library" ? "landing" : "pokedex");
  });
}

/* ================= boot ================= */

drawDexHand();
initStatic();
initLanding();
initChrome();
renderFilters();
if (innerWidth >= 760) document.querySelectorAll(".filter-dock").forEach(d => d.classList.add("open"));
Storm.rebuild();
Storm.start();
Dex.render();
