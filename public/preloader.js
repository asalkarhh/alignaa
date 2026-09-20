(() => {
  const start = (loader) => {
    const started = performance.now();
    let dismissed = false;
    let readyTimer;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      clearTimeout(fallback);
      clearTimeout(readyTimer);
      window.removeEventListener('alignaa:ready', onReady);
      loader.classList.add('is-complete');
      setTimeout(() => loader.remove(), 450);
    };
    const onReady = () => {
      const minimum = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650;
      readyTimer = setTimeout(dismiss, Math.max(0, minimum - (performance.now() - started)));
    };
    // Never leave the website covered if application startup fails.
    const fallback = setTimeout(dismiss, 8000);
    window.addEventListener('alignaa:ready', onReady, { once: true });
  };

  const initialLoader = document.getElementById('alignaa-preloader');
  if (initialLoader) start(initialLoader);

  window.addEventListener('alignaa:navigate', () => {
    const loader = document.createElement('div');
    loader.id = 'alignaa-preloader';
    loader.setAttribute('role', 'status');
    loader.setAttribute('aria-live', 'polite');
    loader.setAttribute('aria-label', 'Loading Alignaa');
    loader.innerHTML = '<video class="alignaa-loader-video" autoplay muted playsinline preload="auto" aria-hidden="true"><source src="/assets/Preloading.mp4" type="video/mp4" /></video>';
    document.body.appendChild(loader);
    start(loader);
  });
})();
