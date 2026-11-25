/* PHENOMENA LAB — 入口（標本棚）の自動配置
   データ：index.html の window.PH_INDEX（fields / labs）。
   作品を足すときは labs に 1 行足すだけ。配置は下の「組み方」から自動で選ぶ。

   組み方のきまり
   - 分野ごとに、できている作品（live）を新しい順に並べ、組み方（R1〜R6）を順番に当てる。
     組み方は分野の順番と行の順番で入れ替わり、1 行おきに左右を反転する（画一的にしないため）。
   - 予定（plan）は、組み方の空いた所に入れ、残りは札の帯（P1）と行の一覧（P2）を交互に。
   - 1 つの分野が MAX_ROWS 行を超えたら、続きは「次のページ」（ボタンで開く）に回す。
   - できている作品が 0 の分野は、最後の NEXT FIELDS にまとめる。1 本できると自動で本編へ移る。
   - 手で直したいときは、その作品の行に lay: { col: '1 / 9', mt: 40, ratio: '16 / 8', big: true } を書く
     （組み方が決めた値を上書きする）。 */
(function () {
  'use strict';
  const D = window.PH_INDEX;
  const MAX_ROWS = 4;
  const esc = s => String(s).replace(/&(?!amp;|lt;|gt;)/g, '&amp;').replace(/</g, '&lt;');
  const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const fieldOf = k => D.fields.find(f => f.k === k);
  const flip = (col, m) => { if (!m) return col; const [a, b] = col.split('/').map(Number); return (14 - b) + ' / ' + (14 - a); };

  // ---------- parts ----------
  function liveCard(L, o) {
    const lay = Object.assign({}, o, L.lay || {});
    const [a, ai, al] = L.acc;
    const side = lay.block && lay.block.side === 'r' ? 'right' : 'left';
    const b = lay.block || {};
    const st = `grid-column:${lay.col};grid-row:${lay.row || '1'};margin-top:${lay.mt || 0}px;--a:${a};--ai:${ai};--al:${al}`;
    let h = `<article class="card${lay.big ? ' big' : ''}" style="${st}">`;
    if (L.img) {
      h += `<div class="thumbw">`;
      if (b.w) h += `<div class="blk" aria-hidden="true" style="${side}:${b.x};top:${b.y};width:${b.w};height:${b.h}"></div>`;
      h += `<a class="thumb" href="${L.app}" style="aspect-ratio:${lay.ratio || '16 / 9'}"><img src="${L.img}" alt="${esc(L.t)} の画面" style="object-position:${L.pos || '50% 50%'}"><span class="tone"></span><span class="code">${esc(L.code)}</span></a></div>`;
    } else {
      h += `<a class="noimg" href="${L.app}"><span class="code">${esc(L.code)}</span><i>${esc(L.note || L.f + ' FIELD')}</i></a>`;
    }
    const f = fieldOf(L.f);
    h += `<div class="txt"><div class="meta"><span class="live">● LIVE</span><span>${f.name} · ${esc(L.code)}</span><span class="fmt">${esc(L.fmt)}</span><span class="d">${L.d}</span></div>`;
    h += `<h3>${esc(L.t)}</h3><span class="jp">${esc(L.jp)}</span><p class="q">${esc(L.q)}</p>`;
    h += `<div class="btns"><a class="app" href="${L.app}">APP →</a>${L.lp ? `<a class="lp" href="${L.lp}">解説 LP →</a>` : ''}</div></div></article>`;
    return h;
  }
  const chips = cc => `<span class="chips" aria-hidden="true">${(cc || []).map(c => `<i style="background:${c}"></i>`).join('')}</span>`;
  function tile(P, col, mt, cls = '') {
    return `<div class="tile ${cls}" style="grid-column:${col};${col === 'auto' ? '' : 'grid-row:1;'}margin-top:${mt || 0}px"><div class="h"><span class="c">${esc(P.code)}</span>${chips(P.chips)}</div>` +
      `<span class="en">${esc(P.t)}</span><span class="jp">${esc(P.jp)}</span><span class="q">${esc(P.q)}</span><span class="st">PLANNED · <b>${esc(P.fmt)}</b></span></div>`;
  }
  function prow(P, col, mt, cls = '') {
    return `<div class="prow ${cls}" style="${col ? 'grid-column:' + col + ';grid-row:1;' : ''}margin-top:${mt || 0}px"><span class="c">${esc(P.code)}</span><div class="b">` +
      `<div class="h"><span class="en">${esc(P.t)} <span>${esc(P.jp)}</span></span>${chips(P.chips)}</div><span class="q">${esc(P.q)}</span><span class="st">PLANNED · <b>${esc(P.fmt)}</b></span></div></div>`;
  }
  const deco = (kind, x, y) => `<span class="dc ${kind}" aria-hidden="true" style="left:${x};top:${y}">${kind === 'plus' ? '+' : kind === 'sl' ? '//' : ''}</span>`;
  const row = (inner, k) => `<div class="g12">${inner}${decoFor(k)}</div>`;
  function decoFor(k) {
    const h = hash('d' + k), kinds = ['plus', 'bar', 'sl'];
    // 飾りは行と行のすき間（上下 56px）にだけ置く＝中身に重ならない
    const x1 = 20 + (h % 60), x2 = 4 + ((h >> 4) % 90);
    return deco(kinds[h % 3], x1 + '%', '-' + (36 + (h >> 8) % 10) + 'px') + deco(kinds[(h >> 3) % 3], x2 + '%', 'calc(100% + ' + (14 + (h >> 12) % 16) + 'px)');
  }
  const blk = (side, x, y, w, h) => ({ side, x, y, w, h });

  // ---------- recipes (12 columns, m = mirror) ----------
  const R = {
    R1(l, p, m) {   // 大 1 ＋ 横に中 1 ＋ その下に予定 2
      let s = liveCard(l[0], { col: flip('1 / 9', m), row: '1 / 3', ratio: '16 / 8', big: true, block: blk(m ? 'r' : 'l', '-24px', '32px', '46%', '100%') });
      s += liveCard(l[1], { col: flip('9 / 13', m), row: p.length ? '1' : '1 / 3', mt: 64, ratio: '4 / 3', block: blk(m ? 'l' : 'r', '-24px', '-16px', '66%', '60%') });
      if (p[0]) s += tile(p[0], flip('9 / 11', m), 0, 'half').replace('margin-top', 'grid-row:2;margin-top');
      if (p[1]) s += tile(p[1], flip('11 / 13', m), 0, 'half').replace('margin-top', 'grid-row:2;margin-top');
      return s;
    },
    R2(l, p, m) {   // 中・中・小を段違いに
      return liveCard(l[0], { col: flip('1 / 6', m), ratio: '16 / 9', block: blk(m ? 'r' : 'l', '-16px', '-16px', '34%', '44%') }) +
        liveCard(l[1], { col: flip('6 / 10', m), mt: 72, ratio: '4 / 3', block: blk(m ? 'r' : 'l', '24px', '-24px', '76%', '40%') }) +
        liveCard(l[2], { col: flip('10 / 13', m), mt: 144, ratio: '4 / 3', block: blk(m ? 'l' : 'r', '-12px', '24px', '50%', '80%') });
    },
    R3(l, p, m) {   // 予定の行の一覧 ＋ 大 1
      return `<div class="plist" style="grid-column:${flip('1 / 5', m)};grid-row:1">${p.map(x => prow(x)).join('')}</div>` +
        liveCard(l[0], { col: flip('5 / 13', m), mt: 40, ratio: '16 / 7', big: true, block: blk(m ? 'l' : 'r', '-16px', '-28px', '44%', '72%') });
    },
    R4(l, p, m) {   // 大 1 ＋ 予定の札 2×2（段違い）
      let s = liveCard(l[0], { col: flip('1 / 8', m), row: '1 / 3', ratio: '16 / 8', big: true, block: blk(m ? 'r' : 'l', '-24px', '-24px', '44%', '64%') });
      const cells = [['8 / 11', 1, 96], ['11 / 13', 1, 0], ['8 / 10', 2, 0], ['10 / 13', 2, 32]];
      p.forEach((x, i) => { const [c, r, mt] = cells[i]; s += tile(x, flip(c, m), mt, 'half').replace('margin-top', `grid-row:${r};margin-top`); });
      return s;
    },
    R5(l, p, m) {   // 中 2 を上下にずらして
      return liveCard(l[0], { col: flip('1 / 7', m), ratio: '16 / 9', block: blk(m ? 'l' : 'r', '-24px', '40%', '62%', '64%') }) +
        liveCard(l[1], { col: flip('7 / 13', m), mt: 120, ratio: '16 / 9', block: blk(m ? 'r' : 'l', '-24px', '-24px', '30%', '40%') });
    },
    R6(l, p, m) {   // 大 1 だけ
      return liveCard(l[0], { col: flip('2 / 11', m), ratio: '16 / 7', big: true, block: blk(m ? 'l' : 'r', '-24px', '-24px', '40%', '60%') });
    },
    P1(p, m, k) {   // 予定の札の帯
      const cols = ['1 / 4', '4 / 7', '7 / 10', '10 / 13'], mts = [0, 40, 16, 56], sh = hash(k) % 4;
      return p.map((x, i) => tile(x, flip(cols[i], m), mts[(i + sh) % 4], 'half')).join('');
    },
    P2(p, m) {      // 予定の行（2〜3 本）
      const cols = ['2 / 5', '6 / 9', '10 / 13'];
      return p.map((x, i) => prow(x, flip(cols[i], m), i % 2 ? 24 : 0, 'half')).join('');
    },
  };

  // ---------- compose one field ----------
  function compose(f, live, plan, fi) {
    const rows = [];
    let li = 0, pi = 0, turn = fi;
    while (li < live.length) {
      const n = live.length - li, pr = plan.length - pi, m = turn % 2 === 1;
      let r;
      if (n === 1) r = pr >= 2 && turn % 2 ? 'R4' : pr >= 1 ? 'R3' : 'R6';
      else if (n === 2) r = turn % 2 ? 'R5' : 'R1';
      else if (n === 3) r = 'R2';
      else r = turn % 3 === 0 ? 'R1' : turn % 3 === 1 ? 'R2' : 'R5';
      const take = { R1: 2, R2: 3, R3: 1, R4: 1, R5: 2, R6: 1 }[r];
      const ptake = { R1: Math.min(2, pr), R3: Math.min(4, pr), R4: Math.min(4, pr) }[r] || 0;
      const grp = live.slice(li, li + take).sort((a, b) => !!b.img - !!a.img);   // 大きい枠には絵のある作品を
      rows.push(row(R[r](grp, plan.slice(pi, pi + ptake), m), f.k + rows.length));
      li += take; pi += ptake; turn++;
    }
    let alt = fi % 2;
    while (pi < plan.length) {
      const m = turn % 2 === 1;
      if (alt % 2 === 0) { rows.push(row(R.P1(plan.slice(pi, pi + 4), m, f.k + pi), f.k + rows.length)); pi += 4; }
      else { rows.push(row(R.P2(plan.slice(pi, pi + 3), m), f.k + rows.length)); pi += 3; }
      alt++; turn++;
    }
    return rows;
  }

  function head(f, n, live, total, right) {
    return `<header class="shead${right ? ' r' : ''}"><div class="l"><span class="big">${f.k}</span><div class="t"><span class="tag">// FIELD ${n}</span>` +
      `<span class="name">${f.name}</span><span class="jp">${esc(f.jp)}</span></div></div>` +
      `<div class="cnt"><span><b>${String(live).padStart(2, '0')}</b> / ${String(total).padStart(2, '0')} LIVE</span><span>${String(total).padStart(2, '0')} LABS</span></div></header>`;
  }

  // ---------- build ----------
  const byField = {};
  D.fields.forEach(f => byField[f.k] = { live: [], plan: [] });
  D.labs.forEach((x, i) => { x._i = i; byField[x.f][x.app ? 'live' : 'plan'].push(x); });
  // 新しい順（同じ日なら、絵のある作品 → 後から足した作品）
  const newer = (a, b) => (b.d || '').localeCompare(a.d || '') || (!!b.img - !!a.img) || (b._i - a._i);
  Object.values(byField).forEach(v => v.live.sort(newer));
  const nLive = D.labs.filter(x => x.app).length, nAll = D.labs.length;

  let out = '';
  // hero
  const latest = D.labs.filter(x => x.app && x.img).sort(newer).slice(0, 2);
  out += `<section class="g12 hero"><div class="topbar"><b>PHENOMENA LAB · EARTH SURVEY ARCHIVE · INDEX v0.1</b><span>ARCHIVE/EARTH/INDEX · NODE 00</span></div>`;
  out += `<div class="hero-band"><div class="row"><span style="font:700 12px/1.3 var(--f-thin);letter-spacing:.24em">// INDEX — 標本棚</span><span>${nAll} LABS · ${String(nLive).padStart(2, '0')} LIVE · ${nAll - nLive} PLANNED</span></div><h1 class="hero-title">PHENOMENA</h1></div>`;
  out += `<div class="hero-lab"><span class="hero-title">LAB</span><p>${esc(D.lead)}</p></div>`;
  out += `<div class="collage">${latest.map(L => `<a class="card" href="${L.app}" aria-label="${esc(L.t)}"><span class="thumb" style="aspect-ratio:4 / 3;--a:#F3D21C"><img src="${L.img}" alt="" style="object-position:${L.pos || '50% 50%'}"><span class="tone"></span></span></a>`).join('')}` +
    `<span class="cap">LATEST · ${latest.map(L => L.code + ' ' + esc(L.t)).join(' / ')}</span></div>`;
  out += `<nav class="fnav" aria-label="分野" style="--n:${D.fields.length}">${D.fields.map(f => { const v = byField[f.k], t = v.live.length + v.plan.length; return `<a class="${v.live.length ? '' : 'zero'}" href="#f-${f.k}"><b>${f.k}</b><span>${f.name}</span><i>${String(v.live.length).padStart(2, '0')}/${String(t).padStart(2, '0')}</i></a>`; }).join('')}</nav>`;
  out += deco('plus', '84%', '96px') + deco('plus', '97%', '190px') + deco('bar', '0px', 'calc(100% + 24px)') + deco('sl', '56%', 'calc(100% + 10px)') + `</section>`;

  // fields with live works
  let sn = 0;
  const liveFields = D.fields.filter(f => byField[f.k].live.length);
  liveFields.forEach((f, fi) => {
    const v = byField[f.k]; sn++;
    const rows = compose(f, v.live, v.plan, fi);
    const total = v.live.length + v.plan.length;
    out += `<section id="f-${f.k}" class="rows"><div class="g12">${head(f, sn, v.live.length, total, fi % 2 === 1)}</div>`;
    out += rows.slice(0, MAX_ROWS).join('');
    if (rows.length > MAX_ROWS) {
      const id = 'p2-' + f.k;
      out += `<div class="g12"><div class="more"><button type="button" aria-expanded="false" aria-controls="${id}" data-more="${id}">NEXT PAGE →</button><span>${f.name} · 2 / 2 · ${rows.length - MAX_ROWS} ROWS</span></div></div>`;
      out += `<div id="${id}" class="rows page2" hidden>${rows.slice(MAX_ROWS).join('')}</div>`;
    }
    out += `</section>`;
  });

  // fields without live works → NEXT FIELDS
  const nextF = D.fields.filter(f => !byField[f.k].live.length);
  if (nextF.length) {
    const cnt = nextF.map(f => byField[f.k].plan.length), sum = cnt.reduce((a, b) => a + b, 0);
    let spans = cnt.map(c => Math.max(3, Math.round(12 * c / sum)));
    while (spans.reduce((a, b) => a + b, 0) > 12) spans[spans.indexOf(Math.max(...spans))]--;
    while (spans.reduce((a, b) => a + b, 0) < 12) spans[spans.indexOf(Math.min(...spans))]++;
    const first = sn + 1, last = sn + nextF.length;
    out += `<section class="g12"><div class="next-bg" aria-hidden="true">NEXT</div>`;
    out += `<header class="shead" style="flex-direction:column;align-items:flex-start;gap:10px"><span class="tag">// NEXT FIELDS ${String(first).padStart(2, '0')}–${String(last).padStart(2, '0')}</span>` +
      `<span class="name" style="font:400 30px/1.1 var(--f-wide);letter-spacing:.06em">${nextF.map(f => f.name).join(' · ')}</span>` +
      `<span class="jp" style="font:400 14px/1.5 var(--f-jp);color:var(--ink-2)">${nextF.map(f => esc(f.jp)).join('・')} — これから作る ${sum} 枚</span></header>`;
    let c0 = 1;
    nextF.forEach((f, i) => {
      const sp = spans[i], col = c0 + ' / ' + (c0 + sp); c0 += sp;
      const P = byField[f.k].plan, mt = [0, 72, 0, 40][i % 4];
      const nh = `<span class="nh"><b>${f.k}</b> ${f.name} · ${esc(f.jp)}</span>`;
      if (sp >= 5) out += `<div id="f-${f.k}" class="ncol tiles2" style="grid-column:${col};margin-top:${mt}px">${nh}${P.map((x, j) => tile(x, 'auto', j % 2 ? 24 : 0)).join('')}</div>`;
      else if (sp === 4 || P.length >= 3) out += `<div id="f-${f.k}" class="ncol" style="grid-column:${col};margin-top:${mt}px;gap:0">${nh}${P.map(x => prow(x)).join('')}</div>`;
      else out += `<div id="f-${f.k}" class="ncol" style="grid-column:${col};margin-top:${mt}px">${nh}${P.map(x => tile(x, 'auto', 0)).join('')}</div>`;
    });
    out += deco('plus', '33%', '-44px') + deco('sl', '62%', 'calc(100% + 20px)') + `</section>`;
  }

  out += `<footer><span>${esc(D.footer)}</span><code>ARCHIVE/EARTH/INDEX — CLASSIFICATION: NONE · END OF RECORD</code></footer>`;
  document.getElementById('ix-main').innerHTML = out;

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-more]'); if (!b) return;
    const el = document.getElementById(b.dataset.more), open = el.hidden;
    el.hidden = !open; b.setAttribute('aria-expanded', String(open)); b.textContent = open ? 'CLOSE PAGE ×' : 'NEXT PAGE →';
  });
  window.__IX = { byField, compose, MAX_ROWS };
})();
