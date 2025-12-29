(() => {
  const tag = document.querySelector('.layout-tag');
  if (!tag) return;

  const updateLabel = () => {
    const w = Math.round(window.innerWidth);
    let prefix = 'D';
    if (w <= 480) {
      prefix = 'M (T)';
    } else if (w <= 540) {
      prefix = 'M (S)';
    } else if (w <= 768) {
      prefix = 'M (L)';
    } else if (w <= 900) {
      prefix = 'T';
    } else {
      prefix = 'D';
    }
    tag.textContent = `${prefix} (${w})`;
  };

  window.addEventListener('resize', updateLabel, { passive: true });
  updateLabel();
})();

// Detect iOS WebKit (mobile Safari) to simulate fixed background via overlay
(() => {
  const ua = navigator.userAgent || '';
  const isIOSWebKit = /iP(hone|od|ad).+AppleWebKit/i.test(ua);
  if (isIOSWebKit) {
    document.documentElement.classList.add('ios-fixed-bg');
  }
})();
