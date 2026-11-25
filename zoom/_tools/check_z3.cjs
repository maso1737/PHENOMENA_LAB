/* Z3 COAST の照合：node zoom/_tools/check_z3.cjs
   答えの決まった見本の島を、写真と同じ道（塗る → しきい値 → 塊 → 縁をたどる → 物差し・箱）で読み、答えに当たるか */
'use strict';
const L = require(require('path').join(__dirname, '../_law/ph_z3_law.js'));
let ok = 0, ng = 0;
const near = (name, v, want, tol) => { const pass = Math.abs(v - want) <= tol; pass ? ok++ : ng++; console.log((pass ? 'OK ' : 'NG ') + name + ' = ' + (+v).toFixed(4) + '（期待 ' + (+want).toFixed(4) + ' ± ' + tol + '）'); };
const W = 1200, H = 800;
function readSample(D, seed, brk) {
  const smp = L.sampleIsland(D, seed, W / 2, H / 2, 470);
  let m = L.fillMask(smp.poly, W, H);
  const lum = new Uint8Array(W * H); for (let i = 0; i < lum.length; i++) lum[i] = m[i] ? 200 : 40;   // 陸＝明るい・海＝暗い
  const c = L.component(lum, W, H, L.otsu(lum), W / 2 | 0, H / 2 | 0, false); m = c.mask;
  if (brk) m = L.smoothMask(m, W, H, brk);
  const P = L.traceBoundary(m, W, H); return { smp, P, A: L.analyze(P) };
}
console.log('— 形の数');
near('D 1.26 の山の角（コッホ 60°）', L.thetaOfD(Math.log(4) / Math.log(3)), 60, 1e-9);
{ const sq = L.fillMask([[100, 100], [300, 100], [300, 300], [100, 300]], 400, 400), P = L.traceBoundary(sq, 400, 400);
  near('正方形 200 px の縁の点の数', P.length, 4 * 199, 0); near('正方形を物差し 10 px で測る（角を弦で切るぶん短い）', L.divider(P, 10).L, 4 * 199 - 2 * 10 * (2 - Math.SQRT2), 12); near('正方形の D（物差し）', L.analyze(P).Ddiv, 1, 0.02); }
{ const P = []; for (let k = 0; k < 2000; k++) { const a = k / 2000 * 2 * Math.PI; P.push([200 + 150 * Math.cos(a), 200 + 150 * Math.sin(a)]); }
  near('円 r150 を物差し 5 px で測る（2πr）', L.divider(P, 5).L, 2 * Math.PI * 150, 1); }
console.log('— 見本の島を写真と同じ道で読む（種 5 つずつ）');
const rows = [];
for (const D of [1.04, 1.15, 1.2, L.D_MAX]) {
  const ds = [], bs = [];
  for (const seed of [1, 2, 3, 4, 5]) { const r = readSample(D, seed); ds.push(r.A.Ddiv); bs.push(r.A.Dbox); }
  const md = ds.reduce((a, b) => a + b) / 5, mb = bs.reduce((a, b) => a + b) / 5;
  near('D ' + D + ' 物差しの読み（平均）', md, D, 0.03); near('D ' + D + ' 箱の読み（平均・荒い側で低めに出る）', mb, D, 0.07);
  rows.push(D + ' → 物差し ' + ds.map(v => v.toFixed(3)).join(' / ') + '　箱 ' + bs.map(v => v.toFixed(3)).join(' / ') + '　状態 ' + L.stateOf(md));
}
rows.forEach(r => console.log('   ' + r));
console.log('— BREAK：ぼかすと小さい物差しで長さが伸びない');
{ const a = readSample(1.25, 1).A, b = readSample(1.25, 1, 10).A, k4 = a.eps.findIndex(e => e >= 4), k12 = a.eps.findIndex(e => e >= 12);
  const ga = Math.log10(a.L[k4] / a.L[k12]), gb = Math.log10(b.L[k4] / b.L[k12]);
  console.log('   物差し 4→12 px で長さの伸び：本物 ×' + Math.pow(10, ga).toFixed(3) + '・ぼかし r10 ×' + Math.pow(10, gb).toFixed(3) + '　D ' + a.Ddiv.toFixed(3) + ' → ' + b.Ddiv.toFixed(3));
  near('ぼかすと D が下がる（差）', a.Ddiv - b.Ddiv, 0.15, 0.15); }
{ const t0 = Date.now(); readSample(1.25, 7); console.log('   1 回の読み（塗る〜当てはめ）' + (Date.now() - t0) + ' ms'); }
console.log('\n' + ok + ' OK / ' + ng + ' NG'); process.exit(ng ? 1 : 0);
