/* ZOOM CORE v0.1 — 止まる場所のない無限ズームの芯（PHENOMENA LAB / SPEC_04）
 *
 * 考え方
 *   - 世界 = 場面のならび。場面は「子の場面が入る場所（位置 x,y・縮み s・回転 rot）」を持つ。
 *   - カメラ = 「いまどの場面にいるか（cur）」＋「その場面 → 画面」の写し（m, t）。
 *       画面の点 = m × 場面の点 + t   （m, t は複素数 [実部, 虚部]。|m| = 場面 1 辺の画面上の px）
 *   - |m| が大きくなりすぎたら子へ、小さくなりすぎたら親へ乗り換えて数を小さく戻す（normalize）。
 *     乗り換えても絵は変わらない。だから桁が尽きない。
 *   - 画像は拡大しない。毎コマ、いまの大きさで描き直す（線の太さは画面の px で決める）。
 *
 * 世界の書き方
 *   world = {
 *     name, root: '場面id',
 *     scenes: { id: { name, parent:{id, slot}, children(): [{x,y,s,rot,to}], draw(ctx, info) } }
 *   }
 *   draw は場面の座標（中心 0・1 辺 1 の正方形の中）で描く。info = { px, alpha, level, size, time }
 *     px    … 画面 1px が場面の座標でいくつか（線の太さ = 1.5 * info.px のように使う）
 *     alpha … 小さいときの薄さ（0〜1）
 *     childAlpha … 子がどれだけ見えているか（0〜1）。「子が出るまでの代わりの絵」を alpha*(1-childAlpha) で描くと、なめらかに受け渡せる
 *   detail（任意）… この場面だけ DETAIL を何倍にするか（子の多い題材を軽くする。例 3）
 *   parent は「この場面は、どの場面の何番目の子か」。引き続けたときに使う（輪にするための指定）。
 */
(function (g) {
  'use strict';
  const mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const div = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  const abs = a => Math.hypot(a[0], a[1]);
  const xf = ch => { const r = (ch.rot || 0) * Math.PI / 180; return { cs: [ch.s * Math.cos(r), ch.s * Math.sin(r)], cc: [ch.x || 0, ch.y || 0] }; };

  class ZoomCore {
    constructor(canvas, world, opt) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d');
      this.p = Object.assign({
        sens: 1.15,      // ホイール 1 刻みで何倍になるか
        inertia: 0.18,   // 手を離した後の余韻（秒）。0 で即時
        magnet: 1,       // 寄るとき、近くの子を寄る中心へ引き寄せる強さ（0〜1）
        auto: false,     // 自動で寄り続ける／引き続ける
        autoDir: 1,      // 1 = 寄る / -1 = 引く
        autoSec: 6,      // 何秒で 10 倍か
        minPx: 6,        // 場面がこの px より小さいと描かない（細部が現れる大きさ）
        frame: 0.8       // 枠の大きさ（画面の短い辺に対する割合）
      }, opt || {});
      this.autoNormalize = true;
      this.pending = 0; this.anchor = [0, 0]; this.time = 0; this.nodes = 0;
      this.onHud = null;
      this.setWorld(world);
      this._bind();
      this.resize();
    }
    setWorld(world) { this.world = world; this.home(); }
    home() {
      this.cur = this.world.root; this.stack = []; this.level = 0; this.depth = 0; this.pending = 0;
      this.m = [this.S || 1, 0]; this.t = [0, 0];
    }
    get S() { return Math.min(this.w || 1, this.h || 1) * this.p.frame; }
    resize() {
      const r = this.canvas.getBoundingClientRect();
      this.setSize(r.width, r.height, Math.min(g.devicePixelRatio || 1, 2));
    }
    /* 11-25 外から大きさを決める口（外枠 ARCHIVE SHELL は CSS で縮むので、画面に無い板に描いて写す使い方のため） */
    setSize(w, h, dpr) {
      const oldS = this.S;
      this.w = Math.max(1, w); this.h = Math.max(1, h); this.dpr = dpr || 1;
      this.canvas.width = Math.round(this.w * this.dpr); this.canvas.height = Math.round(this.h * this.dpr);
      const k = this.S / (oldS || 1);
      if (this._sized) { this.m = [this.m[0] * k, this.m[1] * k]; this.t = [this.t[0] * k, this.t[1] * k]; }
      else { this.m = [this.S, 0]; this._sized = true; }
    }
    kids(id) { return this.world.scenes[id].children ? this.world.scenes[id].children() : []; }

    /* ---- 乗り換え（絵は変わらない） ---- */
    toChild(k) {
      const ch = this.kids(this.cur)[k], f = xf(ch);
      const mc = mul(this.m, f.cc); this.t = [mc[0] + this.t[0], mc[1] + this.t[1]];
      this.m = mul(this.m, f.cs);
      this.stack.push({ id: this.cur, slot: k }); if (this.stack.length > 64) this.stack.shift();
      this.cur = ch.to; this.level++;
    }
    toParent() {
      const p = this.stack.pop() || this.world.scenes[this.cur].parent;
      const f = xf(this.kids(p.id)[p.slot]);
      this.m = div(this.m, f.cs);
      const mc = mul(this.m, f.cc); this.t = [this.t[0] - mc[0], this.t[1] - mc[1]];
      this.cur = p.id; this.level--;
    }
    normalize() {
      let n = 0;
      for (; n < 64; n++) {
        const S = this.S, a = abs(this.m), ks = this.kids(this.cur);
        let best = -1, bd = Infinity;
        for (let i = 0; i < ks.length; i++) {
          if (a * ks[i].s < S) continue;                       // 子が枠より小さいうちは乗り換えない
          const c = mul(this.m, [ks[i].x || 0, ks[i].y || 0]);
          const d = Math.hypot(c[0] + this.t[0], c[1] + this.t[1]);
          if (d < bd) { bd = d; best = i; }
        }
        if (best >= 0) { this.toChild(best); continue; }
        if (a < 0.7 * S) { this.toParent(); continue; }
        break;
      }
      return n;
    }

    /* ---- 動かす ---- */
    zoomAt(f, ax, ay) {                                         // (ax, ay) = 画面の中心からの px
      this.m = [this.m[0] * f, this.m[1] * f];
      this.t = [ax + (this.t[0] - ax) * f, ay + (this.t[1] - ay) * f];
      this.depth += Math.log10(f);
      if (f > 1 && this.p.magnet > 0) {
        const ks = this.kids(this.cur); let bd = Infinity, bc = null;
        for (const ch of ks) {
          const c = mul(this.m, [ch.x || 0, ch.y || 0]); c[0] += this.t[0]; c[1] += this.t[1];
          const d = Math.hypot(c[0] - ax, c[1] - ay); if (d < bd) { bd = d; bc = c; }
        }
        if (bc) { const k = 1 - Math.pow(f, -2 * this.p.magnet); /* 0＝引き寄せない・0.5＝ずれが広がらない・1＝寄るほど中心へ */ this.t[0] += (ax - bc[0]) * k; this.t[1] += (ay - bc[1]) * k; }
      }
      if (this.autoNormalize) this.normalize();
    }
    /* 11-25 回りながら寄る：複素数の倍率 F（大きさ＝何倍・向き＝何度回るか）で、画面の点 (ax, ay) を止めたまま写す。引き寄せは掛けない */
    spinAt(F, ax, ay) {
      this.m = mul(this.m, F);
      const d = mul([this.t[0] - ax, this.t[1] - ay], F); this.t = [ax + d[0], ay + d[1]];
      this.depth += Math.log10(abs(F));
      if (this.autoNormalize) this.normalize();
    }
    pan(dx, dy) { this.t[0] += dx; this.t[1] += dy; if (this.autoNormalize) this.normalize(); }
    push(logAmount, ax, ay) { this.pending += logAmount; this.anchor = [ax, ay]; }
    advance(dt) {                                               // 11-25 動かすだけ（描かない）。step ＝ advance ＋ render
      if (this.pending !== 0) {
        const tau = this.p.inertia;
        let a = tau > 0 ? this.pending * (1 - Math.exp(-dt / tau)) : this.pending;
        if (Math.abs(this.pending - a) < 1e-4) a = this.pending;
        this.zoomAt(Math.exp(a), this.anchor[0], this.anchor[1]); this.pending -= a;
      }
      if (this.p.auto) this.zoomAt(Math.exp(this.p.autoDir * Math.LN10 / this.p.autoSec * dt), 0, 0);
      this.time += dt;
    }
    step(dt) { this.advance(dt); this.render(); }

    /* ---- 描く ---- */
    render() {
      const ctx = this.ctx, w = this.w, h = this.h, dpr = this.dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
      ctx.fillStyle = this.world.bg || '#000'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      // 画面を覆っている親までさかのぼってから、下へ描いていく
      let id = this.cur, m = this.m, t = this.t, lv = this.level, si = this.stack.length - 1;
      const lim = 40 * Math.max(w, h);
      for (let i = 0; i < 48 && abs(m) < lim; i++) {
        const p = si >= 0 ? this.stack[si--] : this.world.scenes[id].parent; if (!p) break;
        const f = xf(this.kids(p.id)[p.slot]);
        m = div(m, f.cs); const mc = mul(m, f.cc); t = [t[0] - mc[0], t[1] - mc[1]]; id = p.id; lv--;
      }
      this.nodes = 0; this._rec(id, m, t, lv);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = 1;
      if (this.onHud) this.onHud(ctx, w, h, this);
    }
    _rec(id, m, t, lv) {
      const sc = this.world.scenes[id], a = abs(m), mp = this.p.minPx * (sc.detail || 1); if (a < mp || this.nodes > 20000) return;
      const r = 0.7072 * a, w = this.w, h = this.h;
      if (Math.abs(t[0]) - r > w / 2 || Math.abs(t[1]) - r > h / 2) return;
      this.nodes++;
      const ctx = this.ctx, d = this.dpr;
      ctx.setTransform(d * m[0], d * m[1], -d * m[1], d * m[0], d * (w / 2 + t[0]), d * (h / 2 + t[1]));
      const alpha = Math.min(1, (a - mp) / (mp * 2));
      ctx.globalAlpha = alpha;
      const ks = this.kids(id);
      let ca = ks.length ? 1 : 0;                                // いちばん小さい子がどれだけ見えているか（0＝まだ出ていない）
      for (const ch of ks) { const cm = this.p.minPx * (this.world.scenes[ch.to].detail || 1); ca = Math.min(ca, Math.max(0, Math.min(1, (a * ch.s - cm) / (cm * 2)))); }
      sc.draw(ctx, { px: 1 / a, alpha, childAlpha: ca, level: lv, size: a, time: this.time });
      ctx.globalAlpha = 1;
      for (const ch of ks) {
        const f = xf(ch), mc = mul(m, f.cc);
        this._rec(ch.to, mul(m, f.cs), [mc[0] + t[0], mc[1] + t[1]], lv + 1);
      }
    }

    /* ---- 入力：どれも「何倍にしたか」に直してから同じ処理へ ---- */
    _bind() {
      const c = this.canvas, pos = e => { const r = c.getBoundingClientRect(); return [e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2]; };
      c.addEventListener('wheel', e => {
        e.preventDefault();
        const [x, y] = pos(e);
        let dy = e.deltaY; if (e.deltaMode === 1) dy *= 33; else if (e.deltaMode === 2) dy *= 400;
        // ctrl つき＝トラックパッドのピンチ（細かい値が続けて来る）
        const amt = e.ctrlKey ? -dy * 0.01 : -(dy / 100) * Math.log(this.p.sens);
        this.push(amt, x, y);
      }, { passive: false });
      const pts = new Map(); let pd = 0, pc = null;
      const two = () => { const a = [...pts.values()]; return { d: Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]), c: [(a[0][0] + a[1][0]) / 2, (a[0][1] + a[1][1]) / 2] }; };
      c.addEventListener('pointerdown', e => { try { c.setPointerCapture(e.pointerId); } catch (_) {} pts.set(e.pointerId, pos(e)); if (pts.size === 2) { const q = two(); pd = q.d; pc = q.c; } });
      c.addEventListener('pointermove', e => {
        if (!pts.has(e.pointerId)) return;
        const old = pts.get(e.pointerId), now = pos(e); pts.set(e.pointerId, now);
        if (pts.size === 1) this.pan(now[0] - old[0], now[1] - old[1]);
        else if (pts.size === 2) {
          const q = two();
          this.pan(q.c[0] - pc[0], q.c[1] - pc[1]);
          if (pd > 0 && q.d > 0) this.zoomAt(q.d / pd, q.c[0], q.c[1]);
          pd = q.d; pc = q.c;
        }
      });
      const up = e => { pts.delete(e.pointerId); };
      c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
      g.addEventListener('keydown', e => {
        if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
        if (e.key === 'ArrowUp') { this.push(Math.log(this.p.sens) * 2, 0, 0); e.preventDefault(); }
        else if (e.key === 'ArrowDown') { this.push(-Math.log(this.p.sens) * 2, 0, 0); e.preventDefault(); }
        else if (e.key === 'Home') { this.home(); this.m = [this.S, 0]; e.preventDefault(); }
      });
      if (g.ResizeObserver) new ResizeObserver(() => this.resize()).observe(c);
    }
    start() {
      let last = performance.now();
      const loop = now => { const dt = Math.min(0.05, (now - last) / 1000); last = now; this.step(dt); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }
  }
  g.ZoomCore = ZoomCore;
})(window);
