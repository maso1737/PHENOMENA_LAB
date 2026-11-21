/* PH-COLOR — 光の色の部品（W1・W3・W4・W6・W7・E5 で共有する正本）
   入力（波長ごとの光の強さ）→ 出力（目の 3 つの受け手の反応・XYZ・画面の色）だけの式。画面にも時間にも触らない。
   classic script（file:// でも読める）＋ Node でも require できる。

   数値の出どころ
   - 等色関数 x̄ȳz̄（CIE 1931 2°）：Wyman, Sloan & Shirley (2013) "Simple Analytic Approximations to the CIE XYZ
     Color Matching Functions" の多ローブ・ガウス近似（式 2）。表との差はおおむね 1〜2 % 程度（論文の評価）。
   - XYZ → 線形 sRGB：IEC 61966-2-1（D65 白）の行列。ガンマも同規格。
   - 目の 3 つの受け手 L・M・S：XYZ から Hunt–Pointer–Estévez の行列で出す（近似）。各曲線は山を 1 にそろえる。
   - 黒体の光：プランクの式。
   - 純色は sRGB の外に出る（負の値になる）。画面に出すときの切り方：**負の成分を 0 に切る**（色相がわずかにずれる代わりに、
     虹の端が赤・紫のまま見える。灰色へ寄せる方式 fitGamut も残してあるが、赤端がピンクに寄るので画面には使わない）。
     「光の色」として出すときは、いちばん明るい成分を 1 にそろえる。clipped＝切り捨てた負の量（いちばん大きい成分に対する割合）。
   - 近似式は両端（640 nm より赤・430 nm より紫）で色の比がずれるので、CIE 1931 の表の端の比にそろえる（cmf() の注）。 */
(function (root) {
  'use strict';

  const L0 = 380, L1 = 750, STEP = 1;                 // 見える光の範囲（1 nm 刻み・371 本）
  const N = Math.round((L1 - L0) / STEP) + 1;
  const lam = i => L0 + i * STEP;

  // ── 等色関数（Wyman 2013 の区分ガウス）
  const g = (x, mu, s1, s2) => { const t = (x - mu) / (x < mu ? s1 : s2); return Math.exp(-0.5 * t * t); };
  function cmfFit(l) {
    return {
      x: 1.056 * g(l, 599.8, 37.9, 31.0) + 0.362 * g(l, 442.0, 16.0, 26.7) - 0.065 * g(l, 501.1, 20.4, 26.2),
      y: 0.821 * g(l, 568.8, 46.9, 40.5) + 0.286 * g(l, 530.9, 16.3, 31.1),
      z: 1.217 * g(l, 437.0, 11.8, 36.0) + 0.681 * g(l, 459.0, 26.0, 13.8)
    };
  }
  /* 両端の補正：近似式は 640 nm より赤・420 nm より紫で、成分の比が CIE 1931 の表からずれる（赤端が緑がかる・紫端が青に寄る）。
     表では両端の色の比はほぼ一定（赤端 x̄/ȳ ≈ 2.60〜2.77・z̄ ≈ 0／紫端 x̄/z̄ ≈ 0.21・ȳ/z̄ ≈ 0.006）。
     明るさの形（赤端は ȳ・紫端は z̄）は近似式のまま使い、比だけ表の値にそろえる。境目は 10 nm でなめらかにつなぐ。 */
  function cmf(l) {
    const f = cmfFit(l);
    if (l > 640) { const r = 2.60 + 0.17 * Math.min(1, (l - 640) / 60), t = Math.min(1, (l - 640) / 10);
      return { x: f.x * (1 - t) + f.y * r * t, y: f.y, z: f.z * (1 - t) }; }
    if (l < 430) { const t = Math.min(1, (430 - l) / 10);
      return { x: f.x * (1 - t) + f.z * 0.21 * t, y: f.y * (1 - t) + f.z * 0.006 * t, z: f.z }; }
    return f;
  }
  const CMF = Array.from({ length: N }, (_, i) => cmf(lam(i)));

  // ── 光（371 本の強さの並び）→ XYZ（そのまま足す。明るさの絶対値は持たない）
  function xyzOf(spec) {
    let X = 0, Y = 0, Z = 0;
    for (let i = 0; i < N; i++) { const a = spec[i]; if (!a) continue; const c = CMF[i]; X += a * c.x; Y += a * c.y; Z += a * c.z; }
    return { X, Y, Z };
  }
  const chroma = ({ X, Y, Z }) => { const s = X + Y + Z; return s > 0 ? { x: X / s, y: Y / s } : { x: 1 / 3, y: 1 / 3 }; };

  // ── XYZ → 線形 sRGB → 画面の sRGB
  const toLin = ({ X, Y, Z }) => [3.2406 * X - 1.5372 * Y - 0.4986 * Z, -0.9689 * X + 1.8758 * Y + 0.0415 * Z, 0.0557 * X - 0.2040 * Y + 1.0570 * Z];
  const gamma = v => v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  /* 負の値の切り方：同じ明るさ Y の灰色 (Y,Y,Y) へ向けて寄せる。戻り値 clipped＝寄せた量（0＝範囲内） */
  function fitGamut(rgb, Y) {
    const mn = Math.min(...rgb); if (mn >= 0) return { rgb, clipped: 0 };
    const t = Y / (Y - mn);                              // Y + t(c − Y) の最小成分が 0 になる t
    return { rgb: rgb.map(c => Y + t * (c - Y)), clipped: 1 - t };
  }
  /* 光の色：いちばん明るい成分を 1 にそろえた画面の色（明るさの情報は捨てる＝「どんな色か」だけ） */
  const clipNeg = lin => { const mx = Math.max(...lin, 1e-12), mn = Math.min(...lin); return { rgb: lin.map(v => Math.max(0, v)), clipped: mn < 0 ? -mn / mx : 0 }; };
  function lightColor(xyz) {
    if (xyz.Y <= 0 && xyz.X <= 0 && xyz.Z <= 0) return { rgb: [0, 0, 0], hex: '#000000', clipped: 0 };
    const f = clipNeg(toLin(xyz)), mx = Math.max(...f.rgb, 1e-9);
    const rgb = f.rgb.map(v => gamma(v / mx));
    return { rgb, hex: hex(rgb), clipped: f.clipped };
  }
  /* 明るさも残す画面の色（scale で全体の明るさを決める。1 を超えた分は切る） */
  function surfaceColor(xyz, scale) {
    const f = clipNeg(toLin({ X: xyz.X * scale, Y: xyz.Y * scale, Z: xyz.Z * scale }));
    const rgb = f.rgb.map(v => gamma(Math.min(1, v)));
    return { rgb, hex: hex(rgb), clipped: f.clipped };
  }
  const hex = rgb => '#' + rgb.map(v => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('');

  // ── 目の 3 つの受け手（Hunt–Pointer–Estévez・山を 1 にそろえる）
  const hpe = ({ x, y, z }) => [0.38971 * x + 0.68898 * y - 0.07868 * z, -0.22981 * x + 1.18340 * y + 0.04641 * z, z];
  const RAW = CMF.map(hpe), PEAK = [0, 1, 2].map(k => Math.max(...RAW.map(r => r[k])));
  const CONE = RAW.map(r => r.map((v, k) => Math.max(0, v / PEAK[k])));      // CONE[i] = [L, M, S]
  const CONE_PEAK = [0, 1, 2].map(k => lam(CONE.reduce((b, r, i) => (r[k] > CONE[b][k] ? i : b), 0)));
  function lmsOf(spec) { const o = [0, 0, 0]; for (let i = 0; i < N; i++) { const a = spec[i]; if (!a) continue; for (let k = 0; k < 3; k++) o[k] += a * CONE[i][k]; } return o; }

  // ── 黒体（プランクの式）・波長 nm、温度 K → 相対の強さ
  const planck = (l, T) => { const m = l * 1e-9; return 1 / (Math.pow(m, 5) * (Math.exp(0.0143877735 / (m * T)) - 1)); };

  // ── 主波長：白（等エネルギーの白 E）から、その色の方向にある虹の色。赤紫は虹に無いので補色を返す
  const E = { x: 1 / 3, y: 1 / 3 };
  const LOCUS = CMF.map((c, i) => { const s = c.x + c.y + c.z; return { l: lam(i), x: c.x / s, y: c.y / s }; });
  function dominant(xy) {
    const dx = xy.x - E.x, dy = xy.y - E.y, r = Math.hypot(dx, dy);
    if (r < 0.012) return { kind: 'white', purity: 0 };
    const ang = a => Math.atan2(a.y - E.y, a.x - E.x), a0 = Math.atan2(dy, dx);
    const best = sign => { let b = null, bd = 9; for (const p of LOCUS) { let d = Math.abs(((ang(p) - (a0 + (sign < 0 ? Math.PI : 0))) + 3 * Math.PI) % (2 * Math.PI) - Math.PI); if (d < bd) { bd = d; b = p; } } return { p: b, d: bd }; };
    const f = best(1);
    if (f.d < 0.03) return { kind: 'spectral', l: f.p.l, purity: Math.min(1, r / Math.hypot(f.p.x - E.x, f.p.y - E.y)) };
    const c = best(-1); return { kind: 'purple', l: c.p.l, purity: null };     // 赤紫の線の上：補色の波長で呼ぶ
  }

  // ── 受け手が 2 つ（L が無い目）の見え方の目安：L を、白で同じ比になるよう M から作り直して XYZ に戻す（BREAK 用・目安）
  const HPE = [[0.38971, 0.68898, -0.07868], [-0.22981, 1.18340, 0.04641], [0, 0, 1]];
  const inv3 = m => { const [a, b, c] = m[0], [d, e, f] = m[1], [g, h, i] = m[2], A = e * i - f * h, B = f * g - d * i, Cc = d * h - e * g, det = a * A + b * B + c * Cc;
    return [[A, c * h - b * i, b * f - c * e], [B, a * i - c * g, c * d - a * f], [Cc, b * g - a * h, a * e - b * d]].map(r => r.map(v => v / det)); };
  const HPE_INV = inv3(HPE), mul = (m, v) => m.map(r => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
  const WHITE_LMS = mul(HPE, [CMF.reduce((s, c) => s + c.x, 0), CMF.reduce((s, c) => s + c.y, 0), CMF.reduce((s, c) => s + c.z, 0)]);
  function dropL({ X, Y, Z }) { const l = mul(HPE, [X, Y, Z]); l[0] = l[1] * WHITE_LMS[0] / WHITE_LMS[1]; const o = mul(HPE_INV, l); return { X: o[0], Y: o[1], Z: o[2] }; }

  const api = { dropL, clipNeg, L0, L1, STEP, N, lam, cmf, CMF, xyzOf, chroma, toLin, gamma, fitGamut, lightColor, surfaceColor, hex, CONE, CONE_PEAK, lmsOf, planck, dominant, E };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PH_COLOR = api;
})(typeof window !== 'undefined' ? window : globalThis);
