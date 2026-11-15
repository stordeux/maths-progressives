// Brouillon au stylet : Pointer Events, pression du stylet, crayon noir ou rouge, gomme, tout effacer.
export function createScratchpad(root) {
  root.innerHTML = `<div class="drawhead"><h2>✏️ Brouillon</h2>
    <button type="button" class="tool on" data-t="pen" aria-pressed="true">Crayon</button>
    <button type="button" class="tool" data-t="red" aria-pressed="false">Rouge</button>
    <button type="button" class="tool" data-t="era" aria-pressed="false">Gomme</button>
    <button type="button" class="tool" data-t="clr">Tout effacer</button></div>
    <canvas class="cv" aria-label="zone de brouillon : écris avec le doigt ou le stylet"></canvas>`;
  const cv = root.querySelector('canvas'), ctx = cv.getContext('2d');
  let mode = 'pen', color = '#1f2328', drawing = false, last = null;
  function size() {
    const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    if (!r.width || !r.height) return;
    let img = null; try { if (cv.width) img = ctx.getImageData(0, 0, cv.width, cv.height); } catch (e) { /* rien */ }
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (img) ctx.putImageData(img, 0, 0);
  }
  function clear() { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.restore(); }
  const pt = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, p: e.pressure || .5 }; };
  cv.addEventListener('pointerdown', e => { drawing = true; try { cv.setPointerCapture(e.pointerId); } catch (x) { /* rien */ } last = pt(e); e.preventDefault(); });
  cv.addEventListener('pointermove', e => {
    if (!drawing) return; const p = pt(e);
    ctx.globalCompositeOperation = mode === 'era' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = color;
    ctx.lineWidth = mode === 'era' ? 26 : (e.pointerType === 'pen' ? 1.5 + 3 * p.p : 3);
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p; e.preventDefault();
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => cv.addEventListener(t, () => { drawing = false; }));
  const tools = [...root.querySelectorAll('[data-t]')];
  const on = t => tools.forEach(b => { if (b.dataset.t !== 'clr') { b.classList.toggle('on', b.dataset.t === t); b.setAttribute('aria-pressed', String(b.dataset.t === t)); } });
  tools.forEach(b => {
    b.onclick = () => {
      const t = b.dataset.t;
      if (t === 'clr') return clear();
      mode = t === 'era' ? 'era' : 'pen'; color = t === 'red' ? '#e03131' : '#1f2328'; on(t);
    };
  });
  window.addEventListener('resize', size);
  if ('ResizeObserver' in window) new ResizeObserver(size).observe(cv);
  size();
  return { clear, size };
}
