# CLAUDE.md — PHENOMENA LAB（仮題）

自然現象・物理現象を「触る → 原因が見える → 表現に持ち出す」ラボ。WTE・12 Principles に続く第 3 の学習プロジェクト。

**別のモデルで続けるとき（Opus 5.5 など）は、まず [HANDOFF_OPUS.md](HANDOFF_OPUS.md)**（作る手順・検証の地雷・カードごとの難所・作る順・POSTER BG への橋）。

## 仕様（4 本・2026-11-11）

| 文書 | 中身 |
|---|---|
| [SPEC_01_PHENOMENA_LAB.md](SPEC_01_PHENOMENA_LAB.md) v0.2 | 全体。LOOK⇄CAUSE・TRANSFER・リアル度 ◎○△。カード 22 枚（W 波の橋・E 大地・A 空と水・M 物の形・S しなやかなもの） |
| [SPEC_02_LOOK_FORMATS.md](SPEC_02_LOOK_FORMATS.md) | 見た目はラボごとに変える（その現象を記録してきた図の形式を借りる）。形式の一覧＋Claude Design 用プロンプト（型＋A1・E1・W1） |
| [SPEC_03_PATTERN_TO_USE.md](SPEC_03_PATTERN_TO_USE.md) | WTE の自然のパターンを「どう使うか」へ。USE カード・点→線→面→世界・G 場（木の育ち方 6 枚）・作例メモ |
| [SPEC_04_DEEP_ZOOM_ENGINE.md](SPEC_04_DEEP_ZOOM_ENGINE.md) | 止まらない無限ズーム。LOOP／CHAIN／DEEP の 3 型・Z 場 5 枚・「奥に入る」LP・AE への渡し方・汎用エンジン |

型の正準：`WORLD TO EXPRESSION/sound-patterns/`（法則ファイル `_law`・アプリ＋解説 LP の 1 組・PROOF・AUTO）。

## 🆕 ARCHIVE SHELL v0.1（2026-11-21・共通の外枠）

- `_shell/shell.css`（色・線・書体の変数＋18 部品の位置）＋ `_shell/shell.js`（画面に合わせて拡大縮小・枠線・物差し／境界の道具）＋ `_shell/fonts/`（Michroma・Jura・IBM Plex Sans JP・JetBrains Mono・M PLUS 1 Code。すべて OFL・`FONTS.md`）。決まりは [SPEC_02 §4](SPEC_02_LOOK_FORMATS.md)。
- 見本（Claude Design の書き出し・**見るだけで編集しない**）：`wave/styleframe/`（SHELL_PARTS・SHELL_TOKENS・A1・E1・W1）。見るときは `wave/styleframe` で `python -m http.server`。旧 `wave2/` は空にした（中身は全部 `wave/styleframe/` へ移動）。
- **ラボで変えるのは 3 つの変数だけ**：`--accent`・`--accent-ink`・`--accent-line`（A1＝空の青 #3A74A0／白／#8DB8D8）。窓の中（canvas）はそのラボの形式。窓の中に入るアクセント色は CONTROL の札だけ。
- 新しいラボに当てる手順：A1 の HTML の外枠部分を写す → 3 変数・文字・SPECIMEN・BIG・NOISE を差し替え → canvas の `layout()` と `pos()` を A1 と同じ「外枠の座標で描く」形にする → `PHShell.onScale(() => { layout(); draw(); })`。
- 🆕 11-22 ホバーの動き（TRANSFER の帯が左から伸び、見出しの行は黒い下地・ボタン・つまみ・CONTROL の札が明るい青に反応）。決まりは SPEC_02 §4.6。
- 地雷：外枠は CSS の transform で縮むので、canvas の `getBoundingClientRect()` は縮んだ大きさを返す。`clientWidth` で描き、ポインタは倍率で割る（A1 の `layout()`・`pos()`）。内蔵ブラウザは file:// を静止画で開くので、file:// の確認は Edge のヘッドレス撮影で行った。

## 🆕 W1 ONE OCTAVE v0.1（2026-11-22・実装済み）

- `wave/01_one_octave.html`（本体）＋ `wave/_law/ph_color.js`（**色の部品・W3/W4/W6/W7/E5 でも使う正本**）＋ `wave/_law/ph_w1_law.js`（光→音・ひな形・広がり）＋ `wave/_tools/check_w1.cjs`（照合 41 項目：`node wave/_tools/check_w1.cjs`）。file:// で開ける。
- 色の部品：等色関数は Wyman 2013 の近似式。**両端（640 nm より赤・430 nm より紫）は近似式の色の比が CIE 表からずれる**ので、表の端の比にそろえた（直す前は赤端が緑がかり、紫端が青に寄った）。画面の外の純色は**負の成分を 0 に切る**（灰色へ寄せる方式は赤端がピンクに寄るので画面には使わない）。受け手 L・M・S は Hunt–Pointer–Estévez の行列（山 576・547・448 nm）。
- 黄色 1 本 ＝ 赤 630 nm＋緑 **551 nm**（X・Y はぴったり、色度の差 0.0014）。虹の縁はわずかに外へふくらむので 2 本で「完全に同じ」は作れない → 差を数値で出している。532 nm（緑のレーザー）だと差 0.006 で見分けられる側に入るので使わない。
- 境界：PURE＝山 1 つで幅 5 nm 以下／WHITE＝実効の幅 300 nm 以上／その間 MIXED（電球・LED・レーザー 2 本）。
- 画面：LOOK＝いまの光・白い球・赤い物（判定は白い球との色度の差：違えば「残る」・同じで暗いだけなら「くすむ」）＋耳 10 オクターブと目の幅。CAUSE＝波長の目盛り（横軸は振動数の対数＝鍵盤が等間隔）・スペクトルの帯（法則で計算した色）・成分の棒（なぞって描く）・受け手の感度と反応の箱・鍵盤（強い成分のある鍵盤が点く）。
- 操作：主役＝成分の棒をなぞる（上で高く・下へなぞると 0）。プリセット 7 つ（太陽・電球・LED・レーザー赤＋緑・街灯・白・消す）。♪ 音（最初の押しで開始・リミッター・音量）。PROOF＝成分を隠して A／B を 2.5 秒ごとに切り替え（受け手の数字は同じ・音は 1 音と 2 音）。AUTO＝山が 24 秒で往復し、40 秒で細い ⇄ 広い（PURE→MIXED→WHITE を通る）。BREAK＝受け手 2／3／4（2＝L を M から作り直す見え方の目安・4＝590 nm に山を持つ仮の Q で A と B が分かれる：Q 1.04 と 0.34）。
- 音：成分 1 本＝1 nm ごとの正弦波（÷2⁴⁰、Hz は整数に丸め＝最大 ±0.5 Hz）。1 秒の輪の音を作って重ねてつなぐ。強さは RMS 0.12 で一定。白（371 本）の生成は約 45 ms。
- 直リンク：`#p=LASER`（プリセット）・`&brk=2〜4`・`&proof=1`・`&auto=1`。検証の出口 `window.__PH`（`S`・`derive()`・`step(dt)`・`setPreset()`・`setSound()`・`buffer()`・`audio()`）。
- 正直に書いてあること：光源の形（LED・太陽の凸凹）は目安。受け手 2 つの見え方・4 つ目の受け手は目安。等色関数は近似式（表との差は照合の数値）。
- **ユーザーが見る・聴く番**：実機での音（ヘッドホン推奨・音量は小さめから）、なぞる手応え、色の見え方。
- 残り：解説 LP `wave/scroll/SCROLL_ONEOCTAVE_LP.html`／STAGE LINK 登録。

## 🆕 A1 CLOUD BASE v0.1（2026-11-11・実装済み）

- 🆕 2026-11-21 外枠 ARCHIVE SHELL をかぶせた（見た目だけ。法則・S／derive／step／draw・`__PH` は同じ。境界の値は変更前と全一致）。窓の色は SHELL_TOKENS「A1 窓」（紙 #E4EEF2・墨 #22323A・上がる空気 #9A4A2A・露点 #2C7A76・雲 #F7FAFB・主役の 2 本 3 px）。つまみ：気温・湿り気は READOUT の値の下、BREAK のばらつきは PROOF／AUTO／BREAK の下（BREAK のときだけ）。

- `air/01_cloud_base.html`（本体）＋ `air/_law/ph_a1_law.js`（法則）＋ `air/_tools/check_a1.cjs`（照合：`node air/_tools/check_a1.cjs`）。file:// で開ける。
- 見た目＝気象の「高さ × 温度」の図（SPEC_02）。左 LOOK（空を横から）と右 CAUSE が**同じ高さの目盛り**。2 本の線の交点から左へ破線＝雲の底。
- 操作：湿り気（主役）・気温。図の下の緑／赤茶の点を引いても同じ（気温の点を引くと露点はそのまま＝空気の中の水の量は変えない）。空をなぞると、その高さの値。PROOF（泡 1 つを追う・①②③の説明）／AUTO（60 秒で霧 ⇄ 乾いた日）／BREAK（底をばらばらに）。下に TRANSFER 5 欄。
- 法則の照合：11 項目すべて OK。早見（×125 m）と厳密な計算の差は最大 5.5%（35 ℃・30% で 131 m）。
- 境界の実測：湿り気 98% 以上で FOG・15〜97% で CLOUD・14% 以下（気温 40 ℃）で DRY（底が 4 km より上）。
- 検証の出口：`window.__PH`（`S` 状態・`L` 法則・`G` 配置・`derive()`・`step(dt)`・`draw()`）。
- 正直に書いてあること：雲の形は見た目のまね（△）。雲の上端の高さは法則から出していない（A2 RISE の仕事）。
- **ユーザーが見る番**：見た目の形式がこれでよいか・文字の大きさ・雲の描き方。スタイルフレームを別に作らず、動く本体を最初の見本にした。
- 残り：解説 LP `air/scroll/SCROLL_CLOUDBASE_LP.html`／TRANSFER の CG 欄を Blender で 1 回試して書き直す／STAGE LINK 登録。

## 🆕 ZOOM CORE v0.1（2026-11-11・実装済み）

- `zoom/zoom_core.js`（芯・1 ファイル）＋ `zoom/zoom_core.html`（試す画面）。file:// でそのまま開ける。
- 題材 3 つ：NEST（四角の入れ子・輪）／TRIANGLE（子が 3 つ）／CHAIN（点 → 線 → 面 → 世界の連なり・輪）。
- 🆕 同日 題材を 3 つ追加（計 6）：GOLDEN（黄金長方形のらせん・回りながら寄る）／KOCH（海岸線の曲線・子 4 つ）／FERN（シダ・大きさの違う子 3 つ）。乗り換えの画素差はどれも 0。
  - 芯に足したもの：`info.childAlpha`（子の見え具合。子が出るまでの「代わりの絵」をなめらかに受け渡す＝コッホの線・シダの葉）／場面の `detail`（その題材だけ細部を粗くして軽くする。シダは 5）。
  - 重さ（1 コマ・内蔵ブラウザ実測）：GOLDEN 0.1 ms／KOCH 3 ms／**FERN 約 21 ms（重い。葉の塗りが多い）**。
  - 芯は回転と等倍の縮みだけ（ゆがむ変形は無い）。本物のバーンズリーのシダは作れないので、等倍の縮みで組んだ「シダの形」。
- カメラ＝「いる場面 cur」＋「場面 → 画面」の写し m, t（複素数）。`normalize()` で子／親へ乗り換えて数を小さく戻す。
- 実測（Claude・内蔵ブラウザ）：乗り換え前後の画素差 0（3 題材）／10^6020 倍まで寄って・引いて同じ絵（線の縁の濃さだけ最大 7% 違う・位置のずれなし）／ホイール 1 刻みの倍率は深さ ±300 桁で同じ／寄る中心のずれ 0。
- MAGNET の意味：0＝引き寄せない（何もない所へも寄れる）・0.5＝子のずれが広がらない・1＝寄るほど子が中心へ。
- 検証のしかた：`window.__ZOOM.core` の `step(dt)`／`zoomAt(倍率, x, y)`／`normalize()`／`render()` を自分で呼ぶ（内蔵ブラウザは隠れていると描画が止まるため）。スクリーンショットは 1 秒待ってから撮る。
- **ユーザーが触る番**：実機のホイール・トラックパッド・タッチの手応え、滑らかさ。
- 次の候補：EXPORT（連番・ループ 1 周ぶん）→ Z4 DOT TO WORLD（CHAIN の絵を作り込む）→ Z2 を教材の形に（PROOF・TRANSFER・解説）。

## いまの状態（2026-11-11）

- 実装は ZOOM CORE・A1 CLOUD BASE・W1 ONE OCTAVE（11-22）・ほかは仕様のみ・STAGE LINK 未登録。
- 🆕 11-22 git init 済み（ローカルのみ・リモートなし）。`.gitignore` で `/fonts/`（OFL でない書体を含む）・`/_out/`・zip を除外。
- 🆕 11-21 共通の外枠 ARCHIVE SHELL（`_shell/`）を作り A1 に適用。E1・W1 の見本も `wave/styleframe/` にある（本体は未着手）。
- ✅ 決定：見た目は統一しない（内容に合った形式）・カード追加（虹・オーロラ・溶岩・布・髪）。
- ✅ 11-11 決定：名前 PHENOMENA LAB・置き場所ルート直下。
- 🆕 11-11 ユーザー：POSTER BG（`Gen-EX…/VJ_Fluid-Paint`）の雲をこの法則で描かせたい＝「突破口になりそう」→ 設計は HANDOFF_OPUS.md §7。✅ 同日 最初の 1 歩を実装（POSTER BG の AUTO に SKY STATE：LAW・HUMID・TEMP・CLOUDS。記録は `VJ_Fluid-Paint/CLAUDE.md` の「次の候補」先頭）＝ユーザーが見る番。
- 次の候補：A1・W1 の解説 LP／E1 隆起と侵食（見本あり）／W4 空の色（`ph_color.js` がそのまま使える）／G3 光を探す木／ズームの連番書き出し。

## 次の会話はここから

1. どれから作るかを聞く。
2. 法則ファイル（`<場>/_law/ph_xx_law.js`）→ Node で既知の値と照合。
3. SPEC_02 の型でプロンプトを用意 → スタイルフレーム（Claude Design か静止 HTML）→ ユーザーが見る → 本体。

## 決まり

- 書き出しは `_out/` の下。
- 1 本＝主役の操作 1 つ＝境界 1 つ。足したくなったら別のカード。
- TRANSFER が空のラボは完成扱いにしない。
- 数値の出どころは法則ファイルの先頭に書く。目安は「目安」と書く。
- SPEC_03 §5 の作例は Claude の記憶からの一覧。使う前に出典を確かめる。
