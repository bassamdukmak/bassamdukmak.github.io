document.querySelectorAll('.iqra-reference-view').forEach((view) => {
  view.querySelectorAll('[data-iqra-scroll]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      view.querySelector(link.getAttribute('href')).scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    });
  });
  view.querySelectorAll('[data-iqra-frame]').forEach((frame) => {
    // Google owns this 704px chart; scale its real iframe without replacing its live data.
    new ResizeObserver(() => {
      if (!frame.clientWidth) return;
      frame.style.setProperty('--iqra-chart-scale', String(frame.clientWidth / 704));
      frame.style.height = `${frame.clientWidth * 436 / 704}px`;
    }).observe(frame);
  });
});
