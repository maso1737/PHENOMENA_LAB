/* PHENOMENA LAB — ARCHIVE SHELL v0.1（共通の外枠の動き）
   - 1920 × 1080 の外枠を画面に合わせて拡大縮小する（--ph-scale）。拡大率が変わったら onScale の関数を呼ぶ。
   - 共通の枠線（四隅のトンボ・横の罫線・十字）を描く。
   - 物差し（SCALE）・境界の目盛り（BOUNDARY）を作る小さな道具。
   法則にも状態にも触らない。窓の中（canvas）はラボの仕事。 */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const subs = [];
  const PHShell = { scale: 1, onScale(fn) { subs.push(fn); } };

  /* ---- 画面に合わせる ---- */
  function fit() {
    const shell = document.querySelector('.ph-shell'); if (!shell) return;
    const vw = window.innerWidth, vh = window.innerHeight, s = Math.min(vw / 1920, vh / 1080);
    shell.style.setProperty('--ph-scale', s);
    shell.style.setProperty('--ph-ox', Math.round((vw - 1920 * s) / 2) + 'px');
    shell.style.setProperty('--ph-oy', Math.round((vh - 1080 * s) / 2) + 'px');
    const changed = s !== PHShell.scale; PHShell.scale = s;
    if (changed) subs.forEach(fn => fn(s));
  }

  /* ---- 共通の枠線（位置は全ラボ共通） ---- */
  function frame() {
    const svg = document.querySelector('svg.ph-frame'); if (!svg || svg.childElementCount) return;
    const M = 'rgba(232,230,223,0.55)', S = 'rgba(232,230,223,0.10)', A = getComputedStyle(document.documentElement).getPropertyValue('--accent-line').trim() || '#E8E6DF', K = '#9C9A93';
    for (const p of ['52,24 24,24 24,52', '1868,24 1896,24 1896,52', '52,1056 24,1056 24,1028', '1868,1056 1896,1056 1896,1028'])
      el('polyline', { points: p, fill: 'none', stroke: M, 'stroke-width': 1.5 }, svg);
    for (const y of [124, 324, 844, 912]) el('line', { x1: 24, y1: y, x2: 1896, y2: y, stroke: S }, svg);
    for (const [x1, y, x2] of [[40, 124, 1040], [280, 844, 1880], [40, 912, 1880]]) el('line', { x1, y1: y, x2, y2: y, stroke: M }, svg);
    for (const x of [268, 1052, 1688]) el('line', { x1: x, y1: 24, x2: x, y2: 1056, stroke: S }, svg);
    el('line', { x1: 372, y1: 44, x2: 372, y2: 104, stroke: A, 'stroke-width': 2 }, svg);
    const cross = (x, y, r, c) => { el('line', { x1: x - r, y1: y, x2: x + r, y2: y, stroke: c }, svg); el('line', { x1: x, y1: y - r, x2: x, y2: y + r, stroke: c }, svg); };
    cross(1100, 78, 10, A); cross(1500, 912, 10, A); cross(268, 324, 6, K); cross(1688, 912, 6, K);
    /* 読ませない層の共通部分：READOUT の左の目盛りのはしご */
    const noise = document.querySelector('svg.ph-noise');
    if (noise) for (let i = 0; i <= 44; i++) { const y = 344 + i * 10.8; el('line', { x1: 264, y1: y, x2: i % 5 ? 268 : 272, y2: y, 'stroke-width': 1 }, noise); }
  }

  /* ---- 物差し（SCALE）：opts = { width, min, max, major, minor, unit, note } → set(値) で ▲ を動かす ---- */
  PHShell.ruler = function (svg, o) {
    const w = o.width || 960, X = v => (v - o.min) / (o.max - o.min) * w, ink = '#E8E6DF', k2 = '#9C9A93', k3 = '#6F6D67';
    svg.setAttribute('width', w); svg.setAttribute('height', 56); svg.setAttribute('viewBox', '-1 0 ' + (w + 2) + ' 56'); svg.style.overflow = 'visible';
    el('line', { x1: 0, y1: 26, x2: w, y2: 26, stroke: 'rgba(232,230,223,0.55)' }, svg);
    for (let v = o.min; v <= o.max + 1e-9; v += o.minor) {
      const x = X(v), big = Math.abs(v / o.major - Math.round(v / o.major)) < 1e-6;
      el('line', { x1: x, y1: big ? 20 : 26, x2: x, y2: big ? 34 : 31, stroke: big ? ink : k3 }, svg);
      if (big) { const t = el('text', { x, y: 14, 'font-family': "'JetBrains Mono', monospace", 'font-size': 11, fill: k2, 'text-anchor': v === o.min ? 'start' : v >= o.max ? 'end' : 'middle' }, svg); t.textContent = v + ' ' + o.unit; }
    }
    if (o.note) { const t = el('text', { x: w / 2, y: 53, 'font-family': "'JetBrains Mono', 'M PLUS 1 Code', monospace", 'font-size': 10, fill: k3, 'text-anchor': 'middle' }, svg); t.textContent = o.note; }
    const m = el('polygon', { points: '0,29 -6,40 6,40', fill: getComputedStyle(document.documentElement).getPropertyValue('--accent-line').trim() }, svg);
    return v => m.setAttribute('transform', 'translate(' + X(Math.max(o.min, Math.min(o.max, v))).toFixed(1) + ' 0)');
  };

  /* ---- 境界の目盛り（BOUNDARY）：opts = { width, zones:[名前…], cuts:[{x, label}] } → set(x) で ▼ を動かす（x は 0〜width） ---- */
  PHShell.boundary = function (svg, o) {
    const w = o.width || 212;
    svg.setAttribute('width', w); svg.setAttribute('height', 46); svg.setAttribute('viewBox', '0 0 ' + w + ' 46');
    el('line', { x1: 0, y1: 22, x2: w, y2: 22, stroke: 'rgba(232,230,223,0.55)' }, svg);
    const edges = [0, ...o.cuts.map(c => c.x), w];
    o.cuts.forEach(c => { el('line', { x1: c.x, y1: 14, x2: c.x, y2: 30, stroke: '#E8E6DF', 'stroke-width': 1.5 }, svg); const t = el('text', { x: c.x, y: 44, 'font-family': "'JetBrains Mono', monospace", 'font-size': 10, fill: '#9C9A93', 'text-anchor': 'middle' }, svg); t.textContent = c.label; });
    const names = o.zones.map((z, i) => { const t = el('text', { x: (edges[i] + edges[i + 1]) / 2, y: 8, 'font-family': 'Jura, sans-serif', 'font-size': 9, 'font-weight': 600, 'letter-spacing': 1, fill: '#6F6D67', 'text-anchor': 'middle' }, svg); t.textContent = z; return t; });
    const m = el('polygon', { points: '0,22 -5,13 5,13', fill: getComputedStyle(document.documentElement).getPropertyValue('--accent-line').trim() }, svg);
    return (x, zone) => { m.setAttribute('transform', 'translate(' + Math.max(5, Math.min(w - 5, x)).toFixed(1) + ' 0)'); names.forEach((t, i) => t.setAttribute('fill', i === zone ? '#E8E6DF' : '#6F6D67')); };
  };

  /* ---- 選択中の印（STATE・REALISM 共通）：子のうち i 番目に .now ---- */
  PHShell.mark = (parent, i) => { [...parent.children].forEach((c, k) => c.classList.toggle('now', k === i)); };

  frame(); fit();
  window.addEventListener('resize', fit);
  window.PHShell = PHShell;
})();
