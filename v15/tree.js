/*
 * V15 landing page: the scroll walkthrough. The brief is a seed; opinions drift above it with
 * nowhere to go. Interviews arrive as light and the Progress-to-Outcome Tree grows. Buds change
 * colour as beliefs move from assumption (grey) to emerging (amber) to validated (green); a
 * disproven branch drops; the brightest bud is what to build next; a ring marks each lap.
 * Light world: no scene background (the CSS gradient shows through), soft shadows, no bloom.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const root = document.documentElement;
const journey = document.getElementById('top');
const panels = Array.from(document.querySelectorAll('.panel')).map(el => ({ el, r: el.dataset.range.split(' ').map(Number) }));
const beats = Array.from(document.querySelectorAll('#glance .beats > li'));
const tags = { answer: document.getElementById('tag-answer'), weak: document.getElementById('tag-weak'), lap: document.getElementById('tag-lap') };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = matchMedia('(max-width: 860px)').matches;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = t => t * t * t * (t * (t * 6 - 15) + 10);
const span = (a, b, x) => ease(clamp((x - a) / (b - a)));
const lerp = (a, b, t) => a + (b - a) * t;
let seed = 5;
const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const rr = (a, b) => a + (b - a) * rnd();

const PALE = '#f4f7fc', PALE2 = '#dfe8f5', NAVY = '#0a1a38', BLUE = '#184c84', GLOW = '#5e95d8';
const GREY = '#b8c0cc', AMBER = '#c98a1e', GREEN = '#3f8f5b';

function start() {
  if (reduce || !journey) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'world'; canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch (e) { return; }
  if (!renderer.getContext()) return;
  document.body.prepend(canvas);
  root.classList.add('webgl');
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#eef3fb', 40, 120);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.3, 500);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xdfe8f5, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 2.0); sun.position.set(-14, 30, 16); sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 90 });
  sun.shadow.normalBias = 0.03; sun.shadow.bias = -0.0003; scene.add(sun);
  const fill = new THREE.DirectionalLight(0xbdd4f5, 0.8); fill.position.set(30, 18, -20); scene.add(fill);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShadowMaterial({ color: NAVY, opacity: 0.1 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  const frosted = (color = PALE) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.6 });
  const lit = (color, k = 1) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: k, roughness: 0.5 });

  // ---------- the tree ----------
  const branches = [], buds = [];
  function limb(from, dir, len, r, depth, delay) {
    const to = from.clone().add(dir.clone().multiplyScalar(len));
    const mid = from.clone().lerp(to, 0.5).add(new THREE.Vector3(rr(-0.4, 0.4), 0.2, rr(-0.4, 0.4)));
    const curve = new THREE.CatmullRomCurve3([from, mid, to]);
    const geo = new THREE.TubeGeometry(curve, 24, r, 10, false);
    const m = new THREE.Mesh(geo, frosted(depth === 2 ? PALE2 : PALE)); m.castShadow = true; m.visible = false; scene.add(m);
    const b = { m, geo, delay, depth, drop: false, to };
    branches.push(b);
    if (depth < 2) {
      const n = depth === 0 ? 4 : 3;
      for (let i = 0; i < n; i++) {
        const d = dir.clone().applyAxisAngle(new THREE.Vector3(rr(-1, 1), 0, rr(-1, 1)).normalize(), rr(0.5, 0.95));
        d.y = Math.abs(d.y) + 0.2; d.normalize();
        limb(to.clone(), d, len * rr(0.55, 0.72), r * 0.55, depth + 1, delay + 0.3 + i * 0.05);
      }
    } else {
      const bud = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 14), new THREE.MeshStandardMaterial({ color: GREY, roughness: 0.6 }));
      bud.position.copy(to); bud.castShadow = true; bud.visible = false; scene.add(bud);
      buds.push({ m: bud, delay: delay + 0.25, state: buds.length % 3 === 0 ? 1 : 2, parent: b, home: to.clone() });
    }
  }
  limb(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), 5, 0.4, 0, 0);
  const star = buds[4];                                              // what to build next
  const dropped = branches.filter(b => b.depth === 2)[7]; dropped.drop = true;
  const dropBud = buds.find(b => b.parent === dropped);

  // ---------- the brief, and the opinions above it ----------
  const seedCard = new THREE.Mesh(new RoundedBoxGeometry(1.7, 0.08, 1.15, 2, 0.02), lit(BLUE, 0.15)); seedCard.position.y = 0.06; seedCard.receiveShadow = true; scene.add(seedCard);
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.3, 2.42, 96), new THREE.MeshBasicMaterial({ color: GLOW, transparent: true, opacity: 0, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; scene.add(ring);
  const NO = mobile ? 36 : 60;
  const opGeo = new THREE.SphereGeometry(0.22, 12, 10);
  const ops = new THREE.InstancedMesh(opGeo, new THREE.MeshStandardMaterial({ color: GREY, roughness: 0.7 }), NO);
  ops.castShadow = true; ops.frustumCulled = false; ops.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(ops);
  const O = Array.from({ length: NO }, (_, i) => {
    let x, y, z; do { x = rr(-1, 1); y = rr(-1, 1); z = rr(-1, 1); } while (x * x + y * y + z * z > 1);
    return { cloud: new THREE.Vector3(x * 7, 4.5 + y * 3, z * 7), ph: rr(0, 6.28), sp: rr(0.4, 1), bud: i < buds.length ? buds[i] : null, delay: rnd() };
  });
  const sparks = Array.from({ length: mobile ? 5 : 8 }, (_, i) => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), lit(GLOW, 1.4)); s.visible = false; scene.add(s); return { s, o: i / 8 }; });

  // ---------- camera journey ----------
  //            p     tx   ty   tz   dist  yaw  pitch
  const KF = [[0.00,  0,   3,   0,   40,   18,  10],
              [0.08,  0,   3,   0,   30,   24,  12],
              [0.30,  0,   4,   0,   26,   60,  14],
              [0.52,  0,   5,   0,   24,  110,  10],
              [0.74,  0,   5.5, 0,   22,  170,  16],
              [0.90,  0,   4,   0,   30,  230,  24],
              [1.00,  0,   3,   0,   44,  260,  28]];
  const target = new THREE.Vector3(), cam = { dist: 0, yaw: 0, pitch: 0 };
  function cameraAt(p) {
    let i = 0; while (i < KF.length - 2 && p > KF[i + 1][0]) i++;
    const a = KF[i], b = KF[i + 1], t = ease(clamp((p - a[0]) / (b[0] - a[0])));
    target.set(lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t));
    cam.dist = lerp(a[4], b[4], t); cam.yaw = lerp(a[5], b[5], t) * Math.PI / 180; cam.pitch = lerp(a[6], b[6], t) * Math.PI / 180;
  }
  let W = 0, H = 0;
  function resize() { W = innerWidth; H = innerHeight; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); }
  resize(); addEventListener('resize', resize);

  const m4 = new THREE.Matrix4(), v3 = new THREE.Vector3(), proj = new THREE.Vector3(), tmp = new THREE.Color();
  const cA = new THREE.Color(GREY), cE = new THREE.Color(AMBER), cV = new THREE.Color(GREEN), cS = new THREE.Color(GLOW);
  function placeTag(el, pos, vis, dy = -34) {
    if (!el) return;
    if (vis < 0.02) { el.style.opacity = 0; return; }
    proj.copy(pos).project(camera);
    if (proj.z > 1) { el.style.opacity = 0; return; }
    const half = (el.offsetWidth || 120) / 2 + 10;
    const x = clamp((proj.x * 0.5 + 0.5) * W, half, W - half), y = (-proj.y * 0.5 + 0.5) * H + dy;
    el.style.opacity = vis.toFixed(3);
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
  }

  let lastBeat = -1;
  function apply(p, time) {
    cameraAt(p);
    const aspect = W / H, distMul = aspect < 1.2 ? Math.min(2.1, 1.35 / aspect) : 1, d = cam.dist * distMul;
    camera.position.set(target.x + Math.sin(cam.yaw) * Math.cos(cam.pitch) * d, target.y + Math.sin(cam.pitch) * d, target.z + Math.cos(cam.yaw) * Math.cos(cam.pitch) * d);
    camera.lookAt(target);
    const heroK = 1 - span(0.02, 0.09, p), panelOn = (1 - heroK) * (1 - span(0.97, 0.995, p));
    const shiftX = (!mobile && aspect > 1.1) ? 0.17 * W * panelOn : 0;
    const shiftY = -heroK * (mobile ? 0.22 : 0.3) * H + ((mobile || aspect <= 1.1) ? 0.2 * H * panelOn : 0);
    if (Math.abs(shiftX) + Math.abs(shiftY) > 0.5) camera.setViewOffset(W, H, -shiftX, shiftY, W, H); else camera.clearViewOffset();
    sun.position.set(target.x - 16, 46, target.z + 12);

    // growth: trunk from 0.30, branches to 0.52, buds by 0.6
    const grow = span(0.3, 0.62, p);
    branches.forEach(b => {
      const f = span(b.delay * 0.55, b.delay * 0.55 + 0.1, grow);
      b.geo.setDrawRange(0, Math.floor(24 * f) * 60); b.m.visible = f > 0.01;
      if (b.drop) { const k = span(0.66, 0.72, p); b.m.position.y = -k * 7; b.m.rotation.z = k * 0.9; b.m.material.transparent = true; b.m.material.opacity = 1 - k; }
    });
    const agitate = 1 + 1.2 * span(0.1, 0.18, p) * (1 - span(0.28, 0.34, p));
    const clear = span(0.4, 0.5, p);
    O.forEach((o, i) => {
      const bob = Math.sin(time * o.sp * agitate + o.ph) * 0.5, wob = Math.cos(time * 0.7 * agitate + o.ph) * 0.4;
      let x = o.cloud.x + wob, y = o.cloud.y + bob, z = o.cloud.z + wob * 0.6, s = 1;
      if (o.bud) {                                                   // this opinion becomes a bud on the tree
        const f = span(o.bud.delay * 0.55 - 0.1, o.bud.delay * 0.55 + 0.08, grow);
        x = lerp(x, o.bud.home.x, f); y = lerp(y, o.bud.home.y, f) + Math.sin(f * Math.PI) * 1.5; z = lerp(z, o.bud.home.z, f);
        s = 1 - f; o.bud.f = f;
      } else s = 1 - span(o.delay * 0.6, o.delay * 0.6 + 0.4, clear);
      m4.makeScale(Math.max(0.0001, s), Math.max(0.0001, s), Math.max(0.0001, s)).setPosition(x, y, z);
      ops.setMatrixAt(i, m4);
    });
    ops.instanceMatrix.needsUpdate = true;
    buds.forEach(b => {
      const f = b.f ?? 0; b.m.visible = f > 0.5; b.m.scale.setScalar(Math.max(0.001, span(0.5, 1, f)));
      const e = span(0.56 + (b.delay - 0.55) * 0.3, 0.64 + (b.delay - 0.55) * 0.3, p), v = b.state === 2 ? span(0.62 + (b.delay - 0.55) * 0.3, 0.72 + (b.delay - 0.55) * 0.3, p) : 0;
      tmp.copy(cA).lerp(cE, e).lerp(cV, v);
      if (b === star) { const g = span(0.7, 0.76, p); tmp.lerp(cS, g); b.m.material.emissive.copy(cS).multiplyScalar(0.9 * g + 0.15 * Math.sin(time * 3) * g); b.m.scale.multiplyScalar(1 + 0.5 * g); }
      else b.m.material.emissive.copy(tmp).multiplyScalar(0.25 * Math.max(e, v));
      b.m.material.color.copy(tmp);
      if (b === dropBud) { const k = span(0.66, 0.72, p); b.m.position.y = b.home.y - k * 7; b.m.material.transparent = true; b.m.material.opacity = 1 - k; }
    });
    const live = span(0.33, 0.4, p);
    sparks.forEach(({ s, o }) => { const ph = (time * 0.3 + o) % 1; s.position.set(Math.sin(ph * 9) * 0.28, ph * 5, Math.cos(ph * 9) * 0.28); s.visible = live > 0.5 && ph < 0.95; });
    seedCard.material.emissiveIntensity = 0.15 + 0.3 * Math.max(0, Math.sin(time * 2)) * (1 - live);
    const lap = span(0.84, 0.9, p);
    ring.material.opacity = 0.75 * lap * (1 - span(0.97, 1, p)); ring.scale.setScalar(1 + 0.5 * span(0.84, 0.97, p));

    placeTag(tags.answer, star.m.position, span(0.72, 0.76, p) * (1 - span(0.96, 0.98, p)));
    placeTag(tags.weak, v3.set(dropped.to.x, 0.4, dropped.to.z), span(0.7, 0.73, p) * (1 - span(0.82, 0.85, p)), -26);
    placeTag(tags.lap, v3.set(2.4, 0.1, 0), lap * (1 - span(0.96, 0.98, p)), -24);

    root.style.setProperty('--hero', heroK.toFixed(3));
    panels.forEach(({ el, r }) => {
      const v = (r[0] < 0 ? 1 : span(r[0], r[1], p)) * (1 - span(r[2], r[3], p));
      el.style.opacity = v.toFixed(3); el.style.transform = `translateY(${((1 - v) * 18).toFixed(1)}px)`; el.style.visibility = v < 0.01 ? 'hidden' : 'visible';
    });
    const beat = p < 0.835 ? 0 : p < 0.89 ? 1 : 2;
    if (beat !== lastBeat) { beats.forEach((li, i) => li.classList.toggle('on', i === beat)); lastBeat = beat; }
  }

  let pTarget = 0, p = 0, time = 0, last = performance.now(), running = false, visible = true;
  function measure() { const r = journey.getBoundingClientRect(), total = r.height - H; pTarget = total > 0 ? clamp(-r.top / total) : 0; visible = r.bottom > 0; }
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
    measure(); p += (pTarget - p) * Math.min(1, dt * 6); if (Math.abs(pTarget - p) < 0.0004) p = pTarget;
    apply(p, time); renderer.render(scene, camera);
    if (visible) requestAnimationFrame(frame); else running = false;
  }
  function wake() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
  addEventListener('scroll', wake, { passive: true });
  measure(); p = pTarget; wake();
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
