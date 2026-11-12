/*
 * V17 landing page: the V5 world (navy night, pale-blue blocks, glowing paths, bloom, a camera that
 * flies from station to station as you scroll) telling the current five steps:
 *   1 Progress     ten people talking, their voices as bars, drawn into one signal
 *   2 Outcome      one behaviour, where it is today, and the target above it
 *   3 Opportunity  struggles along the customer's timeline, one chosen, the rest parked
 *   4 Causal       worked backwards from the outcome, then run forwards
 *   5 Delivery     several solutions against a bar set beforehand; one passes; its effect is read
 * then the evidence travels home to step 1.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const root = document.documentElement;
const journey = document.getElementById('top');
const panels = Array.from(document.querySelectorAll('.panel')).map(el => ({ el, r: el.dataset.range.split(' ').map(Number) }));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 860px)').matches;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = t => t * t * t * (t * (t * 6 - 15) + 10);
const span = (a, b, x) => ease(clamp((x - a) / (b - a)));
const TAU = Math.PI * 2;

function start() {
  if (reduce || !journey) return;
  const canvas = document.createElement('canvas'); canvas.className = 'world'; canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); } catch (e) { return; }
  if (!renderer.getContext()) return;
  document.body.prepend(canvas); root.classList.add('webgl');

  const DPR = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75);
  renderer.setPixelRatio(DPR); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const BG = new THREE.Color('#061a38'), scene = new THREE.Scene(); scene.background = BG; scene.fog = new THREE.FogExp2(BG, 0.0105);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 600);
  scene.add(new THREE.HemisphereLight(0xc6dcff, 0x0a1d3d, 1.25));
  const sun = new THREE.DirectionalLight(0xffffff, 2.3); sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 140 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0x6f9cff, 0.6); fill.position.set(40, 22, -30); scene.add(fill);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: '#0c2549', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const grid = new THREE.GridHelper(400, 200, 0x1e4479, 0x1e4479); grid.material.transparent = true; grid.material.opacity = 0.2; grid.position.y = 0.012; scene.add(grid);

  const mBuild = new THREE.MeshStandardMaterial({ color: '#e6eefa', roughness: 0.8 });
  const mSoft = new THREE.MeshStandardMaterial({ color: '#b9cbe6', roughness: 0.86 });
  const mTile = new THREE.MeshStandardMaterial({ color: '#9fb6d6', roughness: 0.85 });
  const mFig = new THREE.MeshStandardMaterial({ color: '#f4f8ff', roughness: 0.6 });
  const GLOW = new THREE.Color(0.52, 0.8, 1.0);
  const glow = (k = 2.2, opacity = 1, additive = false) => new THREE.MeshBasicMaterial({
    color: GLOW.clone().multiplyScalar(k), toneMapped: false, transparent: additive || opacity < 1, opacity,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: !additive });
  const lit = () => new THREE.MeshStandardMaterial({ color: '#c9d9f1', roughness: 0.6, emissive: GLOW, emissiveIntensity: 0 });

  const G = {
    block: new RoundedBoxGeometry(1, 1, 1, 2, 0.07).translate(0, 0.5, 0),
    box: new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
    prism: (() => { const g = new THREE.CylinderGeometry(0.58, 0.58, 1, 3, 1); g.rotateY(Math.PI / 2); g.rotateZ(Math.PI / 2); g.translate(0, 0.29, 0); return g; })(),
    vault: (() => { const g = new THREE.CylinderGeometry(0.5, 0.5, 1, 20, 1, false, 0, Math.PI); g.rotateZ(Math.PI / 2); return g; })(),
    cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 32).translate(0, 0.5, 0),
    ball: new THREE.IcosahedronGeometry(0.5, 1),
    fig: new THREE.CapsuleGeometry(0.15, 0.4, 4, 8).translate(0, 0.35, 0),
  };
  G.tile = G.block;
  const I = { block: [], tile: [], box: [], prism: [], vault: [], cyl: [], ball: [], fig: [] };
  const UP = new THREE.Vector3(0, 1, 0);
  function put(kind, x, y, z, sx, sy, sz, ry = 0) { I[kind].push(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(UP, ry), new THREE.Vector3(sx, sy, sz))); }
  function bake(kind, mat) { const list = I[kind]; if (!list.length) return; const m = new THREE.InstancedMesh(G[kind], mat, list.length);
    list.forEach((mx, i) => m.setMatrixAt(i, mx)); m.castShadow = true; m.receiveShadow = true; scene.add(m); }
  const solo = (geo, mat, x, y, z, sx, sy, sz) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = m.receiveShadow = true; scene.add(m); return m; };

  let seed = 11;
  const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const rr = (a, b) => a + (b - a) * rnd();

  const S = { talk: new THREE.Vector3(-18, 0, 12), out: new THREE.Vector3(16, 0, 14), opp: new THREE.Vector3(22, 0, -10), cause: new THREE.Vector3(0, 0, -24), ship: new THREE.Vector3(-22, 0, -14) };
  const V = (x, z) => new THREE.Vector3(x, 0.07, z);
  const tmpM = new THREE.Matrix4(), tq = new THREE.Quaternion(), tp = new THREE.Vector3(), ts = new THREE.Vector3();
  function tube(curve, segs = 200, r = 0.075, k = 2.6) {
    const core = new THREE.TubeGeometry(curve, segs, r, 8, false), halo = new THREE.TubeGeometry(curve, segs, r * 3.4, 8, false);
    const a = new THREE.Mesh(core, glow(k)), b = new THREE.Mesh(halo, glow(0.9, 0.2 * k / 2.6, true)); a.visible = b.visible = false; scene.add(a, b);
    return { curve, set(f) { const n = Math.floor(segs * clamp(f)) * 48; core.setDrawRange(0, n); halo.setDrawRange(0, n); a.visible = b.visible = f > 0.002; } };
  }

  /* ---------- 1 · ten people talking ---------- */
  const SIDE = new THREE.Vector3(1, 0, -0.8).normalize();             // screen-right for this camera, so rows of bars face it
  const NV = 10, VB = 5, BIGB = 17;
  const people = Array.from({ length: NV }, (_, i) => { const a = i / NV * TAU + 0.2, x = S.talk.x + Math.cos(a) * 5.4, z = S.talk.z + Math.sin(a) * 5.4;
    put('fig', x, 0, z, 1.25, 1.25, 1.25);
    return { x, z, w: rr(0.5, 0.95), ph: rr(0, TAU), bars: Array.from({ length: VB }, () => [rr(6, 11), rr(0, TAU), rr(2, 4), rr(0, TAU)]),
      line: tube(new THREE.CatmullRomCurve3([V(x - Math.cos(a) * 0.6, z - Math.sin(a) * 0.6), V(S.talk.x + Math.cos(a + 0.25) * 3.2, S.talk.z + Math.sin(a + 0.25) * 3.2), V(S.talk.x + Math.cos(a) * 1.5, S.talk.z + Math.sin(a) * 1.5)]), 40, 0.045, 1.3) }; });
  [[-25.5, 7.5, 0.1], [-27, 12.5, -0.08], [-25, 17.5, 0.12], [-20.5, 20, -0.1]].forEach(([x, z, ry]) => { const w = rr(1.6, 2.1), d = rr(1.5, 1.8), h = rr(1.1, 1.5); put('block', x, 0, z, w, h, d, ry); put('prism', x, h, z, w + 0.1, rr(0.8, 1), d + 0.1, ry); });
  [[-28.5, 9.6], [-23, 21.5], [-11.5, 19]].forEach(([x, z]) => { put('cyl', x, 0, z, 0.16, 0.7, 0.16); put('ball', x, 1.2, z, 1.1, 1.2, 1.1); });
  put('cyl', S.talk.x, 0, S.talk.z, 3.4, 0.45, 3.4);
  const bars = new THREE.InstancedMesh(G.box, glow(1.35), NV * VB + BIGB); bars.frustumCulled = false; scene.add(bars);
  const signalHalo = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), glow(0.6, 0.07, true)); signalHalo.position.set(S.talk.x, 2, S.talk.z); scene.add(signalHalo);
  const pulses = people.map((p, i) => { const m = new THREE.Mesh(new THREE.RingGeometry(0.36, 0.44, 40), glow(1.8, 1, true)); m.rotation.x = -Math.PI / 2; m.position.set(p.x, 0.05, p.z); scene.add(m); return { m, o: i * 0.37 }; });
  const setBar = (n, x, y, z, w, h) => { tp.set(x, y, z); ts.set(w, Math.max(0.001, h), w); tmpM.compose(tp, tq, ts); bars.setMatrixAt(n, tmpM); };

  /* ---------- 2 · one behaviour and its target ---------- */
  put('block', S.out.x, 0, S.out.z, 12.4, 0.35, 3.2);
  const NC = 8, GH = 4, TARGET = 5.6;
  const cols = Array.from({ length: NC }, (_, i) => { const h = 1.3 + 0.28 * Math.sin(i * 1.3 + 1) + i * 0.07; const m = solo(G.block, mBuild, S.out.x - 5.3 + i * 0.9, 0.35, S.out.z, 0.62, 0.01, 1.5); m.userData.h = h; return m; });
  const ghosts = Array.from({ length: GH }, (_, i) => { const h0 = cols[NC - 1].userData.h, h = h0 + (TARGET - h0) * ease((i + 1) / GH);
    const m = solo(G.box, new THREE.MeshStandardMaterial({ color: '#8fb6e6', roughness: 0.8, transparent: true, opacity: 0.4, emissive: GLOW, emissiveIntensity: 0.25 }), S.out.x - 5.3 + (NC + i) * 0.9, 0.35, S.out.z, 0.6, 0.01, 1.45); m.userData.h = h; m.castShadow = false; return m; });
  const targetBeam = solo(G.box, glow(2.5), S.out.x, 0.35 + TARGET, S.out.z, 0.01, 0.07, 0.07); targetBeam.castShadow = false;
  const beacon = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.06, 12, 72), glow(2.6)); beacon.rotation.x = Math.PI / 2; beacon.position.set(S.out.x - 5.3 + (NC + GH - 1) * 0.9, 0.35 + TARGET + 1.1, S.out.z);
  const beaconHalo = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.26, 12, 72), glow(0.8, 0.2, true)); beaconHalo.rotation.x = Math.PI / 2; beaconHalo.position.copy(beacon.position); scene.add(beacon, beaconHalo);
  [[10.5, 17.2], [12, 17.8], [21.5, 17], [22.6, 11.6]].forEach(([x, z]) => put('fig', x, 0, z, 1, 1, 1));
  put('block', S.out.x + 9.5, 0, S.out.z - 3.5, 2.8, 5.2, 2.8); put('block', S.out.x + 12.2, 0, S.out.z - 1, 2.2, 3.2, 2.4); put('box', S.out.x + 9.2, 5.2, S.out.z - 3.7, 1, 0.4, 0.9);

  /* ---------- 3 · struggles along the timeline ---------- */
  const NS = 6, PICK = 3, SH = [1.5, 2.6, 1.1, 3.6, 2.1, 1.4];
  const timeline = tube(new THREE.CatmullRomCurve3([V(S.opp.x - 7, S.opp.z + 1.9), V(S.opp.x, S.opp.z + 1.9), V(S.opp.x + 7, S.opp.z + 1.9)]), 60, 0.06);
  const strug = SH.map((h, i) => { const m = solo(G.block, lit(), S.opp.x - 5.25 + i * 2.1, 0, S.opp.z, 1.45, 0.3, 1.45); m.userData.h = h; return m; });
  const winRing = new THREE.Mesh(new THREE.RingGeometry(1.25, 1.4, 64), glow(2.4, 1, true)); winRing.rotation.x = -Math.PI / 2; winRing.position.set(strug[PICK].position.x, 0.04, S.opp.z); scene.add(winRing);
  [[17, -6.2], [20.6, -6.6], [26.5, -6.4]].forEach(([x, z]) => put('fig', x, 0, z, 1, 1, 1));

  /* ---------- 4 · backwards from the outcome, then forwards ---------- */
  const NN = 4, nodeX = i => S.cause.x - 5.7 + i * 3.8;                // 0 is the outcome (left), 3 is what you control (right)
  const nodes = Array.from({ length: NN }, (_, i) => { put('cyl', nodeX(i), 0, S.cause.z, 2.3, 0.55, 2.3);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.12, 40), glow(1.15)); cap.position.set(nodeX(i), 0.62, S.cause.z); cap.scale.setScalar(0.001); scene.add(cap); return cap; });
  const backLink = tube(new THREE.CatmullRomCurve3([V(nodeX(0), S.cause.z + 1.7), V(nodeX(1), S.cause.z + 1.7), V(nodeX(2), S.cause.z + 1.7), V(nodeX(3), S.cause.z + 1.7)]), 90, 0.06, 1.8);
  const causeRing = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.06, 12, 72), glow(1.6, 1, true)); causeRing.rotation.x = Math.PI / 2; causeRing.position.set(nodeX(0), 2.2, S.cause.z); scene.add(causeRing);
  const causeSpark = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), glow(4.2)); causeSpark.visible = false; scene.add(causeSpark);

  /* ---------- 5 · solutions against a bar, then the effect ---------- */
  const NO = 5, WIN = 2, OH = [2.0, 2.7, 4.3, 1.5, 2.9], BAR = 3.4;
  put('block', S.ship.x, 0, S.ship.z, 11.4, 0.3, 3);
  const opts = OH.map((h, i) => { const m = solo(G.block, lit(), S.ship.x - 4.2 + i * 2.1, 0.3, S.ship.z, 1.35, 0.01, 1.35); m.userData.h = h; return m; });
  put('box', S.ship.x - 5.5, 0, S.ship.z + 1.25, 0.16, BAR + 0.5, 0.16); put('box', S.ship.x + 5.5, 0, S.ship.z + 1.25, 0.16, BAR + 0.5, 0.16);
  const barBeam = solo(G.box, glow(2.5), S.ship.x, 0.3 + BAR, S.ship.z + 1.25, 0.01, 0.07, 0.07); barBeam.castShadow = false;
  const effect = [0, 1, 2, 3].map(i => { const m = new THREE.Mesh(new THREE.TorusGeometry(1.1 + i * 0.45, 0.05, 10, 72), glow(1.5, 1, true)); m.rotation.x = Math.PI / 2; m.position.set(opts[WIN].position.x, 0.3 + OH[WIN] + 1 + i * 0.9, S.ship.z); scene.add(m); return m; });
  [[-27.5, -11], [-16.5, -10.6], [-15.6, -17.4]].forEach(([x, z]) => put('fig', x, 0, z, 1, 1, 1));
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) put('box', -29.4 + i * 0.62, 0, -17.6 + j * 0.62, 0.52, 0.52, 0.52);

  /* ---------- the road between the steps, and the way home ---------- */
  const curves = {
    a: new THREE.CatmullRomCurve3([V(-12.6, 13.2), V(-5, 16.6), V(3, 16.2), V(9.4, 15)]),
    b: new THREE.CatmullRomCurve3([V(22.6, 12.4), V(26.4, 6), V(26.6, -1), V(24.6, -6.6)]),
    c: new THREE.CatmullRomCurve3([V(21, -13), V(15.5, -18.5), V(10.5, -22), V(7.4, -22.8)]),
    d: new THREE.CatmullRomCurve3([V(-7.4, -22.8), V(-12, -22.6), V(-15.6, -19.4), V(-17, -16.4)]),
    back: new THREE.CatmullRomCurve3([V(-26.6, -11), V(-31.5, -3), V(-31, 6), V(-25, 10.6)]),
  };
  const KEYS = ['a', 'b', 'c', 'd'], P = Object.fromEntries(KEYS.map(k => [k, tube(curves[k])]));
  const backPts = curves.back.getSpacedPoints(56);
  const backDots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 10, 8), glow(3), backPts.length);
  backPts.forEach((p, i) => backDots.setMatrixAt(i, tmpM.makeTranslation(p.x, 0.16, p.z))); backDots.count = 0; scene.add(backDots);
  const sparkGeo = new THREE.SphereGeometry(0.13, 12, 10);
  const sparks = KEYS.flatMap(k => [0, 1, 2].map(i => { const m = new THREE.Mesh(sparkGeo, glow(4.2)); m.visible = false; scene.add(m); return { m, k, o: i / 3 }; }));

  // halftone glow on the ground beside the road
  const dotPts = [];
  (() => { const samples = KEYS.map(k => curves[k].getSpacedPoints(120)), R = 2.3, step = 0.55;
    for (let x = -34; x <= 30; x += step) for (let z = -28; z <= 20; z += step) { let best = null;
      samples.forEach((arr, k) => arr.forEach((p, i) => { const d = Math.hypot(p.x - x, p.z - z); if (d < R && (!best || d < best.d)) best = { k, t: i / (arr.length - 1), d }; }));
      if (best) dotPts.push({ x, z, ...best }); } })();
  const dots = new THREE.InstancedMesh(new THREE.CircleGeometry(0.1, 12).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), dotPts.length);
  dotPts.forEach((p, i) => { dots.setMatrixAt(i, tmpM.makeTranslation(p.x, 0.03, p.z)); dots.setColorAt(i, new THREE.Color(0, 0, 0)); }); scene.add(dots);
  const dotCol = new THREE.Color(); let lastDraw = '';
  function updateDots(draw) { const sig = draw.map(v => v.toFixed(3)).join(); if (sig === lastDraw) return; lastDraw = sig;
    dotPts.forEach((p, i) => { dotCol.copy(GLOW).multiplyScalar(Math.pow(1 - p.d / 2.3, 1.7) * clamp((draw[p.k] - p.t) / 0.07) * 0.9); dots.setColorAt(i, dotCol); });
    dots.instanceColor.needsUpdate = true; }

  // scenery in the gaps, as in V5
  (() => { const all = Object.values(curves).flatMap(c => c.getSpacedPoints(80));
    const clear = (x, z) => { for (const s of Object.values(S)) if (Math.hypot(s.x - x, s.z - z) < 10.5) return false; for (const p of all) if (Math.hypot(p.x - x, p.z - z) < 3.2) return false; return true; };
    const centres = [];
    for (let tries = 0; centres.length < 9 && tries < 900; tries++) { const cx = rr(-50, 48), cz = rr(-50, 38); if (cx + cz < -52) continue;
      if (!clear(cx, cz) || centres.some(c => Math.hypot(c[0] - cx, c[1] - cz) < 15)) continue; centres.push([cx, cz]); }
    let placed = 0, tries = 0;
    while (placed < 50 && tries < 4000) { tries++; const c = centres[tries % centres.length]; if (!c) break;
      const x = c[0] + rr(-5.5, 5.5), z = c[1] + rr(-5.5, 5.5); if (!clear(x, z)) continue; placed++;
      const kind = rnd(), ry = rr(-0.3, 0.3);
      if (kind < 0.3) { const w = rr(1.6, 3), d = rr(1.6, 3), h = rr(1.4, 6.5); put('block', x, 0, z, w, h, d, ry); if (rnd() < 0.6) put('box', x + rr(-0.3, 0.3), h, z + rr(-0.3, 0.3), w * 0.35, 0.35, d * 0.3, ry); }
      else if (kind < 0.5) { const L = rr(2.4, 3.6), Wd = rr(1.6, 2.2); put('block', x, 0, z, L, 0.9, Wd, ry); put('vault', x, 0.9, z, L, Wd * 0.7, Wd, ry); }
      else if (kind < 0.68) { for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) put('box', x + i * 0.6, 0, z + j * 0.6, 0.5, 0.5, 0.5, 0); }
      else if (kind < 0.86) { for (let i = 0; i < 3; i++) { const tx = x + rr(-1.2, 1.2), tz = z + rr(-1.2, 1.2), s = rr(0.8, 1.2); put('cyl', tx, 0, tz, 0.15, 0.7 * s, 0.15); put('ball', tx, 1.15 * s, tz, 1.05 * s, 1.15 * s, 1.05 * s); } }
      else { const r = rr(0.9, 1.3); put('cyl', x, 0, z, r * 2, rr(1.6, 3), r * 2); put('cyl', x + r * 2.4, 0, z, r * 1.6, rr(1.2, 2.4), r * 1.6); } } })();

  bake('block', mBuild); bake('tile', mTile); bake('box', mSoft); bake('prism', mSoft); bake('vault', mBuild); bake('cyl', mBuild); bake('ball', mSoft); bake('fig', mFig);

  let composer = null;
  if (!mobile) { composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera)); composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.85, 0.55, 0.92)); composer.addPass(new OutputPass()); }

  /* ---------- camera journey: p, target x, target z, distance, target y ---------- */
  const KF = [[0.00, 0, -4, 88, 0], [0.05, 0, -4, 84, 0], [0.17, -3, -2, 68, 0], [0.27, -9, 4, 52, 0],
              [0.32, -18, 12, 28, 0.6], [0.42, -18, 12, 25, 0.6], [0.46, 16.5, 14, 31, 2.6], [0.54, 16.5, 14, 28, 2.6],
              [0.58, 22, -10, 27, 0.6], [0.66, 22, -10, 24, 0.6], [0.70, 0, -24, 27, 0.4], [0.77, 0, -24, 24, 0.4],
              [0.81, -22, -14, 29, 1.4], [0.89, -22, -14, 26, 1.4], [0.95, -2, -2, 92, 0], [1.00, -2, -2, 96, 0]];
  const DIR = new THREE.Vector3(0.8, 1.32, 1).normalize(), target = new THREE.Vector3();
  function cameraAt(p) { let i = 0; while (i < KF.length - 2 && p > KF[i + 1][0]) i++;
    const [a, ax, az, ad, ay] = KF[i], [b, bx, bz, bd, by] = KF[i + 1], t = ease(clamp((p - a) / (b - a)));
    target.set(ax + (bx - ax) * t, ay + (by - ay) * t, az + (bz - az) * t); return ad + (bd - ad) * t; }

  let W = 0, H = 0;
  function resize() { W = innerWidth; H = innerHeight; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
    if (composer) { composer.setPixelRatio(Math.min(DPR, 1.5)); composer.setSize(W, H); } }
  resize(); addEventListener('resize', resize);

  function apply(p, time) {
    const aspect = W / H, distMul = aspect < 1.35 ? Math.min(2.3, 1.42 / aspect) : 1, dist = cameraAt(p) * distMul;
    camera.position.copy(target).addScaledVector(DIR, dist); camera.lookAt(target);
    const heroK = 1 - span(0.02, 0.09, p);
    const shiftX = (!mobile && aspect > 1.1) ? span(0.06, 0.12, p) * (1 - span(0.93, 1, p)) * 0.15 * W : 0;
    const shiftY = -heroK * (mobile ? 0.2 : 0.3) * H + (mobile ? -0.16 * H * span(0.06, 0.12, p) : 0);
    if (Math.abs(shiftX) + Math.abs(shiftY) > 0.5) camera.setViewOffset(W, H, -shiftX, shiftY, W, H); else camera.clearViewOffset();
    scene.fog.density = (0.0105 + 0.006 * heroK) / distMul;
    sun.position.set(target.x - 16, 46, target.z + 12); sun.target.position.copy(target);

    // 1 · voices
    const here = 0.3 + 0.7 * span(0.28, 0.33, p), draw1 = span(0.335, 0.375, p), one = span(0.365, 0.41, p);
    people.forEach((v, i) => {
      const talk = clamp(0.5 + 2.2 * Math.sin(time * v.w + v.ph));
      for (let b = 0; b < VB; b++) { const f = v.bars[b], shape = 1 - 0.45 * Math.abs(b - 2) / 2;
        const amp = 0.08 + talk * shape * 1.05 * Math.pow(Math.abs(Math.sin(time * f[0] * 0.5 + f[1])) * (0.55 + 0.45 * Math.sin(time * f[2] + f[3])), 1.2);
        setBar(i * VB + b, v.x + SIDE.x * (b - 2) * 0.2, 1.35, v.z + SIDE.z * (b - 2) * 0.2, 0.11, amp * here * (1 - 0.35 * one)); }
      v.line.set(draw1);
    });
    for (let b = 0; b < BIGB; b++) { const d = (b - (BIGB - 1) / 2) / ((BIGB - 1) / 2), bell = Math.exp(-d * d * 2);
      const amp = 0.12 + bell * 3.3 * (0.4 + 0.6 * Math.pow(Math.abs(Math.sin(time * 3.2 + b * 0.5)), 1.3));
      setBar(NV * VB + b, S.talk.x + SIDE.x * d * 2.4, 0.45, S.talk.z + SIDE.z * d * 2.4, 0.2 * one, amp * one); }
    bars.instanceMatrix.needsUpdate = true;
    signalHalo.scale.setScalar(0.001 + 3.4 * one * (1 + 0.05 * Math.sin(time * 3)));
    pulses.forEach(({ m, o }) => { const ph = (time * 0.55 + o) % 1; m.scale.setScalar(1 + ph * 3); m.material.opacity = (1 - ph) * 0.4 * here; });

    // road
    const d = { a: span(0.41, 0.46, p), b: span(0.535, 0.58, p), c: span(0.655, 0.7, p), d: span(0.765, 0.81, p) };
    KEYS.forEach(k => P[k].set(d[k])); updateDots(KEYS.map(k => d[k]));
    sparks.forEach(({ m, k, o }) => { if (d[k] < 0.05) { m.visible = false; return; } m.visible = true; curves[k].getPointAt(((time * 0.16 + o) % 1) * d[k] * 0.999, m.position); m.position.y = 0.16; });

    // 2 · outcome
    const rise2 = span(0.45, 0.495, p), tgt = span(0.485, 0.515, p), proj = span(0.505, 0.545, p);
    cols.forEach((m, i) => { m.scale.y = Math.max(0.01, m.userData.h * ease(clamp(rise2 * 1.6 - i * 0.075))); });
    targetBeam.scale.x = Math.max(0.01, 12.2 * tgt); targetBeam.visible = tgt > 0.01;
    ghosts.forEach((m, i) => { const e = ease(clamp(proj * 1.5 - i * 0.16)); m.scale.y = Math.max(0.01, m.userData.h * e); m.visible = e > 0.01; });
    const bk = span(0.53, 0.55, p); beacon.visible = beaconHalo.visible = tgt > 0.01; beacon.rotation.z = time * 0.35;
    beacon.material.color.copy(GLOW).multiplyScalar(2.6 * (0.45 + 0.55 * bk + 0.08 * Math.sin(time * 2.2))); beaconHalo.material.opacity = 0.1 + 0.25 * bk;
    beacon.position.y = beaconHalo.position.y = 0.35 + TARGET + 1.1 + Math.sin(time * 1.2) * 0.15;

    // 3 · opportunity
    const tl = span(0.565, 0.6, p), rise3 = span(0.585, 0.625, p), pick = span(0.625, 0.66, p);
    timeline.set(tl);
    strug.forEach((m, i) => { const win = i === PICK, st = clamp(rise3 * 1.3 - i * 0.07), h = 0.3 + m.userData.h * st;
      m.scale.y = Math.max(0.3, win ? h + 1.1 * pick : h - (h - 0.55) * pick);
      m.material.emissiveIntensity = (win ? 0.2 + 0.25 * pick : 0.2 * (1 - pick)) * st; m.material.color.set(win || pick < 0.5 ? '#c9d9f1' : '#7f95b8'); });
    winRing.material.opacity = pick; winRing.scale.setScalar(1 + 0.06 * Math.sin(time * 2.4));

    // 4 · causal
    const backw = span(0.69, 0.73, p), fwd = clamp((p - 0.735) / 0.035);
    backLink.set(backw);
    nodes.forEach((cap, i) => { const seen = i === 0 ? span(0.685, 0.7, p) * 0.45 : 0, litK = ease(clamp(fwd * 4.2 - (NN - 1 - i))), k = Math.max(seen, litK);
      cap.scale.set(Math.max(0.001, k), 1, Math.max(0.001, k)); });
    causeSpark.visible = fwd > 0.01 && fwd < 0.99; causeSpark.position.set(nodeX(3) + (nodeX(0) - nodeX(3)) * ease(fwd), 0.18, S.cause.z + 1.7);
    const done4 = span(0.765, 0.775, p); causeRing.material.opacity = done4; causeRing.rotation.z = time * 0.4; causeRing.position.y = 2.2 + Math.sin(time * 1.3) * 0.12;

    // 5 · delivery and impact
    const bar5 = span(0.8, 0.82, p), rise5 = span(0.815, 0.855, p), verdict = span(0.855, 0.88, p), eff = span(0.87, 0.9, p);
    barBeam.scale.x = Math.max(0.01, 11 * bar5); barBeam.visible = bar5 > 0.01;
    opts.forEach((m, i) => { const win = i === WIN, st = ease(clamp(rise5 * 1.4 - i * 0.09)), h = m.userData.h * st;
      m.scale.y = Math.max(0.01, win ? h : h - (h - 0.5) * verdict * (st > 0 ? 1 : 0));
      m.material.emissiveIntensity = (win ? 0.2 + 0.35 * verdict : 0.2 * (1 - verdict)) * st; m.material.color.set(win || verdict < 0.5 ? '#c9d9f1' : '#7f95b8'); });
    effect.forEach((m, i) => { const e = ease(clamp(eff * 3 - i * 0.6)); m.material.opacity = e * (0.9 - i * 0.15); m.scale.setScalar(0.6 + 0.4 * e); m.position.y = 0.3 + OH[WIN] + 0.6 + i * 0.9 * e + Math.sin(time * 1.5 + i) * 0.05; });

    // home
    backDots.count = Math.floor(backPts.length * span(0.895, 0.965, p));
    backDots.material.color.copy(GLOW).multiplyScalar(2.6 + 0.6 * Math.sin(time * 3));

    root.style.setProperty('--hero', heroK.toFixed(3));
    panels.forEach(({ el, r }) => { const v = (r[0] < 0 ? 1 : span(r[0], r[1], p)) * (1 - span(r[2], r[3], p));
      el.style.opacity = v.toFixed(3); el.style.transform = `translateY(${((1 - v) * 18).toFixed(1)}px)`; el.style.visibility = v < 0.01 ? 'hidden' : 'visible'; });
  }

  let pTarget = 0, p = 0, time = 0, last = performance.now(), running = false, visible = true;
  function measure() { const r = journey.getBoundingClientRect(), total = r.height - H; pTarget = total > 0 ? clamp(-r.top / total) : 0; visible = r.bottom > 0; }
  function frame(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
    measure(); p += (pTarget - p) * Math.min(1, dt * 6); if (Math.abs(pTarget - p) < 0.0004) p = pTarget;
    if (window.__p != null) p = window.__p;
    apply(p, time); if (composer) composer.render(); else renderer.render(scene, camera);
    if (visible) requestAnimationFrame(frame); else running = false; }
  function wake() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
  addEventListener('scroll', wake, { passive: true }); measure(); p = pTarget; wake();
}

try { start(); } catch (err) { root.classList.remove('webgl'); document.querySelector('canvas.world')?.remove(); console.error(err); }

addEventListener('load', () => {
  if (reduce || !window.Lenis) return;
  const lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
  const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); const el = id.length > 1 && document.querySelector(id);
    if (id === '#top') { e.preventDefault(); lenis.scrollTo(0); return; }
    if (!el) return; e.preventDefault(); lenis.scrollTo(el, { offset: -72 });
  }));
});
