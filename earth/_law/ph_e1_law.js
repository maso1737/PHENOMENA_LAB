/* PH-E1 PUSH & CARVE — 隆起と侵食の法則（アプリと解説 LP が同じ式を読む）
 *
 * 1 次元の断面（横 200 km・1 km ごとに 201 本の柱）。柱ごとに「地殻の厚さ c」と「地層の厚さ」を持つ。
 *
 * 出どころ
 *   - 浮き沈み（アイソスタシー・Airy の型）：地殻の密度 2.8・マントルの密度 3.3（g/cm³。教科書の代表値）
 *       厚くなった分 Δc のうち 高さ＝Δc × (3.3−2.8)/3.3 ≈ 0.152・根＝Δc × 2.8/3.3 ≈ 0.848
 *       → 根は高さの 2.8/0.5 = 5.6 倍／広く削ると、削った厚さの 2.8/3.3 ≈ 85% ぶん浮き上がる
 *   - 板のたわみ（狭い谷は浮かない）：根の形を幅 σ 12 km のぼかしでならす（目安。弾性の板の代わり）
 *   - 押す：板の速さ v（cm/年・目安 0〜5。爪が伸びる速さ ≈ 3 cm/年）× 基準の厚さ 35 km ぶんの地殻が、
 *       ぶつかる所（中央・幅 σ 30 km のガウス形）に毎年押し込まれて厚くなる（量は保存）
 *   - 川が刻む（stream power の式）：E = K × Q^0.5 × 傾き。Q＝上流で降った雨の量（m³/年）
 *       上流の面積は Hack の法則 L = 1.4 × A^0.6（km）から A = (L/1.4)^(1/0.6)。K は目安（下の値で山が 数 km で止まるように合わせた）
 *       解き方は下流から上へ順に（Braun & Willett 2013 の陰解法）→ 1 コマが大きくても暴れない
 *   - 斜面のにじみ：拡散 D = 20 m²/年（目安）
 *   - 風：風上の側の雨を (1+0.6) 倍・風下を (1−0.6) 倍（目安。山に当たって雨を落とす）
 * 単位：長さ m・時間 年・速さ m/年（画面では mm/年・cm/年に直す）
 */
(function (root) {
  'use strict';
  const RHO_C = 2800, RHO_M = 3300, C0 = 35000;                 // 地殻・マントルの密度 kg/m³・基準の地殻の厚さ m
  const HF = (RHO_M - RHO_C) / RHO_M, RF = RHO_C / RHO_M;       // 高さの割合 0.1515・根の割合 0.8485
  const NX = 201, DX = 1000, XC = 100000, SIG_T = 30000, SIG_F = 12000;
  const K = 1.2e-5, M = 0.5, D = 20, WIND_A = 0.6;
  const LAYERS = [                                               // 上から：最初の厚さ m（花こう岩は残り全部）
    { key: 'mud', ja: '泥岩', th: 600 },
    { key: 'sand', ja: '砂岩', th: 600 },
    { key: 'lime', ja: '石灰岩', th: 800 },
  ];
  const GRANITE = { key: 'granite', ja: '花こう岩' };

  const X = i => i * DX;
  const hackA = l => Math.pow(Math.max(0, l) / 1000 / 1.4, 1 / 0.6) * 1e6;   // 上流の長さ l(m) → 面積 m²
  const G = new Float64Array(NX);                                 // 押し込む形（∫ = 1 /m）
  for (let i = 0; i < NX; i++) G[i] = Math.exp(-0.5 * ((X(i) - XC) / SIG_T) ** 2) / (SIG_T * Math.sqrt(2 * Math.PI));
  const KF = (() => { const r = Math.ceil(3 * SIG_F / DX), k = []; let s = 0; for (let j = -r; j <= r; j++) { const v = Math.exp(-0.5 * (j * DX / SIG_F) ** 2); k.push(v); s += v; } return { r, k: k.map(v => v / s) }; })();

  /* 新しい断面（平らな低地） */
  function create() {
    const s = { t: 0, c: new Float64Array(NX).fill(C0), h: new Float64Array(NX), root: new Float64Array(NX), rootFrozen: null,
      lay: LAYERS.map(L => new Float64Array(NX).fill(L.th)), E: new Float64Array(NX), UR: new Float64Array(NX), U: new Float64Array(NX), P: new Float64Array(NX),
      div: (NX - 1) / 2, stat: { up: 0, down: 0, peak: 0, peakI: (NX - 1) / 2, rootMax: 0, meanH: 0 } };
    return s;
  }

  /* 浮き沈み：c から 根 と 高さ を出す。iso=false のときは根を今の形で止める（根のない山＝BREAK） */
  function isostasy(s, iso) {
    const n = NX, { r, k } = KF;
    if (iso) {
      s.rootFrozen = null;
      for (let i = 0; i < n; i++) { let a = 0; for (let j = -r; j <= r; j++) { const q = i + j; if (q >= 0 && q < n) a += k[j + r] * (s.c[q] - C0); } s.root[i] = RF * a; }
    } else {
      if (!s.rootFrozen) s.rootFrozen = Float64Array.from(s.root);
      s.root.set(s.rootFrozen);
    }
    for (let i = 0; i < n; i++) s.h[i] = s.c[i] - C0 - s.root[i];
  }

  /* 上から厚さ e を削る（地層の上から順に）。e < 0 は積もる（いちばん上の層に足す） */
  function carve(s, i, e) {
    s.c[i] -= e;
    if (e < 0) { s.lay[0][i] -= e; return; }
    for (const L of s.lay) { const d = Math.min(L[i], e); L[i] -= d; e -= d; if (e <= 0) return; }
  }

  /* 1 回ぶん（dt 年）。p = { v: m/年, P: m/年, wind: -1 左から・0・1 右から, iso: bool } */
  function substep(s, dt, p) {
    const n = NX, h = s.h;
    // 1) 押す：厚くなる（地層も同じ割合で厚くなる）
    for (let i = 0; i < n; i++) {
      const T = p.v * C0 * G[i]; s.U[i] = T; if (T <= 0) continue;
      const f = (s.c[i] + T * dt) / s.c[i]; s.c[i] += T * dt; for (const L of s.lay) L[i] *= f;
    }
    isostasy(s, p.iso);
    const h0 = Float64Array.from(h);
    // 2) 分水嶺＝いちばん高い柱
    let div = (n - 1) / 2, best = -1e9; for (let i = 1; i < n - 1; i++) if (h[i] > best + 1e-9) { best = h[i]; div = i; }
    if (best < 1) div = (n - 1) / 2;
    s.div = div;
    // 3) 雨と上流の水の量 Q
    for (let i = 0; i < n; i++) s.P[i] = p.P * (p.wind ? 1 + WIND_A * (((i < div) === (p.wind < 0)) ? 1 : -1) : 1);
    const Q = new Float64Array(n);
    Q[div] = s.P[div] * hackA(DX / 2);
    for (let i = div - 1; i >= 0; i--) { const l = (div - i) * DX + DX / 2; Q[i] = Q[i + 1] + s.P[i] * (hackA(l) - hackA(l - DX)); }
    for (let i = div + 1; i < n; i++) { const l = (i - div) * DX + DX / 2; Q[i] = Q[i - 1] + s.P[i] * (hackA(l) - hackA(l - DX)); }
    // 4) 川が刻む（下流から上へ・陰解法）。両端は海の高さ 0 に固定
    h[0] = 0; h[n - 1] = 0;
    for (let i = 1; i < div; i++) { const F = K * Math.pow(Q[i], M) / DX * dt; h[i] = (h[i] + F * h[i - 1]) / (1 + F); }
    for (let i = n - 2; i > div; i--) { const F = K * Math.pow(Q[i], M) / DX * dt; h[i] = (h[i] + F * h[i + 1]) / (1 + F); }
    { const lo = h[div - 1] < h[div + 1] ? h[div - 1] : h[div + 1], F = K * Math.pow(Q[div], M) / DX * dt; h[div] = (h[div] + F * lo) / (1 + F); }
    for (let i = 1; i < n - 1; i++) if (h[i] < 0 && h0[i] >= 0) h[i] = 0;
    // 5) 斜面のにじみ
    const a = D * dt / (DX * DX), hb = Float64Array.from(h);
    for (let i = 1; i < n - 1; i++) h[i] = hb[i] + a * (hb[i + 1] - 2 * hb[i] + hb[i - 1]);
    // 6) 削った量を地殻から引き、浮き沈みをやり直す
    for (let i = 0; i < n; i++) { const e = h0[i] - h[i]; s.E[i] = e / dt; carve(s, i, e); }
    isostasy(s, p.iso);
    s.t += dt;
  }

  /* dt 年すすめる（中は 250 年以下に小分け）。帯の平均の 上／下 の速さ（m/年）を返す */
  function step(s, dt, p) {
    const nSub = Math.max(1, Math.ceil(dt / 250)), d = dt / nSub, hA = Float64Array.from(s.h), eSum = new Float64Array(NX);
    for (let k = 0; k < nSub; k++) { substep(s, d, p); for (let i = 0; i < NX; i++) eSum[i] += s.E[i] * d; }
    for (let i = 0; i < NX; i++) { s.E[i] = eSum[i] / dt; s.UR[i] = (s.h[i] - hA[i]) / dt + s.E[i]; }   // 柱ごと：削る速さ・岩が上がる速さ（高さの変化＋削られた量）
    const down = beltMean(s.E), up = beltMean(s.UR), mh = beltMean(s.h);
    let ah = 0, ar = 0; for (let i = 0; i < NX; i++) { ah += Math.max(0, s.h[i]); ar += s.root[i]; }   // 断面積（地上の山・地下の根）m × 柱
    let pk = 0, pi = s.div, rm = 0; for (let i = 0; i < NX; i++) { if (s.h[i] > pk) { pk = s.h[i]; pi = i; } if (s.root[i] > rm) rm = s.root[i]; }
    s.stat = { up, down, peak: pk, peakI: pi, rootMax: rm, meanH: mh, areaH: ah * DX, areaRoot: ar * DX, ratio: ah > 1 ? ar / ah : 0 };   // ratio＝根の断面積 ÷ 山の断面積
    return s.stat;
  }
  function beltMean(h) { let w = 0, a = 0; for (let i = 0; i < NX; i++) { w += G[i]; a += G[i] * h[i]; } return a / w; }

  /* 境界：上 − 下 ＝ 帯の平均の高さの変わる速さ。±0.1 mm/年（100 万年で ±100 m）の内なら STEADY（高さが止まる） */
  const STEADY_TOL = 0.1e-3;
  function state(up, down) { const d = up - down; return Math.abs(d) <= STEADY_TOL ? 'STEADY' : d > 0 ? 'GROW' : 'DECAY'; }

  /* 柱 i の地層の境目（上から：地表・泥岩の底・砂岩の底・石灰岩の底・モホ面）m */
  function column(s, i) {
    const z = [s.h[i]]; let top = s.h[i];
    for (const L of s.lay) { top -= L[i]; z.push(top); }
    z.push(s.h[i] - s.c[i]);
    return z;
  }

  const api = { STEADY_TOL, RHO_C, RHO_M, C0, HF, RF, NX, DX, XC, SIG_T, SIG_F, K, M, D, WIND_A, LAYERS, GRANITE, G, hackA, create, isostasy, carve, substep, step, state, column, beltMean, X };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PH_E1 = api;
})(typeof window !== 'undefined' ? window : globalThis);
