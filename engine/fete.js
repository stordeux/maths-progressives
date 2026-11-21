// Petites fêtes visuelles : étoiles qui jaillissent, pluie d'étoiles, couronne autour d'un bandeau, étoiles perdues.
// Rien que du DOM + Web Animations, sans bibliothèque ; calque par-dessus la page qui ne prend jamais les clics.
// Si l'appareil demande moins d'animations, aucune fête (l'étoile de l'en-tête s'allume simplement).

const calme = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || !Element.prototype.animate;
const OR = ['#ffd23f', '#f2a900', '#ffe58a', '#ffb703'];
const hasard = (a, b) => a + Math.random() * (b - a);

function calque(duree) {
  const c = document.createElement('div');
  c.className = 'fete'; c.setAttribute('aria-hidden', 'true');
  document.body.appendChild(c);
  setTimeout(() => c.remove(), duree + 100);
  return c;
}
function etoile(c, x, y, taille, couleur = OR[Math.floor(Math.random() * OR.length)], car = '★') {
  const s = document.createElement('span');
  s.textContent = car;
  s.style.cssText = `left:${x}px;top:${y}px;font-size:${taille}px;color:${couleur}`;
  c.appendChild(s);
  return s;
}
const centre = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r }; };

/** gerbe d'étoiles qui jaillissent d'un élément (bonne réponse) */
export function gerbe(el, n = 14) {
  if (!el || calme()) return;
  const { x, y } = centre(el), c = calque(1600);
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + hasard(-1.6, 1.6), d = hasard(90, 190), t = hasard(20, 36);
    etoile(c, x, y, t).animate([
      { transform: 'translate(-50%,-50%) scale(.2) rotate(0deg)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * d * .7}px), calc(-50% + ${Math.sin(a) * d * .7}px)) scale(1.2) rotate(${hasard(90, 200)}deg)`, opacity: 1, offset: .55 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d + 30}px)) scale(.4) rotate(${hasard(220, 360)}deg)`, opacity: 0 },
    ], { duration: hasard(1100, 1500), easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
  }
}

/** pluie d'étoiles sur tout l'écran (niveau débloqué) */
export function pluie(n = 22) {
  if (calme()) return;
  const w = innerWidth, h = innerHeight, c = calque(2000);
  for (let i = 0; i < n; i++) {
    const t = hasard(14, 34), x = hasard(0, w), dx = hasard(-80, 80);
    etoile(c, x, -40, t).animate([
      { transform: 'translate(-50%,0) rotate(0deg)', opacity: 0 },
      { opacity: 1, offset: .12 },
      { transform: `translate(calc(-50% + ${dx}px), ${h * hasard(.55, .95)}px) rotate(${hasard(-360, 360)}deg)`, opacity: 0 },
    ], { duration: hasard(1100, 1700), delay: hasard(0, 350), easing: 'cubic-bezier(.3,.1,.6,1)', fill: 'both' });
  }
}

/** couronne d'étoiles qui éclate autour d'un élément (nouveau titre) */
export function couronne(el, n = 16) {
  if (!el || calme()) return;
  const { x, y, r } = centre(el), c = calque(1600);
  const rx = r.width / 2 + 30, ry = r.height / 2 + 30;
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n, t = hasard(16, 26);
    etoile(c, x, y, t, OR[i % OR.length]).animate([
      { transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * rx}px), calc(-50% + ${Math.sin(a) * ry}px)) scale(1.3) rotate(180deg)`, opacity: 1, offset: .5 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * rx * 1.5}px), calc(-50% + ${Math.sin(a) * ry * 1.5}px)) scale(.3) rotate(360deg)`, opacity: 0 },
    ], { duration: 1400, delay: i * 18, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'both' });
  }
}

/** l'étoile qui vient d'être gagnée dans l'en-tête s'allume en rebondissant */
export function popEtoile(dots, n, depuis = null) {
  const e = dots && dots.children[n - 1]; if (!e) return;
  const allumer = () => {
    e.classList.add('pop');
    setTimeout(() => e.classList.remove('pop'), 2600);
    gerbe(e, 12); // l'étoile gagnée éclate là où elle s'allume
  };
  if (!depuis || calme()) { allumer(); return; }
  // une grande étoile apparaît au-dessus de la réponse, brille, puis s'envole vers sa place dans l'en-tête
  e.style.visibility = 'hidden';
  const a = centre(depuis), b = centre(e), c = calque(1500);
  const s = etoile(c, a.x, a.y, 110, '#ffc400');
  s.classList.add('grande');
  const vol = s.animate([
    { transform: 'translate(-50%,-50%) scale(.1) rotate(-120deg)', opacity: 0 },
    { transform: 'translate(-50%,-50%) scale(1.25) rotate(10deg)', opacity: 1, offset: .3 },
    { transform: 'translate(-50%,-50%) scale(1) rotate(0deg)', opacity: 1, offset: .5 },
    { transform: `translate(calc(-50% + ${b.x - a.x}px), calc(-50% + ${b.y - a.y}px)) scale(.2) rotate(360deg)`, opacity: 1 },
  ], { duration: 1300, easing: 'cubic-bezier(.5,0,.4,1)', fill: 'forwards' });
  gerbe(depuis, 10);
  vol.onfinish = () => { s.remove(); e.style.visibility = ''; allumer(); };
  setTimeout(() => { if (e.style.visibility) { e.style.visibility = ''; allumer(); } }, 1600); // filet de sécurité
}

/** les étoiles perdues (indices de..de+nb-1 dans l'en-tête) pâlissent et tombent doucement */
export function perte(dots, de, nb = 2) {
  if (!dots || calme()) return;
  const c = calque(1100);
  for (let k = 0; k < nb; k++) {
    const e = dots.children[de + k]; if (!e) continue;
    const { x, y } = centre(e);
    etoile(c, x, y, 20, '#f2a900').animate([
      { transform: 'translate(-50%,-50%)', opacity: 1, filter: 'grayscale(0)' },
      { transform: `translate(-50%, calc(-50% + 46px)) rotate(${k ? 40 : -40}deg) scale(.7)`, opacity: 0, filter: 'grayscale(1)' },
    ], { duration: 900, delay: k * 120, easing: 'ease-in', fill: 'both' });
  }
}

/** pose une classe le temps d'une animation CSS (éclat vert, tremblement, reflet…) */
export function anime(el, classe, duree = 700) {
  if (!el) return;
  el.classList.remove(classe); void el.offsetWidth; el.classList.add(classe);
  setTimeout(() => el.classList.remove(classe), duree);
}

/** baguette magique : une grande 🪄 s'agite au-dessus de l'élément puis lance un sort d'étincelles
 *  qui s'envolent en spirale vers le haut de l'écran (message envoyé par le bouton Signaler) */
export function sort(depuis) {
  if (!depuis || calme()) return;
  const { x, y } = centre(depuis), c = calque(2400);
  const b = etoile(c, x, y, 84, '#000', '🪄');
  b.style.textShadow = '0 0 18px rgba(180, 120, 255, .9)';
  b.animate([
    { transform: 'translate(-50%,-50%) scale(.2) rotate(-40deg)', opacity: 0 },
    { transform: 'translate(-50%,-50%) scale(1.1) rotate(-35deg)', opacity: 1, offset: .2 },
    { transform: 'translate(-50%,-50%) scale(1.1) rotate(25deg)', opacity: 1, offset: .38 },
    { transform: 'translate(-50%,-50%) scale(1.1) rotate(-20deg)', opacity: 1, offset: .52 },
    { transform: 'translate(-50%,-50%) scale(1) rotate(30deg)', opacity: 1, offset: .66 },
    { transform: 'translate(-50%,-50%) scale(.6) rotate(30deg)', opacity: 0 },
  ], { duration: 1600, easing: 'ease-in-out', fill: 'forwards' });
  // les étincelles partent du bout de la baguette (en haut à droite) au moment du coup de baguette
  const COUL = ['#b07cff', '#ffd23f', '#ff7ad9', '#7cd6ff', '#ffffff'], CAR = ['✦', '✧', '★', '✨', '·'];
  const bx = x + 30, by = y - 34;
  for (let i = 0; i < 26; i++) {
    const a = hasard(-2.4, -0.5), r = hasard(120, 320), tourne = hasard(-1, 1) * 90;
    const s = etoile(c, bx, by, hasard(14, 30), COUL[i % COUL.length], CAR[i % CAR.length]);
    s.style.textShadow = '0 0 8px currentColor';
    s.animate([
      { transform: 'translate(-50%,-50%) scale(.2)', opacity: 0 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * r * .5 + tourne * .3}px), calc(-50% + ${Math.sin(a) * r * .5}px)) scale(1.2) rotate(${tourne}deg)`, opacity: 1, offset: .4 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * r + tourne}px), calc(-50% + ${Math.sin(a) * r - 120}px)) scale(.3) rotate(${tourne * 3}deg)`, opacity: 0 },
    ], { duration: hasard(1100, 1700), delay: 520 + hasard(0, 300), easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' });
  }
}
