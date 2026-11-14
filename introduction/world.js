/*
 * V22: as V21 on larger screens. On phones the world is pinned in a box at the top of the screen while the text
 * scrolls past it in the ordinary way; the scene travels to whichever panel is being read, at its own pace, so
 * nothing about the scroll is taken over.
 *
 * V21: the V20 world. The walkthrough now sits below the story, so the timeline starts at P0, after the old
 * opening headline, and the journey is shorter. On phones the world is not scroll-driven at all: it is drawn
 * into a box inside the first panel and plays in place, showing the whole cycle at once.
 *
 * V20 landing page walkthrough (V19's world; the timeline makes room for a panel on the Mind before step 1). The V18 light world (transparent canvas, pale forms, soft shadows, solid
 * blue ink, a circle of five steps on the ground) with the Noetic Mind at its centre: a quiet constellation
 * that every step feeds.
 *   1 Progress     a ring of small buildings, each talking; their accounts gather and sort by job
 *   2 Outcome      one behaviour, where it is today, and the key result above it
 *   3 Opportunity  struggles along the customer's timeline, one chosen, the rest held for later
 *   4 Causal       stepping stones laid back from the goal, then walked forwards
 *   5 Delivery     several solutions against the key result from step 2; one passes; its effect is read
 * then the evidence travels on round to inform the next cycle.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const root = document.documentElement;
const journey = document.querySelector('.journey');
const panels = Array.from(document.querySelectorAll('.panel')).map(el => ({ el, r: el.dataset.range.split(' ').map(Number) }));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let mobile = matchMedia('(max-width: 860px)').matches;
const P0 = 0.09;                                                           // the timeline point the walkthrough opens on
let slot = mobile ? document.querySelector('.world-slot') : null;          // phones: the world plays in place, here

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = t => t * t * t * (t * (t * 6 - 15) + 10);
const span = (a, b, x) => ease(clamp((x - a) / (b - a)));
const TAU = Math.PI * 2;

function start() {
  if (reduce || !journey || (mobile && !slot)) return;
  const canvas = document.createElement('canvas'); canvas.className = 'world'; canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch (e) { return; }
  if (!renderer.getContext()) return;
  if (slot) { slot.appendChild(canvas); root.classList.add('webgl-inline'); } else { document.body.prepend(canvas); root.classList.add('webgl'); }

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
  G.win = G.box; G.wall = G.box;
  const I = { block: [], box: [], prism: [], vault: [], cyl: [], ball: [], fig: [], win: [], wall: [] };
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

  /* ---------- 1 · a series of conversations, sorted by the job to be done ---------- */
  const NV = 10, VB = 7, KINDS = ['house', 'cafe', 'house', 'office', 'flats', 'house', 'shop', 'house', 'flats', 'office'];
  const mAwn = ink(MID), mSign = ink(BLUE);
  function building(kind, x, z) {                                        // slim, plain forms; returns the height of the roof
    const Pt = (t, f, y) => new THREE.Vector3(x + SIDE.x * t + FWD.x * f, y, z + SIDE.z * t + FWD.z * f);
    const wall = (w, h, d, y = 0) => putAt('wall', Pt(0, 0, y), w, h, d);
    const win = (t, y, w, h, d) => putAt('win', Pt(t, d / 2 + 0.003, y), w, h, 0.012);
    if (kind === 'house') { wall(0.6, 0.4, 0.48); putAt('prism', Pt(0, 0, 0.4), 0.66, 0.4, 0.56); putAt('wall', Pt(0.17, -0.06, 0.48), 0.07, 0.2, 0.07); win(0.14, 0, 0.09, 0.19, 0.48); win(-0.13, 0.17, 0.1, 0.1, 0.48); return 0.75; }
    if (kind === 'cafe') { wall(0.78, 0.38, 0.48); putAt('box', Pt(0, 0, 0.38), 0.82, 0.022, 0.52); solo(G.box, mAwn, Pt(0, 0.33, 0.285), 0.66, 0.012, 0.18);
      win(-0.13, 0.07, 0.34, 0.15, 0.48); win(0.25, 0, 0.09, 0.2, 0.48); return 0.42; }
    if (kind === 'shop') { wall(0.68, 0.5, 0.48); putAt('box', Pt(0, 0, 0.5), 0.72, 0.022, 0.52); solo(G.box, mSign, Pt(0, 0.25, 0.36), 0.42, 0.075, 0.012); win(-0.1, 0.08, 0.38, 0.2, 0.48); win(0.23, 0, 0.09, 0.21, 0.48); return 0.54; }
    if (kind === 'flats') { wall(0.64, 1.25, 0.44); putAt('box', Pt(0, 0, 1.25), 0.68, 0.022, 0.48);
      for (let c = -1; c <= 1; c++) for (let r = 0; r < 4; r++) win(c * 0.19, 0.16 + r * 0.27, 0.075, 0.11, 0.44); return 1.28; }
    wall(0.48, 2.0, 0.44); wall(0.32, 0.26, 0.3, 2.0); for (let c = -1; c <= 1; c += 2) for (let r = 0; r < 7; r++) win(c * 0.105, 0.2 + r * 0.25, 0.115, 0.1, 0.44); return 2.28;
  }
  const thin = (curve, color = SKY, r = 0.011) => { const g = new THREE.TubeGeometry(curve, 48, r, 6, false), m = new THREE.Mesh(g, ink(color)); m.visible = false; scene.add(m);
    return { curve, set(f) { g.setDrawRange(0, Math.floor(48 * clamp(f)) * 36); m.visible = f > 0.002; } }; };
  const people = Array.from({ length: NV }, (_, i) => { const a = i / NV * TAU + 0.2, x = S.talk.x + Math.cos(a) * 5.6, z = S.talk.z + Math.sin(a) * 5.6;
    const top = building(KINDS[i], x, z);
    return { x, z, a, top, w: rr(0.5, 0.95), ph: rr(0, TAU), bars: Array.from({ length: VB }, () => [rr(6, 11), rr(0, TAU), rr(2, 4), rr(0, TAU)]),
      line: thin(new THREE.CatmullRomCurve3([new THREE.Vector3(x - Math.cos(a) * 0.6, 0.04, z - Math.sin(a) * 0.6), new THREE.Vector3(S.talk.x + Math.cos(a + 0.2) * 3.2, 0.04, S.talk.z + Math.sin(a + 0.2) * 3.2), new THREE.Vector3(S.talk.x + Math.cos(a) * 1.0, 0.04, S.talk.z + Math.sin(a) * 1.0)])) }; });
  put('cyl', S.talk.x, 0, S.talk.z, 2.4, 0.04, 2.4);
  const bars = new THREE.InstancedMesh(G.box, new THREE.MeshBasicMaterial({ color: MID, toneMapped: false }), NV * VB); bars.frustumCulled = false; scene.add(bars);
  const cMid = new THREE.Color(MID);
  const pulses = people.map((p, i) => { const m = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.625, 56), ink(SKY, 0.6)); m.rotation.x = -Math.PI / 2; m.position.set(p.x, 0.03, p.z); scene.add(m); return { m, o: i * 0.37 }; });
  const setBar = (n, x, y, z, w, h) => { tp.set(x, y, z); ts.set(w, Math.max(0.001, h), w * 0.6); tmpM.compose(tp, tq, ts); bars.setMatrixAt(n, tmpM); };
  // each account is a small dot. They gather mixed above the middle, then settle into overlapping clusters, one per job:
  // a little map of who is trying to get what done. The map leans back to face the camera.
  const E2 = new THREE.Vector3(0, 0.8, 0).addScaledVector(FWD, -0.6).normalize(), MAPY = 2.5;
  const mapPt = (a, b) => new THREE.Vector3(S.talk.x, MAPY, S.talk.z).addScaledVector(SIDE, a).addScaledVector(E2, b);
  const mapQ = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(SIDE, E2, new THREE.Vector3().crossVectors(SIDE, E2)));
  const GROUPS = [{ n: 13, c: BLUE, a: -0.95, b: 0.3, r: 1.28 }, { n: 10, c: MID, a: 0.8, b: 0.65, r: 1.1 }, { n: 8, c: SKY, a: 0.05, b: -0.8, r: 0.96 }, { n: 5, c: '#93a3bf', a: 1.7, b: -0.65, r: 0.72 }], ND = 36;
  const jobDots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.08, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), ND); jobDots.frustumCulled = false; scene.add(jobDots);
  const jobRings = GROUPS.map(g => { const m = new THREE.Mesh(new THREE.TorusGeometry(g.r, 0.011, 6, 96), ink(g.c)); m.position.copy(mapPt(g.a, g.b)); m.quaternion.copy(mapQ); m.visible = false; scene.add(m); return m; });
  const slots = GROUPS.flatMap((g, gi) => Array.from({ length: g.n }, (_, j) => ({ gi, j }))).map(v => [rnd(), v]).sort((p, q) => p[0] - q[0]).map(v => v[1]);
  const dotInfo = slots.map(({ gi, j }, k) => { const g = GROUPS[gi], src = people[k % NV], ca = rr(0, TAU), cr = 2.2 * Math.sqrt(rnd()), sr = g.r * 0.8 * Math.sqrt((j + 0.5) / g.n), sa = j * 2.39996 + gi;
    jobDots.setColorAt(k, new THREE.Color(g.c));
    const s0 = new THREE.Vector3(src.x, src.top + 0.3, src.z), cloud = mapPt(0.3 + Math.cos(ca) * cr, Math.sin(ca) * cr * 0.75);
    return { g: gi, ph: rr(0, TAU), t0: 0.1 + Math.floor(k / NV) * 0.06 + rr(0, 0.05), s: s0, c: s0.clone().lerp(cloud, 0.5).setY(Math.max(s0.y, cloud.y) + 0.7), cloud,
      slot: mapPt(g.a + Math.cos(sa) * sr, g.b + Math.sin(sa) * sr) }; });

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

  /* ---------- 4 · stepping stones laid back from the goal, then walked forwards ---------- */
  const NST = 6, stoneP = Array.from({ length: NST }, (_, i) => { const s = i / (NST - 1); return at(S.cause, 5.2 - 10.4 * s, -3.0 + 6.0 * s - 1.0 * Math.sin(s * Math.PI)); });   // 0 is the goal, the last is where you stand
  const stoneW = i => i ? 1.05 : 1.7;
  const stones = stoneP.map((p, i) => solo(G.cyl, lit(), p, stoneW(i), 0.1, stoneW(i)));
  const GY = 2.7, goalP = stoneP[0].clone().addScaledVector(FWD, -0.5);
  putAt('box', goalP, 0.05, GY - 0.6, 0.05);
  const goalRim = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.03, 10, 64), ink(BLUE)); goalRim.position.set(goalP.x, GY, goalP.z); goalRim.rotation.y = RY; scene.add(goalRim);
  const goalCap = new THREE.Mesh(new THREE.CircleGeometry(0.42, 48), new THREE.MeshBasicMaterial({ color: BLUE, toneMapped: false, side: THREE.DoubleSide })); goalCap.position.copy(goalRim.position); goalCap.rotation.y = RY; goalCap.scale.setScalar(0.001); scene.add(goalCap);
  const backLink = tube(new THREE.CatmullRomCurve3(stoneP.map(flat)), 90, 0.03, MID);
  const causeRing = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.03, 12, 72), ink(BLUE, 0.99)); causeRing.position.copy(goalRim.position); causeRing.rotation.y = RY; scene.add(causeRing);
  const walker = solo(G.fig, mFig, stoneP[NST - 1], 1.3, 1.3, 1.3); walker.visible = false;

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

  /* ---------- the Mind at the centre: a quiet constellation that every step feeds ---------- */
  const MY = 6.2, MR = 4.8, mind = new THREE.Group(); mind.position.set(C.x, MY, C.z); mind.rotation.z = 0.2; scene.add(mind);
  const shell = (n, r) => Array.from({ length: n }, (_, i) => { const y = 1 - 2 * (i + 0.5) / n, q = Math.sqrt(1 - y * y), a = i * 2.39996; return new THREE.Vector3(Math.cos(a) * q, y, Math.sin(a) * q).multiplyScalar(r); });
  const NOUT = 70, NIN = 18, mpts = [...shell(NOUT, MR), ...shell(NIN, MR * 0.5)];
  const segs = [], seen = new Set();
  const link = (a, b) => { const key = a < b ? a + '-' + b : b + '-' + a; if (a === b || seen.has(key)) return; seen.add(key); segs.push({ a, b, o: rnd() }); };
  const nearest = (i, lo, hi, n) => Array.from({ length: hi - lo }, (_, k) => lo + k).filter(j => j !== i).sort((p, q) => mpts[i].distanceTo(mpts[p]) - mpts[i].distanceTo(mpts[q])).slice(0, n);
  for (let i = 0; i < NOUT; i++) nearest(i, 0, NOUT, 3).forEach(j => link(i, j));
  for (let i = NOUT; i < NOUT + NIN; i++) { nearest(i, NOUT, NOUT + NIN, 2).forEach(j => link(i, j)); nearest(i, 0, NOUT, 1).forEach(j => link(i, j)); }
  segs.sort((p, q) => p.o - q.o);
  const mindLines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(segs.flatMap(g => [mpts[g.a], mpts[g.b]])), new THREE.LineBasicMaterial({ color: MID, transparent: true, opacity: 0.6, toneMapped: false })); mind.add(mindLines);
  const mindPts = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), mpts.length);
  mpts.forEach((v, i) => { const r = i < NOUT ? 0.095 : 0.13; mindPts.setMatrixAt(i, tmpM.makeScale(r, r, r).setPosition(v.x, v.y, v.z)); mindPts.setColorAt(i, i < NOUT ? cMid : cBlue); });
  mindPts.castShadow = true; mind.add(mindPts);
  const mindCore = new THREE.Mesh(new THREE.SphereGeometry(0.6, 32, 24), ink(BLUE)), mindHalo = new THREE.Mesh(new THREE.SphereGeometry(1.25, 32, 24), ink(SKY, 0.24)), mindAura = new THREE.Mesh(new THREE.SphereGeometry(MR * 1.05, 48, 32), ink('#cfe0f5', 0.1));
  mind.add(mindAura, mindHalo, mindCore); mindPts.material.transparent = mindCore.material.transparent = true;
  put('cyl', C.x, 0, C.z, 7.4, 0.08, 7.4);
  const mindRing = new THREE.Mesh(new THREE.RingGeometry(4.4, 4.48, 96), ink(SKY, 0.9)); mindRing.rotation.x = -Math.PI / 2; mindRing.position.set(C.x, 0.1, C.z); scene.add(mindRing);
  const spokes = Object.values(S).map((s, i) => { const dv = new THREE.Vector3().subVectors(C, s).setY(0).normalize(), q = (r, y) => new THREE.Vector3(s.x + dv.x * r, y, s.z + dv.z * r);
    const curve = new THREE.CatmullRomCurve3([q(9, 0.07), q(15, 0.07), q(20, 0.5), q(24.2, 2.8), q(26.5, MY - 0.4)]);
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.035, 6, false), ink(SKY, 0.85)));
    const beads = [0, 1].map(k => { const m = new THREE.Mesh(sparkGeo, ink(BLUE)); m.visible = false; scene.add(m); return { m, o: k / 2 + i * 0.13 }; });
    return { curve, beads }; });

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

  bake('block', mBuild); bake('box', mSoft); bake('prism', mSoft); bake('vault', mBuild); bake('cyl', mBuild); bake('ball', mSoft); bake('fig', mFig); bake('wall', mBuild); bake('win', new THREE.MeshStandardMaterial({ color: '#a9bfdc', roughness: 0.5 }));

  /* ---------- labels that follow points in the scene ---------- */
  const stage = document.querySelector('.stage'), tags = [], v3 = new THREE.Vector3();
  const tag = (text, pos, cls = '') => { const el = document.createElement('span'); el.className = 'tag3d ' + cls; el.textContent = text; el.setAttribute('aria-hidden', 'true'); (slot || stage).appendChild(el); const t = { el, pos, a: 0 }; tags.push(t); return t; };
  const T = {
    voices: tag('A series of conversations', new THREE.Vector3(S.talk.x, 5.3, S.talk.z).addScaledVector(FWD, -1.2)),
    signal: tag('Sorted by the job to be done', new THREE.Vector3(S.talk.x, 5.3, S.talk.z).addScaledVector(FWD, -1.2), 't-hot'),
    today: tag('Today', at(S.out, CX(NC - 1), 0, cols[NC - 1].userData.h + 0.9)),
    target: tag('The number to reach', at(S.out, CX(NC + GH - 1), 0, TARGET + 1.5), 't-hot'),
    struggles: tag('Struggles customers described', at(S.opp, -2.2, 0, 4)),
    chosenOpp: tag('The one they chose', at(S.opp, SX(PICK), 0, SH[PICK] + 1.9), 't-hot'),
    parked: tag('Held for later', at(S.opp, SX(1), 0, 1.5), 't-dim'),
    outcome: tag('The goal', new THREE.Vector3(goalP.x, GY + 1.3, goalP.z), 't-hot'),
    back: tag('Worked out backwards', stoneP[2].clone().lerp(stoneP[3], 0.5).setY(2.5)),
    fwd: tag('Then walked forwards', stoneP[2].clone().lerp(stoneP[3], 0.5).setY(2.5)),
    control: tag('What you can change today', stoneP[NST - 1].clone().setY(2.1)),
    standard: tag('The number from step 2', at(S.ship, -3.9, 0, BAR + 0.8)),
    chosenSol: tag('Chosen solution', at(S.ship, OX(WIN) + 2.5, 0, OH[WIN] + 0.5), 't-hot'),
    dropped: tag('Did not pass', at(S.ship, OX(3), 0, 1.25), 't-dim'),
    mind: tag('Noetic Mind', new THREE.Vector3(C.x, 0.2, C.z).addScaledVector(FWD, 7.5), 't-hot'),
    next: tag('Informs the next cycle', onRing(322, RC + 5).setY(0.3)),
  };
  const NUM = Object.values(S).map((s, i) => tag(String(i + 1), new THREE.Vector3(s.x, 0.2, s.z).addScaledVector(FWD, 5.5)));

  /* ---------- timing: each step holds for a long stretch of the scroll ---------- */
  const STEP = 0.127, A = [0.25, 0.38, 0.51, 0.64, 0.77];                 // where each step begins
  const ORDER = [S.talk, S.out, S.opp, S.cause, S.ship], DIST = [27, 31, 31, 29, 31], LOOK = [1.3, 2.6, 1.9, 1.5, 2.5];
  const KF = [[0.00, C.x, C.z, 104, 0], [0.215, C.x, C.z, 104, 0]];
  ORDER.forEach((s, i) => { KF.push([A[i] + 0.012, s.x, s.z, DIST[i], LOOK[i]], [A[i] + 0.112, s.x, s.z, DIST[i] - 2, LOOK[i]]); });
  KF.push([0.945, C.x, C.z, 104, 0], [1.00, C.x, C.z, 104, 0]);
  const target = new THREE.Vector3(), dirNow = new THREE.Vector3(), TOP = new THREE.Vector3(0.8, 0.95, 1).normalize();
  function cameraAt(p) { let i = 0; while (i < KF.length - 2 && p > KF[i + 1][0]) i++;
    const [a, ax, az, ad, ay] = KF[i], [b, bx, bz, bd, by] = KF[i + 1], t = ease(clamp((p - a) / (b - a)));
    target.set(ax + (bx - ax) * t, ay + (by - ay) * t, az + (bz - az) * t); return ad + (bd - ad) * t; }

  let W = 0, H = 0;
  const sidePanels = panels.slice(0, -1).map(p => p.el); let panelRight = 0;           // the closing panel sits over the wide view
  function resize() { if (slot) { W = slot.clientWidth; H = slot.clientHeight; } else { W = innerWidth; H = innerHeight; }
    renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
    panelRight = slot ? 0 : sidePanels.reduce((mx, el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.width < W * 0.7 ? Math.max(mx, r.left + r.width) : mx; }, 0); }
  resize(); addEventListener('resize', resize);

  function apply(p, time) {
    const aspect = W / H, distMul = aspect < 1.35 ? Math.min(2.3, 1.42 / aspect) : 1, base = cameraAt(p);
    const wide = 1 - span(0.215, 0.262, p) * (1 - span(0.9, 0.945, p));
    // beside the text panel: fit each step, and the whole circle in the wide views, into the space to its right
    // nothing being explained may sit under the text panel: the free space starts a gap to its right
    const pxWide = panelRight > 0 ? Math.min(panelRight + 36, W - 240) : 0, pxStep = panelRight > 0 ? Math.min(Math.max(panelRight + 28, W * 0.5), W - 240) : 0;
    const panelPx = pxStep + (pxWide - pxStep) * wide, free = 1 - (panelPx + 16) / W, perUnit = 0.536 * aspect * free;
    const dist = panelPx ? Math.max(Math.min(base, 40), 19.5 / perUnit) * (1 - wide) + Math.max(96, 80 / perUnit) * wide : base * distMul;
    dirNow.copy(DIR).lerp(TOP, wide).normalize();
    camera.position.copy(target).addScaledVector(dirNow, dist); camera.lookAt(target);
    const heroK = 1 - span(0.02, 0.07, p);
    // the scene is centred in the space to the right of the text panel
    const shiftX = span(0.045, 0.09, p) * (panelPx - 16) / 2;
    const shiftY = slot ? 0 : -heroK * 0.3 * H;
    if (Math.abs(shiftX) + Math.abs(shiftY) > 0.5) camera.setViewOffset(W, H, -shiftX, shiftY, W, H); else camera.clearViewOffset();
    sun.position.set(target.x - 16, 46, target.z + 12); sun.target.position.copy(target);
    const u = A.map(a => (p - a) / STEP);                                  // local time inside each step
    const on = i => span(0.06, 0.14, u[i]) * (1 - span(0.9, 0.98, u[i])); // when a step's labels may show

    // 1 · conversations, gathered and sorted by job
    const here = 0.35 + 0.65 * span(-0.15, 0.08, u[0]), draw1 = span(0.1, 0.3, u[0]), sorted = span(0.5, 0.76, u[0]);
    people.forEach((v, i) => {
      const talk = clamp(0.5 + 2.2 * Math.sin(time * v.w + v.ph));
      for (let b = 0; b < VB; b++) { const f = v.bars[b], c = (b - (VB - 1) / 2), shape = 1 - 0.5 * Math.abs(c) / ((VB - 1) / 2);
        const amp = 0.06 + talk * shape * 0.95 * Math.pow(Math.abs(Math.sin(time * f[0] * 0.5 + f[1])) * (0.55 + 0.45 * Math.sin(time * f[2] + f[3])), 1.2);
        setBar(i * VB + b, v.x + SIDE.x * c * 0.085, v.top + 0.2, v.z + SIDE.z * c * 0.085, 0.036, amp * 0.7 * here * (1 - 0.4 * sorted)); }
      v.line.set(draw1);
    });
    bars.instanceMatrix.needsUpdate = true;
    dotInfo.forEach((d, k) => { const e1 = span(d.t0, d.t0 + 0.2, u[0]), e2 = span(0.5 + d.g * 0.04, 0.64 + d.g * 0.04, u[0]), a = 1 - e1;
      tp.set(a * a * d.s.x + 2 * a * e1 * d.c.x + e1 * e1 * d.cloud.x, a * a * d.s.y + 2 * a * e1 * d.c.y + e1 * e1 * d.cloud.y, a * a * d.s.z + 2 * a * e1 * d.c.z + e1 * e1 * d.cloud.z);
      tp.y += Math.sin(time * 1.3 + d.ph) * 0.07 * e1 * (1 - e2); tp.lerp(d.slot, e2);
      const sc = Math.max(0.0001, span(0, 0.2, e1)); ts.set(sc, sc, sc); tmpM.compose(tp, tq, ts); jobDots.setMatrixAt(k, tmpM); });
    jobDots.instanceMatrix.needsUpdate = true;
    jobRings.forEach((m, gi) => { const k = span(0.62 + gi * 0.04, 0.76 + gi * 0.04, u[0]); m.visible = k > 0.01; m.scale.setScalar(Math.max(0.001, 0.6 + 0.4 * k)); m.material.opacity = k; m.material.transparent = true; });
    pulses.forEach(({ m, o }) => { const ph = (time * 0.5 + o) % 1; m.scale.setScalar(1 + ph * 0.7); m.material.opacity = (1 - ph) * 0.5 * here; });
    T.voices.a = on(0) * (1 - span(0.5, 0.6, u[0])); T.signal.a = on(0) * span(0.76, 0.84, u[0]);

    // road: each stretch is drawn as you leave a step
    const d = { a: span(A[0] + 0.108, A[1] + 0.012, p), b: span(A[1] + 0.108, A[2] + 0.012, p), c: span(A[2] + 0.108, A[3] + 0.012, p), d: span(A[3] + 0.108, A[4] + 0.012, p) };
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

    // 4 · the path is laid back from the goal, then walked forwards
    const backw = span(0.1, 0.42, u[3]), arrive = span(0.42, 0.5, u[3]), fwd = clamp((u[3] - 0.52) / 0.24), done4 = span(0.76, 0.82, u[3]);
    backLink.set(backw);
    const hop = fwd * (NST - 1), hk = Math.min(NST - 2, Math.floor(hop)), hf = ease(hop - hk);
    stones.forEach((m, i) => { const k = i ? ease(clamp(backw * 5.6 - (i - 0.5))) : 1, w = stoneW(i) * Math.max(0.001, k); m.scale.set(w, 0.1, w); m.visible = k > 0.01;
      m.material.color.copy(cPale).lerp(cBlue, 0.85 * (i === NST - 1 ? arrive : clamp((hop - (NST - 1 - i)) * 3 + 0.4) * (fwd > 0 ? 1 : 0))); });
    walker.visible = arrive > 0.01; walker.scale.setScalar(1.3 * Math.max(0.001, arrive));
    walker.position.lerpVectors(stoneP[NST - 1 - hk], stoneP[NST - 2 - hk], hf); walker.position.y = 0.1 + Math.sin(Math.PI * hf) * 0.6;
    goalCap.scale.setScalar(Math.max(0.001, done4));
    causeRing.visible = done4 > 0.01; causeRing.scale.setScalar(Math.max(0.001, done4) * (1 + 0.05 * Math.sin(time * 2.4)));
    T.outcome.a = on(3) * span(0.06, 0.14, u[3]); T.back.a = on(3) * span(0.18, 0.26, u[3]) * (1 - span(0.46, 0.52, u[3]));
    T.control.a = on(3) * span(0.44, 0.52, u[3]); T.fwd.a = on(3) * span(0.56, 0.62, u[3]);

    // 5 · delivery and impact
    const bar5 = span(0.08, 0.2, u[4]), rise5 = span(0.2, 0.42, u[4]), verdict = span(0.48, 0.6, u[4]), eff = span(0.6, 0.76, u[4]);
    barBeam.scale.x = Math.max(0.01, 11.2 * bar5); barBeam.visible = bar5 > 0.01;
    opts.forEach((m, i) => { const win = i === WIN, st = ease(clamp(rise5 * 1.4 - i * 0.09)), h = m.userData.h * st;
      m.scale.y = Math.max(0.01, win ? h : h - (h - 0.45) * verdict * (st > 0 ? 1 : 0)); m.material.color.copy(cPale).lerp(win ? cBlue : cOff, verdict); });
    effect.forEach((m, i) => { const e = ease(clamp(eff * 3 - i * 0.6)); m.visible = e > 0.01; m.scale.setScalar(Math.max(0.001, 0.6 + 0.4 * e)); m.material.opacity = e * (0.95 - i * 0.17);
      m.position.y = 0.12 + OH[WIN] + 1.9 + i * 0.75 * e + Math.sin(time * 1.5 + i) * 0.04; });
    T.standard.a = on(4) * span(0.16, 0.24, u[4]); T.chosenSol.a = on(4) * span(0.56, 0.64, u[4]); T.dropped.a = on(4) * span(0.6, 0.68, u[4]);

    // home: the evidence travels the last stretch of the circle back to step 1
    backDots.count = Math.floor(backPts.length * span(A[4] + 0.108, 0.955, p));
    const numA = span(0.6, 0.9, wide) * span(0.05, 0.08, p); NUM.forEach(t => { t.a = numA; });
    T.mind.a = numA; T.next.a = span(0.905, 0.935, p) * (slot ? 1 - span(0.95, 0.965, p) : 1);

    // the Mind: connections form as each step reports in, and every finished step keeps feeding it
    const fed = u.map(x => span(0.74, 0.86, x)), opening = 1 - span(0.215, 0.255, p), know = fed.reduce((a, b) => a + b, 0);
    const mk = span(0.3, 0.8, wide) * span(0.035, 0.075, p); mind.visible = mk > 0.01;                  // the Mind shows in the wide views, never cut off by the edge of a close one
    mindLines.material.opacity = 0.6 * mk; mindPts.material.opacity = mindCore.material.opacity = mk; mindHalo.material.opacity = 0.24 * mk; mindAura.material.opacity = 0.1 * mk;
    mind.rotation.y = time * 0.1; mindLines.geometry.setDrawRange(0, 2 * Math.round(segs.length * (0.32 + 0.136 * know)));
    mindHalo.scale.setScalar(1 + 0.08 * Math.sin(time * 1.6));
    spokes.forEach(({ curve, beads }, i) => { const act = Math.max(fed[i], opening);
      beads.forEach(({ m, o }) => { if (act < 0.05) { m.visible = false; return; } const ph = (time * 0.2 + o) % 1; m.visible = true; curve.getPointAt(ph, m.position); m.scale.setScalar(act * 1.3 * Math.sqrt(Math.sin(Math.PI * ph))); }); });

    tags.forEach(t => { if (t.a < 0.01) { if (t.shown) { t.el.style.opacity = 0; t.shown = false; } return; }
      v3.copy(t.pos).project(camera); if (v3.z > 1) { t.el.style.opacity = 0; t.shown = false; return; }
      const half = t.el.offsetWidth / 2, lo = (p > 0.045 ? panelPx : 0) + 10 + half, x = Math.min(W - 10 - half, Math.max(lo, (v3.x + 1) / 2 * W));
      t.el.style.transform = `translate(${x.toFixed(1)}px,${((1 - v3.y) / 2 * H).toFixed(1)}px) translate(-50%,-50%)`; t.el.style.opacity = t.a.toFixed(2); t.shown = true; });

    if (slot) return;                                                       // phones: the panels are ordinary text
    panels.forEach(({ el, r }) => { const v = (r[0] < 0 ? 1 : span(r[0], r[1], p)) * (1 - span(r[2], r[3], p));
      el.style.opacity = v.toFixed(3); el.style.transform = `translateY(${((1 - v) * 18).toFixed(1)}px)`; el.style.visibility = v < 0.01 ? 'hidden' : 'visible'; });
  }

  let pTarget = 0, p = 0, time = 0, last = performance.now(), running = false, visible = true, lastTick = 0, lastFrame = 0;
  // phones: the world holds the finished cycle, seen whole, and is drawn only while its box is on screen
  const stops = panels.map(({ el }) => ({ el, at: Number(el.dataset.at) }));
  function measure() { if (slot) { const r = slot.getBoundingClientRect(); visible = r.bottom > 0 && r.top < innerHeight;
      const line = Math.max(r.bottom, 0) + (innerHeight - Math.max(r.bottom, 0)) * 0.6; let cur = stops[0];           // the panel being read
      for (const st of stops) if (st.el.getBoundingClientRect().top < line) cur = st;
      if (cur.el !== measure.cur) { measure.cur && measure.cur.classList.remove('on'); cur.el.classList.add('on'); measure.cur = cur.el; }
      pTarget = cur.at; return; }
    const r = journey.getBoundingClientRect(), total = r.height - H; canvas.style.opacity = clamp(1.2 - r.top / H).toFixed(3); pTarget = P0 + (1 - P0) * (total > 0 ? clamp(-r.top / total) : 0); visible = r.bottom > 0; }
  function tick(now, snap) { const dt = Math.min(snap ? 0.25 : 0.05, (now - last) / 1000); last = now; lastTick = now; time += dt;
    measure(); if (snap) p = pTarget; else if (slot) { const d = pTarget - p, sp = Math.max(0.022, Math.abs(d) * 0.3) * dt; p += clamp(d, -sp, sp); }
    else { p += (pTarget - p) * Math.min(1, dt * 6); if (Math.abs(pTarget - p) < 0.0004) p = pTarget; }
    if (window.__p != null) p = window.__p;
    apply(p, time); renderer.render(scene, camera); }
  function frame(now) { lastFrame = performance.now(); tick(now, false); if (visible) requestAnimationFrame(frame); else running = false; }
  function wake() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
  // Some viewers pause animation frames (a background pane, a throttled embed, a remote view). The page must still
  // move, so when frames stop arriving it is drawn from the scroll event and from a slow timer instead.
  // The timer fills in at full speed whenever frames are late, so the motion stays smooth instead of stepping.
  function rescue() { if (document.hidden) return; const now = performance.now(); if (now - lastFrame < 60 || now - lastTick < 14) return; measure(); if (visible) tick(now, false); }
  addEventListener('scroll', () => { wake(); rescue(); }, { passive: true }); setInterval(rescue, 16);
  measure(); p = pTarget; tick(performance.now(), true); wake();
}

// Some viewers load the page before it has a size. Wait for one, so a wide window is not taken for a phone.
function begin() { if (!innerWidth) { setTimeout(begin, 60); return; }
  mobile = matchMedia('(max-width: 860px)').matches; slot = mobile ? document.querySelector('.world-slot') : null;
  try { start(); if (root.classList.contains('webgl') || root.classList.contains('webgl-inline')) stepper(); } catch (err) { root.classList.remove('webgl', 'webgl-inline'); document.querySelector('canvas')?.remove(); console.error(err); } }
begin();

// Stepping through the page without scrolling: each panel of the walkthrough in turn, then each section below it.
// The arrow keys do it everywhere; inside the walkthrough there is also a Back and Next control.
let smooth = null;
const steady = t => t - 0.6 * Math.sin(TAU * t) / TAU;                        // an even pace with soft ends, so a step plays through at a watchable speed
function step(down, pace) {
  const j = document.querySelector('.webgl .journey, .webgl-inline .journey'); if (!j) return false;
  const top0 = j.getBoundingClientRect().top + scrollY, run = j.offsetHeight - innerHeight, stops = [];
  if (slot) { const bar = slot.getBoundingClientRect().height + parseFloat(getComputedStyle(slot).top);   // phones: bring each panel up under the pinned scene
    j.querySelectorAll('.panel').forEach((el, i) => stops.push(i ? el.getBoundingClientRect().top + scrollY - bar - 20 : top0 - parseFloat(getComputedStyle(slot).top) + 1)); }
  else j.querySelectorAll('.panel[data-at]').forEach(el => stops.push(top0 + clamp((Number(el.dataset.at) - 0.004 - P0) / (1 - P0)) * run));   // each stop is where that step has finished playing
  document.querySelectorAll('.content .sec').forEach(s => stops.push(s.getBoundingClientRect().top + scrollY));
  const max = document.documentElement.scrollHeight - innerHeight; stops.push(max);
  stops.sort((a, b) => a - b);
  const y = smooth && smooth.isScrolling === 'smooth' ? smooth.targetScroll : gliding ? step.to : scrollY;   // mid-glide, step on from where it is heading
  const to = down ? stops.find(v => v > y + 8) : [...stops].reverse().find(v => v < y - 8);
  if (to == null) return true;
  const top = step.to = Math.min(Math.round(to), max), inside = !slot && top < top0 + run + 4 && top > top0 + 4 && y > top0 - 4;   // a move from one step of the walkthrough to the next
  if (smooth) smooth.scrollTo(top, inside ? { duration: pace, easing: steady } : { duration: 0.9 });
  else glide(top, inside ? pace : 0.9);
  return true;
}
// Without smooth scrolling the page is moved on a timer, which still runs in viewers that pause animation frames.
let gliding = 0;
function glide(top, secs) { clearInterval(gliding); const from = scrollY, t0 = performance.now(), snap = root.classList.contains('snap-css');
  if (reduce) { scrollTo(0, top); return; }
  root.classList.remove('snap-css');                                         // the browser's snapping would fight the glide
  gliding = setInterval(() => { const k = Math.min(1, (performance.now() - t0) / (secs * 1000)); scrollTo(0, from + (top - from) * (secs > 2 ? steady(k) : ease(k)));
    if (k >= 1) { clearInterval(gliding); gliding = 0; if (snap && !smooth) root.classList.add('snap-css'); } }, 16); }
['wheel', 'touchstart'].forEach(ev => addEventListener(ev, () => { if (gliding) { clearInterval(gliding); gliding = 0; if (!smooth) root.classList.add('snap-css'); } }, { passive: true }));
addEventListener('keydown', e => {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
  const t = e.target; if (t && t.closest && t.closest('input, textarea, select, [contenteditable]')) return;
  if (step(e.key === 'ArrowDown', 4)) e.preventDefault();
});
function stepper() {                                                         // called once the scene is running
  const box = document.createElement('div'); box.className = 'stepper';
  box.innerHTML = '<button type="button" class="s-back" aria-label="Back one step"><span aria-hidden="true">←</span></button><button type="button" class="s-next">Next<span aria-hidden="true">→</span></button>';
  box.querySelector('.s-back').addEventListener('click', () => step(false, 4));
  box.querySelector('.s-next').addEventListener('click', () => step(true, 8));
  (slot || document.querySelector('.stage')).appendChild(box);
}

addEventListener('load', () => {
  if (reduce || !window.Lenis) return;
  // Smooth scrolling takes over the wheel and moves the page on animation frames. If frames are not arriving it would
  // swallow every scroll, so it starts only once frames are proven to run, and stands down if they stop.
  let lenis = null, seen = 0, t0 = 0, count = 0;
  const raf = t => { count++; if (lenis) { lenis.raf(t); requestAnimationFrame(raf); } };
  // probe: twelve frames must arrive at a healthy rate before smooth scrolling is allowed to take the wheel
  const probe = t => { if (!seen) t0 = t; if (++seen < 12) { requestAnimationFrame(probe); return; }
    if ((t - t0) / 11 < 34) { lenis = new window.Lenis({ duration: 1.15, smoothWheel: true }); smooth = lenis; count = 30; root.classList.remove('snap-css'); requestAnimationFrame(raf); } };
  requestAnimationFrame(probe);
  setInterval(() => { if (lenis && !document.hidden && count < 20) { lenis.destroy(); lenis = null; smooth = null; root.classList.add('snap-css'); } count = 0; }, 1000);
  // Magnetic sections: once the wheel rests, a section heading that is close to the top of the screen is drawn up to it.
  // The pull is one-sided, so reading on down a tall section is never dragged back. Without smooth scrolling the
  // browser's own proximity snapping does the same job (html.snap-css).
  const secs = [...document.querySelectorAll('.content .sec')];
  let dir = 1, snapTimer = 0;
  const settle = () => { if (!lenis) return; const H = innerHeight, y = lenis.targetScroll;
    for (const s of secs) { const top = s.getBoundingClientRect().top + scrollY, d = top - y;
      if (Math.abs(d) < 2) return;
      if (dir > 0 ? (d > -0.12 * H && d < 0.45 * H) : (d > -0.45 * H && d < 0.12 * H)) { lenis.scrollTo(top, { duration: 0.85 }); return; } } };
  addEventListener('wheel', e => { if (!e.deltaY) return; dir = e.deltaY > 0 ? 1 : -1; clearTimeout(snapTimer); snapTimer = setTimeout(settle, 130); }, { passive: true });
  document.addEventListener('visibilitychange', () => { count = 60; });   // returning from a hidden tab is not a stall
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); const el = id.length > 1 && document.querySelector(id);
    if (!lenis) return;
    if (id === '#top') { e.preventDefault(); lenis.scrollTo(0); return; }
    if (!el) return; e.preventDefault(); lenis.scrollTo(el, { offset: -72 });
  }));
});
