(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector('.theme-toggle');
  function applyTheme(theme) {
    root.dataset.theme = theme;
    const dark = theme === 'dark';
    themeButton.setAttribute('aria-pressed', String(dark));
    themeButton.setAttribute('aria-label', dark ? '밝은 테마로 전환' : '어두운 테마로 전환');
    document.querySelector('meta[name="theme-color"]').content = dark ? '#131c2c' : '#ffffff';
  }
  try { applyTheme(localStorage.getItem('resume-theme') === 'dark' ? 'dark' : 'light'); } catch { applyTheme('light'); }
  themeButton.addEventListener('click', () => {
    const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
    try { localStorage.setItem('resume-theme', theme); } catch { /* 저장이 제한되어도 테마는 전환합니다. */ }
  });
  const links = [...document.querySelectorAll('.section-rail a')];
  function activate(id) {
    links.forEach(link => {
      if (link.hash === '#' + id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  links.forEach(link => link.addEventListener('click', () => activate(link.hash.slice(1))));
  if ('IntersectionObserver' in window) {
    const visible = new Map();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => visible.set(entry.target.id, entry.isIntersecting));
      const first = [...document.querySelectorAll('.resume-section')].find(section => visible.get(section.id));
      if (first) activate(first.id);
    }, { rootMargin: '-130px 0px -45% 0px', threshold: 0 });
    document.querySelectorAll('.resume-section').forEach(section => observer.observe(section));
  }
  let detailsBeforePrint = [];
  window.addEventListener('beforeprint', () => {
    detailsBeforePrint = [...document.querySelectorAll('details')].map(detail => ({ detail, open: detail.open }));
    detailsBeforePrint.forEach(item => { item.detail.open = true; });
  });
  window.addEventListener('afterprint', () => {
    detailsBeforePrint.forEach(item => { item.detail.open = item.open; });
  });
  document.querySelector('.print-button').addEventListener('click', async () => {
    await document.fonts.ready;
    window.print();
  });
})();
