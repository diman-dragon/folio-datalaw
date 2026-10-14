// Page sizing for the page list: the scroller size is read once per pass, then pages are only written (no layout thrash).
const MARGIN = 16;
export function createLayout({ scroller, container, entries, getMode }) {
  let cw = 0, ch = 0, scale = 1;
  const widthOf = (e) => Math.max(120, (getMode() === 'paged' ? Math.min(cw, ch / e.ratio) : cw) * scale);
  const place = (e) => { const w = widthOf(e); e.el.style.width = `${w}px`; e.el.style.height = `${w * e.ratio}px`; };
  function all() {
    cw = scroller.clientWidth - MARGIN;
    ch = scroller.clientHeight - MARGIN;
    const paged = getMode() === 'paged';
    const pad = !paged ? 0 : scale <= 1 ? Math.max(8, (scroller.clientWidth - widthOf(entries[0])) / 2) : 8;
    entries.forEach(place);
    container.style.paddingInline = paged ? `${pad}px` : '';
  }
  return { widthOf, place, all, setScale(s) { scale = s; all(); } };
}
