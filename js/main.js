/* ==========================================================================
   La Maison Marann — animations
   GSAP + ScrollTrigger + SplitText + Lenis (hébergés dans assets/vendor).
   - Les états « cachés » sont posés ici (jamais en CSS) : sans JS, tout est visible.
   - Mobile : animations lourdes simplifiées. prefers-reduced-motion : version apaisée.
   ========================================================================== */
(() => {
  'use strict';

  const doc = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  let lenis = null;
  let menuOpen = false;
  const hasGsap = () => !!(window.gsap && window.ScrollTrigger);

  /* ------------------------------------------------------------------------
     1. Horaires & statut « ouvert / fermé » (heure de Paris)
     ------------------------------------------------------------------------ */
  // minutes depuis minuit : [ouverture, fermeture] — 0 = dimanche
  const HOURS = { 0: null, 1: [570, 1080], 2: [570, 1080], 3: [570, 1080], 4: [570, 1080], 5: [570, 1080], 6: [570, 1020] };
  const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const EN_DAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const hm = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}h${String(min % 60).padStart(2, '0')}`;

  function parisNow() {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    return { day: EN_DAYS[get('weekday')], minutes: (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10) };
  }

  function statusText({ day, minutes }) {
    const today = HOURS[day];
    if (today && minutes >= today[0] && minutes < today[1]) {
      return { state: 'open', text: `Ouvert · jusqu’à ${hm(today[1])}` };
    }
    if (today && minutes < today[0]) {
      return { state: 'closed', text: `Fermé · ouvre à ${hm(today[0])}` };
    }
    for (let i = 1; i <= 7; i++) {
      const d = (day + i) % 7;
      if (HOURS[d]) {
        const when = i === 1 ? 'demain' : DAY_NAMES[d];
        return { state: 'closed', text: `Fermé · ouvre ${when} à ${hm(HOURS[d][0])}` };
      }
    }
    return { state: 'closed', text: 'Fermé' };
  }

  function updateStatus() {
    let now;
    try { now = parisNow(); } catch (e) { return; }
    const s = statusText(now);
    $$('[data-status]').forEach((el) => {
      el.dataset.state = s.state;
      const txt = $('.status__txt', el);
      if (txt) txt.textContent = s.text;
    });
    $$('.hours li').forEach((li) => li.classList.toggle('is-today', Number(li.dataset.day) === now.day));
  }

  /* ------------------------------------------------------------------------
     2. Menu mobile plein écran
     ------------------------------------------------------------------------ */
  function initMenu() {
    const burger = $('#burger');
    const menu = $('#menu');
    const nav = $('#nav');
    if (!burger || !menu) return;
    $$('.menu__nav a', menu).forEach((a) => { a.innerHTML = `<span>${a.innerHTML}</span>`; });

    const setMenu = (open) => {
      if (open === menuOpen) return;
      menuOpen = open;
      burger.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-hidden', String(!open));
      doc.classList.toggle('menu-open', open);
      nav.classList.toggle('is-open', open);
      const links = $$('.menu__nav a span', menu);
      const foot = $$('.menu__foot > *', menu);
      if (open) {
        menu.classList.add('is-open');
        lenis && lenis.stop();
        if (!lenis) doc.style.overflow = 'hidden';
        if (hasGsap() && !reducedQuery.matches) {
          gsap.killTweensOf([menu, links, foot]);
          gsap.fromTo(menu, { clipPath: 'inset(0% 0% 100% 0% round 0 0 50% 50%)' }, { clipPath: 'inset(0% 0% 0% 0% round 0 0 0% 0%)', duration: 1.05, ease: 'expo.out' });
          gsap.fromTo(links, { yPercent: 115 }, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.07, delay: 0.18 });
          gsap.fromTo(foot, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.5 });
        }
      } else {
        lenis && lenis.start();
        if (!lenis) doc.style.overflow = '';
        if (hasGsap() && !reducedQuery.matches) {
          gsap.killTweensOf(menu);
          gsap.to(menu, { clipPath: 'inset(0% 0% 100% 0% round 0 0 50% 50%)', duration: 0.7, ease: 'expo.inOut', onComplete: () => menu.classList.remove('is-open') });
        } else {
          menu.classList.remove('is-open');
        }
      }
    };
    initMenu.set = setMenu;

    burger.addEventListener('click', () => setMenu(!menuOpen));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) { setMenu(false); burger.focus(); } });
    window.addEventListener('resize', () => { if (menuOpen && window.innerWidth > 900) setMenu(false); });
  }

  /* ------------------------------------------------------------------------
     3. Ancres : défilement doux (Lenis) ou natif
     ------------------------------------------------------------------------ */
  function initAnchors() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      const target = id === '#' ? doc : $(id);
      if (!target) return;
      e.preventDefault();
      const go = () => {
        const y = id === '#accueil' || id === '#' ? 0 : target;
        if (lenis) lenis.scrollTo(y, { duration: 1.7, easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)) });
        else if (y === 0) window.scrollTo({ top: 0, behavior: reducedQuery.matches ? 'auto' : 'smooth' });
        else target.scrollIntoView({ behavior: reducedQuery.matches ? 'auto' : 'smooth' });
      };
      if (menuOpen && initMenu.set) { initMenu.set(false); setTimeout(go, 420); } else go();
    });
  }

  /* ------------------------------------------------------------------------
     4. Micro-interactions : boutons magnétiques, inclinaison 3D + reflet
     ------------------------------------------------------------------------ */
  function initMagnetic() {
    if (!finePointer || !hasGsap()) return;
    $$('[data-magnetic]').forEach((el) => {
      const label = $('.btn__label', el) || $('.badge__core', el);
      const xTo = gsap.quickTo(el, 'x', { duration: 0.9, ease: 'elastic.out(1, 0.5)' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.9, ease: 'elastic.out(1, 0.5)' });
      const lx = label ? gsap.quickTo(label, 'x', { duration: 0.8, ease: 'power3.out' }) : null;
      const ly = label ? gsap.quickTo(label, 'y', { duration: 0.8, ease: 'power3.out' }) : null;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        xTo(dx * 0.32); yTo(dy * 0.42);
        lx && (lx(dx * 0.14), ly(dy * 0.2));
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); lx && (lx(0), ly(0)); });
    });
  }

  function initTilt(max = 7) {
    if (!finePointer) return;
    $$('[data-tilt]').forEach((el) => {
      const glare = $('.glare', el);
      el.addEventListener('pointerenter', () => el.classList.add('is-tilting'));
      el.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = el.getBoundingClientRect();
        const px = clamp((e.clientX - r.left) / r.width, 0, 1);
        const py = clamp((e.clientY - r.top) / r.height, 0, 1);
        el.style.setProperty('--ry', `${((px - 0.5) * 2 * max).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${(-(py - 0.5) * 2 * max).toFixed(2)}deg`);
        if (glare) {
          glare.style.setProperty('--gx', `${(e.clientX - r.left).toFixed(1)}px`);
          glare.style.setProperty('--gy', `${(e.clientY - r.top).toFixed(1)}px`);
        }
      });
      el.addEventListener('pointerleave', () => {
        el.classList.remove('is-tilting');
        el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ------------------------------------------------------------------------
     5. Carrousel d'avis (glisser, flèches, clavier, lecture auto prudente)
     ------------------------------------------------------------------------ */
  function initCarousel() {
    const root = $('#carousel');
    if (!root || !hasGsap()) return;
    const viewport = $('.carousel__viewport', root);
    const track = $('.carousel__track', root);
    const slides = $$('.review', track);
    const bar = $('.carousel__bar i', root);
    const cur = $('[data-cur]', root);
    const prev = $('[data-prev]', root);
    const next = $('[data-next]', root);
    const reduced = reducedQuery.matches;
    let index = 0;
    let auto = null;
    let autoStopped = false;

    root.classList.add('is-enhanced');
    viewport.scrollLeft = 0;

    const target = (i) => -(slides[i].offsetLeft - (viewport.clientWidth - slides[i].offsetWidth) / 2);

    function go(i, instant = false) {
      index = clamp(i, 0, slides.length - 1);
      const d = instant || reduced ? 0 : 1.1;
      gsap.to(track, { x: target(index), duration: d, ease: 'expo.out', overwrite: true });
      slides.forEach((s, k) => gsap.to(s, { scale: k === index ? 1 : 0.93, opacity: k === index ? 1 : 0.4, duration: instant || reduced ? 0 : 0.9, ease: 'power3.out', overwrite: 'auto' }));
      gsap.to(bar, { scaleX: (index + 1) / slides.length, duration: instant || reduced ? 0 : 0.9, ease: 'power3.out', overwrite: 'auto' });
      cur.textContent = String(index + 1);
      prev.disabled = index === 0; next.disabled = index === slides.length - 1;
      prev.style.opacity = prev.disabled ? '.35' : ''; next.style.opacity = next.disabled ? '.35' : '';
    }

    const stopAuto = () => { autoStopped = true; clearInterval(auto); auto = null; };
    const startAuto = () => {
      if (reduced || autoStopped || auto) return;
      auto = setInterval(() => { index >= slides.length - 1 ? go(0) : go(index + 1); }, 12000);
    };

    prev.addEventListener('click', () => { stopAuto(); go(index - 1); });
    next.addEventListener('click', () => { stopAuto(); go(index + 1); });
    viewport.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); stopAuto(); go(index + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); stopAuto(); go(index - 1); }
    });

    // Glisser
    let dragging = false, startX = 0, startTx = 0, lastX = 0, lastT = 0, vel = 0;
    viewport.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true; startX = lastX = e.clientX; lastT = performance.now(); vel = 0;
      startTx = gsap.getProperty(track, 'x');
      gsap.killTweensOf(track);
      stopAuto();
    });
    viewport.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 6 && !root.classList.contains('is-dragging')) { root.classList.add('is-dragging'); try { viewport.setPointerCapture(e.pointerId); } catch (_) {} }
      const now = performance.now();
      vel = (e.clientX - lastX) / Math.max(1, now - lastT);
      lastX = e.clientX; lastT = now;
      gsap.set(track, { x: startTx + dx });
    });
    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false; root.classList.remove('is-dragging');
      const dx = e.clientX - startX;
      if (dx < -70 || vel < -0.6) go(index + 1);
      else if (dx > 70 || vel > 0.6) go(index - 1);
      else go(index);
    };
    viewport.addEventListener('pointerup', endDrag);
    viewport.addEventListener('pointercancel', endDrag);

    // Pause : survol, focus, onglet masqué, hors écran
    root.addEventListener('pointerenter', () => { clearInterval(auto); auto = null; });
    root.addEventListener('pointerleave', () => startAuto());
    root.addEventListener('focusin', () => { clearInterval(auto); auto = null; });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { clearInterval(auto); auto = null; } });
    new IntersectionObserver(([en]) => { en.isIntersecting ? startAuto() : (clearInterval(auto), auto = null); }, { threshold: 0.4 }).observe(root);

    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => go(index, true), 150); });
    go(0, true);
    window.addEventListener('load', () => go(index, true));
  }

  /* ------------------------------------------------------------------------
     6. Défilement fluide + synchronisation ScrollTrigger
     ------------------------------------------------------------------------ */
  function initLenis() {
    if (reducedQuery.matches || !window.Lenis) return;
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;
  }

  /* ------------------------------------------------------------------------
     7. Préchargeur + entrée spectaculaire : l'arche s'ouvre sur le salon
     ------------------------------------------------------------------------ */
  function prepareHero() {
    const hero = $('.hero');
    const arches = $$('.hero__mirrors .arch', hero);
    const lead = $$('.hero__lead, .hero__actions .btn, .hero__meta', hero);
    const split = SplitText.create($$('.hero__line', hero), { type: 'lines,chars', mask: 'lines', aria: 'none' });
    $$('.hero__outline', hero).forEach((el) => { el.dataset.o = getComputedStyle(el).opacity; });

    gsap.set(split.chars, { yPercent: 118 });
    gsap.set(arches, { yPercent: 38, opacity: 0 });
    gsap.set(lead, { y: 30, opacity: 0 });
    gsap.set('.hero__outline', { opacity: 0 });
    gsap.set('.hero__scroll', { opacity: 0 });
    gsap.set('#nav', { yPercent: -110 });
    // La fenêtre d'arche (même géométrie que le dessin du préchargeur)
    gsap.set(hero, { clipPath: doorClip(0) });
    return { hero, arches, lead, split };
  }

  const DOOR_W = 224, DOOR_H = 344, DOOR_R = 112;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  // Rayon du haut : demi-cercle tant que l'arche grandit, puis il s'aplatit pour libérer les coins
  function doorRadius(p) {
    const w = DOOR_W + (window.innerWidth - DOOR_W) * p;
    return (w / 2) * (1 - smooth(0.6, 1, p));
  }
  function doorClip(p) {
    const vw = window.innerWidth, vh = window.innerHeight;
    const t = ((vh - DOOR_H) / 2) * (1 - p);
    const l = ((vw - DOOR_W) / 2) * (1 - p);
    const r = doorRadius(p);
    return `inset(${t.toFixed(1)}px ${l.toFixed(1)}px ${t.toFixed(1)}px ${l.toFixed(1)}px round ${r.toFixed(1)}px ${r.toFixed(1)}px 0px 0px)`;
  }

  function finishIntro(resolve) {
    doc.classList.remove('is-loading');
    doc.classList.add('is-ready');
    lenis && lenis.start();
    resolve();
  }

  function runIntro() {
    return new Promise((resolve) => {
      const reduced = reducedQuery.matches;
      if (!hasGsap() || reduced) {
        if (hasGsap()) gsap.set('#nav', { clearProps: 'all' });
        return finishIntro(resolve);
      }

      const refs = prepareHero();
      const loader = $('#loader');
      const door = $('.loader__door', loader);
      const draw = $$('.loader__draw path', loader);
      const countWrap = $('.loader__count', loader);
      const countEl = $('#loaderCount');
      const nameSplit = SplitText.create($('.loader__name', loader), { type: 'chars', aria: 'none' });
      gsap.set(nameSplit.chars, { yPercent: 120 });
      lenis && lenis.stop();

      const counter = { v: 0 };
      const open = { p: 0 };
      const applyOpen = () => {
        const p = open.p;
        gsap.set(refs.hero, { clipPath: doorClip(p) });
        const vw = window.innerWidth, vh = window.innerHeight;
        door.style.width = `${DOOR_W + (vw - DOOR_W) * p}px`;
        door.style.height = `${DOOR_H + (vh - DOOR_H) * p}px`;
        const r = doorRadius(p);
        door.style.borderRadius = `${r}px ${r}px 0 0`;
        door.style.opacity = String(p > 0.82 ? Math.max(0, 1 - (p - 0.82) / 0.14) : 1);
      };

      const tl = gsap.timeline({ onComplete: () => {
        gsap.set(refs.hero, { clearProps: 'clipPath' });
        gsap.set(['.hero__mirrors .arch', '.hero__outline', '.hero__lead', '.hero__actions .btn', '.hero__meta', '.hero__scroll'], { clearProps: 'opacity,transform' });
        loader.style.display = 'none';
        finishIntro(resolve);
        ScrollTrigger.refresh();
      } });

      tl.to(draw, { strokeDashoffset: 0, duration: 0.95, ease: 'power2.inOut', stagger: 0.12 }, 0.05)
        .to(counter, { v: 100, duration: 1.25, ease: 'power1.inOut', onUpdate: () => { countEl.textContent = String(Math.round(counter.v)); } }, 0.05)
        .to(nameSplit.chars, { yPercent: 0, duration: 0.8, ease: 'power4.out', stagger: 0.025 }, 0.3)
        .addLabel('open', 1.55)
        .set(door, { opacity: 1 }, 'open')
        .set(draw, { opacity: 0 }, 'open')
        .set(loader, { backgroundColor: 'transparent' }, 'open')
        .to([loader.querySelector('.loader__name'), countWrap], { opacity: 0, duration: 0.3, ease: 'power2.out' }, 'open')
        .to(open, { p: 1, duration: 1.3, ease: 'expo.inOut', onUpdate: applyOpen }, 'open+=0.05')
        // Montage du hero pendant l'ouverture
        .to(refs.arches, { yPercent: 0, opacity: 1, duration: 1.7, ease: 'expo.out', stagger: 0.13 }, 'open+=0.5')
        .to(refs.split.chars, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: 0.04 }, 'open+=0.75')
        .to('.hero__outline', { opacity: (i, el) => parseFloat(el.dataset.o || 1), duration: 1.4, ease: 'power2.out' }, 'open+=0.8')
        .to(refs.lead, { y: 0, opacity: 1, duration: 1, ease: 'expo.out', stagger: 0.1 }, 'open+=1.15')
        .to('.hero__scroll', { opacity: 1, duration: 1 }, 'open+=1.6')
        .to('#nav', { yPercent: 0, duration: 1.1, ease: 'expo.out' }, 'open+=1.35');
    });
  }

  /* ------------------------------------------------------------------------
     8. Animations au défilement (ScrollTrigger)
     ------------------------------------------------------------------------ */
  function setupScroll() {
    const mm = gsap.matchMedia();

    mm.add({
      desktop: '(min-width: 901px) and (prefers-reduced-motion: no-preference)',
      mobile: '(max-width: 900px) and (prefers-reduced-motion: no-preference)',
      reduce: '(prefers-reduced-motion: reduce)'
    }, (ctx) => {
      const { desktop, mobile, reduce } = ctx.conditions;

      /* ---------- Toujours : barre de progression, menu qui se cache, bouton flottant ---------- */
      gsap.to('.progress i', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.2 } });

      const nav = $('#nav');
      let navHidden = false;
      ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate: (self) => {
          const y = self.scroll();
          nav.classList.toggle('is-solid', y > 40);
          if (menuOpen) return;
          const shouldHide = self.direction === 1 && y > 320;
          const shouldShow = self.direction === -1 || y <= 320;
          if (shouldHide && !navHidden) { navHidden = true; gsap.to(nav, { yPercent: -110, duration: 0.6, ease: 'power3.out', overwrite: true }); }
          else if (shouldShow && navHidden) { navHidden = false; gsap.to(nav, { yPercent: 0, duration: 0.6, ease: 'power3.out', overwrite: true }); }
        }
      });
      ScrollTrigger.create({
        trigger: '#accueil', start: 'bottom 30%',
        onEnter: () => $('#fab').classList.add('is-visible'),
        onLeaveBack: () => $('#fab').classList.remove('is-visible')
      });

      if (reduce) return; // version apaisée : contenu statique

      /* ---------- Hero : parallax multicouche ---------- */
      const hero = $('.hero');
      const H = () => hero.offsetHeight;
      const heroTl = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      $$('.hero__bg [data-layer], .hero__outline--fore', hero).forEach((el) => {
        heroTl.to(el, { y: () => H() * parseFloat(el.dataset.layer), ease: 'none' }, 0);
      });
      $$('.hero__mirrors .arch', hero).forEach((el) => {
        const k = desktop ? parseFloat(el.dataset.rise) : parseFloat(el.dataset.rise) * 0.5;
        heroTl.to(el, { y: () => -H() * k, ease: 'none' }, 0);
      });
      heroTl.to('.hero__copy', { y: () => H() * (desktop ? 0.2 : 0.08), opacity: 0.0, ease: 'none' }, 0);

      // Souris : les miroirs et les arches de fond se déplacent à des vitesses différentes
      if (desktop && finePointer) {
        const movers = $$('.hero__mirrors .arch, .hero__outline, .hero__tiles', hero).map((el) => ({
          q: gsap.quickTo(el, 'x', { duration: 1.4, ease: 'power3.out' }),
          depth: parseFloat(el.dataset.depth || el.dataset.layer || 0.3)
        }));
        hero.addEventListener('pointermove', (e) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          movers.forEach((m) => m.q(nx * -46 * m.depth));
        });
      }

      /* ---------- Images : léger déplacement dans leur cadre ---------- */
      const skip = desktop ? ':not(.card__fig .media):not(.step .media)' : ':not(.card__fig .media)';
      $$(`.media[data-parallax]${skip}`).forEach((el) => {
        const amp = Math.min(parseFloat(el.dataset.parallax) || 6, 8);
        const trigger = el.closest('.arch__clip, .manifesto__reveal, .shot__clip') || el.parentElement;
        gsap.fromTo(el, { yPercent: -amp }, { yPercent: amp, ease: 'none', scrollTrigger: { trigger, start: 'top bottom', end: 'bottom top', scrub: true } });
      });

      /* ---------- Marquee : vitesse et sens suivent le scroll ---------- */
      const track = $('.marquee__track');
      const marqueeTween = gsap.to(track, { xPercent: -50, ease: 'none', duration: 34, repeat: -1 });
      marqueeTween.totalTime(marqueeTween.duration() * 100); // la lecture à l'envers ne bute jamais sur 0
      let dir = 1, boost = 0, skewTarget = 0;
      const setSkew = gsap.quickSetter('.marquee__skew .marquee__track', 'skewX', 'deg');
      let skew = 0;
      ScrollTrigger.create({
        trigger: '.marquee', start: 'top bottom', end: 'bottom top',
        onUpdate: (self) => {
          dir = self.direction || dir;
          const v = self.getVelocity();
          boost = Math.min(Math.abs(v) / 180, 9);
          skewTarget = clamp(-v / 260, -7, 7);
        }
      });
      const tick = () => {
        boost *= 0.93; skewTarget *= 0.9;
        marqueeTween.timeScale(gsap.utils.interpolate(marqueeTween.timeScale(), dir * (1 + boost), 0.1));
        skew += (skewTarget - skew) * 0.12; setSkew(skew);
      };
      gsap.ticker.add(tick);

      /* ---------- Manifeste : mots qui s'allument, carte révélée par un cercle ---------- */
      SplitText.create('.manifesto__text', {
        type: 'words', wordDelimiter: ' ', autoSplit: true,
        onSplit: (self) => gsap.fromTo(self.words, { opacity: 0.14 }, {
          opacity: 1, ease: 'none', stagger: 0.12,
          scrollTrigger: { trigger: '.manifesto__text', start: 'top 82%', end: 'bottom 50%', scrub: true }
        })
      });
      gsap.fromTo('.manifesto__reveal', { clipPath: 'circle(0% at 28% 62%)' }, {
        clipPath: 'circle(150% at 28% 62%)', duration: 2.2, ease: 'expo.out',
        scrollTrigger: { trigger: '.manifesto__card', start: 'top 82%' }, onComplete: () => gsap.set('.manifesto__reveal', { clearProps: 'clipPath' })
      });
      gsap.from('.manifesto__card figcaption', { opacity: 0, y: 14, duration: 1, delay: 0.6, ease: 'power3.out', scrollTrigger: { trigger: '.manifesto__card', start: 'top 70%' } });

      /* ---------- Rituel : section épinglée, quatre temps ---------- */
      if (desktop) {
        const steps = $$('.step');
        const n = steps.length;
        const parts = steps.map((s) => ({
          fig: $('.step__fig', s), clip: $('.arch__clip', s), media: $('.media', s), txt: $$('.step__num, h3, p', s)
        }));
        parts.forEach((p, i) => {
          if (i === 0) return;
          gsap.set(p.fig, { autoAlpha: 0, yPercent: 7 });
          gsap.set(p.clip, { clipPath: 'inset(100% 0% 0% 0%)' });
          gsap.set(p.txt, { autoAlpha: 0, y: 56 });
        });
        const dots = $$('.story__rail li');
        const tl = gsap.timeline({
          defaults: { ease: 'power2.out' },
          scrollTrigger: {
            trigger: '.story', start: 'top top', end: () => `+=${Math.round(window.innerHeight * n * 0.95)}`,
            pin: '.story__pin', scrub: 0.7, anticipatePin: 1, invalidateOnRefresh: true,
            onUpdate: (self) => {
              const idx = clamp(Math.floor(self.progress * n + 0.2), 0, n - 1);
              dots.forEach((d, k) => d.classList.toggle('is-on', k === idx));
            }
          }
        });
        parts.forEach((p, i) => {
          tl.fromTo(p.media, { yPercent: 6 }, { yPercent: -6, duration: 1, ease: 'none' }, Math.max(0, i - 0.45));
          if (i === 0) return;
          const t = i - 0.5;
          const prev = parts[i - 1];
          tl.to(prev.txt, { autoAlpha: 0, y: -48, duration: 0.3, stagger: 0.03 }, t)
            .to(prev.fig, { autoAlpha: 0, yPercent: -5, duration: 0.45 }, t + 0.25)
            .to(p.fig, { autoAlpha: 1, yPercent: 0, duration: 0.3 }, t + 0.12)
            .to(p.clip, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.55, ease: 'power3.inOut' }, t + 0.12)
            .to(p.txt, { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.07 }, t + 0.32);
        });
        tl.to({}, { duration: 0.05 }, n - 0.05);
      } else {
        $$('.step').forEach((s) => {
          gsap.from($$('.step__num, h3, p', s), { y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: s, start: 'top 80%' } });
          gsap.fromTo($('.arch__clip', s), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: s, start: 'top 82%' } });
        });
      }
      SplitText.create('.story__title', { type: 'lines', mask: 'lines', autoSplit: true, onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.story', start: 'top 60%' } }) });

      /* ---------- Prestations : défilement horizontal piloté par le scroll vertical ---------- */
      SplitText.create('.panel--intro h2', { type: 'lines', mask: 'lines', autoSplit: true, onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.services', start: 'top 55%' } }) });
      if (desktop) {
        const sTrack = $('.services__track');
        const dist = () => Math.max(0, sTrack.scrollWidth - document.documentElement.clientWidth);
        const hTween = gsap.to(sTrack, {
          x: () => -dist(), ease: 'none',
          scrollTrigger: { trigger: '.services', start: 'top top', end: () => `+=${dist()}`, pin: '.services__pin', scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true }
        });
        $$('.panel--card').forEach((panel) => {
          gsap.from(panel, { yPercent: 14, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: panel, containerAnimation: hTween, start: 'left 96%', toggleActions: 'play none none reverse' } });
          gsap.fromTo($('.card__fig', panel), { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.out', scrollTrigger: { trigger: panel, containerAnimation: hTween, start: 'left 90%', toggleActions: 'play none none reverse' } });
          const media = $('.media', panel);
          gsap.fromTo(media, { xPercent: 7 }, { xPercent: -7, ease: 'none', scrollTrigger: { trigger: panel, containerAnimation: hTween, start: 'left right', end: 'right left', scrub: true } });
        });
        gsap.from('.panel--end > *', { y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.panel--end', containerAnimation: hTween, start: 'left 90%', toggleActions: 'play none none reverse' } });
      } else {
        $$('.panel--card').forEach((panel) => {
          gsap.from(panel, { y: 40, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.services', start: 'top 70%' } });
        });
      }

      /* ---------- Chiffres : carreaux qui se retournent + compteurs ---------- */
      $$('.tile').forEach((tile) => {
        const inner = $('.tile__in', tile);
        gsap.set(inner, { rotationX: -88, autoAlpha: 0 });
      });
      ScrollTrigger.create({
        trigger: '.wall', start: 'top 80%', once: true,
        onEnter: () => {
          $$('.tile').forEach((tile, i) => {
            const inner = $('.tile__in', tile);
            const el = $('[data-count]', tile);
            const end = Number(el.dataset.count);
            const suffix = el.dataset.suffix || '';
            const o = { v: 0 };
            el.textContent = `0${suffix}`;
            gsap.to(inner, { rotationX: 0, autoAlpha: 1, duration: 1.3, ease: 'expo.out', delay: i * 0.14 });
            gsap.to(o, { v: end, duration: 2.1, ease: 'power3.out', delay: i * 0.14 + 0.15, onUpdate: () => { el.textContent = `${Math.round(o.v)}${suffix}`; }, onComplete: () => { el.textContent = `${end}${suffix}`; } });
          });
        }
      });
      SplitText.create('.facts__title', { type: 'lines', mask: 'lines', autoSplit: true, onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.facts__title', start: 'top 85%' } }) });

      /* ---------- Galerie : rideaux, dérive de colonnes ---------- */
      SplitText.create('.gallery__title', { type: 'lines', mask: 'lines', autoSplit: true, onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1.4, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.gallery__title', start: 'top 85%' } }) });
      $$('.shot').forEach((shot) => {
        gsap.fromTo($('.shot__reveal', shot), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: shot, start: 'top 88%' } });
        gsap.from($('figcaption', shot), { opacity: 0, duration: 1, delay: 0.5, scrollTrigger: { trigger: shot, start: 'top 85%' } });
        if (desktop) {
          const d = parseFloat(shot.dataset.drift || 0) * 0.8;
          gsap.fromTo(shot, { y: d }, { y: -d, ease: 'none', scrollTrigger: { trigger: shot, start: 'top bottom', end: 'bottom top', scrub: true } });
        }
      });

      /* ---------- Avis ---------- */
      SplitText.create('.reviews__head h2', { type: 'lines', mask: 'lines', autoSplit: true, onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.reviews__head', start: 'top 82%' } }) });
      gsap.from('.reviews__head p, .carousel__ui', { opacity: 0, y: 24, duration: 1, ease: 'power3.out', stagger: 0.12, scrollTrigger: { trigger: '.reviews__head', start: 'top 80%' } });
      gsap.from('.carousel__viewport', { y: 80, opacity: 0, duration: 1.5, ease: 'expo.out', scrollTrigger: { trigger: '.carousel', start: 'top 86%' } });

      /* ---------- Appel à l'action ---------- */
      gsap.fromTo('.cta__arch', { scale: 0.45 }, { scale: 1.1, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true } });
      SplitText.create('.cta__line', { type: 'lines,chars', mask: 'lines', autoSplit: true, onSplit: (self) => gsap.from(self.chars, { yPercent: 115, duration: 1.3, ease: 'expo.out', stagger: 0.035, scrollTrigger: { trigger: '.cta__title', start: 'top 82%' } }) });
      gsap.from('.cta__sub, .cta__row > *', { y: 36, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.cta__sub', start: 'top 88%' } });
      const ring = gsap.to('.badge__ring', { rotation: 360, duration: 16, ease: 'none', repeat: -1 });
      ScrollTrigger.create({ trigger: '.cta', start: 'top bottom', end: 'bottom top', onUpdate: (self) => { ring.timeScale(1 + clamp(Math.abs(self.getVelocity()) / 220, 0, 8) * (self.direction || 1)); gsap.to(ring, { timeScale: 1, duration: 1.4, ease: 'power2.out', overwrite: true }); } });

      /* ---------- Nous trouver ---------- */
      gsap.from('.find__info h2, .find__addr, .find .status, .find__actions', { y: 36, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.find', start: 'top 72%' } });
      gsap.from('.hours li', { x: -26, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.07, scrollTrigger: { trigger: '.hours', start: 'top 85%' } });
      gsap.fromTo('.find__clip', { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.7, ease: 'expo.out', scrollTrigger: { trigger: '.find__map', start: 'top 80%' } });

      /* ---------- Pied de page : le grand nom se lève ---------- */
      SplitText.create('.footer__giant', { type: 'lines,chars', mask: 'lines', autoSplit: true, onSplit: (self) => gsap.from(self.chars, { yPercent: 118, duration: 1.5, ease: 'expo.out', stagger: 0.04, scrollTrigger: { trigger: '.footer__giant', start: 'top 92%' } }) });
      gsap.from('.footer__top > div', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.footer__top', start: 'top 88%' } });

      /* ---------- Séparateurs : arcades qui se lèvent ---------- */
      $$('.edge').forEach((edge) => {
        gsap.fromTo(edge, { yPercent: 70 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: edge, start: 'top bottom', end: 'top 55%', scrub: true } });
      });

      return () => gsap.ticker.remove(tick);
    });

    return mm;
  }

  /* ------------------------------------------------------------------------
     Démarrage
     ------------------------------------------------------------------------ */
  function boot() {
    const yearEl = $('#year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
    updateStatus();
    setInterval(updateStatus, 30000);
    initMenu();
    initAnchors();

    if (!hasGsap()) { doc.classList.remove('is-loading'); doc.classList.add('is-ready'); return; }

    gsap.registerPlugin(ScrollTrigger, SplitText);
    ScrollTrigger.config({ ignoreMobileResize: true });

    const start = async () => {
      try {
        initLenis();
        const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
        const heroImg = $('.hero__mirrors .arch--c img');
        const imgReady = heroImg && heroImg.decode ? heroImg.decode().catch(() => {}) : Promise.resolve();
        await Promise.race([Promise.all([fontsReady, imgReady]), new Promise((r) => setTimeout(r, 2800))]);

        setupScroll();
        initMagnetic();
        initTilt();
        initCarousel();
        await runIntro();
        window.__ready = true;
        window.addEventListener('load', () => ScrollTrigger.refresh());
        document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
      } catch (err) {
        console.error('[La Maison Marann] animations désactivées :', err);
        doc.classList.remove('is-loading');
        doc.classList.add('is-ready');
      }
    };
    start();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
