// Arithmétique élémentaire.
export const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
export const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
/** fraction irréductible [n, d] avec d > 0 */
export const red = (n, d) => { const g = gcd(n, d) || 1; const s = d < 0 ? -1 : 1; return [s * n / g, s * d / g]; };
/** arrondi propre pour éviter 0,30000000000000004 */
export const r6 = x => Math.round(x * 1e6) / 1e6;
export const approx = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;
/** nombre de décimales (après arrondi à 1e-6) */
export const decimals = x => { const s = String(r6(Math.abs(x))); const i = s.indexOf('.'); return i < 0 ? 0 : s.length - i - 1; };
