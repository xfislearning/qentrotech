
    const menuButton = document.querySelector('.menu-button');
    const navLinks = document.querySelector('.nav-links');
    menuButton.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    navLinks.addEventListener('click', event => {
      if (event.target.closest('a')) {
        navLinks.classList.remove('open');
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.setAttribute('aria-label', 'Open menu');
      }
    });
    document.getElementById('year').textContent = new Date().getFullYear();
  
document.addEventListener('keydown', event => {if(event.key === 'Escape' && navLinks.classList.contains('open')){navLinks.classList.remove('open');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open menu');menuButton.focus();}});
document.addEventListener('click', event => {if(!event.target.closest('header')){navLinks.classList.remove('open');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open menu');}});