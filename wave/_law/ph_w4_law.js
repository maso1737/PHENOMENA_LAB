/* PH-W4 SKY — 空の色（法則の正本）
   入力（太陽の高さ・粒の大きさ・見る向き）→ 出力（空の光の 波長ごとの強さ・画面の色・状態）だけ。画面にも時間にも触らない。
   色の計算は PH_COLOR（ph_color.js）。classic script ＋ Node で require できる。

   数値の出どころ
   - 太陽の光（大気の外）：5778 K の黒体（本物は吸収線で凸凹がある＝目安）。
   - 空気の散り方：レイリー散乱の厚み τR(λ) = 0.008569 λ⁻⁴ (1 + 0.0113 λ⁻² + 0.00013 λ⁻⁴)（λ は µm・Hansen & Travis 1974）。
     向きの分かれ方 P(Θ) = 3/4 (1 + cos²Θ)。 → 青 450 nm は赤 700 nm の約 6 倍散る（照合）。
   - 粒（もや・霞・雲の粒）：厚み τp(λ) = 0.2 × (λ/550)^−α（オングストロームの式・量 0.2 は目安）。
     α は粒の大きさ r から決める目安の式 α = 4 / (1 + (r / 0.1 µm)^1.5)（r ≪ 波長で 4＝空気と同じ・r ≳ 波長で 0＝色によらず散る）。
     本物はミー散乱の計算が要る（ここでは ○）。向きの分かれ方は ヘニエイ–グリーンスタイン（g = 0.75）とレイリーを α で混ぜる（目安）。
   - オゾン（チャピュイ帯・600 nm 付近の吸収）：厚み 0.042（300 DU × 断面積 5.2e−21 cm²）を山の形で（形は目安）。オゾンは 22 km の高さにあるので、
     太陽の光の通り道だけに掛ける（通る量 m = (1 + h/R) / √(cos²z + 2h/R)・Komhyr の式）。入れないと夕方の天頂が青く残らない（HANDOFF §5）。
   - 通る空気の量（エアマス）：Kasten & Young 1989。天頂 1・地平線 38.1。
   - 空の明るさ：平らな大気・空気と粒が同じ割合で混ざっている・1 回だけ散る（一次散乱）。
     L(λ) = E(λ) · [τR PR(Θ) + τp Pp(Θ)] / (4π τ) · mv (e^(−τ ms) − e^(−τ mv)) / (mv − ms)
     （τ＝通り抜けの厚み・ms 太陽の側・mv 見る側のエアマス）。2 回以上散る光を入れていないので、地平線の白さは少し弱い（○）。
   - 遠くの山：見える光 = 山の光 × T + 地平の空の光 × (1 − T)、T = e^(−β d)。β＝地面の近くの消え方（空気の厚みを 8 km・粒を 1.5 km で割る）。 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./ph_color.js') : root.PH_COLOR;
  const { N, lam, CMF, planck } = C;
  const D2R = Math.PI / 180, clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // ── 波長の並び（画面用に 5 nm 刻み 75 本。照合は 1 nm でも同じ式）
  const STEP = 5, LS = []; for (let l = 380; l <= 750; l += STEP) LS.push(l);
  const NL = LS.length, CM = LS.map(l => CMF[l - 380]);

  const tauRay = l => { const u = l / 1000; return 0.008569 * Math.pow(u, -4) * (1 + 0.0113 * Math.pow(u, -2) + 0.00013 * Math.pow(u, -4)); };
  const alphaOf = r => 4 / (1 + Math.pow(r / 0.1, 1.5));                 // 粒の大きさ µm → 散り方の傾き α（目安）
  const P_AMT = 0.2;                                                     // 粒の量：550 nm での厚み（目安）
  const tauP = (l, a) => P_AMT * Math.pow(l / 550, -a);
  const tauO3 = l => 0.042 * Math.exp(-0.5 * ((l - 602) / (l < 602 ? 45 : 60)) ** 2);
  const airmass = alt => { const h = Math.max(0, alt); return 1 / (Math.sin(h * D2R) + 0.50572 * Math.pow(h + 6.07995, -1.6364)); };
  const o3mass = alt => { const z = (90 - Math.max(0, alt)) * D2R, k = 22 / 6371; return (1 + k) / Math.sqrt(Math.cos(z) ** 2 + 2 * k); };
  const E0 = LS.map(l => planck(l, 5778)); { const m = Math.max(...E0); for (let i = 0; i < NL; i++) E0[i] /= m; }
  const TR = LS.map(tauRay);
  const blueRed = () => tauRay(450) / tauRay(700);                       // 空気だけで、青 450 は赤 700 の何倍散るか

  /* いまの条件を 1 つにまとめる（太陽の高さ alt°・粒 r µm・brk＝BREAK：散り方が逆＝赤ほど散る・opt.noO3＝オゾンなしで比べる用） */
  function setup(alt, r, brk, opt) {
    const a = alphaOf(r), ms = airmass(alt), mo = o3mass(alt);
    const tr = brk ? LS.map(l => TR[LS.indexOf(550)] * Math.pow(l / 550, 4)) : TR;           // BREAK：λ⁺⁴（現実の外）
    const tp = LS.map(l => tauP(l, brk ? -a : a)), te = LS.map((l, i) => tr[i] + tp[i]);
    const Es = LS.map((l, i) => E0[i] * Math.exp(-(opt && opt.noO3 ? 0 : tauO3(l)) * mo));                        // オゾンは上で太陽の光だけを削る
    const sun = LS.map((l, i) => Es[i] * Math.exp(-te[i] * ms));                          // 地面に届く太陽の光（直達）
    const w = a / 4, g = 0.75;
    return { alt, r, a, ms, mo, tr, tp, te, Es, sun, w, g, brk: !!brk, sunDir: [0, Math.cos(alt * D2R), Math.sin(alt * D2R)] };
  }
  const PR = c => 0.75 * (1 + c * c);
  const HG = (c, g) => (1 - g * g) / Math.pow(1 + g * g - 2 * g * c, 1.5);
  /* 空の 1 点（方位 az°＝太陽から測る・高さ el°）の光 → 波長ごとの強さ（out に書く） */
  function skyAt(S, az, el, out) {
    const ce = Math.cos(el * D2R), v = [Math.sin(az * D2R) * ce, Math.cos(az * D2R) * ce, Math.sin(el * D2R)];
    const c = clamp(v[0] * S.sunDir[0] + v[1] * S.sunDir[1] + v[2] * S.sunDir[2], -1, 1);
    const pr = PR(c), pp = S.w * pr + (1 - S.w) * HG(c, S.g), mv = airmass(el), ms = S.ms;
    for (let i = 0; i < NL; i++) {
      const t = S.te[i], k = Math.abs(mv - ms) < 1e-4 ? t * mv * Math.exp(-t * ms) : mv * (Math.exp(-t * ms) - Math.exp(-t * mv)) / (mv - ms);
      out[i] = S.Es[i] * (S.tr[i] * pr + S.tp[i] * pp) / (4 * Math.PI * t) * k;
    }
    return out;
  }
  /* 遠くの物（地面の近く・横向き）：obj＝物の光（波長ごと）・d km・hor＝地平の空の光 */
  function aerial(S, obj, hor, d, out) {
    for (let i = 0; i < NL; i++) { const b = S.tr[i] / 8 + S.tp[i] / 1.5, T = Math.exp(-b * d); out[i] = obj[i] * T + hor[i] * (1 - T); }
    return out;
  }
  const xyz = s => { let X = 0, Y = 0, Z = 0; for (let i = 0; i < NL; i++) { const c = CM[i], a = s[i]; X += a * c.x; Y += a * c.y; Z += a * c.z; } return { X: X * STEP, Y: Y * STEP, Z: Z * STEP }; };

  // ── 状態（粒の大きさで決まる散り方）：α ≥ 2.5 BLUE（粒 ≪ 波長）／0.8〜2.5 MILKY／α < 0.8 WHITE（粒 ≳ 波長）
  const A_BLUE = 2.5, A_WHITE = 0.8;
  const rOfAlpha = a => 0.1 * Math.pow(4 / a - 1, 1 / 1.5);
  const R_BLUE = rOfAlpha(A_BLUE), R_WHITE = rOfAlpha(A_WHITE);                           // 境の大きさ µm
  const stateOf = r => { const a = alphaOf(r); return a >= A_BLUE ? 'BLUE' : a >= A_WHITE ? 'MILKY' : 'WHITE'; };
  const R_MIN = 0.0003, R_MAX = 10;                                                       // 空気の分子 0.3 nm 〜 雲の粒 10 µm

  /* シアノメーター（ソシュールの青さの目盛り 0〜52 の目安）：0＝白 → 26 前後＝空色 → 52＝濃い紺。番号は形だけ借りた目安の色 */
  const CYAN_N = 53;
  const lin = v => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  const hexRgb = h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16) / 255);
  const CY_KEYS = [[0, '#F4F6F8'], [10, '#CFE0F1'], [22, '#8DB6E3'], [34, '#4E83C7'], [44, '#26519A'], [52, '#0D1F4C']];
  function cyanHex(n) { let k = 0; while (k < CY_KEYS.length - 2 && n > CY_KEYS[k + 1][0]) k++; const [n0, h0] = CY_KEYS[k], [n1, h1] = CY_KEYS[k + 1], t = clamp((n - n0) / (n1 - n0), 0, 1), a = hexRgb(h0), b = hexRgb(h1); return C.hex(a.map((v, i) => v + (b[i] - v) * t)); }
  const labOf = rgb => { const [r, g, b] = rgb.map(lin), X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.9505, Y = 0.2126 * r + 0.7152 * g + 0.0722 * b, Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.089, f = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116; return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))]; };
  const CY_LAB = Array.from({ length: CYAN_N }, (_, n) => labOf(hexRgb(cyanHex(n))));
  /* 画面の色（0〜1 の rgb）にいちばん近い目盛り：明るさより色みを重く見る（空の青さを比べる道具なので） */
  function cyanometer(rgb) { const L = labOf(rgb); let best = 0, bd = 1e9; CY_LAB.forEach((q, n) => { const d = 0.5 * (L[0] - q[0]) ** 2 + (L[1] - q[1]) ** 2 + (L[2] - q[2]) ** 2; if (d < bd) { bd = d; best = n; } }); return { n: best, dE: Math.sqrt(bd) }; }

  const api = { STEP, LS, NL, E0, TR, tauRay, tauP, tauO3, alphaOf, P_AMT, airmass, o3mass, setup, skyAt, aerial, xyz, PR, HG, blueRed,
    A_BLUE, A_WHITE, R_BLUE, R_WHITE, R_MIN, R_MAX, stateOf, CYAN_N, cyanHex, cyanometer, labOf };
  if (isNode) module.exports = api;
  root.PH_W4 = api;
})(typeof window !== 'undefined' ? window : globalThis);
