/* PH-W1 ONE OCTAVE — 光を音で聴く（法則の正本）
   入力（371 本の光の強さ：380〜750 nm・1 nm 刻み）→ 出力（音の高さ・状態・見え方）だけ。画面にも時間にも触らない。
   色の計算は PH_COLOR（ph_color.js）に任せる。classic script ＋ Node で require できる。

   数値の出どころ
   - 光の速さ c = 299 792 458 m/s（定義値）。振動数 f = c / λ。
   - 40 オクターブ下げる＝ 2⁴⁰（= 1 099 511 627 776）で割る。700 nm → 389.5 Hz（G4 付近）・380 nm → 717.6 Hz。
   - 音名は A4 = 440 Hz の平均律。
   - 見える範囲：このラボは 380〜750 nm（比 1.97 ＝ 0.98 オクターブ）。よく見える 400〜700 nm は 0.81 オクターブ。
   - 耳：20 Hz〜20 kHz ＝ 約 10 オクターブ（目安。年齢で上が下がる）。
   - 光源の形：太陽＝5778 K の黒体（本物の太陽は大気と吸収線で凸凹がある＝近似）／電球＝2700 K の黒体／
     白色 LED＝青 450 nm の山＋黄色い蛍光体の広い山（形は目安）／ナトリウム灯＝589 nm の 1 本（実際は 589.0 と 589.6 の 2 本）。
   - 「黄色 1 本」と同じに見える「赤＋緑 2 本」：赤 630 nm を決め、緑（520〜560 nm）を 1 nm ずつ試して、X と Y が 589 nm と
     ぴったりそろう強さを解き、色度（x, y）の差が 0.0015 以下になる、いちばん短い（緑らしい）波長を選ぶ（→ 550 nm）。虹の色の並び（色度図の縁）はわずかに外へふくらむので、
     2 本で「完全に同じ」は作れない。残る差は check_w1 が数値で出す（人が見分けられる差＝色度でおよそ 0.003 より十分小さい）。
   - 赤い物の返す光：600 nm から上をよく返す塗料の目安（ロジスティック曲線）。 */
(function (root) {
  'use strict';
  const C = (typeof module !== 'undefined' && module.exports) ? require('./ph_color.js') : root.PH_COLOR;
  const { N, L0, lam, CMF, xyzOf, chroma } = C;

  const SPEED = 299792458, DOWN = Math.pow(2, 40);
  const THz = l => SPEED / (l * 1e-9) / 1e12;
  const toHz = l => SPEED / (l * 1e-9) / DOWN;
  const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  function note(hz) {
    const m = 69 + 12 * Math.log2(hz / 440), k = Math.round(m);
    return { name: NOTES[((k % 12) + 12) % 12] + (Math.floor(k / 12) - 1), cents: Math.round((m - k) * 100), midi: k, hz: 440 * Math.pow(2, (k - 69) / 12) };
  }
  const OCT_EYE = Math.log2(750 / 380), OCT_EYE_CORE = Math.log2(700 / 400), OCT_EAR = Math.log2(20000 / 20);

  const idx = l => Math.max(0, Math.min(N - 1, Math.round(l - L0)));
  const empty = () => new Float32Array(N);
  const norm = s => { let m = 0; for (const v of s) m = Math.max(m, v); if (m > 0) for (let i = 0; i < N; i++) s[i] /= m; return s; };

  // ── 黄色 1 本と同じ色に見える赤＋緑（同じ XYZ）
  const DXY_OK = 0.0015;                                           // 色度の差の許し（人が見分けられる差 約 0.003 の半分）
  function metamer(lA = 589, lR = 630) {
    const c = C.cmf(lA), pa = chroma({ X: c.x, Y: c.y, Z: c.z }); let best = null;
    for (let lG = 520; lG <= 560; lG++) {                          // 緑（520〜560 nm）を 1 nm ずつ試す
      const r = solve2(lA, lR, lG); if (r.aR <= 0 || r.aG <= 0) continue;
      const s = empty(); s[idx(lR)] = r.aR; s[idx(lG)] = r.aG; const pb = chroma(xyzOf(s)), d = Math.hypot(pb.x - pa.x, pb.y - pa.y);
      if (d <= DXY_OK) { best = { lA, lR, ...r, dxy: d }; break; }    // 許しに入るうち、いちばん緑らしい（短い）波長
    }
    return best;
  }
  /* 1 nm の格子に乗せた 2 本（lR・lG）の強さを、X と Y が lA の 1 本と一致するように解く（Z の残りは照合で確かめる） */
  function solve2(lA, lR, lG) {
    const A = C.CMF[idx(lA)], R = C.CMF[idx(lR)], G = C.CMF[idx(lG)];
    const det = R.x * G.y - G.x * R.y, aR = (A.x * G.y - G.x * A.y) / det, aG = (R.x * A.y - A.x * R.y) / det;
    return { lG: lG, aR, aG };
  }

  // ── 光源のひな形（いちばん強い所を 1 にそろえる）
  const MET = metamer();
  const PRESETS = {
    SUN:    () => norm(empty().map((_, i) => C.planck(lam(i), 5778))),
    BULB:   () => norm(empty().map((_, i) => C.planck(lam(i), 2700))),
    LED:    () => norm(empty().map((_, i) => { const l = lam(i); return Math.exp(-0.5 * ((l - 450) / 10) ** 2) + 0.62 * Math.exp(-0.5 * ((l - 565) / (l < 565 ? 40 : 60)) ** 2); })),
    LASER:  () => { const s = empty(), m = Math.max(MET.aR, MET.aG); s[idx(MET.lR)] = MET.aR / m; s[idx(MET.lG)] = MET.aG / m; return s; },
    SODIUM: () => { const s = empty(); s[idx(589)] = 1; return s; },
    WHITE:  () => empty().fill(1),
    CLEAR:  () => empty()
  };

  // ── 成分の広がり：光っている線の数（山の数）と、実効の幅（参加比 (Σa)²/Σa² × 1 nm）
  const PURE_W = 5, WHITE_W = 300;                              // 境界：幅 5 nm 以下で山 1 つ＝PURE／幅 300 nm 以上（371 nm の 8 割が平らに光る）＝WHITE
  function spread(s) {
    let mx = 0, sum = 0, sq = 0; for (const v of s) { mx = Math.max(mx, v); sum += v; sq += v * v; }
    if (mx <= 0) return { W: 0, lines: 0, state: 'DARK', peak: null };
    let lines = 0, on = false, peak = 0;
    for (let i = 0; i < N; i++) { const lit = s[i] >= 0.05 * mx; if (lit && !on) lines++; on = lit; if (s[i] > s[peak]) peak = i; }
    const W = sum * sum / sq;
    const state = W >= WHITE_W ? 'WHITE' : (lines === 1 && W <= PURE_W ? 'PURE' : 'MIXED');
    let mn = mx; for (const v of s) mn = Math.min(mn, v);
    return { W, lines, state, peak: mx - mn < 1e-6 ? null : lam(peak) };   // 全部同じ強さ（平ら）なら山は無い
  }
  /* 光っている線（山）の頂上の波長の一覧（音の鍵盤に印を付ける用）：ばらばらの山の頂上だけ、多すぎるときは強い順に 8 本 */
  function peaks(s) {
    let mx = 0; for (const v of s) mx = Math.max(mx, v); if (mx <= 0) return [];
    const out = []; let i = 0;
    while (i < N) { if (s[i] < 0.05 * mx) { i++; continue; } let j = i, b = i; while (j < N && s[j] >= 0.05 * mx) { if (s[j] > s[b]) b = j; j++; } out.push({ l: lam(b), a: s[b] / mx, w: j - i }); i = j; }
    return out.sort((p, q) => q.a - p.a).slice(0, 8);
  }

  // ── 物の色：光 × 物が返す割合
  const RED_REFL = empty().map((_, i) => 0.06 + 0.84 / (1 + Math.exp(-(lam(i) - 600) / 9)));
  const WHITE_REFL = empty().fill(0.92);
  const lit = (s, refl) => s.map((v, i) => v * refl[i]);

  // ── 4 つ目の受け手（BREAK 用・鳥の紫外の受け手は範囲外なので、L と M の間 590 nm に山を持つ仮の受け手＝目安）
  const Q = empty().map((_, i) => Math.exp(-0.5 * ((lam(i) - 590) / 22) ** 2));
  const qOf = s => { let o = 0; for (let i = 0; i < N; i++) o += s[i] * Q[i]; return o; };

  const api = { DXY_OK, SPEED, DOWN, THz, toHz, note, OCT_EYE, OCT_EYE_CORE, OCT_EAR, idx, empty, norm, metamer, MET, PRESETS, spread, peaks, PURE_W, WHITE_W, RED_REFL, WHITE_REFL, lit, Q, qOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PH_W1 = api;
})(typeof window !== 'undefined' ? window : globalThis);
