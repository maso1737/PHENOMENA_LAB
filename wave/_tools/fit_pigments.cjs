/* 絵具の返す割合の形を、POSTER BG のパレットの hex に「昼光の下で」合わせて、ph_pigment.js の FIT / RECIPES を書き直す。
   node wave/_tools/fit_pigments.cjs
   形の初期値（顔料らしい段・山の位置）から大きく離れないよう、ずれに罰を付けたネルダー–ミードで合わせる。 */
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, '../_law/ph_pigment.js');
const PG = require('../_law/ph_pigment.js');
const { reflOf, render, E_DAY, hexLin, labOfLin, dE, PIGMENTS, PAPER, mixRefl, PID, NP } = PG;
PG.setSource('shape');   // 目安の形を合わせる（実測の絵具は fit_measured.cjs）

// 初期の形（顔料の種類ごとの目安）。[位置, 幅, 高さ]
const INIT = {
  WHITE:       { base: 0.30, step: [[405, 7, 0.60]], slope: 0.005 },
  LEMON:       { base: 0.05, step: [[505, 14, 0.80]] },
  YELLOW_DEEP: { base: 0.05, step: [[560, 16, 0.82]] },
  VERMILION:   { base: 0.05, step: [[596, 9, 0.75]] },
  ROSE:        { base: 0.08, step: [[600, 14, 0.65]], bump: [[420, 25, 0.15]] },
  MAUVE:       { base: 0.05, step: [[640, 25, 0.30]], bump: [[430, 30, 0.30]] },
  CERULEAN:    { base: 0.04, bump: [[480, 45, 0.50]] },
  COBALT:      { base: 0.03, step: [[700, 20, 0.15]], bump: [[455, 32, 0.45]] },
  ULTRAMARINE: { base: 0.02, step: [[690, 20, 0.25]], bump: [[445, 25, 0.35]] },
  P_GREEN:     { base: 0.03, bump: [[525, 30, 0.30]] },
  Y_OCHRE:     { base: 0.07, step: [[555, 25, 0.50]] },
  B_SIENNA:    { base: 0.05, step: [[600, 35, 0.30]] },
  PAPER:       { base: 0.62, step: [[400, 12, 0.25]], slope: 0.01 }
};
// 平らにする／戻す（各数値と、その「動いてよい大きさ」）
function flat(f) { const v = [], s = []; v.push(f.base); s.push(0.05);
  for (const t of f.step || []) { v.push(...t); s.push(6, 4, 0.08); }
  for (const t of f.bump || []) { v.push(...t); s.push(6, 5, 0.08); }
  if (f.slope != null) { v.push(f.slope); s.push(0.01); } return { v, s }; }
function unflat(f, v) { let k = 0; const o = { base: v[k++] };
  if (f.step) o.step = f.step.map(() => [v[k++], Math.max(2, v[k++]), v[k++]]);
  if (f.bump) o.bump = f.bump.map(() => [v[k++], Math.max(4, v[k++]), v[k++]]);
  if (f.slope != null) o.slope = v[k++]; return o; }

function nelder(fn, x0, step, iters = 4000) {
  const n = x0.length; let P = [x0.slice()];
  for (let i = 0; i < n; i++) { const x = x0.slice(); x[i] += step[i]; P.push(x); }
  let F = P.map(fn);
  for (let it = 0; it < iters; it++) {
    const o = F.map((f, i) => i).sort((a, b) => F[a] - F[b]); P = o.map(i => P[i]); F = o.map(i => F[i]);
    const c = new Array(n).fill(0); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) c[j] += P[i][j] / n;
    const at = t => c.map((v, j) => v + t * (P[n][j] - v));
    const xr = at(-1), fr = fn(xr);
    if (fr < F[0]) { const xe = at(-2), fe = fn(xe); if (fe < fr) { P[n] = xe; F[n] = fe; } else { P[n] = xr; F[n] = fr; } }
    else if (fr < F[n - 1]) { P[n] = xr; F[n] = fr; }
    else { const xc = at(0.5), fc = fn(xc); if (fc < F[n]) { P[n] = xc; F[n] = fc; } else { for (let i = 1; i <= n; i++) { P[i] = P[i].map((v, j) => P[0][j] + 0.5 * (v - P[0][j])); F[i] = fn(P[i]); } } }
  }
  const b = F.indexOf(Math.min(...F)); return { x: P[b], f: F[b] };
}
const labHex = h => labOfLin(hexLin(h));
const labOfR = R => labOfLin(render(R, E_DAY, 0).lin.map(v => Math.max(0, v)));

const FIT = {}, report = [];
for (const p of [...PIGMENTS, PAPER]) {
  const init = INIT[p.id], { v, s } = flat(init), T = labHex(p.hex);
  const fn = x => { const f = unflat(init, x); let reg = 0; for (let i = 0; i < x.length; i++) reg += ((x[i] - v[i]) / s[i]) ** 2; return dE(labOfR(reflOf(f)), T) + (p.id === 'CERULEAN' ? 0.03 : 0.15) * reg; };
  let r = nelder(fn, v, s.map(q => q * 0.5)); r = nelder(fn, r.x, s.map(q => q * 0.2));
  const f = unflat(init, r.x), round = a => Array.isArray(a) ? a.map(round) : Math.round(a * 1e4) / 1e4;
  for (const k in f) f[k] = round(f[k]);
  FIT[p.id] = f;
  report.push([p.id, p.hex, render(reflOf(f), E_DAY, 0).hex, dE(labOfR(reflOf(f)), T).toFixed(2)]);
}
PG.setFit(FIT);

// 混ぜた色：量（合計 1）を合わせる
const RECIPE_DEF = [
  { id: 'SKY', hex: '#86C8EC', en: 'SKY', jp: 'スカイブルー', of: ['CERULEAN', 'WHITE', 'COBALT', 'P_GREEN'] },
  { id: 'LAVENDER', hex: '#A7A3D4', en: 'LAVENDER', jp: 'ラベンダー', of: ['ULTRAMARINE', 'ROSE', 'WHITE'] },
  { id: 'INDIGO', hex: '#283450', en: 'INDIGO', jp: 'インジゴ', of: ['ULTRAMARINE', 'B_SIENNA', 'P_GREEN', 'WHITE', 'COBALT'] },
  { id: 'OLIVE', hex: '#6F7B2F', en: 'OLIVE', jp: 'オリーブグリーン', of: ['P_GREEN', 'Y_OCHRE', 'LEMON', 'B_SIENNA', 'ULTRAMARINE', 'YELLOW_DEEP'] }
];
const RECIPES = [];
for (const r of RECIPE_DEF) {
  const T = labHex(r.hex);
  const toW = x => { const e = x.map(v => Math.exp(v)), s = e.reduce((a, b) => a + b, 0); return e.map(v => v / s); };
  const fn = x => { const w = new Array(NP).fill(0); toW(x).forEach((v, i) => { w[PID[r.of[i]]] = v; }); return dE(labOfR(mixRefl(w)), T); };
  let best = null;
  for (let t = 0; t < 14; t++) { const x0 = r.of.map(() => (Math.random() - 0.5) * 4); const q = nelder(fn, x0, r.of.map(() => 1), 1500); if (!best || q.f < best.f) best = q; }
  const w = toW(best.x), o = {}; r.of.forEach((k, i) => { o[k] = Math.round(w[i] * 1e4) / 1e4; });
  RECIPES.push({ id: r.id, hex: r.hex, en: r.en, jp: r.jp, w: o });
  report.push([r.id, r.hex, render(mixRefl(PG.vec(o)), E_DAY, 0).hex, best.f.toFixed(2)]);
}

let src = fs.readFileSync(FILE, 'utf8');
src = src.replace(/\/\* <<FIT>> \*\/[\s\S]*?\/\* <<\/FIT>> \*\//, '/* <<FIT>> */\n  const FIT = ' + JSON.stringify(FIT) + ';\n  /* <</FIT>> */');
src = src.replace(/\/\* <<RECIPES>> \*\/[\s\S]*?\/\* <<\/RECIPES>> \*\//, '/* <<RECIPES>> */\n  const RECIPES = ' + JSON.stringify(RECIPES) + ';\n  /* <</RECIPES>> */');
fs.writeFileSync(FILE, src);
console.log('id            target   fitted   ΔE76');
for (const r of report) console.log(r[0].padEnd(13), r[1], r[2], r[3].padStart(6));
