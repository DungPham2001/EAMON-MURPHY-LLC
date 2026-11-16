(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Year ---------- */
  $('#year').textContent = new Date().getFullYear();

  /* ---------- Reveal on scroll ---------- */
  $$('.reveal').forEach(el => el.style.setProperty('--d', el.dataset.delay || 0));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('is-visible');
      // remove stagger delay once revealed so hover effects respond instantly
      setTimeout(() => el.classList.add('is-done'), 1000 + (el.dataset.delay || 0) * 100);
      io.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal, .steps').forEach(el => io.observe(el));

  /* ---------- Header, progress bar, back-to-top, parallax ---------- */
  const header = $('.header');
  const progress = $('.scroll-progress');
  const toTop = $('.to-top');
  const parallaxEls = $$('.parallax');
  const parallaxBgs = $$('.parallax-bg');
  let lastY = 0, ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    header.classList.toggle('is-scrolled', y > 40);
    header.classList.toggle('is-hidden', y > lastY && y > 400 && !document.body.classList.contains('menu-open'));
    toTop.classList.toggle('is-visible', y > 700);
    lastY = y;

    if (!reduceMotion) {
      parallaxEls.forEach(el => {
        const r = el.getBoundingClientRect();
        const raw = (r.top + r.height / 2 - innerHeight / 2) * (parseFloat(el.dataset.speed) || 0.1);
        const offset = Math.max(-40, Math.min(40, raw));
        el.style.translate = `0 ${-offset}px`;
      });
      parallaxBgs.forEach(el => {
        const r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        el.style.transform = `translateY(${(r.top + r.height / 2 - innerHeight / 2) * -0.15}px)`;
      });
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- Active nav link ---------- */
  const links = $$('.nav__links a');
  const sectionIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('section[id]').forEach(s => sectionIO.observe(s));

  /* ---------- Mobile menu ---------- */
  const toggle = $('.nav__toggle');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    document.body.classList.toggle('no-scroll', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('.mobile-menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* ---------- Word rotator ---------- */
  const items = $$('.rotator__item');
  if (items.length && !reduceMotion) {
    let i = 0;
    setInterval(() => {
      const current = items[i];
      i = (i + 1) % items.length;
      const next = items[i];
      current.classList.add('is-leaving');
      current.classList.remove('is-active');
      next.classList.add('is-active');
      setTimeout(() => current.classList.remove('is-leaving'), 700);
    }, 2400);
  }

  /* ---------- Tabs ---------- */
  const tabBtns = $$('.tabs__btn');
  const indicator = $('.tabs__indicator');
  const moveIndicator = (btn) => {
    indicator.style.width = btn.offsetWidth + 'px';
    indicator.style.transform = `translateX(${btn.offsetLeft}px)`;
  };
  const activateTab = (btn) => {
    tabBtns.forEach(b => {
      const on = b === btn;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on);
      const panel = document.getElementById(b.getAttribute('aria-controls'));
      panel.hidden = !on;
      panel.classList.toggle('is-active', on);
    });
    moveIndicator(btn);
  };
  tabBtns.forEach((btn, idx) => {
    btn.addEventListener('click', () => activateTab(btn));
    btn.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabBtns[(idx + (e.key === 'ArrowRight' ? 1 : -1) + tabBtns.length) % tabBtns.length];
      next.focus(); activateTab(next);
    });
  });
  const syncIndicator = () => moveIndicator($('.tabs__btn.is-active'));
  window.addEventListener('resize', syncIndicator);
  document.fonts?.ready.then(syncIndicator);
  syncIndicator();

  /* ---------- FAQ: only one open at a time ---------- */
  const accs = $$('.acc');
  accs.forEach(d => d.addEventListener('toggle', () => {
    if (d.open) accs.forEach(o => o !== d && (o.open = false));
  }));

  /* ---------- Lightbox ---------- */
  const lb = $('.lightbox');
  const lbImg = $('img', lb);
  const lbCap = $('.lightbox__cap', lb);
  const openLB = (fig) => {
    const img = $('img', fig);
    lbImg.src = img.src; lbImg.alt = img.alt;
    lbCap.textContent = $('figcaption', fig)?.textContent || '';
    lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  };
  const closeLB = () => {
    lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  };
  $$('.m-item').forEach(fig => fig.addEventListener('click', () => openLB(fig)));
  lb.addEventListener('click', e => { if (e.target !== lbImg) closeLB(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeLB(); setMenu(false); }
  });

  if (reduceMotion || !finePointer) return;

  /* ---------- Cursor glow ---------- */
  const glow = $('.cursor-glow');
  let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
  window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  const loop = () => {
    gx += (tx - gx) * 0.12;
    gy += (ty - gy) * 0.12;
    glow.style.transform = `translate(${gx - 190}px, ${gy - 190}px)`;
    requestAnimationFrame(loop);
  };
  loop();

  /* ---------- Magnetic buttons ---------- */
  $$('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });

  /* ---------- 3D tilt + spotlight on cards ---------- */
  $$('.tilt').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
      el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 6}deg) rotateY(${(px - 0.5) * 6}deg) translateY(-6px)`;
      el.style.transition = 'transform .15s ease-out, box-shadow .5s, border-color .5s';
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
      el.style.transition = '';
    });
  });

  /* ---------- Hero mouse parallax ---------- */
  const orbs = $$('.orb');
  $('.hero').addEventListener('mousemove', e => {
    const x = e.clientX / innerWidth - 0.5;
    const y = e.clientY / innerHeight - 0.5;
    orbs.forEach((o, idx) => {
      const f = (idx + 1) * 30;
      o.style.translate = `${x * f}px ${y * f}px`;
    });
  });
})();

/* ---------- Contact form (opens the visitor's email app) ---------- */
(() => {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const note = form.querySelector('.form__note');

  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    form.querySelectorAll('[required]').forEach(input => {
      const field = input.closest('.field');
      const valid = input.checkValidity() && input.value.trim() !== '';
      field.classList.toggle('is-invalid', !valid);
      if (!valid) ok = false;
    });
    if (!ok) {
      note.textContent = 'Please fill in all fields with a valid email.';
      return;
    }
    const d = Object.fromEntries(new FormData(form));
    const subject = `Website inquiry — ${d.service}`;
    const body = `Name: ${d.name}\nEmail: ${d.email}\nInterested in: ${d.service}\n\n${d.message}`;
    window.location.href = `mailto:karmoiacopino@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    note.textContent = 'Opening your email app… Thank you!';
    form.reset();
  });

  form.querySelectorAll('input, textarea, select').forEach(el =>
    el.addEventListener('input', () => el.closest('.field').classList.remove('is-invalid'))
  );
})();
