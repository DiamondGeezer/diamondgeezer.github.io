(() => {
  const tag = document.querySelector('.layout-tag');
  if (!tag) return;

  const updateLabel = () => {
    const w = Math.round(window.innerWidth);
    let label = `💻 (${w})`;
    if (w <= 480) {
      label = `📱 (T) (${w})`;
    } else if (w <= 540) {
      label = `📱 (S) (${w})`;
    } else if (w <= 768) {
      label = `📱 (L) (${w})`;
    } else if (w <= 900) {
      label = `📺 (${w})`;
    }
    tag.textContent = label;
  };

  window.addEventListener('resize', updateLabel, { passive: true });
  updateLabel();
})();

// Detect mobile/tablet WebKit to simulate fixed background via overlay (covers iPadOS Safari with Mac UA)
(() => {
  const ua = navigator.userAgent || '';
  const isIOSWebKit = /iP(hone|od|ad).+AppleWebKit/i.test(ua);
  const isIPadMacSafari = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  if (isIOSWebKit || isIPadMacSafari) {
    document.documentElement.classList.add('ios-fixed-bg');
  }
})();

// Hero wave subtle amplitude shift on scroll (clipped, no resize)
(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const wavePath = document.querySelector('.hero-wave path');
  if (!wavePath) return;

  const baseAmp = 26; // keeps crest well within viewBox height
  const maxDelta = 18; // more visible amplitude change
  const decay = 0.9; // damping when scroll stops
  const minEnergy = 0.01;

  const buildPath = (amp) => {
    const crest = Math.min(41, 1 + amp); // cap within viewBox height
    // fixed x coordinates, scaled for 1800 width
    return `M0,1 C225,1 225,${crest} 450,${crest} C675,${crest} 675,1 900,1 C1125,1 1125,${crest} 1350,${crest} C1575,${crest} 1575,1 1800,1 L1800,42 L0,42 Z`;
  };

  let ticking = false;
  let targetAmp = baseAmp;
  let energy = 0;
  let scrollFactor = 0;

  const onScroll = () => {
    const y = window.scrollY || 0;
    scrollFactor = Math.min(1, y / 600); // ease in first ~600px
    targetAmp = baseAmp + maxDelta * scrollFactor;
    energy = 1; // kick the wobble when scrolling
  };

  const animate = (ts) => {
    energy = Math.max(minEnergy, energy * decay); // decay toward calm
    const wobble = Math.sin(ts * 0.004); // gentle oscillation
    const amp = baseAmp + (maxDelta * scrollFactor * energy * wobble);
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        wavePath.setAttribute('d', buildPath(amp));
        ticking = false;
      });
    }
    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// Perk marquee scroll (cycle images within container)
(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const track = document.querySelector('.perk-animation-track');
  if (!track) return;

  const items = Array.from(track.children);
  if (!items.length) return;

  const style = getComputedStyle(track);
  const gapPx = (() => {
    const g = parseFloat(style.gap || style.columnGap || '0');
    return Number.isFinite(g) ? g : 0;
  })();

  // Duplicate items for seamless loop without DOM shuffles
  const clones = items.map((node) => node.cloneNode(true));
  clones.forEach((node) => track.appendChild(node));

  const singleSetWidth =
    items.reduce((sum, node) => sum + node.getBoundingClientRect().width, 0) +
    gapPx * (items.length - 1);

  let offset = 0;
  let lastTime = null;
  const speed = 35; // px per second

  const step = (ts) => {
    if (lastTime == null) lastTime = ts;
    const dt = (ts - lastTime) / 1000;
    lastTime = ts;

    offset -= speed * dt;
    if (-offset >= singleSetWidth) {
      offset += singleSetWidth;
    }

    track.style.transform = `translateX(${offset}px)`;
    requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
})();

// FAQ accordion toggles
(() => {
  const items = Array.from(document.querySelectorAll('.faq-item'));
  if (!items.length) return;

  const collapse = (item) => {
    const btn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!btn || !answer) return;
    item.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    answer.style.maxHeight = '0px';
  };

  const expand = (item) => {
    const btn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!btn || !answer) return;
    item.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    answer.style.maxHeight = `${answer.scrollHeight}px`;
  };

  items.forEach((item) => {
    const btn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!btn || !answer) return;
    // Init collapsed
    collapse(item);
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      if (isOpen) {
        collapse(item);
      } else {
        expand(item);
      }
    });
  });

  window.addEventListener('resize', () => {
    items.forEach((item) => {
      if (item.classList.contains('open')) {
        const answer = item.querySelector('.faq-answer');
        if (answer) {
          answer.style.maxHeight = `${answer.scrollHeight}px`;
        }
      }
    });
  }, { passive: true });
})();
