// PH-E1 の法則を既知の値と照合する： node earth/_tools/check_e1.cjs
const L = require('../_law/ph_e1_law.js');
const rows = [];
const near = (name, got, want, tol) => rows.push([Math.abs(got - want) <= tol ? 'OK ' : 'NG ', name, (+got).toFixed(3), 'want ' + want + ' ±' + tol]);
const yes = (name, ok, note) => rows.push([ok ? 'OK ' : 'NG ', name, note || '', '']);
const P = (v, P, o) => Object.assign({ v: v / 100, P, wind: 0, iso: true }, o || {});   // v は cm/年
const run = (s, yr, p) => { let st; for (let k = 0; k < yr / 1e5; k++) st = L.step(s, 1e5, p); return st; };

/* 1. 浮き沈みの比（密度 2.8／3.3） */
near('高さの割合 (3.3−2.8)/3.3', L.HF, 0.1515, 0.001);
near('根の割合 2.8/3.3', L.RF, 0.8485, 0.001);
near('根 ÷ 高さ = 5.6', L.RF / L.HF, 5.6, 0.01);

/* 2. 広く削ると約 85% 浮く（中央 120 km を 1000 m 削る） */
{ const s = L.create(); for (let i = 0; i < L.NX; i++) s.c[i] += 10000; L.isostasy(s, true); const i = 100, h0 = s.h[i];
  for (let j = 40; j <= 160; j++) L.carve(s, j, 1000); L.isostasy(s, true);
  near('広く 1000 m 削ると高さは 152 m だけ下がる', h0 - s.h[i], 152, 3);
  near('→ 浮いた割合', 1 - (h0 - s.h[i]) / 1000, 0.85, 0.005); }
/* 3. 狭い谷（2 km 幅）は板に支えられてほとんど浮かない（たわみの目安） */
{ const s = L.create(); L.isostasy(s, true); const h0 = s.h[100]; for (let j = 99; j <= 101; j++) L.carve(s, j, 1000); L.isostasy(s, true);
  const f = 1 - (h0 - s.h[100]) / 1000; yes('狭い谷は浮く割合が小さい（< 25%）', f < 0.25, '浮いた割合 ' + f.toFixed(3)); }

/* 4. 押す量の保存：雨 0 で 1 万年 → 増えた断面積 = v × 35 km × 1 万年 */
{ const s = L.create(), a0 = s.c.reduce((a, b) => a + b, 0); run(s, 1e5, P(2, 0)); const da = (s.c.reduce((a, b) => a + b, 0) - a0) * L.DX;
  near('押し込まれた断面積 km²（2 cm/年・10 万年）', da / 1e6, 0.02 * 35000 * 1e5 / 1e6, 0.5); }

/* 5. 隆起 ＝ 侵食で高さが止まる（既定 1.5 cm/年・雨 1 m/年・1000 万年） */
{ const s = L.create(); const st = run(s, 1e7, P(1.5, 1));
  near('止まったときの 上 − 下 mm/年', (st.up - st.down) * 1e3, 0, 0.02);
  yes('境界の判定 = STEADY', L.state(st.up, st.down) === 'STEADY', L.state(st.up, st.down));
  const T = 0.015 * L.C0 * L.beltMean(L.G);   // 帯の平均の押し込み速さ（厚くなる速さ）
  near('止まったとき 侵食 ＝ 厚くなる速さ（量の保存）mm/年', st.down * 1e3, T * 1e3, 0.05);
  near('止まったときの最高点 km（目安の値・合わせた結果）', st.peak / 1000, 3.68, 0.1);
  near('根の断面積 ÷ 地上の山の断面積（両端で根が切れる分だけ小さい）', st.ratio, 5.6, 0.2);
  yes('最高点の真下の根 ÷ 最高点 は 5.6 より小さい（板が広く支える）', st.rootMax / st.peak < 5.6, (st.rootMax / st.peak).toFixed(2));
  // 押すのをやめると低くなる（DECAY）。根が浮き上がるので、高さが半分になるのに時間がかかる
  const s2 = L.create(); run(s2, 1e7, P(1.5, 1)); const st2 = L.step(s2, 1e5, P(0, 1));
  yes('押すのをやめた直後 = DECAY', L.state(st2.up, st2.down) === 'DECAY', L.state(st2.up, st2.down));
  yes('やめた直後も岩は上がり続ける（根が浮く）', st2.up > 0.5 * st2.down, 'up ' + (st2.up * 1e3).toFixed(2) + ' / down ' + (st2.down * 1e3).toFixed(2) + ' mm/年');
  const s3 = L.create(); run(s3, 1e7, P(1.5, 1)); const half = st.meanH / 2; let tIso = 0; while (L.step(s3, 1e5, P(0, 1)).meanH > half) tIso += 1e5;
  const s4 = L.create(); run(s4, 1e7, P(1.5, 1)); let tNo = 0; while (L.step(s4, 1e5, P(0, 1, { iso: false })).meanH > half) tNo += 1e5;
  yes('浮き沈みがあると、山が半分になるまで長い', tIso > 2 * tNo, '浮き沈みあり ' + (tIso / 1e6).toFixed(1) + ' 百万年 ／ なし ' + (tNo / 1e6).toFixed(1) + ' 百万年');
}
/* 6. 境界の向き */
{ const s = L.create(); const st = run(s, 1e6, P(1.5, 1)); yes('育ち始め = GROW', L.state(st.up, st.down) === 'GROW', L.state(st.up, st.down)); }
/* 7. 押す速さに比例して高くなる（傾き n = 1） */
{ const a = run(L.create(), 1e7, P(1.5, 1)).peak, b = run(L.create(), 1e7, P(3, 1)).peak; near('押す 2 倍 → 最高点の比', b / a, 2, 0.05); }
/* 8. 雨が多いと低い（Q^0.5 → 雨 4 倍で 1/2） */
{ const a = run(L.create(), 1.5e7, P(1.5, 0.5)).peak, b = run(L.create(), 1.5e7, P(1.5, 2)).peak; near('雨 4 倍 → 最高点の比', b / a, 0.5, 0.05); }
/* 9. 雨 0 なら削られない（月の地形） */
{ const s = L.create(); const st = run(s, 2e6, P(1.5, 0)); yes('雨 0 の侵食は斜面のにじみだけ（押し込みの 5% 未満）', st.down < 0.05 * st.up, (st.down * 1e3).toFixed(3) + ' / ' + (st.up * 1e3).toFixed(2) + ' mm/年'); yes('雨 0 は育ち続ける = GROW', L.state(st.up, st.down) === 'GROW'); }
/* 10. 風：雨の多い側が速く削られ、分水嶺は雨の少ない側へ動く */
{ const s = L.create(); run(s, 1e7, P(1.5, 1, { wind: -1 })); yes('左から風 → 分水嶺は右（乾いた側）へ', s.div > 103, '中央から ' + (s.div - 100) + ' km');
  const t = L.create(); run(t, 1e7, P(1.5, 1, { wind: 1 })); yes('右から風 → 分水嶺は左へ', t.div < 97, '中央から ' + (t.div - 100) + ' km'); }
/* 11. 1 コマの大きさで答えが変わらない（陰解法） */
{ const a = L.create(); for (let k = 0; k < 300; k++) L.step(a, 1e4, P(1.5, 1)); const b = L.create(); for (let k = 0; k < 3; k++) L.step(b, 1e6, P(1.5, 1));
  near('300 万年：1 万年ずつ と 100 万年ずつ の最高点の差 m', a.stat.peak - b.stat.peak, 0, 15); }
/* 12. 地層：削られると下の層が出る */
{ const s = L.create(); run(s, 5e6, P(1.5, 1)); const c = L.column(s, s.stat.peakI); yes('500 万年で山頂の泥岩・砂岩・石灰岩は削られて花こう岩が出る', c[0] - c[3] < 1, '上 3 層の厚さ ' + (c[0] - c[3]).toFixed(0) + ' m'); }

console.log(rows.map(r => r.join('  ')).join('\n'));

console.log('\n押す速さ × 雨 → 止まったときの最高点（km・1500 万年後）');
const vs = [0.5, 1, 1.5, 2, 3, 4], Ps = [0.2, 0.5, 1, 2, 3];
console.log('  v＼P  ' + Ps.map(p => String(p).padStart(6)).join(''));
for (const v of vs) console.log('  ' + String(v).padStart(4) + '  ' + Ps.map(p => (run(L.create(), 1.5e7, P(v, p)).peak / 1000).toFixed(2).padStart(6)).join(''));
const t0 = Date.now(); const s = L.create(); for (let k = 0; k < 600; k++) L.step(s, 1667, P(1.5, 1)); console.log('\n重さ：1 コマ（1667 年）あたり ' + ((Date.now() - t0) / 600).toFixed(2) + ' ms');
process.exitCode = rows.some(r => r[0] === 'NG ') ? 1 : 0;
