// Noetic Mind — version 2 ("Astra"). Motion is orchestrated once, then the page is still.
document.documentElement.classList.add('js');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// hero: the next-bet brief fills in once, row by row
(function () {
  const brief = document.querySelector('.brief');
  if (!brief) return;
  if (reduceMotion) { brief.classList.add('filled'); return; }
  setTimeout(function () { brief.classList.add('filled'); }, 60);
})();

// decision record: Request → Evidence → Decision
(function () {
  const rec = document.getElementById('record');
  if (!rec) return;
  const btns = rec.querySelectorAll('[data-go]');
  let touched = false;

  function go(n) {
    rec.dataset.step = String(n);
    btns.forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.go === n)); });
  }
  btns.forEach(function (b) {
    b.addEventListener('click', function () { touched = true; go(+b.dataset.go); });
  });

  if (reduceMotion) { go(3); return; }
  go(1);

  // play the three stages once when the record comes into view; any click takes over
  const io = new IntersectionObserver(function (entries) {
    if (!entries.some(function (e) { return e.isIntersecting; })) return;
    io.disconnect();
    setTimeout(function () { if (!touched) go(2); }, 1300);
    setTimeout(function () { if (!touched) go(3); }, 3100);
  }, { rootMargin: '-25% 0px -25% 0px' });
  io.observe(rec);
})();

// system flow lights up left to right, once
(function () {
  const flow = document.querySelector('.flow');
  if (!flow) return;
  if (reduceMotion) { flow.classList.add('lit'); return; }
  const io = new IntersectionObserver(function (entries) {
    if (entries.some(function (e) { return e.isIntersecting; })) { flow.classList.add('lit'); io.disconnect(); }
  }, { rootMargin: '0px 0px -20% 0px' });
  io.observe(flow);
})();
