/*
 * V18 landing page walkthrough. The V5 idea (one small world, a camera flown from station to station
 * by the scroll, paths drawn along the ground) in the light V15/V16 look: transparent canvas over the
 * white gradient, pale forms, soft shadows, solid blue where V5 glowed, no bloom. Slim shapes, a lower
 * camera, and every row turned square to the camera so each step reads like a drawing.
 *   1 Progress     ten people talking, their voices as bars, drawn into one signal
 *   2 Outcome      one behaviour, where it is today, and the target above it
 *   3 Opportunity  struggles along the customer's timeline, one chosen, the rest parked
 *   4 Causal       worked backwards from the outcome, then run forwards
 *   5 Delivery     several solutions against a bar set beforehand; one passes; its effect is read
 * then the evidence travels home to step 1.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

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
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch (e) { return; }
  if (!renderer.getContext()) return;
  document.body.prepend(canvas); root.classList.add('webgl');

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2)); renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene(); scene.fog = new THREE.Fog('#eef3fb', 120, 420);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 600);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe8f5, 1.15));
  const sun = new THREE.DirectionalLight(0xffffff, 2.0); sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 140 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xbdd4f5, 0.7); fill.position.set(40, 22, -30); scene.add(fill);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.ShadowMaterial({ color: '#0a1a38', opacity: 0.11 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const grid = new THREE.GridHelper(400, 200, 0xbfd0e8, 0xbfd0e8); grid.material.transparent = true; grid.material.opacity = 0.22; grid.position.y = 0.012; scene.add(grid);

  const NAVY = '#22365c', BLUE = '#184c84', MID = '#2f6fb3', SKY = '#8fb6e6', PALE = '#f4f7fc', PALE2 = '#dfe8f5';
  const frosted = c => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.6 });
  const mBuild = frosted(PALE), mSoft = frosted(PALE2), mFig = new THREE.MeshStandardMaterial({ color: NAVY, roughness: 0.6 });
  const ink = (color = MID, opacity = 1) => new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });
  const cPale = new THREE.Color('#e9eff9'), cBlue = new THREE.Color(BLUE), cOff = new THREE.Color('#e4e9f1');
  const lit = () => new THREE.MeshStandardMaterial({ color: cPale.clone(), roughness: 0.55 });

  const G = {
    block: new RoundedBoxGeometry(1, 1, 1, 2, 0.05).translate(0, 0.5, 0),
    box: new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
    prism: (() => { const g = new THREE.CylinderGeometry(0.58, 0.58, 1, 3, 1); g.rotateY(Math.PI / 2); g.rotateZ(Math.PI / 2); g.translate(0, 0.29, 0); return g; })(),
    vault: (() => { const g = new THREE.CylinderGeometry(0.5, 0.5, 1, 20, 1, false, 0, Math.PI); g.rotateZ(Math.PI / 2); return g; })(),
    cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 40).translate(0, 0.5, 0),
    ball: new THREE.IcosahedronGeometry(0.5, 1),
    fig: new THREE.CapsuleGeometry(0.13, 0.46, 4, 10).translate(0, 0.36, 0),
  };
  const I = { block: [], box: [], prism: [], vault: [], cyl: [], ball: [], fig: [] };
  const UP = new THREE.Vector3(0, 1, 0);
  function put(kind, x, y, z, sx, sy, sz, ry = 0) { I[kind].push(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(UP, ry), new THREE.Vector3(sx, sy, sz))); }
  function bake(kind, mat) { const list = I[kind]; if (!list.length) return; const m = new THREE.InstancedMesh(G[kind], mat, list.length);
    list.forEach((mx, i) => m.setMatrixAt(i, mx)); m.castShadow = true; m.receiveShadow = true; scene.add(m); }

  let seed = 11;
  const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const rr = (a, b) => a + (b - a) * rnd();

  // the camera looks along -DIR; SIDE is screen-right on the ground and FWD points at the camera, so
  // anything laid out along SIDE is seen square on
  const DIR = new THREE.Vector3(0.8, 0.62, 1).normalize();
  const SIDE = new THREE.Vector3(1, 0, -0.8).normalize(), FWD = new THREE.Vector3(0.8, 0, 1).normalize(), RY = Math.atan2(0.8, 1);
  const C = new THREE.Vector3(0, 0, -4), RC = 27;
  const onRing = (deg, r = RC) => { const a = deg * Math.PI / 180; return new THREE.Vector3(C.x + r * (Math.sin(a) * SIDE.x - Math.cos(a) * FWD.x), 0, C.z + r * (Math.sin(a) * SIDE.z - Math.cos(a) * FWD.z)); };
  const S = { talk: onRing(0), out: onRing(72), opp: onRing(144), cause: onRing(216), ship: onRing(288) };
  const at = (s, t, f = 0, y = 0) => new THREE.Vector3(s.x + SIDE.x * t + FWD.x * f, y, s.z + SIDE.z * t + FWD.z * f);
  const solo = (geo, mat, pos, sx, sy, sz) => { const m = new THREE.Mesh(geo, mat); m.position.copy(pos); m.scale.set(sx, sy, sz); m.rotation.y = RY; m.castShadow = m.receiveShadow = true; scene.add(m); return m; };
  const putAt = (kind, pos, sx, sy, sz) => put(kind, pos.x, pos.y, pos.z, sx, sy, sz, RY);
  const tmpM = new THREE.Matrix4(), tq = new THREE.Quaternion().setFromAxisAngle(UP, RY), tp = new THREE.Vector3(), ts = new THREE.Vector3();
  const flat = v => new THREE.Vector3(v.x, 0.06, v.z);
  function tube(curve, segs = 200, r = 0.045, color = MID) {
    const core = new THREE.TubeGeometry(curve, segs, r, 8, false), halo = new THREE.TubeGeometry(curve, segs, r * 3.2, 8, false);
    const a = new THREE.Mesh(core, ink(color)), b = new THREE.Mesh(halo, ink(SKY, 0.22)); a.visible = b.visible = false; scene.add(a, b);
    return { curve, set(f) { const n = Math.floor(segs * clamp(f)) * 48; core.setDrawRange(0, n); halo.setDrawRange(0, n); a.visible = b.visible = f > 0.002; } };
  }
  const road = (p0, p1, bend) => { const d = new THREE.Vector3().subVectors(p1, p0), n = new THREE.Vector3(-d.z, 0, d.x).normalize().multiplyScalar(bend);
    return new THREE.CatmullRomCurve3([flat(p0), flat(p0.clone().addScaledVector(d, 0.33).addScaledVector(n, 1)), flat(p0.clone().addScaledVector(d, 0.67).addScaledVector(n, 0.8)), flat(p1)]); };

  /* ---------- 1 · ten people talking ---------- */
  const NV = 10, VB = 7, BIGB = 23;
  const people = Array.from({ length: NV }, (_, i) => { const a = i / NV * TAU + 0.2, x = S.talk.x + Math.cos(a) * 5.6, z = S.talk.z + Math.sin(a) * 5.6;
    put('fig', x, 0, z, 1, 1, 1);
    return { x, z, w: rr(0.5, 0.95), ph: rr(0, TAU), bars: Array.from({ length: VB }, () => [rr(6, 11), rr(0, TAU), rr(2, 4), rr(0, TAU)]),
      line: tube(new THREE.CatmullRomCurve3([new THREE.Vector3(x - Math.cos(a) * 0.5, 0.05, z - Math.sin(a) * 0.5), new THREE.Vector3(S.talk.x + Math.cos(a + 0.22) * 3.2, 0.05, S.talk.z + Math.sin(a + 0.22) * 3.2), new THREE.Vector3(S.talk.x + Math.cos(a) * 1.25, 0.05, S.talk.z + Math.sin(a) * 1.25)]), 40, 0.025, SKY) }; });
  put('cyl', S.talk.x, 0, S.talk.z, 2.5, 0.16, 2.5);
  const bars = new THREE.InstancedMesh(G.box, new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), NV * VB + BIGB); bars.frustumCulled = false; scene.add(bars);
  const cMid = new THREE.Color(MID);
  for (let n = 0; n < NV * VB + BIGB; n++) bars.setColorAt(n, n < NV * VB ? cMid : cBlue);
  const pulses = people.map((p, i) => { const m = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.44, 48), ink(SKY, 0.6)); m.rotation.x = -Math.PI / 2; m.position.set(p.x, 0.03, p.z); scene.add(m); return { m, o: i * 0.37 }; });
  const setBar = (n, x, y, z, w, h) => { tp.set(x, y, z); ts.set(w, Math.max(0.001, h), w * 0.6); tmpM.compose(tp, tq, ts); bars.setMatrixAt(n, tmpM); };

  /* ---------- 2 · one behaviour and its target ---------- */
  const NC = 9, GH = 5, TARGET = 5.2, CX = i => -6 + i * 0.92;
  putAt('block', at(S.out, 0, 0), 13.6, 0.12, 1.6);
  const cols = Array.from({ length: NC }, (_, i) => { const m = solo(G.block, mBuild, at(S.out, CX(i), 0, 0.12), 0.34, 0.01, 0.34); m.userData.h = 1.25 + 0.3 * Math.sin(i * 1.3 + 1) + i * 0.06; return m; });
  const ghosts = Array.from({ length: GH }, (_, i) => { const h0 = cols[NC - 1].userData.h; const m = solo(G.box, new THREE.MeshStandardMaterial({ color: SKY, roughness: 0.7, transparent: true, opacity: 0.5 }), at(S.out, CX(NC + i), 0, 0.12), 0.32, 0.01, 0.32);
    m.userData.h = h0 + (TARGET - h0) * ease((i + 1) / GH); m.castShadow = false; return m; });
  const targetBeam = solo(G.box, ink(BLUE), at(S.out, 0, 0, 0.12 + TARGET), 0.01, 0.045, 0.045); targetBeam.castShadow = false;
  const beacon = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.035, 12, 72), ink(BLUE)); beacon.position.copy(at(S.out, CX(NC + GH - 1), 0, 0.12 + TARGET)); beacon.rotation.y = RY; scene.add(beacon);

  /* ---------- 3 · struggles along the timeline ---------- */
  const NS = 6, PICK = 3, SH = [1.6, 2.7, 1.2, 3.9, 2.2, 1.5], SX = i => -5.5 + i * 2.2;
  const timeline = tube(new THREE.CatmullRomCurve3([flat(at(S.opp, -7.2, 1.2)), flat(at(S.opp, 0, 1.2)), flat(at(S.opp, 7.2, 1.2))]), 60, 0.04, BLUE);
  const strug = SH.map((h, i) => { const m = solo(G.block, lit(), at(S.opp, SX(i), 0), 0.5, 0.2, 0.5); m.userData.h = h; return m; });
  const winRing = new THREE.Mesh(new THREE.RingGeometry(0.72, 0.8, 64), ink(BLUE, 0.99)); winRing.rotation.x = -Math.PI / 2; winRing.position.copy(at(S.opp, SX(PICK), 0, 0.03)); scene.add(winRing);

  /* ---------- 4 · backwards from the outcome, then forwards ---------- */
  const NN = 4, NX = i => -5.7 + i * 3.8;                              // 0 is the outcome (left), 3 is what you control (right)
  const NY = 1.7;
  const nodes = Array.from({ length: NN }, (_, i) => { const p = at(S.cause, NX(i), 0); put('cyl', p.x, 0, p.z, 0.7, 0.08, 0.7); putAt('box', p, 0.045, NY - 0.72, 0.045);
    const cap = new THREE.Mesh(new THREE.CircleGeometry(0.5, 48), new THREE.MeshBasicMaterial({ color: i === 0 ? BLUE : MID, toneMapped: false, side: THREE.DoubleSide })); cap.position.set(p.x, NY, p.z); cap.rotation.y = RY; cap.scale.setScalar(0.001); scene.add(cap);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.028, 10, 64), ink(i === 0 ? BLUE : MID)); rim.position.set(p.x, NY, p.z); rim.rotation.y = RY; rim.visible = false; scene.add(rim);
    return { cap, rim }; });
  const backLink = tube(new THREE.CatmullRomCurve3([0, 1, 2, 3].map(i => at(S.cause, NX(i) + (i === 0 ? 0.72 : i === 3 ? -0.72 : 0), 0, NY))), 90, 0.03, MID);
  const causeRing = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.03, 12, 72), ink(BLUE, 0.99)); causeRing.position.copy(at(S.cause, NX(0), 0, NY)); causeRing.rotation.y = RY; scene.add(causeRing);
  const causeSpark = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), ink(BLUE)); causeSpark.visible = false; scene.add(causeSpark);

  /* ---------- 5 · solutions against a bar, then the effect ---------- */
  const NO = 5, WIN = 2, OH = [2.0, 2.7, 4.4, 1.5, 2.9], BAR = 3.4, OX = i => -4.4 + i * 2.2;
  putAt('block', at(S.ship, 0, 0), 11.6, 0.12, 1.6);
  const opts = OH.map((h, i) => { const m = solo(G.block, lit(), at(S.ship, OX(i), 0, 0.12), 0.6, 0.01, 0.6); m.userData.h = h; return m; });
  putAt('box', at(S.ship, -5.6, 0), 0.07, BAR + 0.5, 0.07); putAt('box', at(S.ship, 5.6, 0), 0.07, BAR + 0.5, 0.07);
  const barBeam = solo(G.box, ink(BLUE), at(S.ship, 0, 0, 0.12 + BAR), 0.01, 0.045, 0.045); barBeam.castShadow = false;
  const effect = [0, 1, 2, 3].map(i => { const m = new THREE.Mesh(new THREE.TorusGeometry(0.7 + i * 0.32, 0.028, 10, 72), ink(MID, 0.99)); m.rotation.x = Math.PI / 2; m.position.copy(at(S.ship, OX(WIN), 0)); scene.add(m); return m; });

  /* ---------- the road between the steps, and the way home ---------- */
  const arc = (d0, d1) => new THREE.CatmullRomCurve3(Array.from({ length: 13 }, (_, i) => flat(onRing(d0 + (d1 - d0) * i / 12))));
  const curves = { a: arc(0, 72), b: arc(72, 144), c: arc(144, 216), d: arc(216, 288), back: arc(288, 360) };
  const track = new THREE.Mesh(new THREE.TorusGeometry(RC, 0.08, 8, 240), ink(SKY, 0.8)); track.rotation.x = Math.PI / 2; track.position.set(C.x, 0.04, C.z); scene.add(track);
  const KEYS = ['a', 'b', 'c', 'd'], P = Object.fromEntries(KEYS.map(k => [k, tube(curves[k], 200, 0.05, MID)]));
  const backPts = curves.back.getSpacedPoints(56);
  const backDots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 10, 8), ink(BLUE), backPts.length);
  backPts.forEach((p, i) => backDots.setMatrixAt(i, tmpM.makeTranslation(p.x, 0.12, p.z))); backDots.count = 0; scene.add(backDots);
  const sparkGeo = new THREE.SphereGeometry(0.11, 12, 10);
  const sparks = KEYS.flatMap(k => [0, 1, 2].map(i => { const m = new THREE.Mesh(sparkGeo, ink(BLUE)); m.visible = false; scene.add(m); return { m, k, o: i / 3 }; }));

  // halftone dots on the ground beside the road, as in V5
  const dotPts = [];
  (() => { const samples = KEYS.map(k => curves[k].getSpacedPoints(120)), R = 1.9, step = 0.5;
    for (let x = -44; x <= 44; x += step) for (let z = -48; z <= 40; z += step) { let best = null;
      samples.forEach((arr, k) => arr.forEach((p, i) => { const d = Math.hypot(p.x - x, p.z - z); if (d < R && (!best || d < best.d)) best = { k, t: i / (arr.length - 1), d }; }));
      if (best) dotPts.push({ x, z, ...best }); } })();
  const dots = new THREE.InstancedMesh(new THREE.CircleGeometry(0.075, 12).rotateX(-Math.PI / 2), ink(SKY, 0.8), dotPts.length); scene.add(dots);
  let lastDraw = '';
  function updateDots(draw) { const sig = draw.map(v => v.toFixed(3)).join(); if (sig === lastDraw) return; lastDraw = sig;
    dotPts.forEach((p, i) => { const s = Math.pow(1 - p.d / 1.9, 1.2) * clamp((draw[p.k] - p.t) / 0.07); tmpM.makeScale(Math.max(0.0001, s), 1, Math.max(0.0001, s)).setPosition(p.x, 0.02, p.z); dots.setMatrixAt(i, tmpM); });
    dots.instanceMatrix.needsUpdate = true; }
  updateDots([0, 0, 0, 0]);

  bake('block', mBuild); bake('box', mSoft); bake('prism', mSoft); bake('vault', mBuild); bake('cyl', mBuild); bake('ball', mSoft); bake('fig', mFig);

  /* ---------- labels that follow points in the scene ---------- */
  const stage = document.querySelector('.stage'), tags = [], v3 = new THREE.Vector3();
  const tag = (text, pos, cls = '') => { const el = document.createElement('span'); el.className = 'tag3d ' + cls; el.textContent = text; el.setAttribute('aria-hidden', 'true'); stage.appendChild(el); const t = { el, pos, a: 0 }; tags.push(t); return t; };
  const T = {
    voices: tag('Ten conversations', new THREE.Vector3(S.talk.x, 3.3, S.talk.z).addScaledVector(FWD, -5.6)),
    signal: tag('One clear signal', new THREE.Vector3(S.talk.x, 4.3, S.talk.z), 't-hot'),
    today: tag('Today', at(S.out, CX(NC - 1), 0, cols[NC - 1].userData.h + 0.9)),
    target: tag('Target', at(S.out, CX(NC + GH - 1), 0, TARGET + 1.5), 't-hot'),
    struggles: tag('Struggles customers described', at(S.opp, -2.2, 0, 4)),
    chosenOpp: tag('Chosen opportunity', at(S.opp, SX(PICK), 0, SH[PICK] + 1.9), 't-hot'),
    parked: tag('Parked', at(S.opp, SX(1), 0, 1.5), 't-dim'),
    outcome: tag('The outcome', at(S.cause, NX(0), 0, NY + 1.6), 't-hot'),
    control: tag('What you control', at(S.cause, NX(3), 0, NY + 1.3)),
    standard: tag('The standard, set beforehand', at(S.ship, -3.9, 0, BAR + 0.8)),
    chosenSol: tag('Chosen solution', at(S.ship, OX(WIN) + 2.5, 0, OH[WIN] + 0.5), 't-hot'),
    dropped: tag('Did not pass', at(S.ship, OX(3), 0, 1.25), 't-dim'),
  };
  const NUM = Object.values(S).map((s, i) => tag(String(i + 1), new THREE.Vector3(s.x, 0.2, s.z).addScaledVector(FWD, 5.5)));

  /* ---------- timing: each step holds for a long stretch of the scroll ---------- */
  const STEP = 0.137, A = [0.2, 0.34, 0.48, 0.62, 0.76];                 // where each step begins
  const ORDER = [S.talk, S.out, S.opp, S.cause, S.ship], DIST = [27, 31, 31, 29, 31], LOOK = [1.3, 2.6, 1.9, 1.5, 2.5];
  const KF = [[0.00, C.x, C.z, 104, 0], [0.14, C.x, C.z, 104, 0]];
  ORDER.forEach((s, i) => { KF.push([A[i] + 0.012, s.x, s.z, DIST[i], LOOK[i]], [A[i] + 0.122, s.x, s.z, DIST[i] - 2, LOOK[i]]); });
  KF.push([0.945, C.x, C.z, 104, 0], [1.00, C.x, C.z, 104, 0]);
  const target = new THREE.Vector3(), dirNow = new THREE.Vector3(), TOP = new THREE.Vector3(0.8, 0.95, 1).normalize();
  function cameraAt(p) { let i = 0; while (i < KF.length - 2 && p > KF[i + 1][0]) i++;
    const [a, ax, az, ad, ay] = KF[i], [b, bx, bz, bd, by] = KF[i + 1], t = ease(clamp((p - a) / (b - a)));
    target.set(ax + (bx - ax) * t, ay + (by - ay) * t, az + (bz - az) * t); return ad + (bd - ad) * t; }

  let W = 0, H = 0;
  const sidePanel = document.querySelector('.panel.p-side'); let panelRight = 0;
  function resize() { W = innerWidth; H = innerHeight; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
    const r = sidePanel ? sidePanel.getBoundingClientRect() : null; panelRight = r && !mobile && r.width < W * 0.7 ? r.left + r.width : 0; }
  resize(); addEventListener('resize', resize);

  function apply(p, time) {
    const aspect = W / H, distMul = aspect < 1.35 ? Math.min(2.3, 1.42 / aspect) : 1, base = cameraAt(p);
    const wide = 1 - span(0.14, 0.21, p) * (1 - span(0.9, 0.945, p));
    // beside the text panel: fit each step, and the whole circle in the wide views, into the space to its right
    // nothing being explained may sit under the text panel: the free space starts a gap to its right
    const panelPx = panelRight > 0 && W - panelRight > 280 ? panelRight + 36 : 0, free = 1 - (panelPx + 16) / W, perUnit = 0.536 * aspect * free;
    const dist = panelPx ? Math.max(Math.min(base, 40), 21.5 / perUnit) * (1 - wide) + Math.max(96, 80 / perUnit) * wide : base * distMul;
    dirNow.copy(DIR).lerp(TOP, wide).normalize();
    camera.position.copy(target).addScaledVector(dirNow, dist); camera.lookAt(target);
    const heroK = 1 - span(0.02, 0.07, p);
    // the scene is centred in the space to the right of the text panel
    const shiftX = span(0.045, 0.09, p) * (panelPx - 16) / 2;
    const shiftY = -heroK * (mobile ? 0.2 : 0.3) * H + (mobile ? -0.16 * H * span(0.045, 0.09, p) : 0);
    if (Math.abs(shiftX) + Math.abs(shiftY) > 0.5) camera.setViewOffset(W, H, -shiftX, shiftY, W, H); else camera.clearViewOffset();
    sun.position.set(target.x - 16, 46, target.z + 12); sun.target.position.copy(target);
    const u = A.map(a => (p - a) / STEP);                                  // local time inside each step
    const on = i => span(0.06, 0.14, u[i]) * (1 - span(0.9, 0.98, u[i])); // when a step's labels may show

    // 1 · voices
    const here = 0.35 + 0.65 * span(-0.15, 0.08, u[0]), draw1 = span(0.14, 0.36, u[0]), one = span(0.32, 0.6, u[0]);
    people.forEach((v, i) => {
      const talk = clamp(0.5 + 2.2 * Math.sin(time * v.w + v.ph));
      for (let b = 0; b < VB; b++) { const f = v.bars[b], c = (b - (VB - 1) / 2), shape = 1 - 0.5 * Math.abs(c) / ((VB - 1) / 2);
        const amp = 0.06 + talk * shape * 0.95 * Math.pow(Math.abs(Math.sin(time * f[0] * 0.5 + f[1])) * (0.55 + 0.45 * Math.sin(time * f[2] + f[3])), 1.2);
        setBar(i * VB + b, v.x + SIDE.x * c * 0.13, 1.25, v.z + SIDE.z * c * 0.13, 0.06, amp * here * (1 - 0.4 * one)); }
      v.line.set(draw1);
    });
    for (let b = 0; b < BIGB; b++) { const d = (b - (BIGB - 1) / 2) / ((BIGB - 1) / 2), bell = Math.exp(-d * d * 2);
      const amp = 0.1 + bell * 3.4 * (0.4 + 0.6 * Math.pow(Math.abs(Math.sin(time * 3.2 + b * 0.5)), 1.3));
      setBar(NV * VB + b, S.talk.x + SIDE.x * d * 1.9, 0.16, S.talk.z + SIDE.z * d * 1.9, 0.09 * one, amp * one); }
    bars.instanceMatrix.needsUpdate = true;
    pulses.forEach(({ m, o }) => { const ph = (time * 0.5 + o) % 1; m.scale.setScalar(1 + ph * 1.6); m.material.opacity = (1 - ph) * 0.55 * here; });
    T.voices.a = on(0) * (1 - span(0.5, 0.6, u[0])); T.signal.a = on(0) * span(0.58, 0.68, u[0]);

    // road: each stretch is drawn as you leave a step
    const d = { a: span(A[0] + 0.118, A[1] + 0.012, p), b: span(A[1] + 0.118, A[2] + 0.012, p), c: span(A[2] + 0.118, A[3] + 0.012, p), d: span(A[3] + 0.118, A[4] + 0.012, p) };
    KEYS.forEach(k => P[k].set(d[k])); updateDots(KEYS.map(k => d[k]));
    sparks.forEach(({ m, k, o }) => { if (d[k] < 0.05) { m.visible = false; return; } m.visible = true; curves[k].getPointAt(((time * 0.16 + o) % 1) * d[k] * 0.999, m.position); m.position.y = 0.12; });

    // 2 · outcome
    const rise2 = span(0.1, 0.34, u[1]), tgt = span(0.3, 0.46, u[1]), proj = span(0.44, 0.68, u[1]), bk = span(0.64, 0.72, u[1]);
    cols.forEach((m, i) => { m.scale.y = Math.max(0.01, m.userData.h * ease(clamp(rise2 * 1.6 - i * 0.07))); });
    targetBeam.scale.x = Math.max(0.01, 13.4 * tgt); targetBeam.visible = tgt > 0.01;
    ghosts.forEach((m, i) => { const e = ease(clamp(proj * 1.5 - i * 0.13)); m.scale.y = Math.max(0.01, m.userData.h * e); m.visible = e > 0.01; });
    beacon.visible = bk > 0.01; beacon.scale.setScalar(Math.max(0.001, bk) * (1 + 0.07 * Math.sin(time * 2.4)));
    T.today.a = on(1) * span(0.3, 0.38, u[1]); T.target.a = on(1) * span(0.42, 0.5, u[1]);

    // 3 · opportunity
    const tl = span(0.08, 0.24, u[2]), rise3 = span(0.2, 0.44, u[2]), pick = span(0.5, 0.66, u[2]);
    timeline.set(tl);
    strug.forEach((m, i) => { const win = i === PICK, st = clamp(rise3 * 1.3 - i * 0.07), h = 0.2 + m.userData.h * st;
      m.scale.y = Math.max(0.2, win ? h + 0.9 * pick : h - (h - 0.5) * pick * 0.75); m.material.color.copy(cPale).lerp(win ? cBlue : cOff, pick); });
    winRing.visible = pick > 0.01; winRing.scale.setScalar(Math.max(0.001, pick) * (1 + 0.06 * Math.sin(time * 2.4)));
    T.struggles.a = on(2) * span(0.36, 0.44, u[2]) * (1 - span(0.5, 0.56, u[2])); T.chosenOpp.a = on(2) * span(0.62, 0.7, u[2]); T.parked.a = on(2) * span(0.66, 0.74, u[2]);

    // 4 · causal
    const backw = span(0.12, 0.4, u[3]), fwd = clamp((u[3] - 0.46) / 0.22), done4 = span(0.68, 0.74, u[3]);
    backLink.set(backw);
    nodes.forEach(({ cap, rim }, i) => { rim.visible = (backw * 3.4 - i > 0.15) || (i === 0 && u[3] > 0.06); const k = ease(clamp(fwd * 4.2 - (NN - 1 - i))); cap.scale.setScalar(Math.max(0.001, k)); });
    const sp = at(S.cause, NX(3) + (NX(0) - NX(3)) * ease(fwd), 0.1, NY); causeSpark.visible = fwd > 0.01 && fwd < 0.99; causeSpark.position.copy(sp);
    causeRing.visible = done4 > 0.01; causeRing.scale.setScalar(Math.max(0.001, done4) * (1 + 0.05 * Math.sin(time * 2.4)));
    T.outcome.a = on(3) * span(0.08, 0.16, u[3]); T.control.a = on(3) * span(0.38, 0.46, u[3]);

    // 5 · delivery and impact
    const bar5 = span(0.08, 0.2, u[4]), rise5 = span(0.2, 0.42, u[4]), verdict = span(0.48, 0.6, u[4]), eff = span(0.6, 0.76, u[4]);
    barBeam.scale.x = Math.max(0.01, 11.2 * bar5); barBeam.visible = bar5 > 0.01;
    opts.forEach((m, i) => { const win = i === WIN, st = ease(clamp(rise5 * 1.4 - i * 0.09)), h = m.userData.h * st;
      m.scale.y = Math.max(0.01, win ? h : h - (h - 0.45) * verdict * (st > 0 ? 1 : 0)); m.material.color.copy(cPale).lerp(win ? cBlue : cOff, verdict); });
    effect.forEach((m, i) => { const e = ease(clamp(eff * 3 - i * 0.6)); m.visible = e > 0.01; m.scale.setScalar(Math.max(0.001, 0.6 + 0.4 * e)); m.material.opacity = e * (0.95 - i * 0.17);
      m.position.y = 0.12 + OH[WIN] + 1.9 + i * 0.75 * e + Math.sin(time * 1.5 + i) * 0.04; });
    T.standard.a = on(4) * span(0.16, 0.24, u[4]); T.chosenSol.a = on(4) * span(0.56, 0.64, u[4]); T.dropped.a = on(4) * span(0.6, 0.68, u[4]);

    // home: the evidence travels the last stretch of the circle back to step 1
    backDots.count = Math.floor(backPts.length * span(A[4] + 0.118, 0.955, p));
    const numA = span(0.6, 0.9, wide) * span(0.05, 0.08, p); NUM.forEach(t => { t.a = numA; });

    tags.forEach(t => { if (t.a < 0.01) { if (t.shown) { t.el.style.opacity = 0; t.shown = false; } return; }
      v3.copy(t.pos).project(camera); if (v3.z > 1) { t.el.style.opacity = 0; t.shown = false; return; }
      const half = t.el.offsetWidth / 2, lo = (p > 0.045 ? panelPx : 0) + 10 + half, x = Math.min(W - 10 - half, Math.max(lo, (v3.x + 1) / 2 * W));
      t.el.style.transform = `translate(${x.toFixed(1)}px,${((1 - v3.y) / 2 * H).toFixed(1)}px) translate(-50%,-50%)`; t.el.style.opacity = t.a.toFixed(2); t.shown = true; });

    root.style.setProperty('--hero', heroK.toFixed(3));
    panels.forEach(({ el, r }) => { const v = (r[0] < 0 ? 1 : span(r[0], r[1], p)) * (1 - span(r[2], r[3], p));
      el.style.opacity = v.toFixed(3); el.style.transform = `translateY(${((1 - v) * 18).toFixed(1)}px)`; el.style.visibility = v < 0.01 ? 'hidden' : 'visible'; });
  }

  let pTarget = 0, p = 0, time = 0, last = performance.now(), running = false, visible = true;
  function measure() { const r = journey.getBoundingClientRect(), total = r.height - H; pTarget = total > 0 ? clamp(-r.top / total) : 0; visible = r.bottom > 0; }
  function frame(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
    measure(); p += (pTarget - p) * Math.min(1, dt * 6); if (Math.abs(pTarget - p) < 0.0004) p = pTarget;
    if (window.__p != null) p = window.__p;
    apply(p, time); renderer.render(scene, camera);
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
