// Noetic Mind — marketing site interactions
document.documentElement.classList.add('js');

// ---- theme ----
(function () {
  const saved = localStorage.getItem('noetic-theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.addEventListener('click', function () {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('noetic-theme', next);
  });
})();

// ---- scroll reveal + convergence draw-in ----
(function () {
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  // diagram animates shortly after load (it's above the fold)
  const conv = document.querySelector('.conv');
  if (conv) {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // clone each flow line into a "pulse" layer: a bright dot streams along it
    // into Solutions, on top of the solid line. Skipped entirely if reduced motion.
    if (!reduce) {
      const flows = conv.querySelectorAll('.flow');
      flows.forEach(function (p, i) {
        const pulse = p.cloneNode(false);
        pulse.setAttribute('class', 'flow-pulse');
        pulse.setAttribute('pathLength', '1');
        pulse.style.animationDelay = (-(i * 0.375)).toFixed(3) + 's';
        conv.appendChild(pulse);
      });
    }
    // reveal immediately (nodes/focal fade in via CSS transitions, pulses start)
    conv.classList.add('in');
  }
})();

// ---- worked example: pinned panel morphs through evidence states as steps scroll ----
(function () {
  const stage = document.querySelector('.example .stage');
  const steps = document.querySelectorAll('.scrolly-steps .step');
  if (!stage || !steps.length) return;
  const states = ['emerging', 'crowned', 'killed', 'shipped', 'validated'];
  const labels = ['Emerging', 'Crowned', 'Killed', 'Shipped', 'Validated'];
  const num = stage.querySelector('.stage-num');
  const state = stage.querySelector('.stage-state');
  const bars = stage.querySelectorAll('.stage-prog i');

  function activate(i) {
    steps.forEach(function (s, si) { s.classList.toggle('active', si === i); });
    stage.dataset.state = states[i];
    stage.classList.toggle('final', i === 4);
    if (num) num.textContent = '0' + (i + 1);
    if (state) state.textContent = labels[i];
    bars.forEach(function (b, bi) { b.classList.toggle('on', bi <= i); });
  }

  // a step is "active" when it crosses the vertical middle of the viewport
  const io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) activate(+e.target.dataset.i); });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  steps.forEach(function (s) { io.observe(s); });
  activate(0);
})();

// ---- scroll-linked certainty curve: the line climbs AS YOU SCROLL ----
(function () {
  const stage = document.querySelector('.curve-stage');
  const line = stage && stage.querySelector('.cline');
  if (!stage || !line) return;

  // reduced motion: show the finished curve, no scrubbing
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    line.style.strokeDashoffset = '0';
    stage.classList.add('drawn');
    return;
  }

  let ticking = false;
  function update() {
    ticking = false;
    const r = stage.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    // 0 when the chart's top sits at 82% of the viewport, 1 by the time it reaches 28%
    let p = (vh * 0.82 - r.top) / (vh * 0.54);
    p = p < 0 ? 0 : p > 1 ? 1 : p;
    line.style.strokeDashoffset = String(1 - p);   // pathLength=1, so 1→0 draws it
    stage.classList.toggle('drawn', p > 0.92);
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
})();
