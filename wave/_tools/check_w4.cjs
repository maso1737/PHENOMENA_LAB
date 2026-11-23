/* W4 SKY の照合：node wave/_tools/check_w4.cjs */
const C = require('../_law/ph_color.js'), W = require('../_law/ph_w4_law.js');
let ok = 0, ng = 0; const out = new Float64Array(W.NL);
const chk = (name, v, cond, note) => { const p = !!cond; p ? ok++ : ng++; console.log((p ? 'OK ' : 'NG ') + name + ' : ' + v + (note ? '  （' + note + '）' : '')); };
const sky = (S, az, el) => W.xyz(W.skyAt(S, az, el, out).slice());
const dom = x => C.dominant(C.chroma(x));
const pur = x => { const d = dom(x); return d.purity == null ? 0 : d.purity; };

chk('青 450 ÷ 赤 700 の散り方', W.blueRed().toFixed(2), W.blueRed() > 5.5 && W.blueRed() < 6.5, 'SPEC_01「約 6 倍」・(700/450)^4 = 5.86 に補正の項');
chk('空気の厚み τR(550 nm)', W.tauRay(550).toFixed(4), Math.abs(W.tauRay(550) - 0.097) < 0.003, '海面の目安 0.097');
chk('エアマス 天頂', W.airmass(90).toFixed(4), Math.abs(W.airmass(90) - 1) < 0.002);
chk('エアマス 地平線', W.airmass(0).toFixed(1), W.airmass(0) > 37 && W.airmass(0) < 39, 'Kasten–Young 約 38');
const noon = W.setup(60, W.R_MIN), dz = dom(sky(noon, 0, 89));
chk('昼（太陽 60°）の天頂は青', dz.kind + ' ' + dz.l + ' nm', dz.kind === 'spectral' && dz.l > 465 && dz.l < 495);
const yz = sky(noon, 0, 89).Y, yh = sky(noon, 90, 2).Y;
chk('地平線は天頂より明るい', (yh / yz).toFixed(2) + ' 倍', yh > yz, '一次散乱だけなので本物より控えめ');
chk('地平線は天頂より白っぽい', 'purity ' + pur(sky(noon, 90, 2)).toFixed(2) + ' < ' + pur(sky(noon, 0, 89)).toFixed(2), pur(sky(noon, 90, 2)) < pur(sky(noon, 0, 89)));
const set = W.setup(1, W.R_MIN), ds = dom(W.xyz(set.sun));
chk('夕日（太陽 1°）は赤〜橙', ds.kind + ' ' + ds.l + ' nm', ds.kind === 'spectral' && ds.l >= 590);
const dn = dom(W.xyz(noon.sun));
chk('昼の太陽の光は白に近い', dn.kind + ' purity ' + (dn.purity || 0).toFixed(2), dn.kind === 'white' || dn.purity < 0.25);
const zO = sky(W.setup(1, W.R_MIN), 180, 89), zN = sky(W.setup(1, W.R_MIN, false, { noO3: true }), 180, 89), cO = C.chroma(zO), cN = C.chroma(zN);
chk('オゾンで夕方の天頂が青く残る', 'x ' + cO.x.toFixed(3) + '（あり）< ' + cN.x.toFixed(3) + '（なし）', cO.x < cN.x, 'HANDOFF §5：入れないと夕焼けの空が弱い');
const pS = pur(sky(W.setup(60, W.R_MIN), 0, 89)), pB = pur(sky(W.setup(60, 2), 0, 89));
chk('粒が大きいと天頂が白く濁る', 'purity ' + pS.toFixed(2) + ' → ' + pB.toFixed(2), pB < pS * 0.8);
chk('境界：空気の大きさは BLUE', W.stateOf(W.R_MIN), W.stateOf(W.R_MIN) === 'BLUE');
chk('境界：0.15 µm は MILKY', W.stateOf(0.15), W.stateOf(0.15) === 'MILKY');
chk('境界：雲の粒 10 µm は WHITE', W.stateOf(10), W.stateOf(10) === 'WHITE');
chk('境の大きさ', 'BLUE|MILKY ' + W.R_BLUE.toFixed(3) + ' µm ／ MILKY|WHITE ' + W.R_WHITE.toFixed(3) + ' µm', W.R_BLUE < 0.1 && W.R_WHITE > 0.2 && W.R_WHITE < 0.5, '目安の式 α = 4/(1+(r/0.1)^1.5)');
{ const S = noon, hor = W.skyAt(S, 90, 1, new Float64Array(W.NL)), obj = W.LS.map((l, i) => 0.03 * S.sun[i]), near = W.xyz(W.aerial(S, obj, hor, 3, new Float64Array(W.NL))), far = W.xyz(W.aerial(S, obj, hor, 80, new Float64Array(W.NL))), H = W.xyz(hor);
  const dist = (a, b) => { const p = C.chroma(a), q = C.chroma(b); return Math.hypot(p.x - q.x, p.y - q.y); };
  chk('遠い山ほど地平の空の色に近い', '3 km ' + dist(near, H).toFixed(3) + ' → 80 km ' + dist(far, H).toFixed(3), dist(far, H) < dist(near, H));
  chk('遠い山ほど明るい', 'Y ' + near.Y.toFixed(4) + ' → ' + far.Y.toFixed(4), far.Y > near.Y); }
{ const b = W.setup(1, W.R_MIN, true), d = dom(W.xyz(b.sun));
  chk('BREAK（赤ほど散る）：夕日が青くなる', d.kind + ' ' + d.l + ' nm', d.kind === 'spectral' && d.l < 500); }
chk('シアノメーター：白は 0 番', W.cyanometer([0.96, 0.965, 0.97]).n, W.cyanometer([0.96, 0.965, 0.97]).n <= 2);
chk('シアノメーター：紺は 52 番', W.cyanometer([0.05, 0.12, 0.3]).n, W.cyanometer([0.05, 0.12, 0.3]).n >= 48);
console.log('\n' + ok + ' OK / ' + ng + ' NG');
process.exit(ng ? 1 : 0);
