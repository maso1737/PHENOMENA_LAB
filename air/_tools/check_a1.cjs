// PH-A1 の法則を既知の値と照合する： node air/_tools/check_a1.cjs
const L = require('../_law/ph_a1_law.js');
const rows = [];
const near = (name, got, want, tol) => rows.push([Math.abs(got - want) <= tol ? 'OK ' : 'NG ', name, got.toFixed(2), 'want ' + want + ' ±' + tol]);

near('es(20℃) hPa', L.es(20), 23.4, 0.2);
near('es(0℃) hPa', L.es(0), 6.11, 0.02);
near('露点 20℃・50% ℃', L.dewPoint(20, 0.5), 9.3, 0.2);
near('露点 30℃・100% ℃', L.dewPoint(30, 1), 30, 0.01);
near('湿り気 30℃／露点 18℃', L.humidity(30, 18), 0.486, 0.01);
near('雲底 早見 30/18 m', L.lcl(30, 18), 1500, 0.01);
near('気圧 1500 m hPa', L.pressure(1500), 845.6, 1);
near('雲の中の冷え方 20℃・1000hPa ℃/km', L.moistLapse(20, 1000), 4.3, 0.3);
near('雲の中の冷え方 0℃・1000hPa ℃/km', L.moistLapse(0, 1000), 6.5, 0.4);
near('雲の中の冷え方 -30℃・500hPa ℃/km', L.moistLapse(-30, 500), 8.6, 0.6);
const p = L.parcel(30, 18, 1500); near('雲底で気温＝露点 ℃', p.T - p.Td, 0, 0.01);

console.log(rows.map(r => r.join('  ')).join('\n'));
console.log('\n早見（×125 m）と厳密な計算の差');
let worst = 0;
for (const T of [5, 15, 25, 35]) for (const rh of [0.3, 0.5, 0.7, 0.9]) {
  const Td = L.dewPoint(T, rh), a = L.lcl(T, Td), b = L.exactLCL(T, Td), d = a - b; worst = Math.max(worst, Math.abs(d) / Math.max(b, 1));
  console.log(`  ${T}℃ ${Math.round(rh * 100)}%  早見 ${a.toFixed(0)} m  厳密 ${b.toFixed(0)} m  差 ${d.toFixed(0)} m`);
}
console.log('  いちばん大きい差の割合 ' + (worst * 100).toFixed(1) + ' %');
process.exitCode = rows.some(r => r[0] === 'NG ') ? 1 : 0;
