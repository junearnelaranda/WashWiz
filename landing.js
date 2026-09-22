const menu = document.querySelector('.menu');
const links = document.querySelector('.links');
menu?.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
});
const navItems = [...document.querySelectorAll('.links a')];
const setActiveNav = id => navItems.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));

navItems.forEach(link => link.addEventListener('click', () => {
  links.classList.remove('open');
  setActiveNav(link.getAttribute('href').slice(1));
}));

const navSections = navItems
  .map(link => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

const sectionObserver = new IntersectionObserver(entries => {
  const visibleSection = entries
    .filter(entry => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (visibleSection) setActiveNav(visibleSection.target.id);
}, { rootMargin: '-25% 0px -60% 0px', threshold: [0.05, 0.2, 0.5] });

navSections.forEach(section => sectionObserver.observe(section));
document.querySelector('.contact form')?.addEventListener('submit', event => {
  event.preventDefault();
  event.currentTarget.querySelector('output').textContent = 'Thanks! Your message is ready to be sent to the WashWiz team.';
  event.currentTarget.reset();
});
const landingFavicon = document.createElement("link");
landingFavicon.rel = "icon";
landingFavicon.type = "image/png";
landingFavicon.href = "logo-transparent.png";
document.head.appendChild(landingFavicon);
