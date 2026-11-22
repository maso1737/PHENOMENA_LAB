/* PH-MIX-SOLVE — 「光 E・目の慣れ adapt の下で、この色に見える配合」を解く（色 → 絵具の配合）
   RELIGHT POSTER の IMAGE／TARGET と同じ解き方を、解説 LP からも読めるように切り出した物（PH_PIGMENT が要る）。
   ※ 2026-11-22 時点、relight_poster.html は同じ式を自分の中にも持っている（いずれこのファイルに一本化する）。
   1. ランダムな配合（1〜3 色＋白）を NS 通り作る（makeBank）
   2. その光での Lab を全部計算（32 帯・画面と同じ式＝labUnder）→ 近い見本を数個選び、その色だけでネルダー–ミードで詰める（solveNear）
   色の数は増やさない＝絵描きが混ぜる数のまま。 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const PG = isNode ? require('./ph_pigment.js') : root.PH_PIGMENT;
  const NP = PG.NP, NB = PG.NB;
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  /* 光 E・目の慣れ adapt の下での Lab を返す関数（w → [L, a, b]） */
  function labUnder(E, adapt) {
    const B = PG.bands(E), M = PG.viewMatrix(E, adapt), KS = B.KS, W = B.W, RP = B.RP;
    return w => { let a = 0; for (let j = 0; j < NP; j++) a += w[j]; const xyz = [0, 0, 0];
      for (let b = 0; b < NB; b++) { let r = RP[b]; if (a > 1e-6) { let k = 0; for (let j = 0; j < NP; j++) if (w[j]) k += w[j] * KS[j][b]; k /= a; r = 1 + k - Math.sqrt(k * k + 2 * k); }
        xyz[0] += r * W[b][0]; xyz[1] += r * W[b][1]; xyz[2] += r * W[b][2]; }
      return PG.labOfLin(PG.mv(M, xyz).map(v => Math.max(0, v))); };
  }
  /* 配合の見本（先頭 NP 個は原色そのもの） */
  function makeBank(NS, seed) {
    NS = NS || 40000; const rnd = mulberry32(seed || 4711), WI = PG.PID.WHITE, others = [...Array(NP).keys()].filter(j => j !== WI), SW = new Float32Array(NS * NP);
    for (let s = 0; s < NS; s++) {
      const w = new Array(NP).fill(0), k = s < NP ? 0 : 1 + Math.floor(rnd() * 3);
      if (s < NP) w[s] = 1;
      else { for (let q = 0; q < k; q++) w[others[Math.floor(rnd() * others.length)]] += 0.05 + rnd(); const sum = w.reduce((p, v) => p + v, 0), t = Math.pow(rnd(), 1.3);
        for (let j = 0; j < NP; j++) w[j] = w[j] / sum * (1 - t); w[WI] += t; }
      SW.set(w, s * NP);
    }
    return { NS, SW };
  }
  /* 見本の、その光での Lab（from〜to だけ計算して途中で返せる＝重い所を小分けにする） */
  function bankLab(bank, lab, SL, from, to) {
    SL = SL || new Float32Array(bank.NS * 3); from = from || 0; to = Math.min(bank.NS, to == null ? bank.NS : to); const w = new Array(NP);
    for (let s = from; s < to; s++) { for (let j = 0; j < NP; j++) w[j] = bank.SW[s * NP + j]; const L = lab(w); SL[s * 3] = L[0]; SL[s * 3 + 1] = L[1]; SL[s * 3 + 2] = L[2]; }
    return SL;
  }
  function refineFrom(T, lab, w0, f0) {
    const idx = []; for (let j = 0; j < NP; j++) if (w0[j] > 1e-4) idx.push(j);
    let w = w0, f = f0;
    if (idx.length > 1 && f > 0.5) {
      const toW = x => { const e = x.map(v => Math.exp(Math.max(-30, Math.min(30, v)))), sm = e.reduce((p, v) => p + v, 0), o = new Array(NP).fill(0); idx.forEach((j, i) => { o[j] = e[i] / sm; }); return o; };
      const fn = x => { const L = lab(toW(x)); return Math.hypot(L[0] - T[0], L[1] - T[1], L[2] - T[2]); };
      const n = idx.length; let P_ = [idx.map(j => Math.log(w0[j]))]; for (let i = 0; i < n; i++) { const x = P_[0].slice(); x[i] += 0.7; P_.push(x); }
      let F = P_.map(fn);
      for (let it = 0; it < 70 * n; it++) {
        const o = F.map((_, i) => i).sort((a, b) => F[a] - F[b]); P_ = o.map(i => P_[i]); F = o.map(i => F[i]);
        const c = new Array(n).fill(0); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) c[j] += P_[i][j] / n;
        const at = t => c.map((v, j) => v + t * (P_[n][j] - v)), xr = at(-1), fr = fn(xr);
        if (fr < F[0]) { const xe = at(-2), fe = fn(xe); if (fe < fr) { P_[n] = xe; F[n] = fe; } else { P_[n] = xr; F[n] = fr; } }
        else if (fr < F[n - 1]) { P_[n] = xr; F[n] = fr; }
        else { const xc = at(0.5), fc = fn(xc); if (fc < F[n]) { P_[n] = xc; F[n] = fc; } else for (let i = 1; i <= n; i++) { P_[i] = P_[i].map((v, j) => P_[0][j] + 0.5 * (v - P_[0][j])); F[i] = fn(P_[i]); } }
      }
      if (F[0] < f) { w = toW(P_[0]); f = F[0]; }
    }
    return { w, f };
  }
  /* 目標の Lab T にいちばん近い配合。K＝顔ぶれの違う出発点の数（TARGET は 8・画像は 1） → { w, f＝ΔE } */
  function solveNear(T, lab, bank, SL, K) {
    K = K || 1; const { NS, SW } = bank, top = [];
    for (let s = 0; s < NS; s++) { const d = (SL[s * 3] - T[0]) ** 2 + (SL[s * 3 + 1] - T[1]) ** 2 + (SL[s * 3 + 2] - T[2]) ** 2;
      if (top.length < K * 6 || d < top[top.length - 1][0]) { top.push([d, s]); top.sort((p, q) => p[0] - q[0]); if (top.length > K * 6) top.pop(); } }
    const seen = new Set(), picks = [];
    for (const [d, s] of top) { let sig = ''; for (let j = 0; j < NP; j++) if (SW[s * NP + j] > 1e-4) sig += j + ','; if (seen.has(sig)) continue; seen.add(sig); picks.push([d, s]); if (picks.length >= K) break; }
    let out = null; for (const [d, s] of picks) { const q = refineFrom(T, lab, Array.from(SW.subarray(s * NP, s * NP + NP)), Math.sqrt(d)); if (!out || q.f < out.f) out = q; }
    return out;
  }
  const mixText = w => { const a = w.reduce((p, q) => p + q, 0) || 1; return w.map((v, j) => [j, v / a]).filter(q => q[1] >= 0.01).sort((p, q) => q[1] - p[1]).slice(0, 4).map(([j, v]) => PG.PIGMENTS[j].jp + ' ' + Math.round(v * 100) + '%').join(' ＋ '); };
  const api = { mulberry32, labUnder, makeBank, bankLab, refineFrom, solveNear, mixText };
  if (isNode) module.exports = api;
  root.PH_MIXSOLVE = api;
})(typeof window !== 'undefined' ? window : globalThis);
