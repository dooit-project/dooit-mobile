// Read-only DOM probe. Run this expression through the connected browser's evaluate API.
// No app state, input values, credentials, or user text are collected.
(() => {
  const box = (element) => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  };
  const visible = (element) => {
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;
    if (rect.bottom <= 0 || rect.top >= window.innerHeight) return false;
    if (rect.right <= 0 || rect.left >= window.innerWidth) return false;
    for (let current = element; current; current = current.parentElement) {
      const style = getComputedStyle(current);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0')
        return false;
      if (current.getAttribute('aria-hidden') === 'true' || current.hasAttribute('inert'))
        return false;
    }
    return true;
  };
  const owned = (row, selector) =>
    [...row.querySelectorAll(selector)].filter(
      (element) => element.closest('[data-ui-row]') === row,
    );
  const rows = [...document.querySelectorAll('[data-ui-row]')].filter(visible).map((row, index) => {
    const title = owned(row, '[data-ui-text="title"]')[0];
    const text = owned(row, '[data-ui-text="block"]')[0];
    const titleBox = title ? box(title) : null;
    const lineHeight = title ? Number.parseFloat(getComputedStyle(title).lineHeight) : NaN;
    const icons = owned(row, '[data-ui-icon]').filter(
      (element) => !element.parentElement.closest('[data-ui-icon]'),
    );
    return {
      name: `${row.dataset.uiRow}:${index}`,
      alignment: row.dataset.uiAlign,
      bounds: box(row),
      text: text ? box(text) : null,
      titleLine:
        titleBox && Number.isFinite(lineHeight)
          ? { ...titleBox, height: Math.min(titleBox.height, lineHeight) }
          : null,
      icons: icons.map(box),
    };
  });
  const targets = [...document.querySelectorAll('[data-ui-touch]')]
    .filter(visible)
    .map((element, index) => ({
      name: `control:${index}`,
      minimum: Number(element.dataset.uiTouch),
      bounds: box(element),
    }));
  return {
    schemaVersion: 1,
    capturedAt: new Date().toISOString(),
    route: window.location.pathname,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    documentWidth: document.documentElement.scrollWidth,
    rows,
    targets,
  };
})();
