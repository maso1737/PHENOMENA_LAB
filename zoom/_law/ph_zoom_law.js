/* PHENOMENA LAB — Z2 SELF の法則（同じ形の中へ）＝ ZOOM CORE の題材 6 つ＋自己相似の数
 *
 * 出どころ
 *   - 相似の次元（Moran 1946）：子 i 個の縮み s_i が Σ s_i^D = 1 を満たす D。子の縮みがそろえば D = log N / log(1/s)。
 *     子が重ならないときは、これが形の次元（ハウスドルフ次元）に等しい。重なる（D > 2）と、面の次元は 2 で止まる。
 *   - コッホ曲線（von Koch 1904）：1 本の線を「山のある 4 本」に置きかえる。山の角 θ のとき 4 本の長さ s = 1 / (2 + 2 cos θ)。
 *     θ 60° → s 1/3・D 1.2619／θ 0° → s 1/4・D 1（ただの直線）／θ 90° → s 1/2・D 2（面を埋める・Cesàro 曲線）。
 *   - シェルピンスキーの三角（1915）：角に縮み 1/2 の子が 3 つ。D = log 3 / log 2 = 1.585。
 *   - 海岸線の次元 ≈ 1.25（ブリテン島の西岸・Richardson の測定を Mandelbrot 1967 "How long is the coast of Britain?" がまとめた値）。
 *   - 回りながら寄る中心（相似の写し z → c + s·e^{iθ}·z の止まる点）：z* = c / (1 − s·e^{iθ})。
 *     そこを止めたまま「×1/s 寄って θ 戻す」と、1 周で元の絵に重なる（渦の中心＝対数らせん）。
 *   - シダの形は等倍の縮みで組んだ「シダの形」（本物のバーンズリーのシダは縦横で縮みが違うので、この芯では作れない）＝ まね △。
 *
 * 世界の書き方は zoom_core.js の先頭（scenes・children()・parent・draw(ctx, info)）。この書き方は変えない。
 * 画面にも時間にも触らない（描く関数は渡された ctx に描くだけ）。
 */
(function (g) {
  'use strict';
  const TAU = Math.PI * 2, D2R = Math.PI / 180;
  const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  const cabs = a => Math.hypot(a[0], a[1]);
  const xf = ch => { const r = (ch.rot || 0) * D2R; return { cs: [ch.s * Math.cos(r), ch.s * Math.sin(r)], cc: [ch.x || 0, ch.y || 0] }; };

  /* ---- 縮みの範囲（つまみで動かせる題材だけ） ---- */
  const RANGE = { nest: [0.5, 0.95], tri: [0.25, 0.6], koch: [0.25, 0.5] };
  const kochAngle = s => Math.acos(Math.max(-1, Math.min(1, 1 / (2 * s) - 1))) / D2R;   // 4 本の長さ s → 山の角 θ（度）
  const kochS = deg => 1 / (2 + 2 * Math.cos(deg * D2R));

  /* ---- 題材を作る。P＝{ twist, nestS, triS, kochS, ink, acc }（つまみの値をここから読む） ---- */
  function makeWorlds(P) {
    const ink = () => P.ink || '#F2EFE6', acc = () => P.acc || '#7FD6CB';

    const NEST = { key: 'nest', name: 'NEST', ja: '四角の入れ子', root: 'sq', loopSlot: 0, realism: 0, scenes: { sq: {
      name: 'SQUARE 四角', parent: { id: 'sq', slot: 0 },
      children: () => [{ x: 0, y: 0, s: P.nestS, rot: P.twist, to: 'sq' }],
      draw(c, i) {
        c.lineWidth = 1.4 * i.px; c.strokeStyle = ink(); c.strokeRect(-0.5, -0.5, 1, 1);
        c.lineWidth = 1 * i.px; c.beginPath();
        for (const [x, y, dx, dy] of [[0, -0.5, 0, 1], [0.5, 0, -1, 0], [0, 0.5, 0, -1], [-0.5, 0, 1, 0]]) { c.moveTo(x, y); c.lineTo(x + dx * 0.035, y + dy * 0.035); }
        c.stroke();
        c.fillStyle = acc(); c.beginPath(); c.arc(-0.5, -0.5, Math.min(0.02, 3.5 * i.px), 0, TAU); c.fill();   // 向きがわかる印
      } } } };

    const V = [0, 1, 2].map(j => { const a = -Math.PI / 2 + j * TAU / 3; return [0.5 * Math.cos(a), 0.5 * Math.sin(a)]; });
    const TRI = { key: 'tri', name: 'TRIANGLE', ja: '三角の中の三角', root: 'tri', loopSlot: 0, realism: 0, scenes: { tri: {
      name: 'TRIANGLE 三角', parent: { id: 'tri', slot: 0 },
      get detail() { return P.triS > 0.5 ? 1 + (P.triS - 0.5) * 20 : 1; },   // 重なる（s > 0.5）と場面の数が増えるので細部を粗く（0.6 で 3 倍）
      children: () => V.map(v => ({ x: v[0] * (1 - P.triS), y: v[1] * (1 - P.triS), s: P.triS, rot: 0, to: 'tri' })),   // 子は角に寄せる（角の点は親と子で同じ）
      draw(c, i) {
        c.lineWidth = 1.2 * i.px; c.strokeStyle = ink(); c.beginPath();
        c.moveTo(V[0][0], V[0][1]); c.lineTo(V[1][0], V[1][1]); c.lineTo(V[2][0], V[2][1]); c.closePath(); c.stroke();
        c.fillStyle = acc(); c.beginPath(); c.arc(V[0][0], V[0][1], Math.min(0.016, 3 * i.px), 0, TAU); c.fill();
      } } } };

    const GA = 137.50776 * D2R, DOTS = 90, PICK = 37;
    const dot = k => { const r = 0.47 * Math.sqrt((k + 0.5) / DOTS), a = k * GA; return [r * Math.cos(a), r * Math.sin(a)]; };
    const CHAIN = { key: 'chain', name: 'CHAIN', ja: '点 → 線 → 面 → 世界', root: 'point', loopSlot: 0, realism: 0, scenes: {
      point: { name: 'POINT 点', parent: { id: 'world', slot: 0 },
        children: () => { const d = dot(PICK); return [{ x: d[0], y: d[1], s: 0.03, rot: 0, to: 'line' }]; },
        draw(c, i) { c.fillStyle = ink(); const r = Math.min(0.011, 8 * i.px);
          for (let k = 0; k < DOTS; k++) { if (k === PICK) continue; const d = dot(k); c.beginPath(); c.arc(d[0], d[1], r, 0, TAU); c.fill(); } } },
      line: { name: 'LINE 線', parent: { id: 'point', slot: 0 },
        children: () => [{ x: 0.12, y: 0.045, s: 0.03, rot: 30, to: 'plane' }],
        draw(c, i) { c.strokeStyle = ink(); c.lineWidth = 1.2 * i.px; c.beginPath();
          for (let k = -7; k <= 7; k++) { const y = k * 0.06, x = Math.sqrt(Math.max(0, 0.25 - y * y)); c.moveTo(-x, y); c.lineTo(x, y); }
          c.stroke(); } },
      plane: { name: 'PLANE 面', parent: { id: 'line', slot: 0 },
        children: () => [{ x: 1 / 12, y: -1 / 12, s: 0.13, rot: 0, to: 'world' }],
        draw(c, i) { const n = 6, s = 1 / n; c.fillStyle = ink();
          for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { if ((x + y) % 2) continue; if (x === 3 && y === 2) continue; c.fillRect(-0.5 + x * s, -0.5 + y * s, s, s); }
          c.strokeStyle = ink(); c.lineWidth = 1.2 * i.px; c.strokeRect(-0.5, -0.5, 1, 1); } },
      world: { name: 'WORLD 世界', parent: { id: 'plane', slot: 0 },
        children: () => [{ x: 0.17, y: -0.12, s: 0.035, rot: -20, to: 'point' }],
        draw(c, i) { c.strokeStyle = ink(); c.lineWidth = 1.2 * i.px;
          c.beginPath(); c.arc(0, 0, 0.5, 0, TAU); c.stroke();
          c.lineWidth = 0.8 * i.px; c.beginPath();
          for (const k of [0.17, 0.34, 0.5]) { c.moveTo(k, 0); c.ellipse(0, 0, k, 0.5, 0, 0, TAU); }
          for (const y of [-0.3, 0, 0.3]) { const x = Math.sqrt(0.25 - y * y); c.moveTo(-x, y); c.lineTo(x, y); }
          c.stroke(); } }
    } };

    /* らせん：黄金長方形。正方形を 1 つ切り取ると、残りが 90° 回った同じ形 */
    const PHI = (1 + Math.sqrt(5)) / 2, G1 = 1 / PHI, GH = G1 / 2, GX = -0.5 + G1;
    const GOLDEN = { key: 'golden', name: 'GOLDEN', ja: '黄金のらせん', root: 'g', loopSlot: 0, realism: 0, scenes: { g: {
      name: 'GOLDEN らせん', parent: { id: 'g', slot: 0 },
      children: () => [{ x: (GX + 0.5) / 2, y: 0, s: G1, rot: 90, to: 'g' }],
      draw(c, i) {
        c.strokeStyle = ink(); c.lineWidth = 1 * i.px; c.globalAlpha = i.alpha * 0.45;
        c.strokeRect(-0.5, -GH, 1, G1); c.beginPath(); c.moveTo(GX, -GH); c.lineTo(GX, GH); c.stroke();
        c.globalAlpha = i.alpha; c.strokeStyle = acc(); c.lineWidth = 2 * i.px;
        c.beginPath(); c.arc(GX, GH, G1, Math.PI, Math.PI * 1.5); c.stroke();
      } } } };

    /* コッホ曲線：1 本の線を「山のある 4 本」に置きかえる、をくり返す。山の角 θ はつまみ（4 本の長さ s から決まる） */
    const kp = () => { const s = P.kochS, th = kochAngle(s), h = s * Math.sin(th * D2R); return { s, th, h }; };
    const KOCH = { key: 'koch', name: 'KOCH', ja: '海岸線の曲線', root: 'k', loopSlot: 1, realism: 0, scenes: { k: {
      name: 'KOCH 海岸線', parent: { id: 'k', slot: 1 },
      children: () => { const { s, th, h } = kp(); return [
        { x: -0.5 + s / 2, y: 0, s, rot: 0, to: 'k' }, { x: (-0.5 + s) / 2, y: -h / 2, s, rot: -th, to: 'k' },
        { x: (0.5 - s) / 2, y: -h / 2, s, rot: th, to: 'k' }, { x: 0.5 - s / 2, y: 0, s, rot: 0, to: 'k' }]; },
      draw(c, i) {                                   // 子が出るまでの間だけ、自分の 4 本を描く
        const a = i.alpha * (1 - i.childAlpha); if (a <= 0) return; const { s, h } = kp();
        c.globalAlpha = a; c.strokeStyle = ink(); c.lineWidth = 1.3 * i.px; c.lineJoin = 'round';
        c.beginPath(); c.moveTo(-0.5, 0); c.lineTo(-0.5 + s, 0); c.lineTo(0, -h); c.lineTo(0.5 - s, 0); c.lineTo(0.5, 0); c.stroke();
      } } } };

    /* シダ：茎が 1 節のびるたびに、小さな自分を左右に出す */
    const FA = 55 * D2R, FS = 0.32, FM = 0.85, FR = 4 * D2R;
    const FERN = { key: 'fern', name: 'FERN', ja: 'シダ', root: 'f', loopSlot: 0, realism: 2, scenes: { f: {
      name: 'FERN シダ', parent: { id: 'f', slot: 0 }, detail: 5,   // 子が多いので、細部が現れる大きさを 5 倍に（軽くする）
      children: () => [
        { x: FM * 0.5 * Math.sin(FR), y: 0.34 - FM * 0.5 * Math.cos(FR), s: FM, rot: 4, to: 'f' },
        { x: FS * 0.5 * Math.sin(FA), y: 0.36 - FS * 0.5 * Math.cos(FA), s: FS, rot: 55, to: 'f' },
        { x: -FS * 0.5 * Math.sin(FA), y: 0.43 - FS * 0.5 * Math.cos(FA), s: FS, rot: -55, to: 'f' }],
      draw(c, i) {
        c.strokeStyle = ink(); c.lineWidth = 1.2 * i.px; c.beginPath(); c.moveTo(0, 0.5); c.lineTo(0, 0.34); c.stroke();
        const a = i.alpha * (1 - i.childAlpha); if (a <= 0) return;   // 細部が出るまでは、葉 1 枚の形で代わりをする
        c.globalAlpha = a * 0.8; c.fillStyle = ink(); c.beginPath(); c.ellipse(0, 0, 0.13, 0.5, 0, 0, TAU); c.fill();
      } } } };

    return { nest: NEST, tri: TRI, koch: KOCH, fern: FERN, golden: GOLDEN, chain: CHAIN };
  }
  const ORDER = ['nest', 'tri', 'koch', 'fern', 'golden', 'chain'];

  /* ---- 相似の次元：Σ s_i^D = 1 を二分法で（子が 1 つなら D = 0＝1 本道） ---- */
  function dimension(world, id) {
    const ks = world.scenes[id || world.root].children(), ss = ks.map(k => k.s);
    if (ss.length <= 1) return 0;
    const f = D => ss.reduce((a, s) => a + Math.pow(s, D), 0) - 1;
    let lo = 0, hi = 8; for (let n = 0; n < 80; n++) { const m = (lo + hi) / 2; if (f(m) > 0) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }
  const childCount = (world, id) => world.scenes[id || world.root].children().length;
  /* 状態：1 段で何本に分かれ、どれだけ詰まるか */
  const D_DUST = 1, D_FILL = 2;
  function stateOf(D, N) { return N <= 1 ? 'PATH' : D < D_DUST - 1e-9 ? 'DUST' : D < D_FILL - 1e-9 ? 'LACE' : 'FILL'; }

  /* ---- 1 周の写し：場面 id から loopSlot の子をたどって id に戻るまで（多くて 8 段）。cs＝縮みと回り・cc＝位置 ---- */
  function loopMap(world, id) {
    id = id || world.root; let cur = id, cs = [1, 0], cc = [0, 0], steps = [];
    for (let n = 0; n < 8; n++) {
      const ks = world.scenes[cur].children(), slot = Math.min(world.loopSlot || 0, ks.length - 1), ch = ks[slot], f = xf(ch);
      cc = [cc[0] + cmul(cs, f.cc)[0], cc[1] + cmul(cs, f.cc)[1]]; cs = cmul(cs, f.cs);
      steps.push({ id: cur, slot, s: ch.s, dec: -Math.log10(ch.s) }); cur = ch.to; if (cur === id) break;
    }
    const k = cabs(cs), turn = Math.atan2(cs[1], cs[0]) / D2R, fixed = cdiv(cc, [1 - cs[0], -cs[1]]);
    return { cs, cc, steps, factor: 1 / k, dec: -Math.log10(k), turn, fixed };
  }
  /* 1 周の道の上の写し（入口 m = S・t = 0 から u 周ぶん）：m(u) = S·cs^(−u)・t(u) = S·z* − m(u)·z*（止まる点 z* は画面の同じ所） */
  function divePose(lm, S, u) {
    const k = cabs(lm.cs), ph = Math.atan2(lm.cs[1], lm.cs[0]), r = Math.pow(k, -u), a = -ph * u;
    const m = [S * r * Math.cos(a), S * r * Math.sin(a)], zm = cmul(m, lm.fixed);
    return { m, t: [S * lm.fixed[0] - zm[0], S * lm.fixed[1] - zm[1]] };
  }

  g.PH_ZOOM = { makeWorlds, ORDER, RANGE, kochAngle, kochS, dimension, childCount, stateOf, D_DUST, D_FILL, loopMap, divePose,
    D_COAST: 1.25, cmul, cdiv, cabs, xf };
  if (typeof module !== 'undefined') module.exports = g.PH_ZOOM;
})(typeof window !== 'undefined' ? window : globalThis);
