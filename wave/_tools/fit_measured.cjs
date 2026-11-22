/* 実測の顔料（CHSOS Pigments Checker・アクリル・厚紙の上で測った反射率）から、ニッカーのポスターカラー 12 色を組み立てる。
   node wave/_tools/fit_measured.cjs
   1. _assets/chsos_pigments/spectra/*.txt（波長 nm・反射率 %）を ±3 nm でならして 380〜750 nm の 1 nm 刻みにする
   2. 全部の顔料に同じ倍率を 1 回だけ掛ける（データの白の基準合わせ：チタン白が POSTER BG の白に合う倍率）
   3. 各色は「ニッカーがその色に入れている顔料（Blick の顔料表示）」の実測をクベルカ–ムンクで混ぜ、
      混ぜる割合だけを動かして、昼光の下で POSTER BG の hex に合わせる（形は一切いじらない＝山や段の位置は実測のまま）
   4. ph_pigment.js の <<MEASURED>> と <<RECIPES>> を書き直す */
const fs = require('fs'), path = require('path');
const FILE = path.join(__dirname, '../_law/ph_pigment.js');
const DIR = path.join(__dirname, '../_assets/chsos_pigments/spectra');
const PG = require('../_law/ph_pigment.js');
const C = require('../_law/ph_color.js');
const { N, lam } = C;
const { render, E_DAY, hexLin, labOfLin, dE, PIGMENTS, ks, kmR } = PG;

// ── 1. 読む・ならす
function load(name) {
  const pts = fs.readFileSync(path.join(DIR, name + '.txt'), 'utf8').trim().split(/\r?\n/).map(l => l.trim().split(/\s+/).map(Number)).filter(p => p.length >= 2 && isFinite(p[0]) && isFinite(p[1]));
  const out = new Float64Array(N);
  for (let i = 0; i < N; i++) { const l = lam(i); let s = 0, w = 0; for (const [x, y] of pts) { const d = x - l; if (Math.abs(d) <= 6) { const g = Math.exp(-0.5 * (d / 3) ** 2); s += g * y; w += g; } } out[i] = s / w / 100; }
  return out;
}
// ニッカーの顔料（Blick の各色ページの Pigment Information）と、このデータでの名前
const PIG = {
  PW6: 'titanium white', PY3: 'PY 3 - hansa yellow 10G', ARY: 'arylide yellow', NAP: 'naphthol red', PR81: 'PR 81 - rhodamine 6G',
  PB15: 'phthalo blue', PB36: 'cobalt cerulean b', PB29: 'ultramarine b art', PG7: 'phthalo green', PY42: 'yellow ochre', PBr7: 'burnt sienna'
};
const RAW = {}; for (const k in PIG) RAW[k] = load(PIG[k]);

// ── 2. 白の基準合わせ（全部に同じ倍率）
const labHex = h => labOfLin(hexLin(h));
const labOfR = R => labOfLin(render(R, E_DAY, 0).lin.map(v => Math.max(0, v)));
const WHITE_HEX = PIGMENTS.find(p => p.id === 'WHITE').hex;
let gain = 1; { let best = 1e9; for (let g = 0.9; g <= 1.4; g += 0.0005) { const R = RAW.PW6.map(v => Math.min(0.97, v * g)); const d = dE(labOfR(R), labHex(WHITE_HEX)); if (d < best) { best = d; gain = g; } } }
const SP = {}; for (const k in RAW) SP[k] = RAW[k].map(v => Math.min(0.97, Math.max(0.003, v * gain)));

// ── 3. 混ぜる割合を合わせる
//   of：使う顔料・ci：ニッカーの表示・sub：データに無いので代わりに使った顔料（正直に書く）
const DEF = {
  WHITE:       { of: ['PW6'], ci: 'PW6', note: 'Nicker White＝PW6(+PW4)' },
  LEMON:       { of: ['PY3', 'PW6'], ci: 'PY3+PW6', note: 'Nicker Lemon Yellow' },
  YELLOW_DEEP: { of: ['ARY', 'NAP', 'PY3', 'PW6'], ci: 'PY2+PY1+PO13', sub: 'PY2/PO13 は無い→アリライドイエロー＋ナフトールレッドで代用', note: 'Nicker Chrome Deep' },
  VERMILION:   { of: ['NAP', 'ARY', 'PW6'], ci: 'PO16+PR22', sub: 'PO16 は無い→アリライドイエローで橙に寄せた', note: 'Nicker Vermilion（PR22＝ナフトールレッド）' },
  ROSE:        { of: ['PR81', 'PW6'], ci: 'PR81', note: 'Nicker Brilliant Rose' },
  MAUVE:       { of: ['PR81', 'PB29', 'PW6'], ci: 'PV3', sub: 'PV3（メチルバイオレット）は無い→ローダミン＋ウルトラマリンで代用', note: 'Nicker Mauve' },
  CERULEAN:    { of: ['PB15', 'PB36', 'PG7', 'PW6'], ci: 'PB15:3+PW6', sub: 'フタロブルーの原液は暗すぎて形が測れていない→本物のセルリアン顔料（PB36）の測定で補った', note: 'Nicker Cerulean Blue' },
  COBALT:      { of: ['PB29', 'PB15', 'PW6'], ci: 'PB29', note: 'Nicker Cobalt Blue（中身はウルトラマリン）' },
  ULTRAMARINE: { of: ['PB29', 'PW6'], ci: 'PB29', note: 'Nicker Ultramarine' },
  P_GREEN:     { of: ['PG7', 'PY3', 'PW6'], ci: 'PG7+PY3', note: 'Nicker Viridian 系' },
  Y_OCHRE:     { of: ['PY42', 'PW6'], ci: 'PY42', note: 'Nicker Yellow Ocher' },
  B_SIENNA:    { of: ['PBr7', 'PW6'], ci: 'PBr7', note: 'Nicker Burnt Sienna' }
};
function nelder(fn, x0, step, iters = 1500) {
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
const toW = x => { const e = x.map(v => Math.exp(v)), s = e.reduce((a, b) => a + b, 0); return e.map(v => v / s); };
/* 実測の高さの補正（形はそのまま）：顔料ごとに「底上げ」o を引いて g 倍する＝ R' = (R − o)·g
   底上げ＝表面の照り返しや薄塗りで透けた下地（ナフトールレッドは 16% の床・フタロブルーは 2% の床）。サンダーソン補正の代わり。
   o と g には罰（小さく保つ）を付け、混ぜる割合と一緒に合わせる。白（PW6）は補正しない */
const minOf = a => a.reduce((m, v) => Math.min(m, v), 1);
const adj = (p, o, g) => SP[p].map(v => Math.min(0.97, Math.max(0.002, (v - o) * g)));
const mixR = (Rs, w) => { const R = new Float64Array(N); for (let i = 0; i < N; i++) { let k = 0; Rs.forEach((r, j) => { k += w[j] * ks(r[i]); }); R[i] = kmR(k); } return R; };
const sig = x => 1 / (1 + Math.exp(-x));
function decode(of, x) {
  const n = of.length, w = n > 1 ? toW(x.slice(0, n)) : [1]; let k = n > 1 ? n : 0; const o = [], g = [];
  for (const p of of) { if (p === 'PW6') { o.push(0); g.push(1); continue; } o.push(sig(x[k++]) * (minOf(SP[p]) - 0.002)); g.push(Math.exp(x[k++])); }
  return { w, o, g };
}
function fitMix(of, hex) {
  const T = labHex(hex), np = (of.length > 1 ? of.length : 0) + 2 * of.filter(p => p !== 'PW6').length;
  const fn = x => { const d = decode(of, x); let pen = 0; d.g.forEach((g, j) => { pen += 3 * Math.log(g) ** 2; }); d.o.forEach((o, j) => { pen += 6 * o; });
    return dE(labOfR(mixR(of.map((p, j) => adj(p, d.o[j], d.g[j])), d.w)), T) + pen; };
  let best = null; for (let t = 0; t < 12; t++) { const x0 = Array.from({ length: np }, (_, i) => (Math.random() - 0.5) * (i < of.length && of.length > 1 ? 6 : 2)); const q = nelder(fn, x0, x0.map(() => 1), 2500); if (!best || q.f < best.f) best = q; }
  const d = decode(of, best.x), R = mixR(of.map((p, j) => adj(p, d.o[j], d.g[j])), d.w);
  return { ...d, R, f: dE(labOfR(R), T) };
}
const MEASURED = {}, report = [];
const r4 = v => Math.round(v * 1e4) / 1e4;
for (const p of PIGMENTS) {
  const d = DEF[p.id], q = fitMix(d.of, p.hex), R = q.R;
  const R5 = []; for (let l = 380; l <= 750; l += 5) R5.push(r4(R[l - 380]));
  const w = {}; d.of.forEach((k, i) => { if (q.w[i] > 5e-4) w[k] = r4(q.w[i]); });
  const fix = {}; d.of.forEach((k, i) => { if (k !== 'PW6' && q.w[i] > 5e-4) fix[k] = { floor: r4(q.o[i]), gain: r4(q.g[i]) }; });
  MEASURED[p.id] = { ci: d.ci, from: w, fix, sub: d.sub || '', note: d.note, R5 };
  report.push([p.id, p.hex, render(R, E_DAY, 0).hex, q.f.toFixed(2), JSON.stringify(w) + ' ' + Object.entries(fix).map(([k, v]) => k + ' 床' + v.floor.toFixed(3) + '×' + v.gain.toFixed(2)).join(' ')]);
}

// ── 4. 書き戻して、混色の見本も実測の絵具で合わせ直す
let src = fs.readFileSync(FILE, 'utf8');
src = src.replace(/\/\* <<MEASURED>> \*\/[\s\S]*?\/\* <<\/MEASURED>> \*\//, '/* <<MEASURED>> */\n  const MEASURED_GAIN = ' + r4(gain) + ';\n  const MEASURED = ' + JSON.stringify(MEASURED) + ';\n  /* <</MEASURED>> */');
fs.writeFileSync(FILE, src);
delete require.cache[require.resolve('../_law/ph_pigment.js')];
const PG2 = require('../_law/ph_pigment.js');
const RECIPE_DEF = [
  { id: 'SKY', hex: '#86C8EC', en: 'SKY', jp: 'スカイブルー', of: ['CERULEAN', 'WHITE', 'COBALT', 'P_GREEN'] },
  { id: 'LAVENDER', hex: '#A7A3D4', en: 'LAVENDER', jp: 'ラベンダー', of: ['ULTRAMARINE', 'ROSE', 'WHITE', 'MAUVE'] },
  { id: 'INDIGO', hex: '#283450', en: 'INDIGO', jp: 'インジゴ', of: ['ULTRAMARINE', 'B_SIENNA', 'P_GREEN', 'WHITE', 'COBALT', 'CERULEAN'] },
  { id: 'OLIVE', hex: '#6F7B2F', en: 'OLIVE', jp: 'オリーブグリーン', of: ['P_GREEN', 'Y_OCHRE', 'LEMON', 'B_SIENNA', 'ULTRAMARINE', 'YELLOW_DEEP', 'VERMILION'] }
];
const RECIPES = [];
const labOfR2 = R => labOfLin(PG2.render(R, PG2.E_DAY, 0).lin.map(v => Math.max(0, v)));
for (const r of RECIPE_DEF) {
  const T = labHex(r.hex);
  const fn = x => { const w = new Array(PG2.NP).fill(0); toW(x).forEach((v, i) => { w[PG2.PID[r.of[i]]] = v; }); return dE(labOfR2(PG2.mixRefl(w)), T); };
  let best = null; for (let t = 0; t < 14; t++) { const q = nelder(fn, r.of.map(() => (Math.random() - 0.5) * 4), r.of.map(() => 1)); if (!best || q.f < best.f) best = q; }
  const w = toW(best.x), o = {}; r.of.forEach((k, i) => { if (w[i] > 5e-4) o[k] = r4(w[i]); });
  RECIPES.push({ id: r.id, hex: r.hex, en: r.en, jp: r.jp, w: o });
  report.push([r.id, r.hex, PG2.render(PG2.mixRefl(PG2.vec(o)), PG2.E_DAY, 0).hex, best.f.toFixed(2), JSON.stringify(o)]);
}
src = fs.readFileSync(FILE, 'utf8');
src = src.replace(/\/\* <<RECIPES>> \*\/[\s\S]*?\/\* <<\/RECIPES>> \*\//, '/* <<RECIPES>> */\n  const RECIPES = ' + JSON.stringify(RECIPES) + ';\n  /* <</RECIPES>> */');
fs.writeFileSync(FILE, src);
console.log('白の基準合わせの倍率 ' + gain.toFixed(4));
console.log('id            target   fitted   ΔE76  混ぜた割合');
for (const r of report) console.log(r[0].padEnd(13), r[1], r[2], r[3].padStart(6), ' ', r[4]);
