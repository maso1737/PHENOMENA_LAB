// PH-COLOR と PH-W1 の法則を既知の値と照合する： node wave/_tools/check_w1.cjs
const C = require('../_law/ph_color.js'), W = require('../_law/ph_w1_law.js');
const rows = [];
const near = (name, got, want, tol) => rows.push([Math.abs(got - want) <= tol ? 'OK ' : 'NG ', name, (+got).toFixed(4), 'want ' + want + ' ±' + tol]);
const ok = (name, cond, info) => rows.push([cond ? 'OK ' : 'NG ', name, info, '']);

// 等色関数の近似（CIE 1931 表の値と比べる）
near('ȳ(555) 表 1.0000', C.cmf(555).y, 1.0, 0.02);
near('x̄(600) 表 1.0622', C.cmf(600).x, 1.0622, 0.03);
near('z̄(450) 表 1.7721', C.cmf(450).z, 1.7721, 0.06);
near('x̄(450) 表 0.3362', C.cmf(450).x, 0.3362, 0.03);
// 両端の色度（CIE 1931 表：700 nm (0.7347, 0.2653)・400 nm (0.1733, 0.0048)・380 nm (0.1741, 0.0050)）
const ch1 = l => { const c = C.cmf(l); return C.chroma({ X: c.x, Y: c.y, Z: c.z }); };
near('700 nm の色度 x', ch1(700).x, 0.7347, 0.01); near('700 nm の色度 y', ch1(700).y, 0.2653, 0.01);
near('750 nm の色度 x', ch1(750).x, 0.7347, 0.01);
near('400 nm の色度 x', ch1(400).x, 0.1733, 0.01); near('400 nm の色度 y', ch1(400).y, 0.0048, 0.01);
near('380 nm の色度 x', ch1(380).x, 0.1741, 0.01);
near('650 nm の色度 x（表 0.7260）', ch1(650).x, 0.7260, 0.015); near('450 nm の色度 x（表 0.1566）', ch1(450).x, 0.1566, 0.015);
// 白：等エネルギーの光は色度 (1/3, 1/3)
const ee = C.chroma(C.xyzOf(W.PRESETS.WHITE()));
near('等エネルギーの白 x', ee.x, 0.3333, 0.006); near('等エネルギーの白 y', ee.y, 0.3333, 0.006);
// 黒体の色度（プランク軌跡の表）
const bb = T => C.chroma(C.xyzOf(new Float32Array(C.N).map((_, i) => C.planck(C.lam(i), T))));
const a = bb(2856), d = bb(6504);
near('2856 K（光源 A）x 0.4476', a.x, 0.4476, 0.008); near('2856 K y 0.4074', a.y, 0.4074, 0.008);
near('6504 K x 0.3135', d.x, 0.3135, 0.008); near('6504 K y 0.3237', d.y, 0.3237, 0.008);
// sRGB：D65 の色度・Y=1 の白が (1,1,1) 付近
const Xd = 0.3127 / 0.3290, Zd = (1 - 0.3127 - 0.3290) / 0.3290, lin = C.toLin({ X: Xd, Y: 1, Z: Zd });
near('D65 白 → R', lin[0], 1, 0.01); near('D65 白 → G', lin[1], 1, 0.01); near('D65 白 → B', lin[2], 1, 0.01);
// 589 nm は黄（橙寄り）：R が最大、G が R の 6 割以上、B ほぼ 0
const y589 = C.lightColor(C.xyzOf(W.PRESETS.SODIUM())).rgb;
ok('589 nm は黄〜橙 (R 最大・G は R の 4 割以上・B ほぼ 0)', y589[0] >= y589[1] && y589[1] > 0.4 * y589[0] && y589[2] < 0.15, y589.map(v => v.toFixed(2)).join(','));
// 受け手の山（Hunt–Pointer–Estévez の近似）：L 約 570・M 約 540・S 約 445
near('L の山 nm', C.CONE_PEAK[0], 570, 15); near('M の山 nm', C.CONE_PEAK[1], 543, 15); near('S の山 nm', C.CONE_PEAK[2], 445, 10);
// 光 → 音
near('700 nm → Hz', W.toHz(700), 389.5, 0.2); near('380 nm → Hz', W.toHz(380), 717.6, 0.2);
near('見える範囲 380–750 nm（オクターブ）', W.OCT_EYE, 0.98, 0.01); near('400–700 nm（オクターブ）', W.OCT_EYE_CORE, 0.807, 0.002);
near('耳 20 Hz–20 kHz（オクターブ）', W.OCT_EAR, 9.97, 0.01);
const n589 = W.note(W.toHz(589)); ok('589 nm → A#4 −12¢ 付近', n589.name === 'A#4' && Math.abs(n589.cents + 12) <= 2, n589.name + ' ' + n589.cents + '¢ ' + W.toHz(589).toFixed(1) + ' Hz');
// 黄色 1 本 ＝ 赤＋緑 2 本（同じ XYZ）
const M = W.MET, A = C.xyzOf(W.PRESETS.SODIUM());
const sB = new Float32Array(C.N); sB[W.idx(M.lR)] = M.aR; sB[W.idx(M.lG)] = M.aG; const B = C.xyzOf(sB);
ok('緑の波長（520〜560 nm・色度の差 ≤ 0.0015）', M.lG >= 520 && M.lG <= 560 && M.dxy <= 0.0015, M.lG + ' nm・色度の差 ' + M.dxy.toFixed(5));
near('A と B の X の差', (B.X - A.X) / A.X, 0, 1e-6); near('A と B の Y の差', (B.Y - A.Y) / A.Y, 0, 1e-6);
near('A と B の色度 x の差（見分けの目安 0.003）', C.chroma(B).x - C.chroma(A).x, 0, 0.0015); near('A と B の色度 y の差', C.chroma(B).y - C.chroma(A).y, 0, 0.0015);
const lA = C.lmsOf(W.PRESETS.SODIUM()), lB = C.lmsOf(sB), mxA = Math.max(...lA), mxB = Math.max(...lB);
ok('受け手 L・M・S の比が A と B で同じ（差 < 0.01）', lA.every((v, k) => Math.abs(v / mxA - lB[k] / mxB) < 0.01), lA.map(v => (v / mxA).toFixed(3)).join('/') + ' vs ' + lB.map(v => (v / mxB).toFixed(3)).join('/'));
const qa = W.qOf(W.PRESETS.SODIUM()) / lA[0], qb = W.qOf(sB) / lB[0];
ok('4 つ目の受け手（BREAK）なら A と B は違う（差 > 0.05）', Math.abs(qa - qb) > 0.05, qa.toFixed(3) + ' vs ' + qb.toFixed(3));
// 状態の境界
const st = k => W.spread(W.PRESETS[k]()).state;
ok('ナトリウム＝PURE・レーザー 2 本／LED／電球＝MIXED・太陽／白＝WHITE', st('SODIUM') === 'PURE' && st('LASER') === 'MIXED' && st('LED') === 'MIXED' && st('BULB') === 'MIXED' && st('SUN') === 'WHITE' && st('WHITE') === 'WHITE', ['SODIUM', 'LASER', 'LED', 'BULB', 'SUN', 'WHITE'].map(k => k + ':' + st(k) + '(' + W.spread(W.PRESETS[k]()).W.toFixed(0) + ' nm)').join(' '));
// 主波長
const dm = C.dominant(C.chroma(A)); ok('589 nm の主波長は 589 付近', dm.kind === 'spectral' && Math.abs(dm.l - 589) <= 2, dm.kind + ' ' + dm.l);
const mag = new Float32Array(C.N); mag[W.idx(450)] = 1; mag[W.idx(650)] = 1; const dmm = C.dominant(C.chroma(C.xyzOf(mag)));
ok('青＋赤＝赤紫（虹に無い）', dmm.kind === 'purple', dmm.kind + ' 補色 ' + dmm.l + ' nm');

console.log(rows.map(r => r.join('  ')).join('\n'));
console.log('\n黄色 1 本と同じ色の 2 本：赤 ' + M.lR + ' nm × ' + M.aR.toFixed(3) + ' ＋ 緑 ' + M.lG + ' nm × ' + M.aG.toFixed(3) + '（Z の差は明るさ Y の ' + ((B.Z - A.Z) / A.Y * 100).toFixed(2) + ' %）');
process.exitCode = rows.some(r => r[0] === 'NG ') ? 1 : 0;
