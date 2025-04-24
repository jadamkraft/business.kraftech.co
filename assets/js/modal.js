document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('contactModal');
    const openModalBtn = document.getElementById('stickyCta');
    const closeBtn = document.querySelector('#contactModal .close-button');
  
    if (openModalBtn && modal && closeBtn) {
      openModalBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
      });
  
      closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
      });
  
      window.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      });
    }
  });
  