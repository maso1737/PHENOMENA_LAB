/* PHENOMENA LAB — Z3 COAST の法則（荒れ方の物差し：写真の輪郭から D を読む）
 *
 * 出どころ
 *   - 物差しの方法（ディバイダー法）：Richardson（1961 年に没後発表の測定）。長さ L(ε) を物差し ε で測ると L ∝ ε^(1−D)。
 *     Mandelbrot 1967 "How Long Is the Coast of Britain?"（Science 156: 636）がこれを D としてまとめた。
 *   - 文献値（Richardson の測定・Mandelbrot 1967 の表）：ブリテン島の西岸 1.25／ドイツの国境 1.15／オーストラリアの海岸 1.13／南アフリカの海岸 1.02。
 *   - 箱で数える方法（ボックスカウンティング）：大きさ ε の箱で輪郭を覆う数 N(ε) ∝ ε^(−D)。物差しと別の道で同じ D を出す（照らし合わせ）。
 *   - 見本の島：正方形の 4 辺に、コッホの置きかえ（1 本 → 長さ s の 4 本・山の角 θ）をくり返す。山を外に出すか内に入れるかは 1 本ごとに乱数。
 *     4 本・縮み s なので D = log 4 / log(1/s) が決まっている（答えを先に知っている写真）。s = 1/(2 + 2 cos θ)。
 *   - 輪郭の取り出し：明るさのしきい値（既定は大津の方法）→ 押した点とつながった塊 → 外側の縁をムーア近傍でたどる。
 *   - BREAK（ぼかした地図）：塊を半径 r でならしてから縁を取る。r より細かい入り江が消え、小さい物差しで長さが伸びなくなる（地図の縮尺の限界）。
 * 画面にも時間にも触らない。
 */
(function (g) {
  'use strict';
  const D2R = Math.PI / 180;
  const LIT = [['南アフリカの海岸', 1.02], ['オーストラリアの海岸', 1.13], ['ドイツの国境', 1.15], ['ブリテン島の西岸', 1.25]];
  const D_SMOOTH = 1.1, D_WILD = 1.2;   // 区切りは文献値の間（南アフリカ 1.02 ｜ オーストラリア 1.13・ドイツ 1.15 ｜ ブリテン島 1.25）
  const stateOf = D => D < D_SMOOTH ? 'SMOOTH' : D < D_WILD ? 'RUGGED' : 'WILD';
  const D_MIN = 1.02, D_MAX = 1.26;   // 見本で作れる範囲（1.3 では山どうしがぶつかって塊になり、読みが 0.1 ほど低く出た）
  const sOfD = D => Math.pow(4, -1 / D), thetaOfD = D => Math.acos(Math.min(1, 1 / (2 * sOfD(D)) - 1)) / D2R;

  function rng(seed) { let a = (seed >>> 0) || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---- 見本の島：中心 (cx, cy)・正方形の辺 A・答え D・乱数の種 → 多角形（時計回り） ---- */
  function sampleIsland(D, seed, cx, cy, A, minSeg) {
    const s = sOfD(D), th = thetaOfD(D) * D2R, h = s * Math.sin(th), R = rng(seed);
    let P = [[cx - A / 2, cy - A / 2], [cx + A / 2, cy - A / 2], [cx + A / 2, cy + A / 2], [cx - A / 2, cy + A / 2]];
    let seg = A, G = [1, 1, 1, 1];   // 山の向きは「親の 1 本から生まれた 4 本」でそろえる（1 本ずつ乱数にすると内と外の山がぶつかり、D 1.2 あたりで読みが頭打ちになった）
    while (seg * s >= (minSeg || 3)) {   // いちばん細かい山は 3 px まで（写真のぼけ・ざらつきで 1.5 px の入り江は埋まり、D が 0.04 低く読めた）
      const Q = [], G2 = [];
      for (let i = 0; i < P.length; i++) {
        const p = P[i], q = P[(i + 1) % P.length], dx = q[0] - p[0], dy = q[1] - p[1], sg = G[i], gs = R() < 0.5 ? 1 : -1; G2.push(gs, gs, gs, gs);
        const nx = -dy * sg, ny = dx * sg;   // 時計回り（画面は y 下向き）で (−dy, dx) は外向き
        Q.push(p, [p[0] + dx * s, p[1] + dy * s], [p[0] + dx * 0.5 + nx * h, p[1] + dy * 0.5 + ny * h], [p[0] + dx * (1 - s), p[1] + dy * (1 - s)]);
      }
      P = Q; G = G2; seg *= s;
    }
    return { poly: P, D, s, theta: th / D2R, seg };
  }

  /* ---- 多角形を塗る（偶奇・走査線）→ 0/1 の塊 ---- */
  function fillMask(poly, W, H) {
    const m = new Uint8Array(W * H), n = poly.length, xs = [];
    for (let y = 0; y < H; y++) {
      const yc = y + 0.5; xs.length = 0;
      for (let i = 0; i < n; i++) { const a = poly[i], b = poly[(i + 1) % n]; if ((a[1] <= yc) !== (b[1] <= yc)) xs.push(a[0] + (yc - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
      xs.sort((u, v) => u - v);
      for (let k = 0; k + 1 < xs.length; k += 2) { const x0 = Math.max(0, Math.ceil(xs[k] - 0.5)), x1 = Math.min(W - 1, Math.floor(xs[k + 1] - 0.5)); for (let x = x0; x <= x1; x++) m[y * W + x] = 1; }
    }
    return m;
  }

  /* ---- 写真 → 明るさ → しきい値（大津）→ 押した点とつながった塊 ---- */
  function otsu(lum) {
    const h = new Float64Array(256); for (let i = 0; i < lum.length; i++) h[lum[i]]++;
    let sum = 0; for (let i = 0; i < 256; i++) sum += i * h[i];
    let wB = 0, sB = 0, best = 0, t = 128; const tot = lum.length;
    for (let i = 0; i < 256; i++) { wB += h[i]; if (!wB) continue; const wF = tot - wB; if (!wF) break; sB += i * h[i]; const mB = sB / wB, mF = (sum - sB) / wF, v = wB * wF * (mB - mF) * (mB - mF); if (v > best) { best = v; t = i; } }
    return t;
  }
  function component(lum, W, H, t, sx, sy, invert) {
    const on = i => (lum[i] > t) !== !!invert, seed = sy * W + sx, m = new Uint8Array(W * H);
    if (sx < 0 || sy < 0 || sx >= W || sy >= H || !on(seed)) return { mask: m, n: 0 };
    const st = [seed]; m[seed] = 1; let n = 0;
    while (st.length) { const i = st.pop(); n++; const x = i % W, y = (i - x) / W;
      if (x > 0 && !m[i - 1] && on(i - 1)) { m[i - 1] = 1; st.push(i - 1); } if (x < W - 1 && !m[i + 1] && on(i + 1)) { m[i + 1] = 1; st.push(i + 1); }
      if (y > 0 && !m[i - W] && on(i - W)) { m[i - W] = 1; st.push(i - W); } if (y < H - 1 && !m[i + W] && on(i + W)) { m[i + W] = 1; st.push(i + W); } }
    return { mask: m, n };
  }
  /* 縁につながる塊だけを選ぶ（中の湖は捨てる）は不要：外側の縁をたどるので湖は最初から入らない */

  /* ---- BREAK：塊を半径 r でならす（箱 3 回＝ほぼガウス）→ 0.5 で切る ---- */
  function smoothMask(m, W, H, r) {
    if (r < 1) return m;
    let a = Float32Array.from(m), b = new Float32Array(W * H); const R = Math.max(1, Math.round(r / Math.sqrt(3)));
    for (let pass = 0; pass < 3; pass++) {
      for (let y = 0; y < H; y++) { let acc = 0; const o = y * W; for (let x = -R; x <= R; x++) acc += a[o + Math.min(W - 1, Math.max(0, x))];
        for (let x = 0; x < W; x++) { b[o + x] = acc / (2 * R + 1); acc += a[o + Math.min(W - 1, x + R + 1)] - a[o + Math.max(0, x - R)]; } }
      for (let x = 0; x < W; x++) { let acc = 0; for (let y = -R; y <= R; y++) acc += b[Math.min(H - 1, Math.max(0, y)) * W + x];
        for (let y = 0; y < H; y++) { a[y * W + x] = acc / (2 * R + 1); acc += b[Math.min(H - 1, y + R + 1) * W + x] - b[Math.max(0, y - R) * W + x]; } }
    }
    const o = new Uint8Array(W * H); for (let i = 0; i < o.length; i++) o[i] = a[i] >= 0.5 ? 1 : 0; return o;
  }

  /* ---- 外側の縁をたどる（ムーア近傍・時計回り）→ 画素の中心の並び ---- */
  function traceBoundary(m, W, H) {
    let start = -1; for (let i = 0; i < W * H; i++) if (m[i]) { start = i; break; }
    if (start < 0) return [];
    const at = (x, y) => x >= 0 && y >= 0 && x < W && y < H && m[y * W + x];
    const DX = [1, 1, 0, -1, -1, -1, 0, 1], DY = [0, 1, 1, 1, 0, -1, -1, -1];   // 右から時計回り
    const sx = start % W, sy = (start - sx) / W, out = [[sx + 0.5, sy + 0.5]];
    let x = sx, y = sy, dir = 7, guard = 0;
    while (guard++ < 4 * W * H) {
      let found = false;
      for (let k = 0; k < 8; k++) { const d = (dir + 6 + k) % 8, nx = x + DX[d], ny = y + DY[d]; if (at(nx, ny)) { x = nx; y = ny; dir = d; found = true; break; } }
      if (!found) break;
      if (x === sx && y === sy) break;
      out.push([x + 0.5, y + 0.5]);
    }
    return out;
  }

  /* ---- 物差しで測る（閉じた多角形をコンパスで歩く）→ 歩数・長さ・跳んだ点 ---- */
  function divider(P, eps, keep) {
    const n = P.length; if (n < 3) return { n: 0, L: 0, hops: [] };
    let px = P[0][0], py = P[0][1], i = 1, steps = 0; const hops = keep ? [[px, py]] : null, e2 = eps * eps;
    while (i <= n) {
      const q = P[i % n], dx = q[0] - px, dy = q[1] - py;
      if (dx * dx + dy * dy < e2) { i++; continue; }
      // P[i-1] → P[i] の線分と、中心 (px,py)・半径 eps の円の交点（先の方）
      const a = P[(i - 1) % n], ux = q[0] - a[0], uy = q[1] - a[1], fx = a[0] - px, fy = a[1] - py;
      const A = ux * ux + uy * uy, B = 2 * (fx * ux + fy * uy), Cc = fx * fx + fy * fy - e2, disc = Math.max(0, B * B - 4 * A * Cc);
      const t = Math.min(1, Math.max(0, (-B + Math.sqrt(disc)) / (2 * A)));
      px = a[0] + ux * t; py = a[1] + uy * t; steps++; if (keep) hops.push([px, py]);
    }
    const rem = Math.hypot(P[0][0] - px, P[0][1] - py);
    return { n: steps, L: steps * eps + rem, hops };
  }

  /* ---- 箱で数える（輪郭の点が入る ε の升の数。点の間は 1 px 以下なので点で足りる）---- */
  function boxCount(P, eps) {
    const S = new Set(); for (const p of P) S.add(Math.floor(p[0] / eps) * 100003 + Math.floor(p[1] / eps)); return S.size;
  }

  function fitLine(xs, ys) {
    const n = xs.length; if (n < 2) return { b: 0, a: 0, r2: 0 };
    let sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0; for (let i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; sxx += xs[i] * xs[i]; sxy += xs[i] * ys[i]; syy += ys[i] * ys[i]; }
    const b = (n * sxy - sx * sy) / (n * sxx - sx * sx), a = (sy - b * sx) / n, r = (n * sxy - sx * sy) / Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
    return { b, a, r2: r * r };
  }
  function extent(P) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of P) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); } return { x0, y0, x1, y1, diam: Math.max(x1 - x0, y1 - y0) }; }

  /* ---- まとめて読む：物差し 16 通り（2 px〜差し渡しの 1/3・対数）。当てはめは lo〜hi の間 ---- */
  const N_EPS = 16;
  function epsList(diam) { const e0 = 2, e1 = Math.max(6, diam / 3); return Array.from({ length: N_EPS }, (_, k) => e0 * Math.pow(e1 / e0, k / (N_EPS - 1))); }
  function analyze(P, opt) {
    opt = opt || {}; const ex = extent(P), eps = epsList(ex.diam);
    const lo = opt.lo || 6, hi = opt.hi || ex.diam / 5;   // 6 px より下は画素の階段・差し渡しの 1/5 より上は形全体の大きさが効く
    const L = eps.map(e => divider(P, e).L), N = eps.map(e => boxCount(P, e));
    const pick = eps.map((e, k) => e >= lo * 0.999 && e <= hi * 1.001 ? k : -1).filter(k => k >= 0);
    const fd = fitLine(pick.map(k => Math.log10(eps[k])), pick.map(k => Math.log10(L[k])));
    const fb = fitLine(pick.map(k => Math.log10(eps[k])), pick.map(k => Math.log10(N[k])));
    return { eps, L, N, lo, hi, pick, Ddiv: 1 - fd.b, Dbox: -fb.b, fd, fb, ex, pts: P.length };
  }

  g.PH_Z3 = { LIT, D_SMOOTH, D_WILD, D_MIN, D_MAX, stateOf, sOfD, thetaOfD, rng, sampleIsland, fillMask, otsu, component, smoothMask, traceBoundary, divider, boxCount, fitLine, extent, epsList, analyze, N_EPS };
  if (typeof module !== 'undefined') module.exports = g.PH_Z3;
})(typeof window !== 'undefined' ? window : globalThis);
