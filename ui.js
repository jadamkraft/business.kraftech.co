// ui.js (hardened)
// Scroll-reveal with multiple fallbacks so content never stays hidden.

(function () {
  try {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    // If IntersectionObserver is missing, reveal immediately.
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('in'));
      return;
    }

    let revealedCount = 0;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          revealedCount++;
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

    els.forEach(el => io.observe(el));

    // Safety net: if nothing has revealed after 800ms, reveal all.
    setTimeout(() => {
      if (revealedCount === 0) {
        els.forEach(el => el.classList.add('in'));
      }
    }, 800);
  } catch (err) {
    // Absolute fallback: reveal everything if any error occurs.
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
  }

  // Hide any legacy sticky footer if still present
  const sticky = document.getElementById('sticky-footer');
  if (sticky) sticky.style.display = 'none';
})();
