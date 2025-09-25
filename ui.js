// ui.js
// Basic IntersectionObserver reveal
(function(){
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || !els.length) return;
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  els.forEach(el=>io.observe(el));
})();

// Hide any legacy sticky footer if still present
const sticky = document.getElementById('sticky-footer');
if (sticky) sticky.style.display = 'none';

// Mobile nav toggle helper
const toggle = document.querySelector('.nav-toggle');
const menu = document.getElementById('navMenu');
if (toggle && menu && toggle.dataset.navBound !== 'inline') {
  toggle.addEventListener('click', () => {
    menu.classList.toggle('open');
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
  });
  toggle.dataset.navBound = 'ui';
}
