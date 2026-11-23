/* W6 RAINBOW の照合：node wave/_tools/check_w6.cjs */
const W = require('../_law/ph_w6_law.js'), W4 = require('../_law/ph_w4_law.js'), C = require('../_law/ph_color.js');
let ok = 0, ng = 0;
const chk = (name, v, cond, note) => { const p = !!cond; p ? ok++ : ng++; console.log((p ? 'OK ' : 'NG ') + name + ' : ' + v + (note ? '  （' + note + '）' : '')); };
const n = l => W.nWater(l);

const maxErr = Math.max(...W.N_TABLE.map(([l, v]) => Math.abs(n(l) - v)));
chk('屈折率の式と表の差（最大）', maxErr.toExponential(1), maxErr < 3e-4, '小数 4 桁の表なので 3e-4 以内');
chk('赤 700 nm の屈折率', n(700).toFixed(4), Math.abs(n(700) - 1.331) < 0.002, 'HANDOFF：赤 1.331');
chk('紫 400 nm の屈折率', n(400).toFixed(4), Math.abs(n(400) - 1.343) < 0.002, 'HANDOFF：紫 1.343');
chk('主虹 赤（n 1.331）', W.bowDeg(1.331, 1).toFixed(2) + '°', Math.abs(W.bowDeg(1.331, 1) - 42.4) < 0.15, 'HANDOFF：42.4°');
chk('主虹 紫（n 1.343）', W.bowDeg(1.343, 1).toFixed(2) + '°', Math.abs(W.bowDeg(1.343, 1) - 40.6) < 0.15, 'HANDOFF：40.6°');
const p7 = W.bowDeg(n(700), 1), p4 = W.bowDeg(n(400), 1), s7 = W.bowDeg(n(700), 2), s4 = W.bowDeg(n(400), 2);
chk('主虹は赤が外側', '赤 ' + p7.toFixed(2) + '° ＞ 紫 ' + p4.toFixed(2) + '°', p7 > p4);
chk('副虹は約 51°・色の順が逆', '赤 ' + s7.toFixed(2) + '° ＜ 紫 ' + s4.toFixed(2) + '°', s7 < s4 && s7 > 49.5 && s4 < 54.5, 'SPEC_01：約 51°・順が逆');
chk('アレキサンダーの暗い帯の幅', (s7 - p7).toFixed(2) + '°', s7 - p7 > 7 && s7 - p7 < 9, '主虹の外と副虹の内の間 約 8°');
// 最小偏角：b を細かく振った最小と式の値
{ const nn = n(589.3); let mn = 1e9, bm = 0; for (let b = 0; b <= 1; b += 1e-5) { const d = W.devDeg(b, nn, 1); if (d < mn) { mn = d; bm = b; } }
  chk('最小偏角の高さ b₀（式 ⇄ 総当たり）', W.rainbowB(nn, 1).toFixed(4) + ' ⇄ ' + bm.toFixed(4), Math.abs(W.rainbowB(nn, 1) - bm) < 1e-3, 'cos²i = (n²−1)/3');
  chk('最小偏角 D（589 nm）', mn.toFixed(2) + '°', Math.abs(mn - 137.8) < 0.3, '教科書の 138°'); }
// 光が集まる：b を一様に振ったとき、θ が虹の角 ±1° に入る光の割合
{ const nn = n(589.3), th0 = W.bowDeg(nn, 1); let inB = 0, N = 100000; for (let q = 0; q < N; q++) { const b = (q + 0.5) / N, t = W.thetaDeg(b, nn, 1); if (t > th0 - 1) inB++; }
  chk('虹の角から内へ 1° の帯に入る光', (inB / N * 100).toFixed(1) + ' %', inB / N > 0.096, '一様なら 1°/42° ＝ 2.4 % の 4 倍以上 → 最小偏角に集まる'); }
// rayPath：出る向きと D が合う
{ const r = W.rayPath(0.86, 1.333, 1), a = Math.atan2(r.out[1], r.out[0]) * 180 / Math.PI;
  chk('作図の出る向き（k=1）', a.toFixed(2) + '° ⇄ −D ' + (-r.D + 360).toFixed(2), Math.abs(((a + 360) % 360) - (360 - r.D)) < 1e-6);
  const e = r.pts[r.pts.length - 1]; chk('作図の点は粒の表面', Math.hypot(e[0], e[1]).toFixed(6), Math.abs(Math.hypot(e[0], e[1]) - 1) < 1e-9); }
chk('エアリー関数 Ai(0)', W.airy(0).toFixed(6), Math.abs(W.airy(0) - 0.355028) < 1e-6);
chk('エアリー関数 Ai(−1)', W.airy(-1).toFixed(6), Math.abs(W.airy(-1) - 0.535561) < 1e-5);
chk('エアリー関数 Ai(−6)（級数）', W.airy(-6).toFixed(5), Math.abs(W.airy(-6) - (-0.32915)) < 2e-4);
chk('エアリー関数 Ai(−10)（漸近）', W.airy(-10).toFixed(4), Math.abs(W.airy(-10) - 0.040241) < 1e-5);
chk('Ai(−2.338) は 0（最初の零点）', W.airy(-2.33811).toExponential(1), Math.abs(W.airy(-2.33811)) < 1e-4);
// 帯の太さ・状態
chk('境の大きさ', 'COLOR|PALE ' + W.A_COLOR.toFixed(3) + ' mm ／ PALE|WHITE ' + W.A_WHITE.toFixed(3) + ' mm（半径）', W.A_WHITE > 0.03 && W.A_WHITE < 0.1 && W.A_COLOR > 0.2 && W.A_COLOR < 0.6, 'SPEC_01：約 0.05 mm 以下で白い虹');
chk('雨粒 1 mm は COLOR', W.stateOf(1), W.stateOf(1) === 'COLOR');
chk('霧の粒 0.02 mm は WHITE', W.stateOf(0.02), W.stateOf(0.02) === 'WHITE');
const th = []; for (let t = 30; t < 58; t += 0.05) th.push(t);
const peakOf = (a, l) => { const o = new Float64Array(th.length); W.bandOne(l, a, 1, false, th, o); let m = 0, k = 0; o.forEach((v, j) => { if (v > m) { m = v; k = j; } }); return th[k]; };
{ const big = peakOf(1, 550), fog = peakOf(0.02, 550);
  chk('白い虹は内側へ寄る（550 nm の山）', '1 mm ' + big.toFixed(2) + '° → 0.02 mm ' + fog.toFixed(2) + '°', fog < big - 1.5, '霧の虹は 2〜3° 小さい（観測）'); }
chk('過剰虹の間隔（0.25 mm）', W.supernumDeg(0.25).toFixed(2) + '°', W.supernumDeg(0.25) > 0.6 && W.supernumDeg(0.25) < 1.6, '粒が小さいほど広い');
chk('過剰虹は小さい粒ほど離れる', '0.5 mm ' + W.supernumDeg(0.5).toFixed(2) + '° ＜ 0.1 mm ' + W.supernumDeg(0.1).toFixed(2) + '°', W.supernumDeg(0.5) < W.supernumDeg(0.1));
// 色：大きい粒の虹の山の外側は赤・内側は紫〜青、霧の虹の山は白っぽい
{ const sun = W4.setup(20, W4.R_MIN).sun, T = W.bowTable(1, false, th, sun), T2 = W.bowTable(0.02, false, th, sun);
  const xyz = s => W4.xyz(s), dom = s => C.dominant(C.chroma(xyz(s)));
  const j = t => Math.round((t - 30) / 0.05), o = dom(T[j(42.5)]), i = dom(T[j(41.6)]);
  chk('主虹（1 mm）は外ほど赤い', '42.5° ' + o.l + ' nm ＞ 41.6° ' + i.l + ' nm', o.kind === 'spectral' && i.kind === 'spectral' && o.l > 600 && o.l - i.l > 30);
  const sx = C.chroma(xyz(sun)), dsun = s => { const c = C.chroma(xyz(s)); return Math.hypot(c.x - sx.x, c.y - sx.y); };
  const pk = TT => { let m = 0, k = 0; TT.forEach((r, q) => { const y = xyz(r).Y; if (y > m) { m = y; k = q; } }); return TT[k]; };
  chk('霧の虹（0.02 mm）の山は太陽の光と同じ色（白）', '太陽の光との色度の差 ' + dsun(pk(T2)).toFixed(3) + '（1 mm は ' + dsun(pk(T)).toFixed(3) + '）', dsun(pk(T2)) < 0.02 && dsun(pk(T)) > 0.08, '白い＝太陽の光の色のまま');
  const yi = xyz(T[j(35)]).Y, yo = xyz(T[j(46)]).Y;
  chk('主虹の内側の空は外側より明るい', (yi / Math.max(1e-12, yo)).toFixed(1) + ' 倍', yi > yo * 3, '暗い帯（外）は主虹の光が来ない'); }
// BREAK：分散が逆で色の順が逆
{ const r7 = W.bowDeg(W.nOf(700, true), 1), r4 = W.bowDeg(W.nOf(400, true), 1);
  chk('BREAK（分散が逆）：主虹の赤が内側', '赤 ' + r7.toFixed(2) + '° ＜ 紫 ' + r4.toFixed(2) + '°', r7 < r4); }
// 太陽の高さ：主虹の頂の高さ ＝ 虹の角 − 太陽の高さ
chk('太陽 42.5° を超えると主虹（赤）は地平線の下', (p7 - 43).toFixed(2) + '°', p7 - 43 < 0, 'SPEC_01：42° を超えると見えない');
console.log('\n' + ok + ' OK / ' + ng + ' NG');
process.exit(ng ? 1 : 0);
