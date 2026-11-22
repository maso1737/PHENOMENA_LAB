/* PH-PIGMENT — 絵具 1 色ごとの「どの波長をどれだけ返すか」と、光源を変えたときの見え方（法則の正本）
   入力（絵具の量の並び・光の強さの並び 371 本）→ 出力（画面の色）だけ。画面にも時間にも触らない。
   色の計算は PH_COLOR（ph_color.js）。光源のひな形の一部は PH_W1（ph_w1_law.js）と同じ式。classic script ＋ Node で require できる。

   数値の出どころ
   - 絵具の返す割合（分光反射率）：顔料の種類ごとの「形」（段・山・坂）は一般的な顔料の性質の目安
     （カドミウム系の赤＝600 nm 付近の急な段／ウルトラマリン＝450 nm の山＋700 nm で赤が少し戻る／酸化鉄＝なだらかな坂）。
     段や山の位置・高さは、POSTER BG のパレットの色（16 色の hex）に「昼光の下で」合うように、_tools/fit_pigments.cjs で合わせた（下の FIT）。
     → 実在の絵具を測った値ではない（目安）。昼光での色の差は check_relight.cjs が数値で出す。
   - 混ぜ方：クベルカ–ムンク（単一定数）。K/S = (1−R)² / 2R を量で足し、R = 1 + K/S − √((K/S)² + 2 K/S) に戻す。
     塗っていない所は紙。塗った割合（被覆）で紙と絵具の返す割合を足し合わせる（ポスターカラーは不透明なので面積の混ぜ方）。
   - 昼光：6500 K の黒体で代用（本物の D65 は凸凹がある・目安）。画面の白（D65）にそろえる。
   - 目の慣れ：Hunt–Pointer–Estévez の受け手で、白（紙の代わりに「全部返す物」）が同じ反応になるよう割り算する（フォン・クリース）。
     0 ＝カメラ（昼光で固定）・1 ＝目が完全に慣れる。どちらでも光の明るさはそろえる（露出は自動）。
   - 夕日：5778 K の黒体 × 大気の通り抜け。レイリー散乱の厚み τ(λ) = 0.008569 λ⁻⁴ (1 + 0.0113 λ⁻² + 0.00013 λ⁻⁴)（λ は µm・Hansen & Travis 1974 の式）
     ＋薄いもや 0.08 (λ/0.55)⁻¹·³（目安）。通る空気の量（エアマス）は Kasten & Young 1989。
   - 水銀灯・3 波長蛍光灯：線の位置は水銀（405・436・546・577/579 nm）・希土類の蛍光体（450・545・611 nm）。強さの比は目安。
   - ナトリウム灯：W1 と同じ 589 nm の 1 本（低圧ナトリウム灯）。 */
(function (root) {
  'use strict';
  const isNode = typeof module !== 'undefined' && module.exports;
  const C = isNode ? require('./ph_color.js') : root.PH_COLOR;
  const { N, L0, lam, CMF, planck } = C;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const empty = () => new Float32Array(N);
  const norm = s => { let m = 0; for (const v of s) m = Math.max(m, v); if (m > 0) for (let i = 0; i < N; i++) s[i] /= m; return s; };
  const idx = l => Math.max(0, Math.min(N - 1, Math.round(l - L0)));
  const gs = (l, mu, s) => Math.exp(-0.5 * ((l - mu) / s) ** 2);

  // ── 光源（いちばん強い所を 1 にそろえる。明るさの絶対値は使わない＝露出は自動）
  function airmass(altDeg) { const h = Math.max(-0.5, altDeg); return 1 / (Math.sin(h * Math.PI / 180) + 0.50572 * Math.pow(h + 6.07995, -1.6364)); }
  function tauRay(l) { const u = l / 1000; return 0.008569 * Math.pow(u, -4) * (1 + 0.0113 * Math.pow(u, -2) + 0.00013 * Math.pow(u, -4)); }
  const tauHaze = l => 0.08 * Math.pow(l / 550, -1.3);
  function sunAt(altDeg) { const m = airmass(altDeg); return norm(empty().map((_, i) => { const l = lam(i); return planck(l, 5778) * Math.exp(-m * (tauRay(l) + tauHaze(l))); })); }
  function lines(list, cont = 0) { const s = empty(); for (let i = 0; i < N; i++) { const l = lam(i); let v = cont; for (const [mu, sg, a] of list) v += a * gs(l, mu, sg); s[i] = v; } return norm(s); }
  const LIGHTS = {
    DAY:     { jp: '昼光',         en: 'DAYLIGHT',  note: '6500 K の黒体で代用', make: () => norm(empty().map((_, i) => planck(lam(i), 6500))) },
    SUNSET:  { jp: '夕日',         en: 'SUNSET',    note: '大気の通り抜け＝レイリー散乱＋薄いもや', make: p => sunAt(p && p.sunAlt != null ? p.sunAlt : 3), param: 'sunAlt' },
    BULB:    { jp: '電球',         en: 'BULB',      note: '2700 K の黒体', make: () => norm(empty().map((_, i) => planck(lam(i), 2700))) },
    LED:     { jp: '白色 LED',     en: 'WHITE LED', note: '青 450 nm ＋黄色い蛍光体（形は目安）', make: () => norm(empty().map((_, i) => { const l = lam(i); return gs(l, 450, 10) + 0.62 * Math.exp(-0.5 * ((l - 565) / (l < 565 ? 40 : 60)) ** 2); })) },
    TRI:     { jp: '3 波長蛍光灯', en: 'TRI-BAND',  note: '450・545・611 nm（強さは目安）', make: () => lines([[450, 11, 0.45], [487, 3, 0.22], [545, 3.2, 1], [587, 3, 0.18], [611, 3.2, 0.85]], 0.02) },
    MERCURY: { jp: '水銀灯',       en: 'MERCURY',   note: '405・436・546・578 nm（強さは目安）', make: () => lines([[405, 2, 0.35], [436, 2, 0.8], [546, 2, 1], [578, 2.2, 0.8]], 0.015) },
    SODIUM:  { jp: 'ナトリウム灯', en: 'SODIUM',    note: '589 nm の 1 本（トンネルの橙）', make: () => { const s = empty(); s[idx(589)] = 1; return s; } }
  };
  const LIGHT_ORDER = ['DAY', 'SUNSET', 'BULB', 'LED', 'TRI', 'MERCURY', 'SODIUM'];

  // ── 絵具の返す割合（形の項を足して 0.004〜0.96 に切る）
  //    base：一定／step [位置, 幅, 高さ]：ロジスティックの段／bump [位置, 幅, 高さ]：山／slope：100 nm あたりの傾き（565 nm 中心）
  /* <<FIT>> */
  const FIT = {"WHITE":{"base":0.3022,"step":[[406.9067,8.9806,0.6122]],"slope":0.0239},"LEMON":{"base":0.0828,"step":[[501.9542,16.5197,0.7314]]},"YELLOW_DEEP":{"base":0.0742,"step":[[548.3963,22.9284,0.6771]]},"VERMILION":{"base":0.0421,"step":[[593.2095,12.3337,0.7403]]},"ROSE":{"base":0.1205,"step":[[598.7465,12.3833,0.6459]],"bump":[[420.724,25.7162,0.1822]]},"MAUVE":{"base":0.0898,"step":[[636.0738,25.5227,0.366]],"bump":[[428.248,30.1563,0.3268]]},"CERULEAN":{"base":0.07,"bump":[[470.8593,44.2174,0.6273]]},"COBALT":{"base":0.0579,"step":[[700.289,19.7484,0.1462]],"bump":[[458.354,33.8966,0.4621]]},"ULTRAMARINE":{"base":0.0296,"step":[[690.6712,19.0605,0.2335]],"bump":[[453.0349,31.5136,0.2995]]},"P_GREEN":{"base":0.0778,"bump":[[519.531,31.095,0.1865]]},"Y_OCHRE":{"base":0.073,"step":[[529.1116,25.2508,0.409]]},"B_SIENNA":{"base":0.0319,"step":[[605.6682,25.5622,0.3343]]},"PAPER":{"base":0.6124,"step":[[404.6383,16.0878,0.2874]],"slope":0.0319}};
  /* <</FIT>> */
  const PIGMENTS = [
    { id: 'WHITE',       hex: '#F7F5EE', en: 'WHITE',       jp: 'ホワイト' },
    { id: 'LEMON',       hex: '#F2DE4B', en: 'LEMON',       jp: 'レモンイエロー' },
    { id: 'YELLOW_DEEP', hex: '#F0A43A', en: 'YELLOW DEEP', jp: 'イエローディープ' },
    { id: 'VERMILION',   hex: '#E0482C', en: 'VERMILION',   jp: 'バーミリオン' },
    { id: 'ROSE',        hex: '#D8607F', en: 'ROSE',        jp: 'ローズ' },
    { id: 'MAUVE',       hex: '#8A4F9C', en: 'MAUVE',       jp: 'モーブ' },
    { id: 'CERULEAN',    hex: '#2A93D2', en: 'CERULEAN',    jp: 'セルリアンブルー' },
    { id: 'COBALT',      hex: '#2259B9', en: 'COBALT',      jp: 'コバルトブルー' },
    { id: 'ULTRAMARINE', hex: '#2C3796', en: 'ULTRAMARINE', jp: 'ウルトラマリン' },
    { id: 'P_GREEN',     hex: '#23805A', en: 'P.GREEN',     jp: 'パーマネントグリーン' },
    { id: 'Y_OCHRE',     hex: '#C39A48', en: 'Y.OCHRE',     jp: 'イエローオーカー' },
    { id: 'B_SIENNA',    hex: '#8F452C', en: 'B.SIENNA',    jp: 'バーントシェンナ' }
  ];
  const PAPER = { id: 'PAPER', hex: '#F6F3EB', en: 'PAPER', jp: '紙' };
  const NP = PIGMENTS.length;
  const PID = Object.fromEntries(PIGMENTS.map((p, i) => [p.id, i]));

  function reflOf(f) {
    const s = empty();
    for (let i = 0; i < N; i++) {
      const l = lam(i); let v = f.base || 0;
      for (const [mu, w, h] of (f.step || [])) v += h / (1 + Math.exp(-(l - mu) / w));
      for (const [mu, w, h] of (f.bump || [])) v += h * gs(l, mu, w);
      if (f.slope) v += f.slope * (l - 565) / 100;
      s[i] = clamp(v, 0.004, 0.96);
    }
    return s;
  }
  let REFL = PIGMENTS.map(p => reflOf(FIT[p.id]));
  let REFL_PAPER = reflOf(FIT.PAPER);
  function setFit(fit) { Object.assign(FIT, fit); REFL = PIGMENTS.map(p => reflOf(FIT[p.id])); REFL_PAPER = reflOf(FIT.PAPER); api.REFL = REFL; api.REFL_PAPER = REFL_PAPER; }

  // ── クベルカ–ムンク（単一定数）
  const ks = R => (1 - R) * (1 - R) / (2 * R);
  const kmR = k => 1 + k - Math.sqrt(k * k + 2 * k);
  /* w：絵具の量の並び（NP 個）。合計＝塗った割合（0〜1）。戻り値＝その画素の返す割合（371 本） */
  function mixRefl(w) {
    let a = 0; for (const v of w) a += v;
    const out = empty();
    for (let i = 0; i < N; i++) {
      let r = REFL_PAPER[i];
      if (a > 1e-6) { let k = 0; for (let j = 0; j < NP; j++) if (w[j]) k += w[j] * ks(REFL[j][i]); r = Math.min(1, a) * kmR(k / a) + (1 - Math.min(1, a)) * r; }
      out[i] = r;
    }
    return out;
  }

  // ── 見え方：光 E と目の慣れ adapt → 「XYZ → 画面の線形 sRGB」の 3×3（露出は全部返す物の Y＝1）
  const HPE = [[0.38971, 0.68898, -0.07868], [-0.22981, 1.18340, 0.04641], [0, 0, 1]];
  const inv3 = m => { const [a, b, c] = m[0], [d, e, f] = m[1], [g, h, i] = m[2], A = e * i - f * h, B = f * g - d * i, Cc = d * h - e * g, det = a * A + b * B + c * Cc;
    return [[A, c * h - b * i, b * f - c * e], [B, a * i - c * g, c * d - a * f], [Cc, b * g - a * h, a * e - b * d]].map(r => r.map(v => v / det)); };
  const mm = (A, B) => A.map(r => B[0].map((_, j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
  const mv = (m, v) => m.map(r => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
  const HPE_INV = inv3(HPE);
  const XYZ2RGB = [[3.2406, -1.5372, -0.4986], [-0.9689, 1.8758, 0.0415], [0.0557, -0.2040, 1.0570]];
  const D65 = [0.95047, 1, 1.08883];
  function whiteXYZ(E) { let X = 0, Y = 0, Z = 0; for (let i = 0; i < N; i++) { const e = E[i]; if (!e) continue; X += e * CMF[i].x; Y += e * CMF[i].y; Z += e * CMF[i].z; } return Y > 0 ? [X / Y, 1, Z / Y] : [D65[0], 1, D65[2]]; }
  const E_DAY = LIGHTS.DAY.make();
  const W_DAY = whiteXYZ(E_DAY);
  /* 目の慣れ：白の受け手の反応を、昼光の白（adapt=0）〜この光の白（adapt=1）の間に取り、D65 の白へ割り直す */
  function viewMatrix(E, adapt) {
    const wl = whiteXYZ(E), lD = mv(HPE, W_DAY), lL = mv(HPE, wl), lT = mv(HPE, D65);
    const src = lD.map((v, k) => v + (lL[k] - v) * adapt);
    const vk = [[lT[0] / src[0], 0, 0], [0, lT[1] / src[1], 0], [0, 0, lT[2] / src[2]]];
    return mm(XYZ2RGB, mm(HPE_INV, mm(vk, HPE)));
  }
  function xyzUnder(R, E) { let X = 0, Y = 0, Z = 0, Yw = 0; for (let i = 0; i < N; i++) { const e = E[i]; if (!e) continue; const c = CMF[i]; X += e * R[i] * c.x; Y += e * R[i] * c.y; Z += e * R[i] * c.z; Yw += e * c.y; } return Yw > 0 ? [X / Yw, Y / Yw, Z / Yw] : [0, 0, 0]; }
  const gamma = C.gamma;
  const toHex = rgb => '#' + rgb.map(v => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
  /* 返す割合 R を、光 E・目の慣れ adapt の下で見た画面の色 */
  function render(R, E, adapt = 0) {
    const M = viewMatrix(E, adapt), xyz = xyzUnder(R, E), lin = mv(M, xyz);
    const rgb = lin.map(v => gamma(clamp(v, 0, 1)));
    return { xyz, lin, rgb, hex: toHex(rgb) };
  }
  /* CG の掛け算（比べる用）：昼光での画面の色（線形）× 光の白の画面の色（線形） */
  function rgbMultiply(R, E, adapt = 0) {
    const day = render(R, E_DAY, 0).lin, w = mv(viewMatrix(E, adapt), whiteXYZ(E));
    const lin = day.map((v, k) => v * w[k]), rgb = lin.map(v => gamma(clamp(v, 0, 1)));
    return { lin, rgb, hex: toHex(rgb) };
  }

  // ── 色の差（Lab・D65）
  const hexLin = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); };
  const RGB2XYZ = inv3(XYZ2RGB);
  function labOfLin(lin) { const xyz = mv(RGB2XYZ, lin); const f = t => t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116; const fx = f(xyz[0] / D65[0]), fy = f(xyz[1] / D65[1]), fz = f(xyz[2] / D65[2]); return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]; }
  const dE = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const chromaOf = lab => Math.hypot(lab[1], lab[2]);

  // ── 混ぜた色の見本（スウォッチ）。量は _tools/fit_pigments.cjs で POSTER BG の hex に合わせた
  /* <<RECIPES>> */
  const RECIPES = [{"id":"SKY","hex":"#86C8EC","en":"SKY","jp":"スカイブルー","w":{"CERULEAN":0.0804,"WHITE":0.9041,"COBALT":0.0155,"P_GREEN":0}},{"id":"LAVENDER","hex":"#A7A3D4","en":"LAVENDER","jp":"ラベンダー","w":{"ULTRAMARINE":0.0361,"ROSE":0.0437,"WHITE":0.9202}},{"id":"INDIGO","hex":"#283450","en":"INDIGO","jp":"インジゴ","w":{"ULTRAMARINE":0.7079,"B_SIENNA":0.2252,"P_GREEN":0.0669,"WHITE":0,"COBALT":0}},{"id":"OLIVE","hex":"#6F7B2F","en":"OLIVE","jp":"オリーブグリーン","w":{"P_GREEN":0.2617,"Y_OCHRE":0,"LEMON":0,"B_SIENNA":0.008,"ULTRAMARINE":0,"YELLOW_DEEP":0.7303}}];
  /* <</RECIPES>> */
  const vec = obj => { const w = new Array(NP).fill(0); for (const k in obj) w[PID[k]] = obj[k]; return w; };

  // ── GPU 用の帯（32 本）。帯の中の返す割合は「この光で見たときの重み」で平均する＝細い線の光（ナトリウム灯）でも 1 本ぶんの値が正しく入る
  const NB = 32;
  const bandOf = i => Math.min(NB - 1, Math.floor(i * NB / N));
  /* 戻り値：W[b] = 帯 b の XYZ の重み（全部返す物で Y＝1）・KS[j][b]＝絵具 j の K/S・RP[b]＝紙の返す割合 */
  function bands(E) {
    const W = Array.from({ length: NB }, () => [0, 0, 0]), wsum = new Float64Array(NB);
    const KS = PIGMENTS.map(() => new Float64Array(NB)), RP = new Float64Array(NB);
    let Yw = 0; for (let i = 0; i < N; i++) Yw += E[i] * CMF[i].y;
    for (let i = 0; i < N; i++) {
      const b = bandOf(i), c = CMF[i], e = E[i];
      W[b][0] += e * c.x; W[b][1] += e * c.y; W[b][2] += e * c.z;
      const wt = e * (c.x + c.y + c.z) + 1e-7;               // 光が無い帯でも形だけは残す
      wsum[b] += wt; RP[b] += wt * REFL_PAPER[i];
      for (let j = 0; j < NP; j++) KS[j][b] += wt * REFL[j][i];
    }
    for (let b = 0; b < NB; b++) {
      W[b] = W[b].map(v => Yw > 0 ? v / Yw : 0);
      RP[b] /= wsum[b];
      for (let j = 0; j < NP; j++) KS[j][b] = ks(KS[j][b] / wsum[b]);
    }
    return { W, KS, RP };
  }
  /* 帯で計算した色（GPU と同じ式。check で 1 nm の計算と比べる） */
  function renderBands(w, B, M) {
    let a = 0; for (const v of w) a += v; const ac = Math.min(1, a);
    const xyz = [0, 0, 0];
    for (let b = 0; b < NB; b++) {
      let r = B.RP[b];
      if (a > 1e-6) { let k = 0; for (let j = 0; j < NP; j++) k += w[j] * B.KS[j][b]; r = ac * kmR(k / a) + (1 - ac) * r; }
      for (let q = 0; q < 3; q++) xyz[q] += r * B.W[b][q];
    }
    const lin = mv(M, xyz); return { lin, rgb: lin.map(v => gamma(clamp(v, 0, 1))) };
  }

  const api = {
    LIGHTS, LIGHT_ORDER, sunAt, airmass, tauRay, PIGMENTS, PAPER, NP, PID, FIT, setFit, reflOf, REFL, REFL_PAPER, ks, kmR, mixRefl,
    whiteXYZ, viewMatrix, xyzUnder, render, rgbMultiply, E_DAY, hexLin, labOfLin, dE, chromaOf, RECIPES, vec, NB, bands, renderBands, toHex, mv
  };
  if (isNode) module.exports = api;
  root.PH_PIGMENT = api;
})(typeof window !== 'undefined' ? window : globalThis);
