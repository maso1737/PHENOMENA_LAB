/* RELIGHT POSTER の法則の照合：node wave/_tools/check_relight.cjs
   1. 絵具 12 色＋紙が、昼光で POSTER BG の色に合う（ΔE76）
   2. 画面（GPU）と同じ 32 帯の計算が、1 nm の計算と合う（全部の光 × 全部の絵具 × 目の慣れ 0／1）
   3. クベルカ–ムンクの性質（白を混ぜると明るく・青＋黄で緑・量 0 は紙）
   4. 光源を替えたときの見え方（このラボの主張）：水銀灯で赤が茶に化ける／ナトリウム灯で色が全部消える／CG の掛け算では起きない
   5. 夕日：太陽が低いほど赤い（エアマスが増える） */
const PG = require('../_law/ph_pigment.js');
const { PIGMENTS, PAPER, LIGHTS, LIGHT_ORDER, E_DAY, render, rgbMultiply, mixRefl, vec, bands, renderBands, viewMatrix, labOfLin, hexLin, dE, chromaOf, REFL_PAPER } = PG;
let ok = 0, ng = 0;
const check = (name, cond, info) => { (cond ? ok++ : ng++); console.log((cond ? 'OK ' : 'NG ') + name + (info ? '  ' + info : '')); };
const lab = r => labOfLin(r.lin.map(v => Math.max(0, v)));
const hue = l => (Math.atan2(l[2], l[1]) * 180 / Math.PI + 360) % 360;

console.log('── 1. 昼光で POSTER BG の色に合う');
for (const p of PIGMENTS) { const d = dE(lab(render(mixRefl(vec({ [p.id]: 1 })), E_DAY, 0)), labOfLin(hexLin(p.hex))); check(p.id.padEnd(12) + ' ' + p.hex, d < 2.5, 'ΔE ' + d.toFixed(2)); }
{ const d = dE(lab(render(REFL_PAPER, E_DAY, 0)), labOfLin(hexLin(PAPER.hex))); check('PAPER        ' + PAPER.hex, d < 1, 'ΔE ' + d.toFixed(2)); }
for (const r of PG.RECIPES) { const d = dE(lab(render(mixRefl(vec(r.w)), E_DAY, 0)), labOfLin(hexLin(r.hex))); console.log('   （混色の見本）' + r.id.padEnd(9) + r.hex + '  ΔE ' + d.toFixed(2) + '（3 色までの混ぜ方の限界。合否は付けない）'); }

console.log('── 2. 32 帯（画面の計算）と 1 nm の差');
let worst = 0, where = '';
const mixes = [...PIGMENTS.map(p => vec({ [p.id]: 1 })), vec({ CERULEAN: 0.5, LEMON: 0.5 }), vec({ VERMILION: 0.3, WHITE: 0.7 }), vec({ ULTRAMARINE: 0.6, B_SIENNA: 0.4 }).map(v => v * 0.6)];
for (const L of LIGHT_ORDER) { const E = LIGHTS[L].make(), B = bands(E);
  for (const ad of [0, 1]) { const M = viewMatrix(E, ad);
    mixes.forEach((w, i) => { const a = lab(render(mixRefl(w), E, ad)), b = labOfLin(renderBands(w, B, M).lin.map(v => Math.max(0, v))), d = dE(a, b); if (d > worst) { worst = d; where = L + ' adapt' + ad + ' mix#' + i; } }); } }
check('32 帯と 1 nm の差（最大）', worst < 1.5, 'ΔE ' + worst.toFixed(2) + '（' + where + '）');

console.log('── 3. 混ぜ方（クベルカ–ムンク）');
{ const v = lab(render(mixRefl(vec({ VERMILION: 1 })), E_DAY, 0)), t = lab(render(mixRefl(vec({ VERMILION: 0.2, WHITE: 0.8 })), E_DAY, 0));
  check('白を混ぜると明るくなる', t[0] > v[0] + 10, 'L ' + v[0].toFixed(0) + ' → ' + t[0].toFixed(0)); }
{ const g = lab(render(mixRefl(vec({ CERULEAN: 0.5, LEMON: 0.5 })), E_DAY, 0)), h = hue(g);
  check('青＋黄で緑（灰色にならない）', h > 120 && h < 200 && chromaOf(g) > 25, '色相 ' + h.toFixed(0) + '°・彩度 ' + chromaOf(g).toFixed(0)); }
{ const p = mixRefl(new Array(PG.NP).fill(0)); check('量 0 は紙', p.every((v, i) => v === REFL_PAPER[i])); }

console.log('── 4. 光源を替えたときの見え方（目の慣れ 50%）');
const AD = 0.5, V = vec({ VERMILION: 1 }), RV = mixRefl(V);
const day = lab(render(RV, E_DAY, 0));
{ const E = LIGHTS.MERCURY.make(), s = lab(render(RV, E, AD)), m = lab(rgbMultiply(RV, E, AD));
  check('水銀灯：赤が茶に化ける（色相が黄の側へ 25°以上）', Math.abs(hue(s) - hue(day)) > 25, '昼 ' + hue(day).toFixed(0) + '° → ' + hue(s).toFixed(0) + '°');
  check('水銀灯：CG の掛け算では赤のまま（ずれ 10°未満）', Math.abs(hue(m) - hue(day)) < 10, hue(m).toFixed(0) + '°'); }
{ const E = LIGHTS.SODIUM.make();
  const cs = PIGMENTS.map(p => { const r = mixRefl(vec({ [p.id]: 1 })); return { id: p.id, h: hue(lab(render(r, E, 1))), c: chromaOf(lab(render(r, E, 1))), cRGB: chromaOf(lab(rgbMultiply(r, E, 1))) }; });
  const maxC = Math.max(...cs.map(q => q.c));
  check('ナトリウム灯・目が慣れる：どの絵具も灰色（彩度 3 未満）', maxC < 3, '最大の彩度 ' + maxC.toFixed(2));
  const v = cs.find(q => q.id === 'VERMILION'); check('ナトリウム灯：CG の掛け算ならバーミリオンは赤のまま（彩度 50 以上）', v.cRGB > 50, '彩度 ' + v.cRGB.toFixed(0));
  const lumR = lab(render(RV, E, 1))[0], lumY = lab(render(mixRefl(vec({ YELLOW_DEEP: 1 })), E, 1))[0], lumG = lab(render(mixRefl(vec({ P_GREEN: 1 })), E, 1))[0];
  console.log('   ナトリウム灯の明るさ L：バーミリオン ' + lumR.toFixed(0) + '・イエローディープ ' + lumY.toFixed(0) + '・緑 ' + lumG.toFixed(0) + '（589 nm を返す量だけで決まる）'); }
{ const E = LIGHTS.DAY.make(), s = lab(render(RV, E, AD)); check('昼光：どの目の慣れでも昼光の色そのもの', dE(s, day) < 0.01, 'ΔE ' + dE(s, day).toFixed(4)); }
{ const E = LIGHTS.BULB.make(), m = lab(rgbMultiply(RV, E, 1)); check('CG の掛け算は「白く合わせる」と元に戻る（電球・慣れ 100%）', dE(m, day) < 0.5, 'ΔE ' + dE(m, day).toFixed(2)); }

console.log('── 5. 夕日');
{ const r = h => { const w = PG.whiteXYZ(PG.sunAt(h)); return w[0] / (w[0] + w[1] + w[2]); };
  check('太陽が低いほど赤い（色度 x：60° > 10° > 2°）', r(2) > r(10) && r(10) > r(60), 'x ' + [60, 10, 2].map(h => r(h).toFixed(3)).join(' → '));
  check('エアマス：真上 1・地平線で約 38', Math.abs(PG.airmass(90) - 1) < 0.01 && Math.abs(PG.airmass(0) - 38) < 1, PG.airmass(90).toFixed(3) + ' / ' + PG.airmass(0).toFixed(1)); }

console.log('\n' + ok + ' OK / ' + ng + ' NG');
process.exit(ng ? 1 : 0);
