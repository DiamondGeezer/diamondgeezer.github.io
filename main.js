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

  const createWaveAnimator = (selector, opts = {}) => {
    const path = document.querySelector(selector);
    if (!path) return;

    const {
      baseAmp = 26,
      maxDelta = 18,
      decay = 0.9,
      minEnergy = 0.01,
      scrollRange = 600,
      freq = 0.004,
      crestCap = 41,
      velocityGain = 0.0,
      maxEnergy = 1.5
    } = opts;

    const buildPath = (amp) => {
      const crest = Math.min(crestCap, 1 + amp); // cap within viewBox height
      return `M0,1 C225,1 225,${crest} 450,${crest} C675,${crest} 675,1 900,1 C1125,1 1125,${crest} 1350,${crest} C1575,${crest} 1575,1 1800,1 L1800,42 L0,42 Z`;
    };

    let ticking = false;
    let energy = 0;
    let scrollFactor = 0;
    let lastY = window.scrollY || 0;
    let lastT = performance.now();

    const onScroll = () => {
      const now = performance.now();
      const y = window.scrollY || 0;
      const dy = y - lastY;
      const dt = Math.max(1, now - lastT); // ms

      scrollFactor = Math.min(1, y / scrollRange);

      // velocity-driven kick (px/ms -> px/s scaled)
      const speed = Math.abs(dy) / dt; // px per ms
      const impulse = Math.min(maxEnergy, speed * velocityGain);
      energy = Math.min(maxEnergy, energy + impulse);

      lastY = y;
      lastT = now;
    };

    const animate = (ts) => {
      energy = Math.max(minEnergy, energy * decay); // decay toward calm
      const wobble = Math.sin(ts * freq);
      const amp = baseAmp + (maxDelta * scrollFactor * wobble) + (maxDelta * energy * 0.6);
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          path.setAttribute('d', buildPath(amp));
          ticking = false;
        });
      }
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  };

  // Home wave (index.html)
  createWaveAnimator('.home-hero-wave path', {
    baseAmp: 26,
    maxDelta: 18,
    scrollRange: 600,
    velocityGain: 0.0,
    maxEnergy: 1.0,
  });

  // Pro foreground wave (front layer only)
  createWaveAnimator('.pro-page .hero-wave:not(.hero-wave-chaos):not(.hero-wave-back) path', {
    baseAmp: 24,
    maxDelta: 22,
    scrollRange: 500,
    freq: 0.0038,
    velocityGain: 1.2, // larger kicks on rapid scroll
    maxEnergy: 2.5,
  });
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

// Scroll reveal animations (respect reduced motion)
(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const revealGroup = (nodes, { rootMargin = '0px', threshold = 0.25, baseDelay = 0, stagger = 120 } = {}) => {
    if (!nodes.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin, threshold });

    nodes.forEach((node, idx) => {
      node.classList.add('will-reveal');
      const delay = (baseDelay + idx * stagger) / 1000;
      node.style.transitionDelay = `${delay}s`;
      observer.observe(node);
    });
  };

  // Supported services cards
  revealGroup(Array.from(document.querySelectorAll('.service')), { threshold: 0.2, baseDelay: 0, stagger: 80 });

  // How it works cards (stagger inner rows per card)
  const howCards = Array.from(document.querySelectorAll('.how-card'));
  howCards.forEach((card, cardIdx) => {
    const parts = [
      card,
      ...Array.from(card.querySelectorAll('.how-card-visual')), // animate visual wrapper to preserve image transforms
      ...Array.from(card.querySelectorAll('.how-step, .how-text h3, .how-text p'))
    ];
    revealGroup(parts, { threshold: 0.2, baseDelay: cardIdx * 120, stagger: 100 });
  });

  // Pro carousel block on home page (stagger children)
  const perkContainer = document.querySelector('.perk-container');
  if (perkContainer) {
    const kids = Array.from(perkContainer.querySelectorAll('.perk-title, .perk-subtitle, .perk-animation-row, .perk-cta'));
    if (kids.length) {
      revealGroup(kids, { threshold: 0.15, baseDelay: 0, stagger: 180 });
    } else {
      revealGroup([perkContainer], { threshold: 0.15, baseDelay: 0 });
    }
  }

  // Final CTA block (stagger rows)
  const finalCta = document.querySelector('.final-cta .container');
  if (finalCta) {
    const rows = Array.from(finalCta.querySelectorAll('h2, p, .app-store-badge'));
    if (rows.length) {
      revealGroup(rows, { threshold: 0.2, baseDelay: 150, stagger: 180 });
    } else {
      revealGroup([finalCta], { threshold: 0.2, baseDelay: 150 });
    }
  }

  // FAQ items
  revealGroup(Array.from(document.querySelectorAll('.faq-item')), { threshold: 0.15, baseDelay: 0, stagger: 50 });
})();

// Typewriter effect for hero title (home only)
(() => {
  if (document.body.classList.contains('pro-page')) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const title = document.querySelector('.hero-copy h1');
  const highlight = title?.querySelector('.hero-title-highlight');
  const subtitle = document.querySelector('.hero-copy .hero-subtitle');
  const heroVisual = document.querySelector('.hero-visual');
  const heroDownload = document.querySelector('.hero-download');
  const ctaRow = document.querySelector('.cta-row');
  if (!title || !highlight || !subtitle) return;

  const fullHighlight = highlight.textContent || '';
  const fullTitleText = (title.textContent || '').trim();
  const restText = fullTitleText.replace(fullHighlight, ''); // keep leading space before second sentence

  if (prefersReducedMotion) {
    subtitle.classList.add('typing-visible');
    heroVisual?.classList.add('typing-visible');
    heroDownload?.classList.add('typing-visible');
    return;
  }

  let notesTimer = null;
  const musPaths = Array.from({ length: 34 }, (_, i) => `assets/music_symbols_chalk/mus_${String(i + 1).padStart(2, '0')}.png`);
  let firstNote = true;
  let lastNote = null;

  const startNotes = () => {
    if (!ctaRow || notesTimer !== null) return;
    const emit = () => {
      let src;
      if (firstNote) {
        const firstChoices = ['assets/music_symbols_chalk/mus_09.png', 'assets/music_symbols_chalk/mus_21.png'];
        src = firstChoices[Math.floor(Math.random() * firstChoices.length)];
        firstNote = false;
      } else {
        do {
          src = musPaths[Math.floor(Math.random() * musPaths.length)];
        } while (src === lastNote);
      }
      lastNote = src;
      const img = new Image();
      img.src = src;
      img.onload = () => {
        const aspect = img.naturalWidth > 0 ? img.naturalHeight / img.naturalWidth : 1;
        const height = 40 + Math.random() * 20; // max 60px
        const width = height / aspect;
        const el = document.createElement('img');
        el.className = 'note-plume';
        el.src = src;
        el.style.setProperty('--note-rot', `${6 + Math.random() * 10}deg`);
        el.style.width = `${width}px`;
        el.style.height = `${height}px`;
        el.style.animationDuration = `${6 + Math.random() * 3}s`;
        // Position at top-right of the download button
        const ctaRect = ctaRow.getBoundingClientRect();
        const btnRect = heroDownload.getBoundingClientRect();
        const x = btnRect.right - ctaRect.left;
        const y = btnRect.top - ctaRect.top;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.transformOrigin = 'center';
        ctaRow.appendChild(el);
        el.addEventListener('animationend', () => el.remove(), { once: true });
      };
    };
    // initial delay ~3s after start, then every 4s
    setTimeout(() => {
      emit();
      notesTimer = setInterval(emit, 4000);
    }, 1000);
    return;
  }

  // Build structure: highlight span, rest span, cursor
  const restSpan = document.createElement('span');
  restSpan.className = 'hero-title-rest';
  restSpan.textContent = '';

  const cursor = document.createElement('span');
  cursor.className = 'type-cursor';
  cursor.textContent = '|';

  highlight.textContent = '';
  title.innerHTML = '';
  title.appendChild(highlight);
  title.appendChild(restSpan);
  title.appendChild(cursor);

  subtitle.classList.remove('typing-visible');
  subtitle.classList.add('typing-hidden');
  if (heroVisual) {
    heroVisual.classList.remove('typing-visible');
    heroVisual.classList.add('typing-hidden');
  }
  if (heroDownload) {
    heroDownload.classList.remove('typing-visible');
    heroDownload.classList.add('typing-hidden');
  }

  const typeText = (el, text, delay = 65) =>
    new Promise((resolve) => {
      let idx = 0;
      const step = () => {
        if (idx <= text.length) {
          el.textContent = text.slice(0, idx);
          idx += 1;
          setTimeout(step, delay);
        } else {
          resolve();
        }
      };
      step();
    });

  const blinkCursor = (times = 2, interval = 180) =>
    new Promise((resolve) => {
      let count = 0;
      cursor.style.visibility = 'visible'; // ensure consistent start state
      const tick = () => {
        cursor.style.visibility = cursor.style.visibility === 'hidden' ? 'visible' : 'hidden';
        count += 1;
        if (count >= times * 2) {
          cursor.style.visibility = 'visible';
          resolve();
          return;
        }
        setTimeout(tick, interval);
      };
      setTimeout(tick, interval);
    });

  const run = async () => {
    await typeText(highlight, fullHighlight, 65);
    await new Promise((r) => setTimeout(r, 1300));
    await typeText(restSpan, restText, 55);
    await blinkCursor(2, 180);
    cursor.remove();
    // After typing completes, reveal subtitle then hero visual staggered
    setTimeout(() => {
      requestAnimationFrame(() => {
        subtitle.classList.remove('typing-hidden');
        subtitle.classList.add('typing-visible');
        if (heroVisual) {
          setTimeout(() => {
            heroVisual.classList.remove('typing-hidden');
            heroVisual.classList.add('typing-visible');
          }, 300);
        }
        if (heroDownload) {
          setTimeout(() => {
            heroDownload.classList.remove('typing-hidden');
            heroDownload.classList.add('typing-visible');
            startNotes();
          }, 600);
        }
      });
    }, 600);
  };

  const startTyping = () => {
    requestAnimationFrame(run);
  };

  // Wait for background image to load before starting typing animation
  const bg = new Image();
  bg.onload = startTyping;
  bg.onerror = startTyping; // fail-safe: still start typing if load fails
  bg.src = 'assets/backgrounds/background.jpg';
  if (bg.complete) startTyping();
})();
