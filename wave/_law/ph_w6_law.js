/* PH-W6 RAINBOW — 虹（法則の正本）
   入力（光の波長・雨粒の半径・太陽の高さ）→ 出力（光の道・虹の角度・角度ごとの明るさ・状態）だけ。画面にも時間にも触らない。
   色の計算は PH_COLOR（ph_color.js）、太陽の光と空は PH_W4（ph_w4_law.js）。classic script ＋ Node で require できる。

   数値の出どころ
   - 水（20 ℃）の屈折率：表の値（404.7 nm 1.3435・486.1 nm 1.3371・589.3 nm 1.3330・656.3 nm 1.3312・706.5 nm 1.3300、
     Daimon & Masumura 2007 などの概数・小数 4 桁）に 3 項のコーシーの式 n = A + B/λ² + C/λ⁴ を最小二乗で合わせた（表との差は照合に出す）。
   - 光の道（幾何光学）：雨粒に高さ b（半径を 1 とする）で入る光は、入る角 i = asin b・中の角 r = asin(b/n)。
     中で k 回はね返って出る光の曲がり D = k·180° + 2i − 2(k+1)r。虹の角（太陽の正反対の点から測る）θ = 180° − D（k＝1）／D − 180°（k＝2）。
   - 光が集まる角（最小偏角・デカルト 1637）：cos² i = (n² − 1)/(k² + 2k)。D が極小になる所で、b を変えても角がほとんど動かない＝光が重なる。
   - 明るさの量（フレネルの式・偏光の 2 成分の平均）：通る (1−R)・中ではね返る R・出る (1−R)。k 回なら (1−R)² R^k。
   - 帯の太さ（エアリー 1838 の近似）：最小偏角の近くで D(b) ≈ Dmin + c (b − b₀)²。出ていく波面は 3 次の形になり、明るさは
     I(ε) ∝ Ai²(−z)、z = ε (k₀a)^(2/3) c^(−1/3)（ε＝Dmin からのずれ・ラジアン、k₀ = 2π/λ、a＝粒の半径）。
     遠くで幾何光学の明るさ 1/(2√(cε)) の平均に一致するよう係数を合わせた（π√(zs/c)）。
     → 粒が小さいほど帯が太く、色が重なって白くなる（霧の白い虹）。主虹の内側の細い縞（過剰虹）も同じ式から出る。
     エアリーの近似は粒が小さい側（半径 0.05 mm 以下）で甘くなる（本物はミー散乱の計算）→ 白い虹の形は ○〜△。
   - 太陽の大きさ（直径 0.53°）でぼかす：円板の重み √(1−u²) で 9 点。細かすぎる縞（間隔が 0.2° より細い所）は平均に置き換える（目に見えないので）。
   - 雨の幕の明るさ・虹の濃さの係数は見え方の目安。 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const W4 = isNode ? require('./ph_w4_law.js') : root.PH_W4;
  const { LS, NL } = W4;
  const D2R = Math.PI / 180, R2D = 180 / Math.PI, clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // ── 水の屈折率（3 項コーシー・最小二乗）
  const N_TABLE = [[404.7, 1.3435], [486.1, 1.3371], [589.3, 1.3330], [656.3, 1.3312], [706.5, 1.3300]];
  const CAUCHY = (() => {
    const rows = N_TABLE.map(([l, n]) => [1, 1 / (l * l), 1 / (l ** 4), n]);
    const M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], v = [0, 0, 0];
    for (const r of rows) for (let a = 0; a < 3; a++) { v[a] += r[a] * r[3]; for (let b = 0; b < 3; b++) M[a][b] += r[a] * r[b]; }
    // 3×3 をガウスの消去で解く
    const A = M.map((r, i) => [...r, v[i]]);
    for (let i = 0; i < 3; i++) { let p = i; for (let k = i + 1; k < 3; k++) if (Math.abs(A[k][i]) > Math.abs(A[p][i])) p = k; [A[i], A[p]] = [A[p], A[i]];
      for (let k = 0; k < 3; k++) if (k !== i) { const f = A[k][i] / A[i][i]; for (let j = i; j < 4; j++) A[k][j] -= f * A[i][j]; } }
    return [A[0][3] / A[0][0], A[1][3] / A[1][1], A[2][3] / A[2][2]];
  })();
  const nWater = l => CAUCHY[0] + CAUCHY[1] / (l * l) + CAUCHY[2] / (l ** 4);
  /* BREAK：分散が逆（赤ほど強く曲がる）＝現実の外。n(λ) の代わりに n(550²/λ)（550 nm を中心に波長を裏返す） */
  const nOf = (l, brk) => brk ? nWater(550 * 550 / l) : nWater(l);

  // ── 光の道
  /* 曲がり D（度）：高さ b（0〜1）・屈折率 n・はね返り k */
  const devDeg = (b, n, k) => { const i = Math.asin(b), r = Math.asin(b / n); return (k * Math.PI + 2 * i - 2 * (k + 1) * r) * R2D; };
  /* 虹の角 θ（太陽の正反対の点から測る・度）：k=1 は 180 − D、k=2 は D − 360 + 180 ＝ D − 180 */
  const thetaDeg = (b, n, k) => { const D = devDeg(b, n, k); return k === 1 ? 180 - D : D - 180; };
  /* 最小偏角の入る高さ b₀ と虹の角 */
  const rainbowB = (n, k) => Math.sqrt(1 - (n * n - 1) / (k * k + 2 * k));
  const bowDeg = (n, k) => thetaDeg(rainbowB(n, k), n, k);
  /* D の曲がり具合 c（D ≈ Dmin + c (b − b₀)²・ラジアン） */
  function curv(n, k) { const b0 = rainbowB(n, k), h = 1e-4, d = x => devDeg(x, n, k) * D2R; return (d(b0 + h) + d(b0 - h) - 2 * d(b0)) / (2 * h * h); }

  /* 1 本の光の道（作図用）：入る点・中の点・出る点（粒の中心が原点・半径 1・光は左から右 +x へ進む）と出る向き
     b＞0 で上側に入る。戻り値 pts（入る点から出る点まで）・out（出る向きの単位ベクトル）・D（度） */
  function rayPath(b, n, k) {
    const i = Math.asin(b), r = Math.asin(b / n);
    const pts = [[-Math.cos(i), b]];                  // 入る点（左側の表面）
    let ang = Math.PI - i;                            // 表面の点の角（中心から見て）
    const step = Math.PI - 2 * r;                     // 中を 1 回渡るごとに進む中心角
    for (let q = 0; q <= k; q++) { ang -= step; pts.push([Math.cos(ang), Math.sin(ang)]); }
    const D = devDeg(b, n, k) * D2R;                  // 進む向き（+x）から D だけ回る（k=1 は上で入って下向きに戻る＝時計回り）
    const out = [Math.cos(-D), Math.sin(-D)];
    return { pts, out, D: D * R2D, i: i * R2D, r: r * R2D };
  }

  // ── フレネル（偏光の平均）
  function fresnelR(i, n) { const r = Math.asin(Math.sin(i) / n), ci = Math.cos(i), cr = Math.cos(r);
    const rs = ((ci - n * cr) / (ci + n * cr)) ** 2, rp = ((n * ci - cr) / (n * ci + cr)) ** 2; return (rs + rp) / 2; }
  /* 虹の光の割合（その b での）：(1−R)² R^k（R は入る面の角 i で。中ではね返る角 r でも同じ R になる） */
  const bowFlux = (n, k) => { const R = fresnelR(Math.asin(rainbowB(n, k)), n); return (1 - R) ** 2 * R ** k; };

  // ── エアリー関数 Ai(x)
  function airy(x) {
    if (x > 5) { const z = (2 / 3) * x ** 1.5; return Math.exp(-z) / (2 * Math.sqrt(Math.PI) * x ** 0.25); }
    if (x < -6) { const t = -x, z = (2 / 3) * t ** 1.5, ph = z + Math.PI / 4; return (Math.sin(ph) * (1 - 385 / (4608 * z * z)) - Math.cos(ph) * 5 / (72 * z)) / (Math.sqrt(Math.PI) * t ** 0.25); }   // 漸近展開の 2 項目まで
    // べき級数 Ai = c1 f − c2 g
    const c1 = 0.355028053887817, c2 = 0.258819403792807, x3 = x * x * x;
    let f = 1, g = x, tf = 1, tg = x;
    for (let k = 1; k < 60; k++) { tf *= x3 / ((3 * k - 1) * (3 * k)); tg *= x3 / ((3 * k) * (3 * k + 1)); f += tf; g += tg; if (Math.abs(tf) + Math.abs(tg) < 1e-17) break; }
    return c1 * f - c2 * g;
  }

  /* 1 つの虹の帯（k）・1 つの波長の明るさ（角 θ° の並びに対して）。a＝粒の半径 mm。
     戻り値 I（粒 1 つの断面あたり・立体角あたりの目安の単位。sin θ で割る＝輪の周りに広がる分） */
  const SUN_D = 0.53, SUN_K = 9, SUN_U = Array.from({ length: SUN_K }, (_, q) => -1 + (2 * q + 1) / SUN_K), SUN_W = (() => { const w = SUN_U.map(u => Math.sqrt(1 - u * u)); const s = w.reduce((a, b) => a + b, 0); return w.map(v => v / s); })();
  function bandOne(lam, a, k, brk, thetas, out, addTo) {
    const n = nOf(lam, brk), th0 = bowDeg(n, k), c = curv(n, k), k0a = 2 * Math.PI / (lam * 1e-6) * a, zs = Math.pow(k0a, 2 / 3) * Math.pow(c, -1 / 3);
    const F = bowFlux(n, k), K = Math.PI * Math.sqrt(zs / c), sgn = k === 1 ? -1 : 1;   // k=1 は内側（θ が小さい側）が明るい・k=2 は外側
    for (let j = 0; j < thetas.length; j++) {
      const th = thetas[j]; let s = 0;
      for (let q = 0; q < SUN_K; q++) {
        const eps = sgn * (th + SUN_U[q] * SUN_D / 2 - th0) * D2R, z = eps * zs;
        let v;
        const per = z > 1 ? 2 * Math.PI / Math.sqrt(z) / zs * R2D : 99;                // その辺の縞の間隔（度）
        if (per < 0.2) v = 1 / (2 * Math.PI * Math.sqrt(z));                          // 細かすぎる縞は平均
        else if (per < 0.4) { const t = (per - 0.2) / 0.2, ai = airy(-z); v = t * ai * ai + (1 - t) / (2 * Math.PI * Math.sqrt(z)); }
        else { const ai = airy(-z); v = ai * ai; }
        s += SUN_W[q] * v;
      }
      let val = F * K * s / Math.max(0.05, Math.sin(th * D2R));
      const ed = sgn * (th - th0);                                                     // 明るい側へのずれ（度）
      if (ed > GEO_A) { const gv = geoAt(k, lam, brk, th) / (2 * rainbowB(n, k)), t = Math.min(1, (ed - GEO_A) / (GEO_B - GEO_A)); val = val * (1 - t) + gv * t; }
      if (addTo) out[j] += val; else out[j] = val;
    }
    return out;
  }
  /* 虹から離れた所（明るい側へ 3° より先）は、エアリーの近似の外なので、光の道を数えた幾何光学の明るさに 3〜5° でつなぐ。
     数え方：b を 0〜1 に 8000 本・その角の升（0.05°）に F(b)·b·Δb を足し、升の幅と sin θ で割る（光が重なるほど明るい＝PROOF と同じ数え方）。
     エアリーと同じ単位にするため 2b₀ で割る（虹の近くで両方が 1/√ε に一致する係数）。粒の大きさによらないので一度だけ作る */
  const GEO_A = 3, GEO_B = 5, GEO_DT = 0.05, GEO_NB = Math.round(180 / GEO_DT), GEO_CACHE = {};
  function geoBuild(brk) {
    const tab = { 1: [], 2: [] }, NS = 8000;
    for (const k of [1, 2]) for (let w = 0; w < NL; w++) {
      const n = nOf(LS[w], brk), h = new Float64Array(GEO_NB);
      for (let q = 0; q < NS; q++) { const b = (q + 0.5) / NS, t = thetaDeg(b, n, k); if (t < 0 || t >= 180) continue; const R = fresnelR(Math.asin(b), n); h[Math.floor(t / GEO_DT)] += (1 - R) ** 2 * R ** k * b / NS; }
      const o = new Float64Array(GEO_NB);
      for (let j = 0; j < GEO_NB; j++) { let sm = 0, c = 0; for (let d = -3; d <= 3; d++) { const jj = j + d; if (jj >= 0 && jj < GEO_NB) { sm += h[jj]; c++; } } o[j] = sm / c / (GEO_DT * D2R) / Math.max(0.05, Math.sin((j + 0.5) * GEO_DT * D2R)); }
      tab[k].push(o);
    }
    return tab;
  }
  function geoAt(k, lam, brk, th) { const key = brk ? 'b' : 'n'; const T = GEO_CACHE[key] || (GEO_CACHE[key] = geoBuild(brk)); const w = Math.round((lam - LS[0]) / (LS[1] - LS[0]));
    const x = th / GEO_DT - 0.5, j = Math.max(0, Math.min(GEO_NB - 2, Math.floor(x))), f = Math.min(1, Math.max(0, x - j)); const a = T[k][w]; return a[j] * (1 - f) + a[j + 1] * f; }
  /* 角の並び thetas（度）に対して、波長ごとの明るさの表 [角][波長]（LS の並び）。sun＝太陽の光（波長ごと）を掛ける */
  function bowTable(a, brk, thetas, sun) {
    const T = thetas.map(() => new Float64Array(NL)), col = new Float64Array(thetas.length);
    for (let w = 0; w < NL; w++) {
      col.fill(0); bandOne(LS[w], a, 1, brk, thetas, col, true); bandOne(LS[w], a, 2, brk, thetas, col, true);
      const s = sun ? sun[w] : 1; for (let j = 0; j < thetas.length; j++) T[j][w] = col[j] * s;
    }
    return T;
  }

  // ── 状態（粒の大きさ）：帯の太さ（エアリーの主な山の幅）と、赤と紫の角の差の比 ρ
  /* 主な山の幅（度）：Ai² の最初の山の半値幅（z で数える・550 nm で） */
  const AIRY_FWHM_Z = (() => { let zp = 0, m = 0; for (let z = -2; z < 2.5; z += 0.0005) { const v = airy(-z) ** 2; if (v > m) { m = v; zp = z; } }
    let lo = zp, hi = zp; while (airy(-lo) ** 2 >= m / 2) lo -= 0.0005; while (airy(-hi) ** 2 >= m / 2) hi += 0.0005; return hi - lo; })();   // 最初の山だけ（2 つ目の山は半分より高いので続けて数えない）
  const spreadDeg = brk => Math.abs(bowDeg(nOf(700, brk), 1) - bowDeg(nOf(400, brk), 1));   // 赤 700 と紫 400 の角の差
  function widthDeg(a) { const n = nWater(550), c = curv(n, 1), zs = Math.pow(2 * Math.PI / 550e-6 * a, 2 / 3) * Math.pow(c, -1 / 3); return AIRY_FWHM_Z / zs * R2D; }
  const rhoOf = a => widthDeg(a) / spreadDeg(false);
  const RHO_COLOR = 1 / 3, RHO_WHITE = 1;                                               // 山の幅が色の差の 1/3 以下＝色が分かれる／色の差以上＝全部の色が重なる
  const aOfRho = rho => { let lo = 1e-4, hi = 10; for (let q = 0; q < 80; q++) { const m = Math.sqrt(lo * hi); rhoOf(m) > rho ? lo = m : hi = m; } return Math.sqrt(lo * hi); };
  const A_COLOR = aOfRho(RHO_COLOR), A_WHITE = aOfRho(RHO_WHITE);
  const stateOf = a => { const r = rhoOf(a); return r <= RHO_COLOR ? 'COLOR' : r <= RHO_WHITE ? 'PALE' : 'WHITE'; };
  const A_MIN = 0.005, A_MAX = 2.5;                                                      // 霧の粒 0.005 mm 〜 大きな雨粒 2.5 mm（半径）

  /* 過剰虹の 1 本目：主虹の山から内側へ何度（550 nm・Ai² の 1 つ目と 2 つ目の山の間 z 1.02 → 3.25） */
  function supernumDeg(a) { const n = nWater(550), c = curv(n, 1), zs = Math.pow(2 * Math.PI / 550e-6 * a, 2 / 3) * Math.pow(c, -1 / 3); return (3.2482 - 1.0188) / zs * R2D; }

  const api = { N_TABLE, CAUCHY, nWater, nOf, devDeg, thetaDeg, rainbowB, bowDeg, curv, rayPath, fresnelR, bowFlux, airy, bandOne, bowTable, geoAt, GEO_A, GEO_B,
    SUN_D, AIRY_FWHM_Z, spreadDeg, widthDeg, rhoOf, RHO_COLOR, RHO_WHITE, A_COLOR, A_WHITE, stateOf, A_MIN, A_MAX, supernumDeg };
  if (isNode) module.exports = api;
  root.PH_W6 = api;
})(typeof window !== 'undefined' ? window : globalThis);
