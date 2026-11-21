/* PH-A1 CLOUD BASE — 雲の底の法則（アプリと解説 LP が同じ式を読む）
 *
 * 出どころ
 *   - 飽和水蒸気圧：Magnus の式（WMO 2008 の係数 6.112 / 17.62 / 243.12）
 *   - 上がる空気の冷え方（乾いた間）：1 km で 9.8 ℃（g / cp）
 *   - 上がる空気の露点の下がり方：1 km で約 1.8 ℃（目安。気圧が下がるぶんだけ）
 *   - 雲の底の高さの早見：(気温 − 露点) × 125 m（Espy の式。= 1000 / (9.8 − 1.8)）
 *   - 厳密な雲の底：温位と混合比を保ったまま持ち上げ、露点と気温が一致する高さ（exactLCL。早見との照合用）
 *   - 雲の中の冷え方：湿潤断熱減率（水が粒になるとき熱が出るぶん、ゆるむ）
 *   - 気圧：標準大気
 * 単位：温度 ℃・高さ m・気圧 hPa・湿り気 0〜1
 */
(function (root) {
  'use strict';
  const DRY = 9.8, DEW = 1.8, PER_DEG = 1000 / (DRY - DEW);          // 125 m / ℃
  const EPS = 0.622, G = 9.81, LV = 2.5e6, RD = 287, CP = 1004;

  const es = T => 6.112 * Math.exp(17.62 * T / (243.12 + T));        // 飽和水蒸気圧 hPa
  const dewFromE = e => { const g = Math.log(e / 6.112); return 243.12 * g / (17.62 - g); };
  const dewPoint = (T, rh) => dewFromE(es(T) * Math.max(1e-4, Math.min(1, rh)));
  const humidity = (T, Td) => es(Td) / es(T);
  const pressure = z => 1013.25 * Math.pow(1 - 0.0065 * z / 288.15, 5.255);

  /* 早見：雲の底の高さ */
  const lcl = (T, Td) => Math.max(0, T - Td) * PER_DEG;

  /* 厳密：持ち上げた空気の気温と露点が一致する高さ */
  function exactLCL(T, Td) {
    if (Td >= T) return 0;
    const p0 = pressure(0), e0 = es(Td), r = EPS * e0 / (p0 - e0);
    const gap = z => { const p = pressure(z), Tp = (T + 273.15) * Math.pow(p / p0, RD / CP) - 273.15; return Tp - dewFromE(r * p / (EPS + r)); };
    let lo = 0, hi = 8000; for (let i = 0; i < 50; i++) { const mid = (lo + hi) / 2; if (gap(mid) > 0) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }

  /* 雲の中の冷え方（℃ / km） */
  function moistLapse(T, p) {
    const Tk = T + 273.15, e = es(T), r = EPS * e / (p - e);
    return 1000 * G * (1 + LV * r / (RD * Tk)) / (CP + LV * LV * r * EPS / (RD * Tk * Tk));
  }

  /* 上がる空気の気温と露点（高さ z で） */
  function parcel(T, Td, z) {
    const zb = lcl(T, Td);
    if (z <= zb) return { T: T - DRY * z / 1000, Td: Td - DEW * z / 1000, cloud: false };
    let Tp = T - DRY * zb / 1000, h = zb;
    while (h < z) { const dz = Math.min(50, z - h); Tp -= moistLapse(Tp, pressure(h)) * dz / 1000; h += dz; }
    return { T: Tp, Td: Tp, cloud: true };
  }

  const api = { DRY, DEW, PER_DEG, es, dewPoint, humidity, pressure, lcl, exactLCL, moistLapse, parcel };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PH_A1 = api;
})(typeof window !== 'undefined' ? window : globalThis);
