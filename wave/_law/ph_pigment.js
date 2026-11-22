/* PH-PIGMENT — 絵具 1 色ごとの「どの波長をどれだけ返すか」と、光源を変えたときの見え方（法則の正本）
   入力（絵具の量の並び・光の強さの並び 371 本）→ 出力（画面の色）だけ。画面にも時間にも触らない。
   色の計算は PH_COLOR（ph_color.js）。光源のひな形の一部は PH_W1（ph_w1_law.js）と同じ式。classic script ＋ Node で require できる。

   数値の出どころ
   - 絵具の返す割合（分光反射率）・既定＝実測（SOURCE 'measured'）：ニッカーのポスターカラー各色に入っている顔料（Blick の Pigment Information）を、
     CHSOS Pigments Checker の実測（顔料＋アクリル・厚紙の上・_assets/chsos_pigments/）からクベルカ–ムンクで混ぜて組んだ（下の MEASURED）。
     動かしたのは「混ぜる割合」と顔料ごとの「底上げ（表面の照り返し・透け）と倍率」だけ。山や段の位置は測定のまま（_tools/fit_measured.cjs）。
     データに無い顔料は代用（PV3→ローダミン＋ウルトラマリン／PO16・PY2・PO13→アリライドイエロー＋ナフトールレッド）、セルリアンは
     フタロの原液が暗すぎて形が測れないので PB36 で補った。ニッカーの絵具そのものを測った値ではない。
   - 目安の形（SOURCE 'shape'・比べる用）：顔料の種類ごとの「形」（段・山・坂）は一般的な顔料の性質の目安
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
  // ── 実測の絵具（_tools/fit_measured.cjs が書く）。380〜750 nm の 5 nm 刻み → 1 nm へ直線でつなぐ
  /* <<MEASURED>> */
  const MEASURED_GAIN = 1.1425;
  const MEASURED = {"WHITE":{"ci":"PW6","from":{"PW6":1},"fix":{},"sub":"","note":"Nicker White＝PW6(+PW4)","R5":[0.1978,0.2219,0.2714,0.3532,0.4623,0.5885,0.7114,0.8084,0.8681,0.8949,0.9055,0.9099,0.9131,0.9134,0.9116,0.9103,0.9094,0.9087,0.9073,0.9058,0.9034,0.9008,0.8993,0.898,0.8971,0.897,0.8984,0.9007,0.9035,0.9073,0.9104,0.9102,0.9107,0.9123,0.914,0.9163,0.9185,0.9201,0.9213,0.9208,0.92,0.9206,0.9206,0.9199,0.9194,0.9182,0.9173,0.9169,0.9161,0.915,0.9136,0.9133,0.914,0.9147,0.9157,0.9162,0.9152,0.9133,0.9117,0.9111,0.9115,0.9123,0.9144,0.9163,0.9166,0.9164,0.9171,0.9181,0.9188,0.9192,0.9204,0.9218,0.9221,0.922,0.9226]},"LEMON":{"ci":"PY3+PW6","from":{"PY3":0.2716,"PW6":0.7284},"fix":{"PY3":{"floor":0,"gain":0.7191}},"sub":"","note":"Nicker Lemon Yellow","R5":[0.1422,0.1401,0.1415,0.1441,0.1445,0.1403,0.1348,0.1287,0.1216,0.1168,0.1106,0.1073,0.1035,0.0986,0.096,0.0949,0.0949,0.0992,0.1116,0.144,0.2073,0.3001,0.4021,0.4961,0.5738,0.6314,0.6693,0.6912,0.7017,0.7058,0.7078,0.7109,0.7185,0.7308,0.745,0.7578,0.7674,0.7734,0.7764,0.7777,0.7784,0.7794,0.7799,0.7795,0.779,0.7781,0.7767,0.7756,0.7749,0.7745,0.7739,0.7732,0.7732,0.773,0.7728,0.7723,0.7715,0.7706,0.7698,0.7693,0.7691,0.7694,0.7705,0.7712,0.7714,0.7716,0.7723,0.7731,0.7733,0.7735,0.7741,0.7748,0.7749,0.7747,0.7746]},"YELLOW_DEEP":{"ci":"PY2+PY1+PO13","from":{"ARY":0.0027,"NAP":0.4834,"PY3":0.5136},"fix":{"ARY":{"floor":0.0332,"gain":1.1101},"NAP":{"floor":0.0307,"gain":1.5122},"PY3":{"floor":0.0112,"gain":1.1009}},"sub":"PY2/PO13 は無い→アリライドイエロー＋ナフトールレッドで代用","note":"Nicker Chrome Deep","R5":[0.1516,0.1344,0.1206,0.1105,0.1027,0.0949,0.0887,0.0833,0.0775,0.0737,0.0688,0.0661,0.0632,0.0592,0.0571,0.0562,0.0563,0.0597,0.0697,0.0949,0.1408,0.2004,0.2547,0.294,0.3192,0.3338,0.3423,0.3483,0.3526,0.3554,0.3577,0.3589,0.3609,0.3638,0.367,0.3713,0.3773,0.3856,0.3986,0.4196,0.4514,0.496,0.552,0.614,0.6759,0.7348,0.7886,0.8359,0.8735,0.9005,0.9183,0.9287,0.9356,0.94,0.9425,0.9435,0.9437,0.9433,0.9428,0.9423,0.9421,0.9428,0.9446,0.9454,0.9456,0.9459,0.9466,0.9475,0.9475,0.9477,0.9483,0.9488,0.9488,0.9486,0.9483]},"VERMILION":{"ci":"PO16+PR22","from":{"NAP":0.7402,"ARY":0.0131,"PW6":0.2467},"fix":{"NAP":{"floor":0.1627,"gain":1.7244},"ARY":{"floor":0.0003,"gain":0.9271}},"sub":"PO16 は無い→アリライドイエローで橙に寄せた","note":"Nicker Vermilion（PR22＝ナフトールレッド）","R5":[0.0646,0.0509,0.0434,0.0399,0.0363,0.0354,0.0357,0.0378,0.0399,0.0404,0.0404,0.0401,0.0409,0.0413,0.0408,0.0418,0.0426,0.0429,0.0429,0.0429,0.0429,0.0434,0.0452,0.0473,0.0494,0.0516,0.0542,0.0581,0.062,0.065,0.0676,0.0687,0.0703,0.0729,0.0759,0.0806,0.0878,0.0981,0.1145,0.1411,0.1817,0.2391,0.3117,0.393,0.4752,0.5545,0.6279,0.6933,0.7462,0.785,0.8117,0.8289,0.8409,0.8497,0.8558,0.8597,0.862,0.8626,0.8625,0.8623,0.863,0.8647,0.8676,0.8712,0.8737,0.875,0.8768,0.8793,0.8811,0.8821,0.8844,0.8868,0.8884,0.89,0.8914]},"ROSE":{"ci":"PR81","from":{"PR81":0.1768,"PW6":0.8232},"fix":{"PR81":{"floor":0,"gain":0.7273}},"sub":"","note":"Nicker Brilliant Rose","R5":[0.1915,0.2069,0.237,0.2798,0.3249,0.3607,0.3827,0.3943,0.3997,0.4029,0.3989,0.3895,0.371,0.3446,0.3148,0.281,0.2449,0.2116,0.1823,0.1599,0.1432,0.1325,0.1257,0.1211,0.1174,0.1147,0.1144,0.1155,0.1161,0.1155,0.1129,0.109,0.107,0.1066,0.1065,0.1099,0.1171,0.1373,0.179,0.2371,0.2981,0.3524,0.3975,0.4353,0.4686,0.4992,0.5292,0.56,0.5932,0.6285,0.6641,0.6975,0.726,0.7474,0.7633,0.7742,0.7818,0.787,0.7906,0.7935,0.7959,0.7982,0.8007,0.803,0.8048,0.8065,0.8083,0.81,0.8115,0.8129,0.8146,0.8162,0.817,0.818,0.819]},"MAUVE":{"ci":"PV3","from":{"PR81":0.0864,"PB29":0.2467,"PW6":0.6669},"fix":{"PR81":{"floor":0.0213,"gain":1.0033},"PB29":{"floor":0,"gain":1.0075}},"sub":"PV3（メチルバイオレット）は無い→ローダミン＋ウルトラマリンで代用","note":"Nicker Mauve","R5":[0.1852,0.197,0.2205,0.252,0.2833,0.3104,0.3317,0.3481,0.3614,0.3738,0.3833,0.3899,0.3902,0.3819,0.3656,0.34,0.3054,0.2661,0.2252,0.1889,0.1583,0.1366,0.1215,0.1104,0.1014,0.0944,0.0922,0.0924,0.0921,0.0902,0.0857,0.0791,0.0757,0.0748,0.0744,0.08,0.0908,0.1148,0.1456,0.1693,0.1831,0.1903,0.1951,0.1982,0.2004,0.2014,0.2014,0.2023,0.2033,0.2043,0.2044,0.2033,0.2034,0.2046,0.2061,0.2064,0.2064,0.2074,0.2088,0.2101,0.2129,0.2171,0.2233,0.2314,0.2417,0.2546,0.2706,0.2898,0.3103,0.332,0.3545,0.376,0.3956,0.4136,0.4296]},"CERULEAN":{"ci":"PB15:3+PW6","from":{"PB15":0.0053,"PB36":0.0388,"PG7":0.0023,"PW6":0.9536},"fix":{"PB15":{"floor":0.013,"gain":0.995},"PB36":{"floor":0.0357,"gain":1.007},"PG7":{"floor":0.0059,"gain":1.0059}},"sub":"フタロブルーの原液は暗すぎて形が測れていない→本物のセルリアン顔料（PB36）の測定で補った","note":"Nicker Cerulean Blue","R5":[0.1942,0.2148,0.2572,0.3231,0.4011,0.4754,0.5295,0.5607,0.5724,0.5773,0.5838,0.59,0.6035,0.6194,0.6312,0.6376,0.6379,0.6326,0.6225,0.6075,0.5893,0.5683,0.5428,0.5138,0.4855,0.4554,0.4241,0.394,0.3651,0.3362,0.3081,0.3084,0.3028,0.2919,0.2792,0.256,0.2297,0.2113,0.198,0.1864,0.1748,0.1566,0.1267,0.0911,0.0694,0.0744,0.0894,0.1011,0.1034,0.1095,0.1175,0.1214,0.1327,0.1475,0.1639,0.1826,0.2,0.2192,0.2451,0.2728,0.3004,0.3286,0.3632,0.3829,0.3987,0.4204,0.4289,0.4434,0.4561,0.4702,0.4859,0.4965,0.5123,0.5323,0.5502]},"COBALT":{"ci":"PB29","from":{"PB29":0.0708,"PB15":0.0182,"PW6":0.9111},"fix":{"PB29":{"floor":0.0658,"gain":0.9978},"PB15":{"floor":0,"gain":0.9965}},"sub":"","note":"Nicker Cobalt Blue（中身はウルトラマリン）","R5":[0.172,0.1859,0.2154,0.2578,0.3027,0.3431,0.3741,0.396,0.4097,0.42,0.4313,0.4425,0.4588,0.4765,0.4895,0.4949,0.491,0.4781,0.4573,0.4295,0.3966,0.3609,0.3239,0.2864,0.2506,0.2173,0.1863,0.1573,0.1349,0.1175,0.1037,0.0989,0.0983,0.0934,0.0875,0.0817,0.0806,0.0801,0.0746,0.0705,0.0659,0.06,0.0594,0.0594,0.0594,0.0559,0.0489,0.0476,0.0476,0.0476,0.0445,0.0366,0.0349,0.0402,0.0469,0.0475,0.0474,0.0517,0.0584,0.0639,0.0754,0.0918,0.1134,0.1379,0.1647,0.1932,0.2217,0.2501,0.2755,0.2986,0.32,0.3373,0.3538,0.3705,0.3856]},"ULTRAMARINE":{"ci":"PB29","from":{"PB29":0.3164,"PW6":0.6836},"fix":{"PB29":{"floor":0.0556,"gain":0.7509}},"sub":"","note":"Nicker Ultramarine","R5":[0.1272,0.1324,0.1449,0.1611,0.1769,0.1936,0.2105,0.2267,0.2424,0.2582,0.2744,0.2905,0.3054,0.3168,0.323,0.3233,0.3162,0.3007,0.2775,0.2482,0.2159,0.1847,0.1558,0.1295,0.1074,0.0895,0.0751,0.0633,0.0554,0.0498,0.0458,0.0444,0.0441,0.0427,0.0411,0.0397,0.0394,0.0392,0.0379,0.0369,0.0359,0.0346,0.0345,0.0345,0.0345,0.0337,0.0323,0.032,0.032,0.032,0.0314,0.0299,0.0295,0.0306,0.0319,0.032,0.032,0.0329,0.0343,0.0355,0.0382,0.0423,0.0483,0.0562,0.0663,0.0789,0.0946,0.1133,0.1335,0.155,0.1772,0.1985,0.2179,0.2359,0.2518]},"P_GREEN":{"ci":"PG7+PY3","from":{"PG7":0.0713,"PY3":0.2421,"PW6":0.6866},"fix":{"PG7":{"floor":0.07,"gain":0.9945},"PY3":{"floor":0.0059,"gain":1.0221}},"sub":"","note":"Nicker Viridian 系","R5":[0.1148,0.1073,0.1029,0.0985,0.0943,0.0927,0.0892,0.0884,0.087,0.0851,0.0824,0.0814,0.0818,0.0814,0.082,0.0837,0.087,0.0937,0.1066,0.134,0.1785,0.2311,0.2762,0.305,0.3172,0.3144,0.3021,0.2843,0.2644,0.2449,0.225,0.2073,0.1928,0.1778,0.1642,0.1538,0.1462,0.1381,0.1301,0.121,0.1133,0.1092,0.1027,0.0987,0.0923,0.0904,0.09,0.0897,0.0844,0.0788,0.0784,0.0784,0.0784,0.0784,0.0784,0.0784,0.0813,0.0865,0.0864,0.089,0.09,0.09,0.09,0.09,0.09,0.09,0.09,0.09,0.09,0.0922,0.0991,0.1046,0.112,0.1192,0.1246]},"Y_OCHRE":{"ci":"PY42","from":{"PY42":0.2179,"PW6":0.7821},"fix":{"PY42":{"floor":0.0668,"gain":0.5041}},"sub":"","note":"Nicker Yellow Ocher","R5":[0.0595,0.0521,0.0492,0.0495,0.0486,0.0478,0.0489,0.0521,0.0561,0.0613,0.0691,0.0797,0.0917,0.1021,0.1087,0.1115,0.1118,0.112,0.1133,0.1156,0.1196,0.1263,0.1354,0.1466,0.1602,0.1754,0.1918,0.2097,0.2288,0.2494,0.2714,0.2932,0.316,0.3396,0.3625,0.3844,0.4047,0.4221,0.4363,0.4476,0.4568,0.4638,0.4688,0.472,0.4738,0.4742,0.4742,0.4736,0.4725,0.4715,0.4707,0.47,0.4695,0.4699,0.4701,0.4705,0.4708,0.4713,0.472,0.4732,0.475,0.4776,0.4805,0.4836,0.487,0.4905,0.4943,0.4984,0.5023,0.5059,0.5098,0.5139,0.5175,0.5206,0.5234]},"B_SIENNA":{"ci":"PBr7","from":{"PBr7":0.2712,"PW6":0.7288},"fix":{"PBr7":{"floor":0.0157,"gain":1.0443}},"sub":"","note":"Nicker Burnt Sienna","R5":[0.0825,0.0721,0.0654,0.0623,0.0578,0.0512,0.0441,0.0425,0.0417,0.0389,0.0358,0.0326,0.0317,0.0314,0.0307,0.0307,0.0307,0.0307,0.0307,0.0308,0.0327,0.0346,0.0347,0.0349,0.0354,0.0356,0.0377,0.0386,0.0386,0.0388,0.0411,0.0454,0.0501,0.0555,0.062,0.0704,0.0807,0.0923,0.1054,0.1196,0.1347,0.1504,0.1656,0.1802,0.1945,0.2073,0.2186,0.2289,0.2379,0.2461,0.2535,0.26,0.2665,0.2731,0.2791,0.2848,0.2907,0.2964,0.3017,0.3074,0.3134,0.3194,0.3259,0.3324,0.3386,0.3449,0.3515,0.3575,0.3627,0.368,0.3728,0.3769,0.3803,0.3832,0.3854]}};
  /* <</MEASURED>> */
  const fromR5 = a => { const s = empty(); for (let i = 0; i < N; i++) { const t = (lam(i) - 380) / 5, k = Math.min(a.length - 1, Math.floor(t)), k2 = Math.min(a.length - 1, k + 1); s[i] = a[k] + (a[k2] - a[k]) * (t - k); } return s; };
  /* 'measured'＝実測の顔料から組んだ形（あれば）／'shape'＝目安の形（FIT） */
  let SOURCE = 'measured';
  const reflFor = p => (SOURCE === 'measured' && MEASURED[p.id]) ? fromR5(MEASURED[p.id].R5) : reflOf(FIT[p.id]);
  let REFL = PIGMENTS.map(reflFor);
  let REFL_PAPER = reflOf(FIT.PAPER);
  function setFit(fit) { Object.assign(FIT, fit); REFL = PIGMENTS.map(reflFor); REFL_PAPER = reflOf(FIT.PAPER); api.REFL = REFL; api.REFL_PAPER = REFL_PAPER; }
  function setSource(src) { SOURCE = src === 'shape' ? 'shape' : 'measured'; REFL = PIGMENTS.map(reflFor); api.REFL = REFL; api.SOURCE = SOURCE; }

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
  const RECIPES = [{"id":"SKY","hex":"#86C8EC","en":"SKY","jp":"スカイブルー","w":{"CERULEAN":0.1815,"WHITE":0.8185}},{"id":"LAVENDER","hex":"#A7A3D4","en":"LAVENDER","jp":"ラベンダー","w":{"ULTRAMARINE":0.0309,"ROSE":0.0536,"WHITE":0.9156}},{"id":"INDIGO","hex":"#283450","en":"INDIGO","jp":"インジゴ","w":{"ULTRAMARINE":0.7561,"B_SIENNA":0.2439}},{"id":"OLIVE","hex":"#6F7B2F","en":"OLIVE","jp":"オリーブグリーン","w":{"P_GREEN":0.2599,"B_SIENNA":0.0346,"YELLOW_DEEP":0.7055}}];
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
    whiteXYZ, viewMatrix, xyzUnder, render, rgbMultiply, E_DAY, hexLin, labOfLin, dE, chromaOf, RECIPES, vec, NB, bands, renderBands, toHex, mv,
    MEASURED, MEASURED_GAIN, setSource, SOURCE
  };
  if (isNode) module.exports = api;
  root.PH_PIGMENT = api;
})(typeof window !== 'undefined' ? window : globalThis);
