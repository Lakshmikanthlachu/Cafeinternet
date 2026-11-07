/* ==========================================================================
   Byteport — Cyber Cafe & Internet Center · main.js
   Vanilla JS (+ optional Lenis for smooth scrolling). Every feature is opt-in
   through data-attributes, so removing a section of HTML never breaks the rest.
   ========================================================================== */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer:fine)').matches && !reduce;
  const isRTL = () => root.getAttribute('dir') === 'rtl';
  const store = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const money = n => '$' + n.toFixed(2);
  const params = new URLSearchParams(location.search);
  const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- smooth scrolling (Lenis) ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    root.style.scrollBehavior = 'auto';
    lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true, syncTouch: false, anchors: { offset: -96 } });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const scrollToEl = (el, offset = -96) => {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset });
    else window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + offset, behavior: reduce ? 'auto' : 'smooth' });
  };

  /* ---------- toast + success popup (readable in light AND dark mode) ---------- */
  const toastHost = document.createElement('div');
  toastHost.className = 'pointer-events-none fixed inset-x-0 bottom-20 z-[80] flex justify-center px-4';
  toastHost.setAttribute('aria-live', 'polite');
  toastHost.innerHTML = '<div class="flex translate-y-4 items-center gap-2 rounded-xl border border-ink-900/10 bg-white px-4 py-3 text-sm font-semibold text-ink-900 opacity-0 shadow-2xl transition duration-300 dark:border-signal-400/40 dark:bg-ink-900 dark:text-white" data-toast-el></div>';
  document.body.appendChild(toastHost);
  let toastT;
  const toast = msg => {
    const t = $('[data-toast-el]', toastHost);
    t.innerHTML = '<span class="h-2 w-2 shrink-0 rounded-full bg-signal-500 shadow-[0_0_10px_#2ee6d6]"></span>' + esc(msg);
    t.classList.remove('opacity-0', 'translate-y-4');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.add('opacity-0', 'translate-y-4'), 2800);
  };
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[90] hidden items-center justify-center p-4';
  modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-labelledby', 'bp-modal-title');
  modal.innerHTML = `<div class="absolute inset-0 bg-ink-950/70 opacity-0 transition duration-300" data-modal-bg></div>
    <div class="relative w-full max-w-md translate-y-6 scale-95 rounded-3xl border border-ink-900/10 bg-white p-8 text-center text-ink-900 opacity-0 shadow-2xl transition duration-300 dark:border-white/10 dark:bg-ink-900 dark:text-white" data-modal-card>
      <span class="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-signal-400 text-ink-950 shadow-neon"><svg class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
      <h2 id="bp-modal-title" class="mt-6 font-display text-2xl font-bold" data-modal-title>Done!</h2>
      <p class="mt-3 text-sm leading-relaxed text-ink-600 dark:text-ink-300" data-modal-text></p>
      <button type="button" class="btn-primary mt-7 w-full" data-modal-close>Got it</button>
    </div>`;
  document.body.appendChild(modal);
  let lastFocus = null;
  const focusables = el => $$('a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])', el).filter(x => x.offsetParent !== null || x === document.activeElement);
  // keep Tab / Shift+Tab inside an open dialog or menu
  const trap = (el, e) => { const f = focusables(el); if (!f.length) return; const first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } else if (!el.contains(document.activeElement)) { e.preventDefault(); first.focus(); } };
  modal.addEventListener('keydown', e => { if (e.key === 'Tab') trap($('[data-modal-card]', modal), e); });
  const openModal = (title, text) => {
    lastFocus = document.activeElement;
    $('[data-modal-title]', modal).textContent = title; $('[data-modal-text]', modal).textContent = text;
    modal.classList.remove('hidden'); modal.classList.add('flex');
    requestAnimationFrame(() => { $('[data-modal-bg]', modal).classList.remove('opacity-0'); $('[data-modal-card]', modal).classList.remove('opacity-0', 'translate-y-6', 'scale-95'); });
    $('[data-modal-close]', modal).focus();
    lenis && lenis.stop();
  };
  const closeModal = () => {
    $('[data-modal-bg]', modal).classList.add('opacity-0'); $('[data-modal-card]', modal).classList.add('opacity-0', 'translate-y-6', 'scale-95');
    setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 250);
    lenis && lenis.start(); lastFocus && lastFocus.focus();
  };
  modal.addEventListener('click', e => { if (e.target.matches('[data-modal-bg],[data-modal-close]')) closeModal(); });

  /* ---------- theme & direction ---------- */
  const syncDirLabel = () => $$('[data-dir-toggle]').forEach(b => { b.setAttribute('aria-pressed', isRTL()); b.setAttribute('aria-label', isRTL() ? 'Switch to left-to-right layout' : 'Switch to right-to-left layout'); b.title = b.getAttribute('aria-label'); });
  syncDirLabel();
  $$('[data-theme-toggle]').forEach(b => b.addEventListener('click', () => {
    const dark = root.classList.toggle('dark'); store.set('bp-theme', dark ? 'dark' : 'light');
    toast(dark ? 'Dark mode on' : 'Light mode on');
  }));
  $$('[data-dir-toggle]').forEach(b => b.addEventListener('click', () => {
    const rtl = !isRTL(); root.setAttribute('dir', rtl ? 'rtl' : 'ltr'); store.set('bp-dir', rtl ? 'rtl' : 'ltr'); syncDirLabel(); toast(rtl ? 'Right-to-left layout' : 'Left-to-right layout');
    window.dispatchEvent(new Event('resize'));
  }));

  /* ---------- desktop dropdowns: hover AND click/tap/keyboard ---------- */
  $$('[data-dd]').forEach(btn => {
    const wrap = btn.parentElement;
    btn.addEventListener('click', e => {
      e.stopPropagation(); wrap.classList.remove('dd-suppress');
      const open = !wrap.classList.contains('is-open');
      $$('.has-dd.is-open').forEach(w => { w.classList.remove('is-open'); $('[data-dd]', w).setAttribute('aria-expanded', 'false'); });
      wrap.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', open);
    });
  });
  const closeDropdowns = () => $$('.has-dd.is-open').forEach(w => { w.classList.remove('is-open'); $('[data-dd]', w).setAttribute('aria-expanded', 'false'); });
  document.addEventListener('click', closeDropdowns);
  $$('.has-dd').forEach(wrap => wrap.addEventListener('keydown', e => {
    const links = $$('.dd-link', wrap), i = links.indexOf(document.activeElement), btn = $('[data-dd]', wrap);
    if (e.key === 'Escape') { e.stopPropagation(); closeDropdowns(); wrap.classList.add('dd-suppress'); btn.focus(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (!wrap.classList.contains('is-open')) btn.click(); (links[i + 1] || links[0]).focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); (links[i - 1] || links[links.length - 1]).focus(); }
  }));
  // closing with Escape also hides hover/focus-within menus until the pointer leaves
  $$('.has-dd').forEach(w => { w.addEventListener('pointerleave', () => w.classList.remove('dd-suppress')); w.addEventListener('focusout', e => { if (!w.contains(e.relatedTarget)) w.classList.remove('dd-suppress'); }); });

  /* ---------- mobile menu (overlay, never pushes content) ---------- */
  const menu = $('[data-menu]'), mBtn = $('[data-menu-toggle]');
  const setMenu = open => {
    if (!menu) return;
    menu.classList.toggle('hidden', !open); mBtn.setAttribute('aria-expanded', open);
    mBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    $('[data-menu-open]', mBtn).classList.toggle('hidden', open); $('[data-menu-close]', mBtn).classList.toggle('hidden', !open);
  };
  mBtn && mBtn.addEventListener('click', e => { e.stopPropagation(); const o = menu.classList.contains('hidden'); setMenu(o); if (o) { const f = focusables(menu)[0]; f && f.focus(); } });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (!modal.classList.contains('hidden')) { closeModal(); return; }
      if (menu && !menu.classList.contains('hidden')) { setMenu(false); mBtn.focus(); return; }
      $$('.cselect.is-open').forEach(c => c._close && c._close(true));
      closeDropdowns();
    }
    // Tab stays inside the open mobile menu (menu button included so it can be closed)
    if (e.key === 'Tab' && menu && !menu.classList.contains('hidden')) {
      const f = [mBtn, ...focusables(menu)], first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!f.includes(document.activeElement)) { e.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener('click', e => { if (menu && !menu.classList.contains('hidden') && !e.target.closest('[data-header]')) setMenu(false); });
  window.addEventListener('resize', () => { if (window.innerWidth >= 1280) setMenu(false); });

  /* ---------- session meter (back to top) ---------- */
  const sess = $('[data-session]');
  if (sess) {
    const start = Date.now(), tEl = $('[data-session-time]'), cEl = $('[data-session-cost]');
    const tick = () => {
      const s = Math.floor((Date.now() - start) / 1000);
      tEl.textContent = [s / 3600, (s % 3600) / 60, s % 60].map(v => String(Math.floor(v)).padStart(2, '0')).join(':');
      cEl.textContent = money((s / 3600) * 1.5);
    };
    tick(); setInterval(tick, 1000);
    sess.addEventListener('click', () => lenis ? lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
  }

  /* ---------- live free-station counter + open status ---------- */
  let free = 18;
  setInterval(() => { free = Math.max(6, Math.min(28, free + (Math.random() > .5 ? 1 : -1))); $$('[data-free-count]').forEach(e => (e.textContent = free)); }, 6000);
  const h = new Date().getHours(), open = h >= 8 || h < 2;
  $$('[data-open-status]').forEach(e => { e.innerHTML = `<span class="me-1.5 inline-block h-2 w-2 rounded-full ${open ? 'bg-lime-500' : 'bg-pulse-500'}"></span>${open ? 'Open now' : 'Closed · opens 8 AM'}`; e.classList.add(open ? 'text-lime-700' : 'text-pulse-600'); e.classList.add(open ? 'dark:text-lime-400' : 'dark:text-pulse-300'); });
  $$('[data-year]').forEach(e => (e.textContent = new Date().getFullYear()));

  /* ---------- reveal on scroll ---------- */
  const proxy = new Map();
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    if (e.target.hasAttribute('data-reveal')) e.target.classList.add('is-in');
    (proxy.get(e.target) || []).forEach(t => t.classList.add('is-in'));
    io.unobserve(e.target);
  }), { threshold: .08, rootMargin: '0px 0px -40px 0px' });
  $$('[data-reveal]').forEach(el => {
    if (reduce) return el.classList.add('is-in');
    // clip-path reveals (boot / wipe) start with ~zero visible area, so watch the parent instead
    const clip = /^(boot|wipe)$/.test(el.dataset.reveal), t = clip ? el.parentElement : el;
    if (clip) proxy.set(t, [...(proxy.get(t) || []), el]);
    io.observe(t);
  });

  /* ---------- count up ---------- */
  const countIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; countIO.unobserve(e.target);
    const el = e.target, end = parseFloat(el.dataset.count), dec = +(el.dataset.decimals || 0), suf = el.dataset.suffix || '';
    if (reduce) { el.textContent = end.toFixed(dec) + suf; return; }
    const t0 = performance.now(), dur = 1600;
    const step = t => { const p = Math.min(1, (t - t0) / dur), v = end * (1 - Math.pow(1 - p, 3)); el.textContent = v.toFixed(dec) + suf; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), { threshold: .5 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ---------- typewriter terminal ---------- */
  $$('[data-typer]').forEach(box => {
    const lines = JSON.parse(box.dataset.typer); let li = 0;
    if (reduce) { box.innerHTML = lines.map(l => `<p>${esc(l)}</p>`).join(''); return; }
    const next = () => {
      if (li >= lines.length) { setTimeout(() => { box.innerHTML = ''; li = 0; next(); }, 4000); return; }
      const p = document.createElement('p'); box.appendChild(p); let ci = 0; const txt = lines[li++];
      const type = () => { p.innerHTML = esc(txt.slice(0, ++ci)) + '<span class="ms-0.5 inline-block h-3 w-1.5 translate-y-0.5 animate-blink bg-signal-300"></span>'; if (ci < txt.length) setTimeout(type, 22); else { p.textContent = txt; setTimeout(next, 280); } };
      type();
    };
    next();
  });

  /* ---------- pinned horizontal scrollers ----------
     The section is made exactly tall enough that scrolling it moves the track from its
     first card to its last; then the sticky element releases and the page carries on. */
  const pins = $$('[data-pin]').map(sec => ({ sec, sticky: $('[data-pin-sticky]', sec), track: $('[data-pin-track]', sec), num: $('[data-pin-num]', sec), bar: $('[data-pin-bar]', sec), dist: 0, x: 0 }));
  const sizePins = () => {
    pins.forEach(p => {
      p.dist = window.innerHeight <= 520 ? 0 : Math.max(0, p.track.scrollWidth - window.innerWidth);
      p.sec.style.height = (p.sticky.offsetHeight + p.dist) + 'px';
    });
    sizeParallax();
  };
  // how far each parallax photo can move before an edge would show (half of its extra size)
  function sizeParallax() {
    $$('[data-parallax],[data-depth]').forEach(el => {
      const keep = el.style.translate; el.style.translate = 'none';
      const a = el.getBoundingClientRect(), b = el.parentElement.getBoundingClientRect();
      el._room = Math.max(0, (a.height - b.height) / 2 - 1); el._roomX = Math.max(0, (a.width - b.width) / 2 - 1);
      el.style.translate = keep;
    });
  }

  /* ---------- scroll-driven effects (parallax, depth, scrubbing, pins) ---------- */
  const par = $$('[data-parallax]'), scrubW = $$('[data-scrub-width]'), scrubs = $$('[data-scrub]');
  const depthEls = $$('[data-depth]');
  const prog = $('[data-progress]'), bar = $('[data-header-bar]');
  let mx = 0, my = 0, ticking = false;
  if (fine && depthEls.length) window.addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; frame(); }, { passive: true });
  function frame() { if (!ticking) { ticking = true; requestAnimationFrame(render); } }
  function render() {
    ticking = false;
    const vh = innerHeight, y = scrollY, max = document.documentElement.scrollHeight - vh;
    bar && bar.classList.toggle('shadow-lg', y > 10);
    if (prog) prog.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    // pinned scrollers run even with reduced motion (they are navigation, not decoration)
    pins.forEach(p => {
      const r = p.sec.getBoundingClientRect(), total = p.sec.offsetHeight - p.sticky.offsetHeight;
      if (!p.dist) { p.track.style.transform = ''; return; }
      const prog = total > 0 ? Math.min(1, Math.max(0, (72 - r.top) / total)) : 0;
      p.track.style.transform = `translate3d(${(-prog * p.dist).toFixed(1)}px,0,0)`;
      const n = p.track.children.length;
      if (p.num) p.num.textContent = String(Math.min(n, 1 + Math.round(prog * (n - 1)))).padStart(2, '0');
      if (p.bar) p.bar.style.width = (prog * 100).toFixed(1) + '%';
    });
    if (reduce) return;
    // individual `translate` property: never fights with hover/tilt transforms or CSS transitions
    par.forEach(el => {
      const r = el.parentElement.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return;
      // p = 0 when the frame is centred in the viewport; the shift is clamped to the photo's spare
      // margin so it never slides off-centre far enough to show an edge, and settles centred.
      const p = (r.top + r.height / 2 - vh / 2) / vh;
      const room = el._room || 0, roomX = el._roomX || 0, k = parseFloat(el.dataset.parallax) * 6;
      const d = el.dataset.depth ? parseFloat(el.dataset.depth) : 0;
      const ty = Math.max(-room, Math.min(room, -p * room * k - my * d));
      const tx = Math.max(-roomX, Math.min(roomX, -mx * d));
      el.style.translate = `${tx.toFixed(1)}px ${ty.toFixed(1)}px`;
    });
    depthEls.forEach(el => { if (el.dataset.parallax) return; const d = parseFloat(el.dataset.depth), rx = el._roomX || 0, ry = el._room || 0; el.style.translate = `${Math.max(-rx, Math.min(rx, -mx * d)).toFixed(1)}px ${Math.max(-ry, Math.min(ry, -my * d)).toFixed(1)}px`; });
    scrubW.forEach(el => { const r = el.parentElement.getBoundingClientRect(); const p = Math.min(1, Math.max(0, (vh * .85 - r.top) / (vh * .5))); el.style.width = p * 100 + '%'; });
    scrubs.forEach(el => { const r = el.getBoundingClientRect(); const p = Math.min(1, Math.max(0, (vh * .6 - r.top) / r.height)); const f = $('[data-scrub-height]', el); if (f) f.style.height = p * 100 + '%'; });
  }
  if (lenis) lenis.on('scroll', frame); else window.addEventListener('scroll', frame, { passive: true });
  window.addEventListener('resize', () => { sizePins(); frame(); });
  window.addEventListener('load', () => { sizePins(); frame(); });
  sizePins(); render();
  // images inside pinned tracks change the track width once loaded
  pins.forEach(p => $$('img', p.track).forEach(i => i.complete || i.addEventListener('load', () => { sizePins(); frame(); }, { once: true })));

  /* ---------- tilt + spotlight + magnetic + float ---------- */
  if (fine) {
    $$('[data-tilt]').forEach(el => {
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; el.style.transform = `perspective(900px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg)`; });
      el.addEventListener('pointerleave', () => (el.style.transform = ''));
    });
    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); el.style.translate = `${((e.clientX - r.left - r.width / 2) * .18).toFixed(1)}px ${((e.clientY - r.top - r.height / 2) * .25).toFixed(1)}px`; });
      el.addEventListener('pointerleave', () => (el.style.translate = ''));
    });
  }
  $$('[data-spot]').forEach(el => el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); el.style.setProperty('--mx', e.clientX - r.left + 'px'); el.style.setProperty('--my', e.clientY - r.top + 'px'); }));
  if (!reduce) $$('[data-float]').forEach(el => el.classList.add('animate-floaty'));

  /* ---------- team cards: tap / Enter to flip on touch screens ---------- */
  $$('[data-flip]').forEach(card => {
    const inner = card.firstElementChild;
    const flip = () => inner.classList.toggle('is-flipped');
    card.addEventListener('click', e => { if (!e.target.closest('a') && !fine) flip(); });
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
  });

  /* ---------- interactive floor map ---------- */
  const floor = $('[data-floor]');
  if (floor) {
    const zones = { std: ['A', 'Standard PC', '$1.50/hr', 'i5 · 24″ · Office, Zoom'], pro: ['B', 'Pro PC', '$2.50/hr', 'i7 · dual 27″ · Adobe CC'], game: ['G', 'Gaming rig', '$3.50/hr', 'RTX 4070 · 240 Hz · headset'] };
    const plan = [...Array(16).fill('std'), ...Array(16).fill('pro'), ...Array(16).fill('game')];
    const tip = $('[data-seat-tip]'), name = $('[data-seat-name]'), spec = $('[data-seat-spec]'), cta = $('[data-seat-cta]');
    const counters = { std: 0, pro: 0, game: 0 }, states = ['free', 'free', 'busy', 'busy', 'free', 'res'];
    const col = { free: 'border border-lime-400/70 bg-lime-400/15 text-lime-300 hover:-translate-y-0.5 hover:bg-lime-400 hover:text-ink-950 hover:shadow-[0_0_18px_#b6ff3b]', busy: 'border border-pulse-400/40 bg-pulse-400/10 text-pulse-300/80 cursor-not-allowed', res: 'border border-volt-400/40 bg-volt-400/10 text-volt-300/80 cursor-not-allowed' };
    floor.innerHTML = plan.map((z, i) => {
      const id = zones[z][0] + String(++counters[z]).padStart(2, '0'), st = states[(i * 7 + 3) % states.length];
      return `<button type="button" class="seat group relative flex aspect-square items-center justify-center rounded-lg font-mono text-[10px] font-bold transition ${col[st]} sm:text-xs" data-z="${z}" data-st="${st}" data-id="${id}" aria-label="${id} ${zones[z][1]} — ${st === 'free' ? 'available' : st === 'busy' ? 'in use' : 'reserved'}" ${st !== 'free' ? 'aria-disabled="true"' : ''}>${id}</button>`;
    }).join('');
    const wrap = floor.parentElement;
    floor.addEventListener('pointerover', e => {
      const s = e.target.closest('.seat'); if (!s || !tip) return; const z = zones[s.dataset.z];
      tip.innerHTML = `<b class="text-white">${s.dataset.id}</b> · ${z[1]}<br>${z[3]}<br><span class="${s.dataset.st === 'free' ? 'text-lime-300' : 'text-pulse-300'}">${s.dataset.st === 'free' ? 'Free · ' + z[2] : s.dataset.st === 'busy' ? 'In use' : 'Reserved'}</span>`;
      const r = s.getBoundingClientRect(), w = wrap.getBoundingClientRect();
      tip.classList.remove('hidden');
      tip.style.left = Math.min(Math.max(8, r.left - w.left + r.width / 2 - tip.offsetWidth / 2), w.width - tip.offsetWidth - 8) + 'px';
      tip.style.top = (r.top - w.top - tip.offsetHeight - 8) + 'px';
    });
    floor.addEventListener('pointerleave', () => tip && tip.classList.add('hidden'));
    floor.addEventListener('click', e => {
      const s = e.target.closest('.seat'); if (!s) return;
      if (s.dataset.st !== 'free') { toast(`${s.dataset.id} is ${s.dataset.st === 'busy' ? 'in use' : 'reserved'} — pick a green one`); return; }
      $$('.seat', floor).forEach(x => x.classList.remove('ring-4', 'ring-signal-400', 'ring-offset-2', 'ring-offset-ink-950'));
      s.classList.add('ring-4', 'ring-signal-400', 'ring-offset-2', 'ring-offset-ink-950');
      const z = zones[s.dataset.z]; name.textContent = `${s.dataset.id} · ${z[1]}`; spec.textContent = `${z[3]} — ${z[2]}`;
      const svc = s.dataset.z === 'game' ? 'Gaming Stations' : 'High-Speed Browsing';
      cta.href = `contact.html?seat=${s.dataset.id}&service=${encodeURIComponent(svc)}#book`; cta.removeAttribute('aria-disabled');
      toast(`${s.dataset.id} selected — tap “Hold this seat”`);
    });
    cta && cta.addEventListener('click', e => { if (cta.getAttribute('aria-disabled') === 'true') { e.preventDefault(); toast('Pick a green station on the map first'); } });
    $$('[data-zone]').forEach(b => b.addEventListener('click', () => {
      $$('[data-zone]').forEach(x => x.setAttribute('aria-pressed', x === b)); const z = b.dataset.zone;
      $$('.seat', floor).forEach(s => { const on = z === 'all' || s.dataset.z === z; s.style.opacity = on ? '' : '.15'; s.tabIndex = on ? 0 : -1; });
    }));
  }

  /* ---------- query-string prefill (contact form, blog) ---------- */
  const setVal = (sel, v) => { const el = $(sel); if (el && v) { if (el.tagName === 'SELECT') { const o = [...el.options].find(o => o.text.toLowerCase() === v.toLowerCase()); if (o) el.value = o.value; } else el.value = v; } };
  setVal('[data-seat-input]', params.get('seat')); setVal('#f-svc', params.get('service')); setVal('#f-msg', params.get('msg'));
  $$('[data-min-today]').forEach(i => { const d = new Date(); i.min = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); if (!i.value) i.value = i.min; });

  /* ---------- custom selects (styled list, keyboard friendly; native <select> keeps the value) ---------- */
  const chev = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  const tick = '<svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
  let csN = 0;
  const enhanceSelect = sel => {
    const id = sel.id || 'cs' + (++csN), wrap = document.createElement('div'), lbl = document.querySelector(`label[for="${id}"]`);
    wrap.className = 'cselect'; sel.parentNode.insertBefore(wrap, sel); wrap.appendChild(sel);
    sel.classList.add('sr-only'); sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'cselect-btn'; btn.id = id + '-btn';
    btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
    const list = document.createElement('ul'); list.className = 'cselect-list'; list.id = id + '-list'; list.setAttribute('role', 'listbox'); list.tabIndex = -1; list.setAttribute('data-lenis-prevent', '');
    if (lbl) { lbl.htmlFor = btn.id; lbl.id = lbl.id || id + '-lbl'; list.setAttribute('aria-labelledby', lbl.id); btn.setAttribute('aria-labelledby', lbl.id + ' ' + btn.id); }
    btn.setAttribute('aria-controls', list.id);
    wrap.append(btn, list);
    let active = -1;
    const opts = () => $$('li', list);
    const render = () => {
      list.innerHTML = [...sel.options].map((o, i) => `<li role="option" id="${id}-o${i}" class="cselect-opt${o.disabled || o.value === '' ? ' hidden' : ''}" data-i="${i}" aria-selected="${o.selected && o.value !== '' }" ${o.disabled ? 'aria-disabled="true"' : ''}><span>${esc(o.text)}</span>${o.selected && o.value !== '' ? tick : ''}</li>`).join('');
      const cur = sel.selectedOptions[0];
      btn.innerHTML = `<span class="truncate ${!cur || cur.value === '' ? 'text-ink-500 dark:text-ink-400' : ''}">${esc(cur ? cur.text : '')}</span>${chev}`;
    };
    const mark = i => { const o = opts(); o.forEach(x => x.classList.remove('is-active')); active = i; if (o[i]) { o[i].classList.add('is-active'); list.setAttribute('aria-activedescendant', o[i].id); o[i].scrollIntoView({ block: 'nearest' }); } };
    const usable = () => opts().filter(o => !o.hasAttribute('aria-disabled') && sel.options[+o.dataset.i].value !== '').map(o => +o.dataset.i);
    const open = () => { $$('.cselect.is-open').forEach(c => c !== wrap && c._close()); render(); wrap.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); list.focus({ preventScroll: true }); mark(sel.selectedIndex > 0 || sel.options[0]?.value !== '' ? sel.selectedIndex : (usable()[0] ?? 0)); };
    const close = (focusBtn = false) => { wrap.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); list.removeAttribute('aria-activedescendant'); if (focusBtn) btn.focus(); };
    const pick = i => { if (i < 0 || sel.options[i].disabled) return; sel.selectedIndex = i; render(); close(true); sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); };
    wrap._close = close; wrap._render = render;
    btn.addEventListener('click', e => { e.stopPropagation(); wrap.classList.contains('is-open') ? close() : open(); });
    btn.addEventListener('keydown', e => { if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); open(); } });
    list.addEventListener('click', e => { e.stopPropagation(); const li = e.target.closest('li'); if (li) pick(+li.dataset.i); });
    list.addEventListener('keydown', e => {
      const u = usable(), pos = u.indexOf(active);
      if (e.key === 'ArrowDown') { e.preventDefault(); mark(u[Math.min(u.length - 1, pos + 1)] ?? u[0]); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); mark(u[Math.max(0, pos - 1)] ?? u[0]); }
      else if (e.key === 'Home') { e.preventDefault(); mark(u[0]); }
      else if (e.key === 'End') { e.preventDefault(); mark(u[u.length - 1]); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(active); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
      else if (e.key === 'Tab') close();
      else if (e.key.length === 1) { const k = e.key.toLowerCase(), hit = u.find(i => sel.options[i].text.toLowerCase().startsWith(k) && i !== active) ?? u.find(i => sel.options[i].text.toLowerCase().startsWith(k)); if (hit !== undefined) mark(hit); }
    });
    list.addEventListener('focusout', e => { if (!wrap.contains(e.relatedTarget)) close(); });
    sel.addEventListener('change', render); sel.form && sel.form.addEventListener('reset', () => setTimeout(render));
    render();
  };
  $$('select.field').forEach(enhanceSelect);
  document.addEventListener('click', () => $$('.cselect.is-open').forEach(c => c._close()));

  /* ---------- form validation: inline messages on every form ---------- */
  const NAME_RE = /^[\p{L}][\p{L}\p{M} .'\-]*$/u;
  const todayStr = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
  const slotMinutes = v => { const [h, m] = v.split(':').map(Number); return (h < 8 ? h + 24 : h) * 60 + m; }; // 00:00–02:00 belong to the same night
  const ruleFor = f => {
    const v = (f.value || '').trim(), lbl = (f.labels && f.labels[0] ? f.labels[0].textContent : f.name || 'This field').replace('*', '').trim();
    if (f.type === 'checkbox') return f.required && !f.checked ? 'Please tick this box to continue.' : '';
    if (f.required && !v) return f.tagName === 'SELECT' ? `Please choose a ${lbl.toLowerCase()}.` : `${lbl} is required.`;
    if (!v) return '';
    if (f.hasAttribute('data-name') && !NAME_RE.test(v)) return 'Use letters only (spaces, hyphens and apostrophes are fine).';
    if (f.hasAttribute('data-name') && v.replace(/[^\p{L}]/gu, '').length < 2) return 'Please enter at least 2 letters.';
    if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Enter a valid email address, e.g. you@email.com.';
    if (f.hasAttribute('data-phone')) { const d = v.replace(/\D/g, ''); if (!/^\+?[\d\s\-()]+$/.test(v)) return 'Numbers only — you may start with +.'; if (d.length < 9) return 'Enter at least 9 digits.'; if (d.length > 15) return 'That number is too long (max 15 digits).'; }
    if (f.hasAttribute('data-future-date') && v < todayStr()) return 'Please choose today or a future date.';
    if (f.hasAttribute('data-time-slot')) { const m = slotMinutes(v); if (m < 8 * 60 || m > 25 * 60 + 30) return 'We are open 8:00 AM – 2:00 AM. Please pick a time in opening hours.'; const date = f.form && f.form.querySelector('[data-future-date]'); if (date && date.value === todayStr()) { const n = new Date(), now = (n.getHours() < 8 ? n.getHours() + 24 : n.getHours()) * 60 + n.getMinutes(); if (m <= now) return 'That time has already passed today — please pick a later slot.'; } }
    if (f.pattern && !new RegExp('^(?:' + f.pattern + ')$').test(v)) return f.dataset.patternMsg || 'Please match the requested format.';
    if (f.minLength > 0 && v.length < f.minLength) return `Please write at least ${f.minLength} characters.`;
    return '';
  };
  const showErr = (f, msg) => {
    const host = f.closest('.cselect') ? f.closest('.cselect').parentElement : f.type === 'checkbox' ? f.closest('label').parentElement : f.parentElement.matches('.relative') && f.parentElement.parentElement.matches('form') ? f.parentElement : f.parentElement;
    let el = host.querySelector(':scope > .field-error');
    const target = f.closest('.cselect') ? $('.cselect-btn', f.closest('.cselect')) : f;
    if (!msg) { el && el.remove(); target.removeAttribute('aria-invalid'); f.removeAttribute('aria-invalid'); return; }
    if (!el) { el = document.createElement('p'); el.className = 'field-error'; el.id = (f.id || f.name) + '-err'; host.appendChild(el); }
    el.innerHTML = '<svg class="mt-px h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg><span>' + esc(msg) + '</span>';
    target.setAttribute('aria-invalid', 'true'); f.setAttribute('aria-invalid', 'true'); target.setAttribute('aria-describedby', el.id);
  };
  const fieldsOf = form => $$('input:not([type=hidden]):not([type=button]):not([type=submit]),select,textarea', form);
  const check = f => { const m = ruleFor(f); showErr(f, m); return !m; };
  const validate = form => { let first = null; fieldsOf(form).forEach(f => { if (!check(f) && !first) first = f; }); if (first) { const t = first.closest('.cselect') ? $('.cselect-btn', first.closest('.cselect')) : first; t.focus({ preventScroll: true }); scrollToEl(t, -160); } return !first; };
  $$('form').forEach(form => {
    form.noValidate = true;
    fieldsOf(form).forEach(f => {
      f.addEventListener('blur', () => { if (f.value || f._touched) check(f); f._touched = true; });
      f.addEventListener('input', () => { if (f.getAttribute('aria-invalid') === 'true' || f.hasAttribute('data-phone')) check(f); });
      f.addEventListener('change', () => check(f));
    });
    // plain GET forms (sidebar search) validate, then submit normally
    if (!form.matches('[data-fake-form],[data-comment-form]')) form.addEventListener('submit', e => { if (!validate(form)) e.preventDefault(); });
  });
  // phone: block letters as they are typed; validate digit count live
  $$('[data-phone]').forEach(inp => {
    inp.addEventListener('beforeinput', e => { if (e.data && /[^\d+\s\-()]/.test(e.data)) { e.preventDefault(); showErr(inp, 'Numbers only — you may start with +.'); } });
    inp.addEventListener('input', () => { const c = inp.value.replace(/[^\d+\s\-()]/g, '').replace(/(?!^)\+/g, ''); if (c !== inp.value) inp.value = c; });
  });
  // booking time slots: hide slots that have already passed when the date is today
  $$('[data-time-slot]').forEach(sel => {
    const date = sel.form && sel.form.querySelector('[data-future-date]');
    const sync = () => {
      const n = new Date(), now = (n.getHours() < 8 ? n.getHours() + 24 : n.getHours()) * 60 + n.getMinutes(), today = date && date.value === todayStr();
      [...sel.options].forEach(o => { o.disabled = !!(o.value && today && slotMinutes(o.value) <= now); });
      if (sel.selectedOptions[0] && sel.selectedOptions[0].disabled) sel.value = '';
      const w = sel.closest('.cselect'); w && w._render && w._render();
    };
    date && date.addEventListener('change', sync); sync();
  });

  /* ---------- session calculator ---------- */
  $$('[data-calc]').forEach(c => {
    const range = $('[data-calc-range]', c), hrs = $('[data-calc-hours]', c), total = $('[data-calc-total]', c), happy = $('[data-calc-happy]', c);
    const upd = () => { const st = $('[data-calc-station]:checked', c); const v = parseFloat(st ? st.value : 1.5) * +range.value * (happy.checked ? .8 : 1); hrs.textContent = range.value; total.textContent = money(v); };
    c.addEventListener('input', upd); c.addEventListener('change', upd); upd();
  });

  /* ---------- print cost calculator ---------- */
  $$('[data-print-calc]').forEach(c => {
    const g = k => $(`[data-pc="${k}"]`, c), send = $('[data-pc-send]', c);
    const upd = () => {
      const pages = Math.max(1, +g('pages').value || 1), copies = Math.max(1, +g('copies').value || 1);
      const ex = $$('[data-pc="extra"]:checked', c).map(x => x.value);
      let v = pages * copies * parseFloat(g('color').value) * +g('size').value;
      if (ex.includes('duplex')) v *= .9; if (ex.includes('staple')) v += .2 * copies; if (ex.includes('bind')) v += 2.5 * copies;
      const sheets = Math.ceil(pages / (ex.includes('duplex') ? 2 : 1)) * copies;
      $('[data-pc-total]', c).textContent = money(v);
      $('[data-pc-sheets]', c).textContent = `${sheets} sheets · ready in ~${Math.max(1, Math.ceil(sheets / 30))} min`;
      if (send) send.href = `contact.html?service=${encodeURIComponent('Printing & Photocopy')}&msg=${encodeURIComponent(`Print job: ${pages} pages × ${copies} copies, ${g('color').selectedOptions[0].text.split(' —')[0]}, ${g('size').selectedOptions[0].text}${ex.length ? ', ' + ex.join(', ') : ''}. Quote ${money(v)}.`)}#book`;
    };
    c.addEventListener('input', upd); c.addEventListener('change', upd); upd();
  });

  /* ---------- filters + search + tags + pagination (services / blog) ---------- */
  $$('[data-filter-group]').forEach(g => {
    const key = g.dataset.filterGroup, target = $(`[data-filter-target="${key}"]`), search = $(`[data-search="${key}"]`);
    const scope = target.parentElement, empty = scope.querySelector('[data-empty]'), clearBtn = scope.querySelector('[data-search-clear]'), activeBox = scope.querySelector('[data-active-filters]');
    const per = +(target.dataset.paginate || 0), pager = $(`[data-pagination="${key}"]`), info = scope.querySelector('[data-page-info]');
    let cat = 'all', tag = '', page = 1;
    const btn = (label, p, opts = {}) => `<button type="button" class="btn-icon disabled:cursor-not-allowed disabled:opacity-40 ${opts.active ? '!border-transparent !bg-ink-950 !text-white dark:!bg-signal-400 dark:!text-ink-950' : ''}" data-page="${p}" ${opts.active ? 'aria-current="page"' : ''} ${opts.disabled ? 'disabled' : ''} aria-label="${opts.label || 'Page ' + p}">${label}</button>`;
    const x = '<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
    const apply = (scroll = false) => {
      const term = search ? search.value.trim().toLowerCase() : '';
      const match = [...target.children].filter(el => (cat === 'all' || el.dataset.cat === cat) && (!tag || (el.dataset.tags || '').split(' ').includes(tag)) && (!term || (el.dataset.title || el.textContent.toLowerCase()).includes(term)));
      const pages = per ? Math.max(1, Math.ceil(match.length / per)) : 1; page = Math.min(page, pages);
      [...target.children].forEach(el => el.classList.add('hidden'));
      match.forEach((el, i) => { const on = !per || (i >= (page - 1) * per && i < page * per); el.classList.toggle('hidden', !on); if (on) el.classList.add('is-in'); });
      empty && empty.classList.toggle('hidden', match.length > 0);
      clearBtn && clearBtn.classList.toggle('hidden', !term);
      if (activeBox) {
        const chips = [];
        if (tag) chips.push(`<button type="button" class="chip !py-1.5" data-clear="tag" aria-label="Remove tag filter ${esc(tag)}">#${esc(tag)}${x}</button>`);
        if (term) chips.push(`<button type="button" class="chip !py-1.5" data-clear="q" aria-label="Clear search ${esc(term)}">“${esc(term)}”${x}</button>`);
        activeBox.innerHTML = chips.length ? `<span class="font-mono text-xs uppercase tracking-widest text-ink-500 dark:text-ink-400">Filtered by</span>${chips.join('')}<button type="button" class="text-xs font-bold text-signal-700 underline underline-offset-4 dark:text-signal-300" data-clear="all">Reset all</button>` : '';
        activeBox.classList.toggle('hidden', !chips.length); activeBox.classList.toggle('flex', !!chips.length);
      }
      if (pager) {
        const arrowL = '<svg class="h-4 w-4 flip-rtl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';
        const arrowR = '<svg class="h-4 w-4 flip-rtl" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
        pager.innerHTML = match.length > per ? btn(arrowL, page - 1, { disabled: page === 1, label: 'Previous page' }) + Array.from({ length: pages }, (_, i) => btn(`<span class="font-mono text-sm font-bold">${i + 1}</span>`, i + 1, { active: i + 1 === page })).join('') + btn(arrowR, page + 1, { disabled: page === pages, label: 'Next page' }) : '';
        if (info) info.textContent = match.length ? `Showing ${(page - 1) * per + 1}–${Math.min(page * per, match.length)} of ${match.length} article${match.length === 1 ? '' : 's'}` : '';
      }
      if (scroll) scrollToEl(target, -140);
    };
    pager && pager.addEventListener('click', e => { const b = e.target.closest('[data-page]'); if (!b || b.disabled) return; page = +b.dataset.page; apply(true); });
    const setCat = c => { cat = c; page = 1; $$('[data-filter]', g).forEach(x => x.setAttribute('aria-pressed', x.dataset.filter === c)); };
    const resetAll = () => { setCat('all'); tag = ''; if (search) search.value = ''; history.replaceState(null, '', location.pathname + location.hash); apply(); };
    $$('[data-filter]', g).forEach(b => b.addEventListener('click', () => { setCat(b.dataset.filter); apply(); }));
    search && search.addEventListener('input', () => { page = 1; apply(); });
    clearBtn && clearBtn.addEventListener('click', () => { search.value = ''; page = 1; apply(); search.focus(); });
    scope.querySelector('[data-filter-reset]')?.addEventListener('click', resetAll);
    activeBox && activeBox.addEventListener('click', e => { const b = e.target.closest('[data-clear]'); if (!b) return; if (b.dataset.clear === 'all') return resetAll(); if (b.dataset.clear === 'tag') tag = ''; else search.value = ''; page = 1; apply(); });
    // deep links: blog.html?cat=security, ?tag=privacy or ?q=wifi
    if (params.get('cat') && $(`[data-filter="${params.get('cat')}"]`, g)) setCat(params.get('cat'));
    if (params.get('tag')) tag = params.get('tag').toLowerCase();
    if (search && params.get('q')) search.value = params.get('q');
    apply();
  });
  $$('[data-view]').forEach(b => b.addEventListener('click', () => {
    $$('[data-view]').forEach(x => x.setAttribute('aria-pressed', x === b)); const t = $('[data-view-target]'); t && t.classList.toggle('is-list', b.dataset.view === 'list');
  }));

  /* ---------- tabs ---------- */
  const styleTabs = () => $$('[data-tab]').forEach(x => x.classList.toggle('is-active', x.getAttribute('aria-selected') === 'true'));
  $$('[data-tab]').forEach(t => t.addEventListener('click', () => {
    $$('[data-tab]', t.parentElement).forEach(x => x.setAttribute('aria-selected', x === t));
    $$('[data-panel]').forEach(p => p.classList.toggle('hidden', p.dataset.panel !== t.dataset.tab));
    styleTabs();
  }));
  styleTabs();

  /* ---------- billing toggle (rates) ---------- */
  $$('[data-billing]').forEach(b => b.addEventListener('click', () => {
    $$('[data-billing]').forEach(x => x.setAttribute('aria-pressed', x === b)); const pack = b.dataset.billing === 'p';
    $$('[data-price-h]').forEach(el => { el.textContent = pack ? '$' + el.dataset.priceP : '$' + el.dataset.priceH; !reduce && el.animate && el.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 350 }); });
    $$('[data-price-unit]').forEach(el => (el.textContent = pack ? ' / 20 hours' : ' / hour'));
  }));

  /* ---------- testimonial slider ---------- */
  $$('[data-slider]').forEach(s => {
    const sec = s.closest('section'), prev = $('[data-slide="prev"]', sec), next = $('[data-slide="next"]', sec);
    const sync = () => { const m = s.scrollWidth - s.clientWidth - 2, x = Math.abs(s.scrollLeft); prev.disabled = x <= 2; next.disabled = x >= m; };
    [prev, next].forEach(b => b.addEventListener('click', () => {
      const card = s.firstElementChild, step = card ? card.offsetWidth + 20 : 300, dir = b === next ? 1 : -1;
      s.scrollBy({ left: step * dir * (isRTL() ? -1 : 1), behavior: reduce ? 'auto' : 'smooth' });
    }));
    s.addEventListener('scroll', sync, { passive: true }); window.addEventListener('resize', sync); sync();
  });

  /* ---------- speed gauge ---------- */
  $$('[data-gauge]').forEach(g => {
    const val = +g.dataset.gauge, max = +g.dataset.max, arc = $('[data-gauge-arc]', g), nd = $('[data-gauge-needle]', g), txt = $('[data-gauge-val]', g);
    const set = p => { arc.style.strokeDashoffset = 100 - p * (val / max) * 100; nd.style.transform = `rotate(${-90 + 180 * p * (val / max)}deg)`; txt.textContent = Math.round(val * p); };
    const gio = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; gio.disconnect();
      if (reduce) return set(1);
      const t0 = performance.now(); const st = t => { const p = Math.min(1, (t - t0) / 1800), ease = 1 - Math.pow(1 - p, 4); set(ease + (p < 1 ? Math.sin(p * 30) * .015 * (1 - p) : 0)); if (p < 1) requestAnimationFrame(st); }; requestAnimationFrame(st);
    }), { threshold: .4 });
    gio.observe(g);
  });

  /* ---------- countdown ---------- */
  $$('[data-countdown]').forEach(c => {
    const end = new Date(c.dataset.countdown).getTime();
    const tick = () => {
      const s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      const v = { days: Math.floor(s / 86400), hrs: Math.floor(s % 86400 / 3600), min: Math.floor(s % 3600 / 60), sec: s % 60 };
      Object.keys(v).forEach(k => { const el = $(`[data-cd="${k}"]`, c); if (el) el.textContent = String(v[k]).padStart(2, '0'); });
    };
    tick(); setInterval(tick, 1000);
  });

  /* ---------- install progress (coming soon) ---------- */
  const ib = $('[data-install-bar]');
  if (ib) {
    const steps = ['installing station_os_v4.2', 'patching fiber_driver', 'calibrating 240hz panels', 'warming up coffee machine', 'almost there…'];
    let p = 0;
    setInterval(() => { p = p >= 100 ? 8 : Math.min(100, p + Math.random() * 7); ib.style.width = p + '%'; $('[data-install-pct]').textContent = Math.floor(p) + '%'; $('[data-install-label]').textContent = steps[Math.min(4, Math.floor(p / 21))]; }, 900);
  }

  /* ---------- RGB keyboard ---------- */
  const kb = $('[data-keyboard]');
  if (kb) {
    const cols = ['#2ee6d6', '#ff3ea5', '#b6ff3b', '#ffb020', '#8b5cff'], keys = $$('.kb-key', kb), combo = $('[data-combo]');
    let n = 0, ct;
    const light = (k, c) => {
      k.style.background = c; k.style.color = '#070b14'; k.style.boxShadow = `0 0 24px ${c}, 0 2px 0 #070b14`; k.style.transform = 'translateY(2px)';
      setTimeout(() => { k.style.background = ''; k.style.color = ''; k.style.boxShadow = ''; k.style.transform = ''; }, 380);
    };
    const hit = k => {
      const c = cols[(n++) % cols.length]; light(k, c); combo.textContent = n; clearTimeout(ct); ct = setTimeout(() => { n = 0; combo.textContent = 0; }, 1500);
      const r = k.getBoundingClientRect();
      keys.forEach(o => { if (o === k) return; const q = o.getBoundingClientRect(), d = Math.hypot(q.left - r.left, q.top - r.top); if (d < 130) setTimeout(() => light(o, c + '99'), d * 1.6); });
    };
    kb.addEventListener('pointerover', e => { const k = e.target.closest('.kb-key'); if (k) hit(k); });
    kb.addEventListener('click', e => { const k = e.target.closest('.kb-key'); if (k) hit(k); });
    document.addEventListener('keydown', e => { if (e.target.matches('input,textarea,select')) return; const k = keys.find(x => x.dataset.key === e.key.toUpperCase() || (e.key === ' ' && x.dataset.key === ' ')); if (k) { const r = kb.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) { if (e.key === ' ') e.preventDefault(); hit(k); } } });
  }

  /* ---------- blog: TOC highlight, share, reply, comments ---------- */
  const tocLinks = $$('[data-toc]');
  if (tocLinks.length) {
    const tio = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; tocLinks.forEach(l => { const on = l.dataset.toc === e.target.id; l.classList.toggle('!border-signal-500', on); l.classList.toggle('!text-signal-700', on); l.classList.toggle('dark:!text-signal-300', on); }); }), { rootMargin: '-20% 0px -70% 0px' });
    tocLinks.forEach(l => { const hd = document.getElementById(l.dataset.toc); hd && tio.observe(hd); });
  }
  $$('[data-share]').forEach(b => b.addEventListener('click', async () => {
    const u = encodeURIComponent(location.href), t = encodeURIComponent(document.title);
    const urls = { fb: `https://www.facebook.com/sharer/sharer.php?u=${u}`, x: `https://twitter.com/intent/tweet?url=${u}&text=${t}`, li: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, wa: `https://wa.me/?text=${t}%20${u}` };
    if (urls[b.dataset.share]) { window.open(urls[b.dataset.share], '_blank', 'noopener,width=640,height=560'); return; }
    try { if (navigator.share) await navigator.share({ title: document.title, url: location.href }); else { await navigator.clipboard.writeText(location.href); toast('Link copied to clipboard'); } }
    catch (e) { if (e && e.name !== 'AbortError') toast('Copy this link: ' + location.href); }
  }));
  const cForm = $('[data-comment-form]');
  $$('[data-reply]').forEach(b => b.addEventListener('click', () => {
    if (!cForm) return; const ta = $('textarea', cForm);
    ta.value = `@${b.dataset.reply} `; scrollToEl(cForm, -120); setTimeout(() => { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }, 500);
  }));
  if (cForm) cForm.addEventListener('submit', e => {
    e.preventDefault(); if (!validate(cForm)) return;
    const name = $('#cm-name', cForm).value.trim(), msg = $('#cm-msg', cForm).value.trim(), list = $('[data-comment-list]'), title = $('#c-title');
    const li = document.createElement('li'); li.className = 'flex gap-4 rounded-2xl bg-signal-400/5 p-3 ring-1 ring-signal-400/30';
    li.innerHTML = `<span class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-signal-400 to-violet-400 font-bold text-ink-950">${esc(name[0] || '?').toUpperCase()}</span><div class="flex-1"><div class="flex flex-wrap items-center gap-2"><b>${esc(name)}</b><span class="font-mono text-xs text-ink-500 dark:text-ink-400">just now · awaiting moderation</span></div><p class="mt-1 text-sm text-ink-700 dark:text-ink-200">${esc(msg)}</p></div>`;
    list.appendChild(li); title.textContent = `${list.children.length} comment${list.children.length === 1 ? '' : 's'}`; cForm.reset(); fieldsOf(cForm).forEach(x => { x._touched = false; showErr(x, ''); });
    openModal('Comment posted!', 'Thanks for joining the conversation — your comment appears below and will be public after a quick review.');
  });

  /* ---------- 404 reconnect ---------- */
  const rc = $('[data-reconnect]');
  if (rc) {
    const log = $('[data-ping-log]'), pl = $('[data-plug-l]'), pr = $('[data-plug-r]');
    rc.addEventListener('mouseenter', () => { pl.style.transform = 'translate(20px,20px)'; pr.style.transform = 'translate(-14px,-20px)'; });
    rc.addEventListener('mouseleave', () => { pl.style.transform = ''; pr.style.transform = ''; });
    rc.addEventListener('click', () => {
      const lines = ['$ ping byteport.cafe' + esc(location.pathname), 'Request timeout for icmp_seq 0', 'Request timeout for icmp_seq 1', 'Destination page unreachable.', 'Try the links on this page, or <a class="underline text-white" href="index.html">go home</a>.'];
      log.innerHTML = ''; lines.forEach((l, i) => setTimeout(() => { const p = document.createElement('p'); p.innerHTML = l; if (i === 3) p.className = 'text-pulse-300'; log.appendChild(p); }, i * 450));
    });
  }

  /* ---------- demo forms → success popup ---------- */
  $$('[data-fake-form]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    if (!validate(f)) return;
    openModal(f.dataset.successTitle || 'Thank you!', f.dataset.success || 'We’ve received your message and will reply shortly.');
    f.reset(); $$('[data-min-today]', f).forEach(i => (i.value = i.min)); $$('[data-future-date]', f).forEach(x => x.dispatchEvent(new Event('change')));
    fieldsOf(f).forEach(x => { x._touched = false; showErr(x, ''); });
  }));
})();
