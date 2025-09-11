// Lightweight scroll reveal
(function(){
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || !els.length) {
    els.forEach(el => el.classList.add('reveal--in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal--in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  els.forEach(el => io.observe(el));
})();
