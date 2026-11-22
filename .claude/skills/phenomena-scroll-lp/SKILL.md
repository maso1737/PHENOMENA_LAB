---
name: phenomena-scroll-lp
description: >-
  PHENOMENA LAB のラボ（アプリ）とセットの解説 LP を、E1・RELIGHT・A1 で固まった同じ型（外枠 ARCHIVE SHELL・駅・図の紙・本文・FORMULA RAIL・余韻の間合い）で作るレシピ。
  使う場面：PHENOMENA_LAB の `<場>/scroll/SCROLL_〇〇_LP.html` を新しく作る・駅を足す・間合いを直すとき。合図の言葉：「解説 LP」「LP を作って」「駅」「FORMULA RAIL」「スクロールが早い」「余韻」「OPEN THE LAB」。
  使わない場面：LP_motion-graphics の作品 LP は `scroll-lp-grammar`。WORLD TO EXPRESSION の解説 LP は WORLD TO EXPRESSION/20_Design/PLAN_SCROLL_EXPLAINER.md。アプリ本体のつまみの確認は `param-check`。
  正本：PHENOMENA_LAB/air/scroll/SCROLL_CLOUDBASE_LP.html（いちばん新しい）・PHENOMENA_LAB/earth/scroll/SCROLL_PUSHCARVE_LP.html（最初の 1 本・重い記録の例）・PHENOMENA_LAB/wave/scroll/SCROLL_RELIGHT_LP.html（1 つずつ切り替わる駅の例）。
---

# PHENOMENA SCROLL LP — ラボの解説 LP の型

ひな形：`references/LP_TEMPLATE.html`（2026-11-23 に A1 の LP から抜いた。駅の数・式の数・BREAK の駅は ST／RAIL から自動で決まる）。
**3 本の LP の CSS と骨組みは同じ。作るたびに変えるのは「★」の所だけ。**

## 作る手順

1. ひな形を `PHENOMENA_LAB/<場>/scroll/SCROLL_<名前>_LP.html` に写す（`../../_shell/` と `../_law/` が届く深さ）。
2. アクセントの 3 変数（CSS の `--accent` `--accent-ink` `--accent-line`）と、スクリプトの `ACC` `ACCL` を**アプリと同じ値**にする。窓の色 `C` はアプリの窓の色をそのまま写す。
3. 法則ファイルを `<script src="../_law/ph_xx_law.js">` で読み、`const L = PH_XX`。**図の数・KEY NUMBER・本文の数は全部ここから計算する**（書き写さない。目安は「目安」と画面に書く）。
4. 駅を組む（下の「駅の並べ方」）。`ST`・`RAIL`・`REF`・`LEN`・`FIG[i]` を書く。
5. アプリ側に 2 つ足す：FORMAT の下の「SCROLL LP 解説を読む →」のリンクと、駅から状態を渡す直リンク（`#rh=99&proof=1` のように `location.hash` を読む口）。各駅の `lab` にその直リンクを書く。
6. 確かめる（下の「確かめ方」）→ 見本を `_out/check/<名前>lp/` に → そのプロジェクトの CLAUDE.md に記録。

## 駅の並べ方（8〜11 駅）

| 駅 | 中身 |
|---|---|
| 00 問い | アプリの QUESTION をそのまま。横長の LOOK（実物の姿）が動く |
| 01〜 | 原因を 1 駅 1 段ずつ。1 駅＝1 つの式か 1 つの量。式は `RAIL` の `at` でその駅に入線させる |
| どこか 1 つ | アプリの **PROOF** と同じ見せ方（いちばん長い駅にする） |
| どこか 1 つ | アプリの **BOUNDARY / STATE** と同じ区切り（▼ は結果・動かすのは原因、の言い方もそろえる） |
| 最後の 1 つ前 | **BREAK**（`brk: true`＝窓の縁が破線・BREAK の札）。本物と外した物を並べる |
| 最後 | TRANSFER 5 枚（アプリの TRANSFER と同じ文）・OPEN THE LAB・NEXT CARD |

- 本文の型：見出し 2 行で言い切る → 本文 2〜3 文（原因 → 結果）→ KEY NUMBER（0 から数え上げる）→ 補足 1 行 → 「驚き」1 文（数字で裏切る）。
- 範囲を超えた案を 1 駅入れてよい（A1 の「一日の雲」）。入れたらアプリにも同じ操作を足すかユーザーに出す。

## 間合い（ユーザーの赤で決まった数・変えるなら聞く）

- 駅の長さ `LEN`（画面の枚数）：00＝1.6・最後＝1.4・中は 2.4〜3.4（PROOF と見せ場は長め）。ホイール 1 回 100px で 1 駅 20〜30 回。
- 駅の頭 12% と終わり 18% は図を止める（余韻）。その間は smootherstep（`hold`）。追いかけは `dt × 4.5`。
- 1 つずつ切り替わる駅（棒が 1 本ずつ・光源を 1 つずつ）は `STEPPED` に入れる＝間を均等に（加速すると真ん中で 1 回に 2 つ進む）。
- **`FIG[i]` に来る `a` はすでに余韻と加速減速がかかっている。図の中で `ease(a / 0.8)` などを重ねない**（重ねると間延びした）。

## 図の書き方

- 図は `PL`（x 280・y 150・幅 1040・高さ 706）の中。右は本文の欄なので出ない。
- 上の 1 行（y+90）＝いま何が起きているか（駅の進みで文が変わる）。下の 1 行（y+h−20）＝縮尺・「目安」の断り（左）と単位（右）。
- 矢印は `bob()` で上下にゆらす。`RM`（動きを減らす設定）のときは止める。
- `railLive` に書いた文字が、線路の NOW の箱の下の行に出る（いまの数で式を書く：例「差 11.4 ℃ × 125 ＝ 1,424 m」）。
- 重い計算（シミュレーションの記録）はジェネレータで少しずつ回し、1 コマ 9 ms まで（`work(9)`）。届く前の駅は `wait()`（「法則で計算中…」）。例は E1 の `runR1` と RELIGHT の `D`。

## 確かめ方

1. 全駅でエラーが出ないか：内蔵ブラウザで開き、`for s, p: __LP.setP(s + p)` を try で回す。
2. 撮影は Chrome のヘッドレス（Edge は途中で書き出さなくなる）。**撮るたびに別の `--user-data-dir`**、URL に `#s=駅&p=0.45&fix=1`（`fix` なしでスクロールした位置を撮ると外枠が写らず真っ黒）。
   `chrome.exe --headless=new --disable-gpu --hide-scrollbars --user-data-dir=<毎回新しい> --window-size=1920,1080 --virtual-time-budget=4000 --screenshot=<png> <url>`
   各駅の 0.45 と 0.95 を撮り、PIL で 1 枚の一覧にして目で見る。文字が左から入る途中で写ることがある（バグではない）。
3. 見る所：図の文字と軸の数字の重なり・右端で切れる札・2 本の線が同じ形に重なっていないか（A1 の 07 は上下に分けて直した）。
4. スクロールの動き：内蔵ブラウザのタブを前に出して（隠れていると rAF が止まる）、`scrollTo` → 1.5 秒待って `__LP.P`・駅番号・線路の文字を読む。駅の頭で止まる／真ん中で動く／終わりで止まるを数で見る。
5. ユーザーが使っているタブは再読み込みしない（`tabs_create` で別タブ）。ポート 8231 を別の会話が使っていたら、そのまま 8231 を開く。

## 地雷

- 外枠は CSS の transform で縮む。canvas は 1920×1080 の座標で描き、`resize()` で `PHShell.scale × devicePixelRatio`（最大 2）にする。
- 駅の数・式の数を直書きしない（ひな形は `ST.length`・`RAIL.length` から出す）。E1 の LP は直書き（`/ 09`・`j === 4`）なので、写すならひな形の方から。
- 法則の数を本文に打ち込むと、法則を直したときに LP だけ古くなる。`kv: () => …`・`kn: () => …` で計算する。
