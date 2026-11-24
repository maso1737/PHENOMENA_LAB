/* Z2 SELF の照合：node zoom/_tools/check_zoom.cjs
   法則（次元・1 周の写し・止まる点）と、芯のカメラの数（乗り換え・1 周で入口に戻る・1 刻みの倍率・寄る中心）を、画面なしで確かめる */
'use strict';
const path = require('path');
// 芯は window と canvas を使うので、何もしない板を渡す
const noop = () => {}, ctx = new Proxy({}, { get: () => noop, set: () => true });
globalThis.window = globalThis; globalThis.devicePixelRatio = 1; globalThis.addEventListener = noop;
const canvas = () => ({ getContext: () => ctx, addEventListener: noop, setPointerCapture: noop, getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 400 }), width: 0, height: 0 });
require(path.join(__dirname, '../zoom_core.js'));
const L = require(path.join(__dirname, '../_law/ph_zoom_law.js'));

let ok = 0, ng = 0;
const near = (name, v, want, tol) => { const pass = Math.abs(v - want) <= tol; pass ? ok++ : ng++; console.log((pass ? 'OK ' : 'NG ') + name + ' = ' + (+v).toPrecision(6) + '（期待 ' + want + ' ± ' + tol + '）'); };
const P = { twist: 45, nestS: 0.707, triS: 0.5, kochS: 1 / 3 }, W = L.makeWorlds(P);

console.log('— 相似の次元 D（Σ s_i^D = 1）');
near('NEST（子 1 つ）', L.dimension(W.nest), 0, 1e-9);
near('シェルピンスキー（三角 s 0.5）', L.dimension(W.tri), Math.log(3) / Math.log(2), 1e-6);
near('コッホ 60°', L.dimension(W.koch), Math.log(4) / Math.log(3), 1e-6);
P.kochS = L.kochS(90); near('コッホ 90°（面を埋める）', L.dimension(W.koch), 2, 1e-6);
P.kochS = L.kochS(0); near('コッホ 0°（直線）', L.dimension(W.koch), 1, 1e-6); P.kochS = 1 / 3;
near('コッホ 60° の 4 本の長さ', L.kochS(60), 1 / 3, 1e-12);
near('シダ（0.85・0.32・0.32）', L.dimension(W.fern), 1.8087, 2e-4);
P.triS = 0.27; near('三角 0.27 は DUST（D < 1）', L.dimension(W.tri), Math.log(3) / Math.log(1 / 0.27), 1e-6);
console.log('   状態：', ['nest', 'tri', 'koch', 'fern'].map(k => k + ' ' + L.stateOf(L.dimension(W[k]), L.childCount(W[k]))).join(' / ')); P.triS = 0.5;

console.log('— 1 周の写し');
const lmN = L.loopMap(W.nest); near('NEST 1 周の倍率 1/0.707', lmN.factor, 1 / 0.707, 1e-9); near('NEST 1 周の回り', lmN.turn, 45, 1e-9);
const lmK = L.loopMap(W.koch); near('KOCH（2 本目）1 周の倍率', lmK.factor, 3, 1e-9); near('KOCH 1 周の回り', lmK.turn, -60, 1e-9);
const lmG = L.loopMap(W.golden); near('GOLDEN 1 周の倍率 φ', lmG.factor, (1 + Math.sqrt(5)) / 2, 1e-9);
const lmC = L.loopMap(W.chain); near('CHAIN 4 場面で 1 周', lmC.steps.length, 4, 0); near('CHAIN 1 周の桁', lmC.dec, -Math.log10(0.03 * 0.03 * 0.13 * 0.035), 1e-9);
// 止まる点は写しで動かない：c + cs·z* = z*
for (const [k, lm] of [['NEST', lmN], ['KOCH', lmK], ['GOLDEN', lmG], ['CHAIN', lmC]]) { const z = lm.fixed, w = L.cmul(lm.cs, z); near(k + ' 止まる点のずれ', Math.hypot(lm.cc[0] + w[0] - z[0], lm.cc[1] + w[1] - z[1]), 0, 1e-12); }

console.log('— 芯のカメラ');
for (const k of L.ORDER) {
  const core = new ZoomCore(canvas(), W[k]); core.setSize(800, 400, 1); core.home(); const S = core.S, lm = L.loopMap(W[k]);
  // 1 周の道の終わりで乗り換えると、入口と同じ写し（m = S・t = 0）に戻る
  core.cur = W[k].root; core.stack = []; core.level = 0; const p = L.divePose(lm, S, 1); core.m = p.m; core.t = p.t;
  // 境目ちょうどは丸めでどちらにも転ぶので、ほんの少しだけ先へ（引き寄せは切る：CHAIN の 2.4×10⁵ 倍だと 1e-6 でも 0.6 px 動く）
  core.p.magnet = 0;
  core.zoomAt(1.000001, S * lm.fixed[0], S * lm.fixed[1]);
  near(k + ' 1 周後の |m| ÷ S', Math.hypot(...core.m) / S, 1.000001, 1e-6);
  near(k + ' 1 周後の m の向き', Math.atan2(core.m[1], core.m[0]), 0, 1e-6);
  near(k + ' 1 周後の t（px）', Math.hypot(...core.t), 0, 1e-3);
}
{ // ホイール 1 刻みの倍率は深さによらない（300 桁寄った所でも同じ）
  const core = new ZoomCore(canvas(), W.tri); core.setSize(800, 400, 1); core.home(); core.p.inertia = 0;
  const one = () => { const d0 = core.depth; core.push(Math.log(1.15), 0, 0); core.advance(1 / 60); return core.depth - d0; };
  const a = one(); for (let i = 0; i < 300; i++) core.zoomAt(10, 0, 0); const b = one();
  near('1 刻み（入口）', a, Math.log10(1.15), 1e-12); near('1 刻み（300 桁の奥）', b, Math.log10(1.15), 1e-12);
  near('300 桁寄っても |m| は小さいまま（÷S）', Math.hypot(...core.m) / core.S, 1.4, 0.65);
}
{ // 寄る中心：MAGNET 0 なら、カーソルの下の点は寄る前後で同じ画素
  const core = new ZoomCore(canvas(), W.nest); core.setSize(800, 400, 1); core.home(); core.p.magnet = 0;
  const ax = 57, ay = -31, z = L.cdiv([ax - core.t[0], ay - core.t[1]], core.m); core.autoNormalize = false; core.zoomAt(3.7, ax, ay);
  const q = L.cmul(core.m, z); near('寄る中心のずれ（px）', Math.hypot(q[0] + core.t[0] - ax, q[1] + core.t[1] - ay), 0, 1e-9);
}
{ // 回りながら寄る（spinAt）：止まる点の画素は動かない
  const core = new ZoomCore(canvas(), W.golden); core.setSize(800, 400, 1); core.home(); const lm = L.loopMap(W.golden);
  const pz = () => { const w = L.cmul(core.m, lm.fixed); return [w[0] + core.t[0], w[1] + core.t[1]]; }, p0 = pz();
  for (let i = 0; i < 200; i++) { const a = -lm.turn * Math.PI / 180 * 0.05, r = Math.pow(lm.factor, 0.05), p = pz(); core.spinAt([r * Math.cos(a), r * Math.sin(a)], p[0], p[1]); }
  const p1 = pz(); near('GOLDEN 10 周回りながら寄って、止まる点のずれ（px）', Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), 0, 1e-6);
  near('GOLDEN 10 周の深さ（桁）', core.depth, 10 * lm.dec, 1e-9);
}
console.log('\n' + ok + ' OK / ' + ng + ' NG');
process.exit(ng ? 1 : 0);
