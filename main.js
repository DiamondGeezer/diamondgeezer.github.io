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
