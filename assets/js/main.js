document.documentElement.classList.remove('no-js');
document.documentElement.classList.add('js');

document.documentElement.classList.remove('no-js'); document.documentElement.classList.add('js');

(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
  const lerp = (a, b, n) => a + (b - a) * n;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const state = {
    y: window.scrollY,
    vh: window.innerHeight,
    vw: window.innerWidth,
    projectDistance: 0,
    ticking: false
  };

  const header = $('[data-header]');
  const progress = $('.scroll-progress span');
  const hero = $('[data-hero]');
  const heroMedia = $('.hero__media');
  const heroLines = $$('.hero__line');
  const projectSection = $('[data-projects]');
  const projectTrack = $('[data-project-track]');
  const projectProgress = $('[data-project-progress]');
  const methodSteps = $$('.method-step');
  const methodImages = $$('.method__images img');
  const methodNumber = $('[data-method-number]');
  const parallaxItems = $$('[data-parallax]');
  const wordReveals = $$('.word-reveal');
  const dotLinks = $$('[data-dot-nav] a');
  const mobileActionBar = $('[data-mobile-consultation]');

  function splitWords() {
    wordReveals.forEach((element) => {
      const words = element.textContent.trim().split(/\s+/);
      element.innerHTML = words.map((word) => `<span class="word">${word}</span>`).join(' ');
    });
  }

  function revealObserver() {
    const items = $$('.reveal');
    if (reducedMotion || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -5% 0px' });

    items.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index % 3, 2) * 80}ms`;
      observer.observe(item);
    });
  }

  function calculateDimensions() {
    state.vh = window.innerHeight;
    state.vw = window.innerWidth;
    if (projectTrack) {
      state.projectDistance = Math.max(0, projectTrack.scrollWidth - state.vw + state.vw * 0.04);
    }
  }

  function updateHeaderAndProgress() {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - state.vh);
    const pageProgress = clamp(state.y / maxScroll);
    progress.style.width = `${pageProgress * 100}%`;
    header.classList.toggle('is-scrolled', state.y > 70);
  }

  function updateHero() {
    if (!hero || reducedMotion) return;
    const start = hero.offsetTop;
    const distance = Math.max(1, hero.offsetHeight - state.vh);
    const p = clamp((state.y - start) / distance);

    heroMedia.style.transform = `translate3d(0, ${p * 5.5}vh, 0) scale(${1.08 - p * 0.055})`;
    heroLines[0].style.transform = `translate3d(${-p * 10}vw, ${-p * 1.5}vh, 0)`;
    heroLines[1].style.transform = `translate3d(${p * 14}vw, ${-p * 2.5}vh, 0)`;
    heroLines[2].style.transform = `translate3d(${p * 3}vw, ${-p * 8}vh, 0)`;
    const fade = clamp(1 - Math.max(0, p - .58) / .35);
    heroLines.forEach((line) => { line.style.opacity = fade; });
  }

  function updateWordReveals() {
    wordReveals.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const p = clamp((state.vh * .94 - rect.top) / (state.vh * .42));
      const words = $$('.word', element);
      const count = Math.ceil(words.length * p);
      words.forEach((word, index) => word.classList.toggle('is-lit', index < count));
    });
  }

  function updateParallax() {
    if (reducedMotion) return;
    parallaxItems.forEach((item) => {
      if (item === heroMedia) return;
      const rect = item.parentElement.getBoundingClientRect();
      if (rect.bottom < -100 || rect.top > state.vh + 100) return;
      const speed = Number(item.dataset.parallax || .12);
      const centerOffset = (rect.top + rect.height / 2) - state.vh / 2;
      item.style.transform = `translate3d(0, ${centerOffset * -speed}px, 0) scale(1.08)`;
    });
  }

  function setMethodStep(index) {
    methodSteps.forEach((step, stepIndex) => step.classList.toggle('is-active', stepIndex === index));
    methodImages.forEach((image, imageIndex) => image.classList.toggle('is-active', imageIndex === index));
    if (methodNumber) methodNumber.textContent = String(index + 1).padStart(2, '0');
  }

  function updateMethod() {
    if (!methodSteps.length) return;
    let active = 0;
    let nearest = Infinity;
    methodSteps.forEach((step, index) => {
      const rect = step.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height * .25 - state.vh * .5);
      if (distance < nearest) {
        nearest = distance;
        active = index;
      }
    });
    setMethodStep(active);
  }

  function updateProjects() {
    if (!projectSection || !projectTrack) return;
    const start = projectSection.offsetTop;
    const distance = Math.max(1, projectSection.offsetHeight - state.vh);
    const p = clamp((state.y - start) / distance);
    if (!window.matchMedia('(max-width: 980px)').matches) {
      projectTrack.style.transform = `translate3d(${-state.projectDistance * p}px, 0, 0)`;
    } else {
      projectTrack.style.transform = 'none';
    }
    if (projectProgress) projectProgress.style.width = `${p * 100}%`;
  }

  function updateDotNav() {
    if (!dotLinks.length) return;
    let activeLink = dotLinks[0];
    let nearest = Infinity;
    dotLinks.forEach((link) => {
      const id = link.getAttribute('href');
      const target = id ? $(id) : null;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const distance = Math.abs(rect.top - state.vh * .28);
      if (rect.top <= state.vh * .56 && rect.bottom >= state.vh * .18 && distance < nearest) {
        nearest = distance;
        activeLink = link;
      }
    });
    dotLinks.forEach((link) => link.classList.toggle('is-active', link === activeLink));
  }


  function updateMobileActionBar() {
    if (!mobileActionBar) return;
    const isMobile = window.matchMedia('(max-width: 700px)').matches;
    if (!isMobile) {
      mobileActionBar.classList.remove('is-visible');
      return;
    }

    const contact = $('#contatti');
    const footer = $('.site-footer');
    const contactTop = contact ? contact.getBoundingClientRect().top : Infinity;
    const footerTop = footer ? footer.getBoundingClientRect().top : Infinity;
    const nearFinalCta = Math.min(contactTop, footerTop) < state.vh * .72;
    const afterIntro = state.y > state.vh * 1.15;
    const menuOpen = document.body.classList.contains('menu-open');

    mobileActionBar.classList.toggle('is-visible', afterIntro && !nearFinalCta && !menuOpen);
  }

  function render() {
    state.y = window.scrollY;
    updateHeaderAndProgress();
    updateHero();
    updateWordReveals();
    updateParallax();
    updateMethod();
    updateProjects();
    updateDotNav();
    updateMobileActionBar();
    state.ticking = false;
  }

  function requestRender() {
    if (!state.ticking) {
      requestAnimationFrame(render);
      state.ticking = true;
    }
  }

  function heroIntro() {
    if (reducedMotion) return;
    const eyebrow = $('.hero__eyebrow');
    const bottom = $('.hero__bottom');
    const items = [eyebrow, ...heroLines, bottom].filter(Boolean);
    items.forEach((item) => { item.style.opacity = '0'; });

    setTimeout(() => {
      eyebrow?.animate([
        { opacity: 0, transform: 'translateY(16px)' },
        { opacity: .72, transform: 'translateY(0)' }
      ], { duration: 700, fill: 'forwards', easing: 'cubic-bezier(.2,.75,.25,1)' });

      heroLines.forEach((line, index) => {
        line.animate([
          { opacity: 0, transform: 'translateY(115%)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 1050, delay: 140 + index * 110, fill: 'forwards', easing: 'cubic-bezier(.16,1,.3,1)' });
      });

      bottom?.animate([
        { opacity: 0, transform: 'translateY(24px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 800, delay: 580, fill: 'forwards', easing: 'cubic-bezier(.2,.75,.25,1)' });
    }, 950);
  }

  function setupPreloader() {
    const preloader = $('.preloader');
    const finish = () => {
      setTimeout(() => preloader?.classList.add('is-done'), 1650);
    };
    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish, { once: true });
  }

  function setupMenu() {
    const toggle = $('[data-menu-toggle]');
    const menu = $('[data-mobile-menu]');
    if (!toggle || !menu) return;

    const close = () => {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Apri menu');
      menu.classList.remove('is-open');
      document.body.classList.remove('menu-open');
      updateMobileActionBar();
    };

    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      if (open) close();
      else {
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', 'Chiudi menu');
        menu.classList.add('is-open');
        document.body.classList.add('menu-open');
        updateMobileActionBar();
      }
    });

    $$('a', menu).forEach((link) => link.addEventListener('click', close));
  }

  function setupCursor() {
    const cursor = $('.cursor');
    if (!cursor || matchMedia('(pointer: coarse)').matches) return;
    let tx = -100, ty = -100, x = -100, y = -100;

    window.addEventListener('mousemove', (event) => {
      tx = event.clientX;
      ty = event.clientY;
      cursor.classList.add('is-visible');
    });
    document.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));
    $$('.cursor-view').forEach((element) => {
      element.addEventListener('mouseenter', () => cursor.classList.add('is-view'));
      element.addEventListener('mouseleave', () => cursor.classList.remove('is-view'));
    });

    const loop = () => {
      x = lerp(x, tx, .18);
      y = lerp(y, ty, .18);
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  function setupMagnetic() {
    if (matchMedia('(pointer: coarse)').matches || reducedMotion) return;
    $$('.magnetic').forEach((element) => {
      element.addEventListener('mousemove', (event) => {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        element.style.transform = `translate3d(${x * .12}px, ${y * .12}px, 0)`;
      });
      element.addEventListener('mouseleave', () => { element.style.transform = ''; });
    });
  }

  function setupImageTilt() {
    if (matchMedia('(pointer: coarse)').matches || reducedMotion) return;
    $$('.service-card, .project-card').forEach((card) => {
      const image = $('img', card);
      if (!image) return;
      card.addEventListener('mousemove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        image.style.transform = `scale(1.055) translate3d(${x * -10}px, ${y * -10}px, 0)`;
      });
      card.addEventListener('mouseleave', () => { image.style.transform = ''; });
    });
  }


  function setupNetwork() {
    const section = $('[data-network]');
    if (!section) return;
    const cards = $$('[data-network-card]', section);
    const details = $$('[data-network-detail]', section);
    const setActive = (key) => {
      cards.forEach((card) => card.classList.toggle('is-active', card.dataset.networkCard === key));
      details.forEach((detail) => detail.classList.toggle('is-active', detail.dataset.networkDetail === key));
    };
    cards.forEach((card) => {
      const key = card.dataset.networkCard;
      card.addEventListener('mouseenter', () => setActive(key));
      card.addEventListener('focus', () => setActive(key));
      card.addEventListener('click', () => setActive(key));
    });
    if (!matchMedia('(pointer: coarse)').matches && !reducedMotion) {
      section.addEventListener('mousemove', (event) => {
        const rect = section.getBoundingClientRect();
        section.style.setProperty('--mx', `${((event.clientX - rect.left) / rect.width) * 100}%`);
        section.style.setProperty('--my', `${((event.clientY - rect.top) / rect.height) * 100}%`);
      });
    }
  }

  function setupForm() {
    const form = $('[data-demo-form]');
    const note = $('[data-form-note]');
    if (!form || !note) return;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const button = $('button[type="submit"]', form);
      button.disabled = true;
      button.querySelector('span').textContent = 'Richiesta acquisita';
      note.textContent = 'Anteprima: simulazione completata. Nella versione WordPress collegheremo il form all’invio reale.';
      note.classList.add('is-success');
      setTimeout(() => {
        button.disabled = false;
        button.querySelector('span').textContent = 'Invia richiesta';
      }, 2600);
    });
  }

  function setupSmoothAnchors() {
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const id = link.getAttribute('href');
        if (!id || id === '#') return;
        const target = $(id);
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      });
    });
  }

  function init() {
    splitWords();
    revealObserver();
    calculateDimensions();
    setupPreloader();
    setupMenu();
    setupCursor();
    setupMagnetic();
    setupImageTilt();
    setupNetwork();
    setupForm();
    setupSmoothAnchors();
    heroIntro();

    const year = $('[data-year]');
    if (year) year.textContent = new Date().getFullYear();

    window.addEventListener('scroll', requestRender, { passive: true });
    window.addEventListener('resize', () => {
      calculateDimensions();
      requestRender();
    });

    requestRender();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
