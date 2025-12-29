(() => {
  const tag = document.querySelector('.layout-tag');
  if (!tag) return;

  const updateLabel = () => {
    const w = Math.round(window.innerWidth);
    let prefix = 'D';
    if (w <= 540) {
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
