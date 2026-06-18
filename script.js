const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

function closeMenu() {
  navLinks.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open menu');
}

function openMenu() {
  navLinks.classList.add('open');
  menuToggle.setAttribute('aria-expanded', 'true');
  menuToggle.setAttribute('aria-label', 'Close menu');
}

menuToggle.addEventListener('click', (event) => {
  event.stopPropagation();
  const isOpen = navLinks.classList.contains('open');
  isOpen ? closeMenu() : openMenu();
});

document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', closeMenu);
});

document.addEventListener('click', (event) => {
  if (!navLinks.classList.contains('open')) return;
  if (navLinks.contains(event.target) || menuToggle.contains(event.target)) return;
  closeMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 900) closeMenu();
});



// Highlight the navigation link for the section currently in view.
const homePageSections = ['top', 'services', 'approach', 'why']
  .map(id => document.getElementById(id))
  .filter(Boolean);
const sectionNavLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));

function updateActiveNavLink() {
  if (!homePageSections.length || !sectionNavLinks.length) return;

  const headerOffset = document.querySelector('.site-header')?.offsetHeight || 0;
  const scrollPosition = window.scrollY + headerOffset + 120;
  let activeSectionId = 'top';

  homePageSections.forEach(section => {
    if (scrollPosition >= section.offsetTop) {
      activeSectionId = section.id;
    }
  });

  // Keep Why Qentro active near the bottom of the page.
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 20) {
    activeSectionId = homePageSections[homePageSections.length - 1].id;
  }

  sectionNavLinks.forEach(link => {
    const linkTarget = link.getAttribute('href').replace('#', '');
    link.classList.toggle('active', linkTarget === activeSectionId);
  });
}

updateActiveNavLink();
window.addEventListener('scroll', updateActiveNavLink, { passive: true });
window.addEventListener('resize', updateActiveNavLink);

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
