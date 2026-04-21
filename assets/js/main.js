/* ==================================================================
   Bridgrs — Marketing site motion (dark tech edition)
   ================================================================== */

(() => {
  'use strict';

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Mark JS available (redundant with inline head script; safe) ── */
  document.documentElement.classList.add('js');

  /* ── Cursor glow (desktop only) ─────────────────── */
  const glow = document.querySelector('.cursor-glow');
  if (glow && !reduce && window.matchMedia('(pointer: fine)').matches) {
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    let active = false;

    window.addEventListener('mousemove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!active) {
        active = true;
        glow.style.opacity = '1';
      }
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
      active = false;
      glow.style.opacity = '0';
    });

    const tick = () => {
      currentX += (targetX - currentX) * 0.14;
      currentY += (targetY - currentY) * 0.14;
      glow.style.transform = `translate(${currentX - 300}px, ${currentY - 300}px)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ── Card spotlight (tracks mouse to --mx/--my) ──── */
  if (!reduce) {
    document.querySelectorAll('.cap, .sector, .step, .trust-item, .faq-item').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        el.style.setProperty('--mx', `${x}%`);
        el.style.setProperty('--my', `${y}%`);
      }, { passive: true });
    });
  }

  /* ── Counter-up for [data-count] ─────────────────── */
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    if (isNaN(target)) return;
    const hasDecimal = target % 1 !== 0;
    const duration = 1400;
    const start = performance.now();

    const suffix = el.querySelector('.unit, .sfx');
    const suffixHTML = suffix ? suffix.outerHTML : '';

    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const value = target * eased;
      const text = hasDecimal ? value.toFixed(2) : Math.floor(value).toString();
      el.innerHTML = text + suffixHTML;
      if (t < 1) requestAnimationFrame(step);
      else {
        const final = hasDecimal ? target.toFixed(2) : Math.floor(target).toString();
        el.innerHTML = final + suffixHTML;
      }
    };
    requestAnimationFrame(step);
  };

  /* ── Reveals + counter trigger ───────────────────── */
  const reveals = document.querySelectorAll('.reveal');
  const counters = document.querySelectorAll('[data-count]');
  const countedSet = new WeakSet();

  const revealAll = () => {
    reveals.forEach(r => r.classList.add('in'));
    counters.forEach(c => {
      if (!countedSet.has(c)) { countedSet.add(c); animateCount(c); }
    });
  };

  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach(r => io.observe(r));

    const ioCount = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !countedSet.has(e.target)) {
          countedSet.add(e.target);
          animateCount(e.target);
          ioCount.unobserve(e.target);
        }
      });
    }, { root: null, rootMargin: '0px 0px -15% 0px', threshold: 0.3 });
    counters.forEach(c => ioCount.observe(c));

    // Failsafe: guarantee visibility if IO doesn't fire (screenshot tools, odd viewports)
    setTimeout(revealAll, 2500);
  } else {
    revealAll();
  }

  /* ── Live inbox classification animation ─────── */
  const classifyingRow = document.querySelector('.inbox-row.classifying');
  if (classifyingRow && !reduce) {
    const tagEl = classifyingRow.querySelector('.inbox-tag');
    const outcomes = [
      { label: 'Interested', className: 'tag-hot' },
      { label: 'Action', className: 'tag-warm' },
      { label: 'Interview', className: 'tag-hot' }
    ];
    let cycle = 0;

    const resolve = () => {
      if (!document.body.contains(classifyingRow)) return;
      const next = outcomes[cycle % outcomes.length];
      cycle++;

      tagEl.style.transition = 'opacity 0.35s ease';
      tagEl.style.opacity = '0';

      setTimeout(() => {
        tagEl.textContent = next.label;
        tagEl.className = `inbox-tag ${next.className}`;
        tagEl.style.opacity = '1';
        classifyingRow.classList.remove('classifying');

        setTimeout(() => {
          tagEl.style.opacity = '0';
          setTimeout(() => {
            tagEl.textContent = 'Classifying…';
            tagEl.className = 'inbox-tag';
            tagEl.style.opacity = '1';
            classifyingRow.classList.add('classifying');
            setTimeout(resolve, 2200);
          }, 400);
        }, 3200);
      }, 400);
    };

    setTimeout(resolve, 2800);
  }

  /* ── Smooth-scroll for in-page anchors ─────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (ev) => {
      const id = a.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      ev.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ── Mobile nav toggle ─────────────────── */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    const openStyles = {
      display: 'flex',
      flexDirection: 'column',
      position: 'absolute',
      top: '80px',
      left: 'var(--gutter)',
      right: 'var(--gutter)',
      background: 'rgba(10, 13, 31, 0.96)',
      padding: '20px 24px',
      border: '1px solid var(--hairline)',
      borderRadius: '24px',
      backdropFilter: 'blur(24px)',
      gap: '14px',
      zIndex: '40',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
    };
    const reset = () => {
      Object.keys(openStyles).forEach(k => { navLinks.style[k] = ''; });
    };
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.style.display === 'flex';
      if (isOpen) reset();
      else Object.assign(navLinks.style, openStyles);
    });
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', reset));
    window.addEventListener('resize', () => {
      if (window.innerWidth > 720) reset();
    });
  }

  /* ── Nav scroll-shadow intensity ─────────── */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => {
      if (window.scrollY > 12) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

})();
