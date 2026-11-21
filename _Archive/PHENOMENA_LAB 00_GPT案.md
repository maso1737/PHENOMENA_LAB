これはかなり面白い次のシリーズになりそうです。

私なら、WORLD-TO-EXPRESSION、12 Principles of Animationに続く第3の学習プロジェクトとして、\*\*「自然現象・物理現象を理解し、表現に変換するインタラクティブ・ラボ」\*\*を作ります。

重要なのは、物理学の教科書をWeb化することではありません。

現象を自分で操作する → なぜそうなるかが見える → 見た目や動きの原理がわかる → 3D・アニメーション・映像生成に応用できる。

この流れを一貫させたいです。

例えば、地形を盛り上げたり削ったりする、光を動かして影の変化を聴く、雲を発生させて成長・消滅させる。そういう「触ることで理解する」教材です。

## まず作るべきシリーズの方向

[Plates tectonic](https://images.openai.com/static-rsc-4/5K598Frdg8SajgImjoZrXKyP1BzmLy3xGNhBDyD9ehSqg3Xd2I6A1w_-BpHF2DZrnXboPeqnpJgrITkg-P2AvjSdgAHywu58OhqRYr9lPUJKXPFaowpfCWstUyh4aRFlh8zgtS4Z_LbudBIgixYbKSeyJ9esd_LhgogsHf065hyydUo5c-RS4pcOY0vlDlyL?purpose=inline)

01 — EARTH / 地球をつくる力

プレートの衝突、沈み込み、隆起、侵食、堆積、地形形成。UEの地形制作や環境デザインへ。

[地球情報基盤センター/情報・計算デザイン研究開発グループ](https://images.openai.com/static-rsc-4/gEbgVYYBc-fjfB_7ug8rxMef0ykfKIs1YYx9HwYlj0FDTIHU3gRwEdsD4XSdVsmvjwrFT0PoAXcanFR-Kon4KJ7-cyxeiQjyFUJ88vT26UgC4ScwvhCu_uG2-jh1ozPZHvQA9lHWpqd2oTFJvzKpcsFkZ78ihncmoaxbTELBIoc?purpose=inline)

02 — ATMOSPHERE / 空気と雲

水蒸気、凝結、気圧、温度、風、乱流、雲の成長、霧。ボリューム表現や自然現象の生成へ。

[White light spectrum scientific experiment](https://images.openai.com/static-rsc-4/BkCTdaNdsSaBnq7LJuhfVfBptQ7kf0wqCoyXXMrT5zJnJ648aoeuXjn1-uiuvLRtRaaAz_ZL_8Dr2k-Os67N48VAtZjGUXKSxhi0pDGMxHaJeYr5WyTMJzTLCfD0-Vzbm8CFs6nTy5JHbA1ymNa4ChWDxY55plKOjZdOClP4BfDAauTPT7cAEWfI5Yn8pyYw?purpose=inline)

03 — LIGHT / 光を理解する

反射、屈折、散乱、吸収、影、色温度、間接光。ライティングと映像の説得力へ。

[Cymatics Game — Flower & Frequency](https://images.openai.com/static-rsc-4/RG1GQ1QAi1maLig2lSRNVJQjfP4YNx8EEyKm6wzz5ddMPoy0D4AP-JtR4I9ufwc9mUM1zCywoYcAeu7oG671r_pKmQiQXFQ-TL8nF2o04CFxpYoxujyqibP4ucQTdl2Ry7tXV_luSu9rvprRILcVzZqP0ggOZllI9QtQ7cQndZk?purpose=inline)

04 — SOUND / 音を理解する

振動、周波数、波長、共鳴、干渉、減衰、音の伝播。音響演出やサウンドビジュアルへ。

[Shiying Xiong](https://images.openai.com/static-rsc-4/shEHoR2VtlCocpRK29vNDuPqviWSWPI2tyBaB0rIrP9JyCpbiOk58RtqmkaI_6wFHVRyta0vpGrsrifx-xjbqm5yFY_FPgFgJ1GW_BcX0eIEbrk98sIPlI-Z9OQoZxUAg_TB7LD6AGoMZ0mGUYytns26YSf7ug10DKZpLojlEdE?purpose=inline)

05 — MATTER / 物質の振る舞い

液体、気体、固体、粘性、表面張力、蒸発、凝固、煙、蒸気。シミュレーションと質感表現へ。

この5領域は独立した教材ではなく、最終的には相互に関係する世界として設計します。

## Fable 5.2に任せるとよい仕事

今回のClaude Fable 5.2は、長時間の調査・複数段階の設計・大規模な技術作業を想定したモデルです。コンテキストは100万トークン、最大出力は12.8万トークン。曖昧な構想から技術仕様を作り、検証しながら完成物に進める用途が強化されています。

[image](https://www.google.com/s2/favicons?domain=https://platform.claude.com\&sz=32)

Claude Platform Docs+1



今回なら、いきなりHTMLを作らせるより、先に以下を設計させるのがよいと思います。

1. 学習シリーズ全体の設計
2. 各現象の科学的な仕組みの調査
3. 操作できるシミュレーションの仕様
4. 数学モデル・物理モデルの選定
5. 画面構成とインタラクション設計
6. 3D・映像表現への応用設計
7. 実装ロードマップと検証方法

特に大事なのは、科学的に正しいことと、視覚的にわかりやすいことを別々に検証することです。

WORLD-TO-EXPRESSIONで作ってきた「ルールを理解する→現象が生まれる→知覚する→自分の表現に変える」という流れを、自然現象にも展開します。

## 私が提案するプロジェクト構成

仮タイトルは、

# NATURAL FORCES

## THE SCIENCE BEHIND EXPRESSION

自然現象の原理から、映像表現の説得力をつくる。

[scientific ground cross-section to explain subduction and plate tectonics - 3d illustration](https://images.openai.com/static-rsc-4/6MEDILepxL8hIm8SGEBEBKca2Lyn4s5GCSntQdbcZQ9U-jejww8unUgFleLLmL8eAJCNiAmxiHzqNIQ09CTjmGpPHw7En1rchwUVAkSw7i82ac5UoWr5FGw3C3BKiJiq3HtizCZK-j5CaMpfuMpXADVmUyo1e1yl3RQwkZFIrUTazNSeWVmOvmLD7qx6CeNb?purpose=inline)

[地球情報基盤センター/情報・計算デザイン研究開発グループ](https://images.openai.com/static-rsc-4/gEbgVYYBc-fjfB_7ug8rxMef0ykfKIs1YYx9HwYlj0FDTIHU3gRwEdsD4XSdVsmvjwrFT0PoAXcanFR-Kon4KJ7-cyxeiQjyFUJ88vT26UgC4ScwvhCu_uG2-jh1ozPZHvQA9lHWpqd2oTFJvzKpcsFkZ78ihncmoaxbTELBIoc?purpose=inline)

[Transparent Prism with Light and Shadow in Focus](https://images.openai.com/static-rsc-4/-wn1uor7yahhIU5F6gKkYRm6ymkATVbf0aWZeaP0Ea-Wctz0FpyS6Xs_yoEq3qCQydpUhm8Q69qiudH4Op52KYqckB5lucgSJdiRslnhIfhOKajDGuBq5OS_c1knCNazSiB5KA3kka6Z6BlUDM6k6SxOQG_LpF9z44nj34omn3b2gP7I86S-KtUpCTJW0NGW?purpose=inline)

9

### 3つの階層を作る

| 階層         | 役割                        |
| ---------- | ------------------------- |
| DISCOVER   | 現象を見て、驚き、興味を持つ            |
| EXPERIMENT | パラメータを操作して仕組みを理解する        |
| EXPRESSION | 理解した原理をCG・映像・アニメーションに応用する |

各テーマでこの3つを繰り返す構成です。

## 最初の教材候補

[ConceptViz | AI-Powered Science Diagrams for Teachers & Scientists](https://images.openai.com/static-rsc-4/vYQfkDTsgRQGyzJXhCggvEMjrecOcOYcAulvDn0nrnbwGZl6ZI_E5xAsTVWtiiCIyqv_7Xg0pSw2gCzZ3eaux3JNeie_7iyQK4OA6PE7AAnMxwT1L-wlCDDzdrzwZenrwDP9VdRaMXpgEcHjXtcwY1iyb94pF7jvRRTfVUjiBy4?purpose=inline)

01\. TECTONICS — 地球の変形

プレートを左右から動かす。衝突・沈み込み・隆起・褶曲・断層を2Dで可視化。

応用：地形生成、UE Landscape、地層、岩肌、破壊表現

[What is convectional rainfall? - Internet Geography](https://images.openai.com/static-rsc-4/fVdkw3TbSNB3yirgGfLS7y2qh8P48a_QPWRt1-oO1_tBUo1XNReYtw7euIlpDuimc0lgjstFFpkNhCX4L_stUImUXmaHyRGSg_eIwVNY1eqmx_G8S188cMzxnPJTI2z1YNV4fW5DxqRgcvLvuMIF9eDzkR07M6bHjR6_SY09sHA?purpose=inline)

02\. CLOUD FORMATION — 雲の形成

温度・湿度・気圧・上昇気流を操作。水蒸気が凝結して雲になる過程を可視化。

応用：ボリューム、雲、霧、煙、空気遠近

[Here's What The Sun Looks Like From Every Planet  – Australian Research & Space Exploration](https://images.openai.com/static-rsc-4/6vdgDoD-spqgBYYZUE_zRqbAM8wxs-7to4XrKBunMTE7dpqmYaX6HrAFJsYxmtmDhoUdlBilg7mfvYRRsG18Tvi15y0WSTU9MY8ns2-7Mn5SxQSAQk7RWFkLjA74VsoaadZ221mePnr2qJYCtelQsco3dpC74b9V9QRM00y5FyE?purpose=inline)

03\. LIGHT BEHAVIOR — 光の振る舞い

光源・材質・角度・粗さを変更し、反射・屈折・散乱・影の変化を体験。

応用：ライティング、マテリアル、撮影、レンダリング

[Chladni Plates | Physics Instructional Resource Team](https://images.openai.com/static-rsc-4/tx9MyxWZ7tyNKtGZ9K9DlDzDLov2FhyS5c0azVqQyzgCAcPWHxUMwcaiMO5d0tHk5fb6BGjkdqeVyczyle8nOb4qt0eEu1yVugc7yCAnigdD5LILEaA5mDUhq9J_Vhr61-iCvRKH_v4y-evtsJ5axM4h8KdH6jq-5HxzAJFfKEQ?purpose=inline)

04\. SOUND & VIBRATION — 音と振動

周波数・振幅・波長・共鳴・干渉を操作。音波を図形や振動として理解する。

応用：モーション、VFX、音響同期、ビジュアル表現

[Home - UK Fluids Network](https://images.openai.com/static-rsc-4/Ul85rWm-RqGT8_Zs7cscLzr8PUrL-TaOsyaeTA2vhCUKKFfcmbnOb6S3GxUU00B7CPffEwBwZHRfQ-Zr1iym3dqw5JzEYE5dJZ_Gwx9TmIZCcwCADUGGNvPvbrkTZYXK7oglJ5-NqzlT6T_srgdr6qJgj0wNi5mghj7RQ82iGmE?purpose=inline)

05\. FLUID & MATTER — 流体と物質

粘性・表面張力・密度・流速・渦・蒸発を操作。

応用：液体、蒸気、煙、布、粒子、シミュレーション

## 特に面白くしたいインタラクション

ここは単なるパラメータ調整UIにしないほうがいいです。

A. EARTH — 地形を育てる

[Plate Tectonics Virtual Lab | ExploreLearning Gizmos](https://images.openai.com/static-rsc-4/mdjFDbSBGAUIGzBvamT9_MGwqrlUBergv8VVDSN6ieSs-fUV9fgcgyNaF3Ovcq2yWLkrUL_Mkd74q7kRLehneCDS7V4UcY6O_vyFn2cGevD6Pk5j6SjNC5at88-_7rTeyJ6kuahaz6lGDz7NJyIQiyMQXdgi2nRLG4GrmgoR6sA?purpose=inline)

[gizmos.explorelearning.com](https://gizmos.explorelearning.com/find-gizmos/lesson-info?resourceId=446\&utm_source=chatgpt.com)

- 2枚のプレートをドラッグして接近させる
- 速度・角度・硬さを変更
- 地面が圧縮され、隆起する
- 片方が沈み込み、山脈や海溝ができる
- 侵食をONにすると地形が変わる

最後に、できた地形を高さマップとして書き出す。

B. ATMOSPHERE — 雲を生み出す

[PPT - Atmospheric Stability and Cloud Formation PowerPoint Presentation - ID:4017717](https://images.openai.com/static-rsc-4/v-dCi3qFp0Ys_l8TwxB_UQjtCcW6gDMMPjTaHnI4w3bXJq6b2xI0nkDIlLhvUqE2jj-PpcuXi2c6A5JQLpUYovtMoJGmKUPch8G-B5RbMjnuBPyRqbETqTHR89gS4oiJ3JhQ8CvcWClFv1WVD5WLo-G4-PH8DLgYrpA-QTI13FI?purpose=inline)

[slideserve.com](https://www.slideserve.com/ryder/atmospheric-stability-and-cloud-formation?utm_source=chatgpt.com)

- 地表温度を上げる
- 水蒸気量を増やす
- 上昇気流を発生させる
- 温度低下によって凝結が起こる
- 雲粒が成長する

雲が単なる白いエフェクトではなく、なぜその形になったかを理解する。

C. LIGHT — 光を聴く

[Prisma Cahaya - Cahaya Putih Menjadi Warna | Simu](https://images.openai.com/static-rsc-4/7HWG8wuCDEZisQn6Oo2r7bDsO9AhOxF4Ea0tFg6dHApcxAC5M3EV51wFRph4YYrHsir0OnAqB9gNmMBgFJvn_Cy42YgKjWBG39mQsWFiupfBK49cDCwhPhSEqjIfCa1YqieD3ZBskuGf4xG7455R1uYXPsFpqxJG2nBB2tD9iMA?purpose=inline)

[simu.konsep.com](https://simu.konsep.com/sim/prisma-cahaya?utm_source=chatgpt.com)

- 光源の角度を動かす
- 材質や粗さを変える
- 反射・屈折・散乱を観察
- 光の強度や波長の変化を音に変換する

ここは面白い実験にできます。光そのものに音があるわけではありませんが、光の角度や強度を音程・音量・音色に対応させる「ソニフィケーション」で、目と耳の両方から理解できます。

## Fable 5.2に最初に渡す仕様設計依頼

以下をそのままClaude Fable 5.2に渡すことをおすすめします。

今回は実装を急がず、まずプロジェクト全体の設計書を作らせます。

FABLE 5.2 — MASTER DESIGN BRIEF

```

# PROJECT: NATURAL FORCES
## The Science Behind Expression
### Master Specification & Research Phase

あなたは、科学教育、物理シミュレーション、
インタラクティブデザイン、CG/VFX、映像演出、
WebGL技術に精通した
Principal Creative Technologist 兼 Scientific Designerです。

以下の新しい学習プロジェクトを設計してください。

## 1. PROJECT VISION

WORLD-TO-EXPRESSION、12 PRINCIPLES OF ANIMATION
に続く、新しいインタラクティブ学習シリーズを構築する。

目的は自然現象・物理現象の基本原理を、
実際に触って変化させることで理解し、
最終的にCG、3D、アニメーション、映像制作、
生成AI映像の表現力へと接続すること。

単なる科学解説サイトではない。

「操作する → 現象が起きる → 原因がわかる
→ ルールを発見する → 表現に応用する」

という学習体験をつくる。

## 2. TARGET USERS

- 3D CGアーティスト
- アニメーション制作者
- 映像クリエイター
- VFXアーティスト
- Unreal Engineユーザー
- 生成AI映像制作者
- 自然現象や物理に興味がある人

専門的な数式を学ぶこと自体を目的にしない。
しかし科学的な正確性は妥協しない。

## 3. SERIES DOMAINS

以下の領域を横断的に設計する。

A. EARTH
地質、プレートテクトニクス、地形形成、
侵食、堆積、断層、火山。

B. ATMOSPHERE
大気、水蒸気、雲の形成、凝結、
気圧、温度、風、乱流、霧。

C. LIGHT
光の伝播、反射、屈折、散乱、吸収、
影、色温度、間接光。

D. SOUND
振動、周波数、波長、振幅、共鳴、
干渉、音の伝播、減衰。

E. FLUID & MATTER
流体、粘性、表面張力、密度、渦、
蒸発、凝固、蒸気、煙。

各領域について、さらに学習価値の高い
テーマを調査・提案すること。

## 4. INTERACTION PRINCIPLE

各教材は、以下の構造を持つ。

01 DISCOVER
現象を視覚的に発見する。

02 MANIPULATE
ユーザーが直接操作する。
ドラッグ、スライダー、クリックなど。

03 OBSERVE
変化をリアルタイムで観察する。

04 UNDERSTAND
何が原因で変化したかを理解する。
必要な数式や物理法則も示す。

05 COMPARE
パラメータの違いによる結果を比較する。
同じ初期条件からの比較を可能にする。

06 EXPRESSION
CG、3D、アニメーション、映像制作に
どう応用できるかを示す。

## 5. SCIENTIFIC REQUIREMENTS

最重要事項。

すべてのシミュレーションについて、

- 実際の自然現象の仕組み
- 使用する物理法則
- 数学モデル
- 初期条件
- 入力パラメータ
- 出力される現象
- モデルの適用範囲
- 簡略化している部分
- 現実との違い

を明記すること。

科学的な厳密シミュレーション、
教育用の近似モデル、
視覚的な概念モデルを区別する。

視覚的にそれらしく見えるだけの
疑似物理を科学的事実として説明しない。

## 6. TECHNICAL DIRECTION

Webブラウザで動作するインタラクティブ教材を基本とする。

検討対象：

- HTML / CSS / JavaScript
- Canvas 2D
- SVG
- WebGL / Three.js
- GPUによる計算
- Web Audio API
- 必要に応じてWebGPU

すべての教材を3Dにする必要はない。

2Dのグラフィカルなシミュレーションで
原理を最もわかりやすく説明できるなら、
積極的に2Dを採用する。

計算負荷、ブラウザ互換性、
実装難易度、教育効果を比較すること。

## 7. DESIGN DIRECTION

既存の一般的な教育サイトや
管理画面のようなUIにはしない。

科学実験室、デジタルアート、
インタラクティブな展覧会の融合。

- 強いビジュアル
- 大きな現象の可視化
- 操作による劇的な変化
- グラフィカルな数値表示
- 適切な余白とタイポグラフィ
- スクロールによる発見
- 操作と説明が自然につながる構成

操作する前から触ってみたくなること。

## 8. EXPRESSION BRIDGE

各現象について、必ず制作への応用を設計する。

例：

地形形成 → UE Landscape / Heightmap
雲の形成 → Volumetric Cloud / VFX
光の散乱 → Lighting / Rendering
音の振動 → Motion Graphics / VJ
流体 → Fluid Simulation / Houdini

さらに生成AI映像において、
プロンプトや映像演出の判断に
どのような知識が役立つかも示す。

## 9. REQUIRED DELIVERABLES

まず次の設計書をMarkdownで作成する。

01_PROJECT_VISION.md
プロジェクトの目的、思想、学習設計。

02_SERIES_ARCHITECTURE.md
全シリーズの構成、テーマ、学習順序。

03_SCIENTIFIC_KNOWLEDGE_MAP.md
各領域の物理法則、現象、相互関係。

04_INTERACTION_GRAMMAR.md
操作、入力、反応、可視化の共通設計。

05_SIMULATION_SPECIFICATIONS.md
最初に実装すべき教材10個の詳細仕様。

06_VISUAL_DESIGN_SYSTEM.md
UI、タイポグラフィ、色、アニメーション、
ビジュアル表現の方向性。

07_TECHNICAL_ARCHITECTURE.md
技術選定、実装方式、共通コンポーネント、
パフォーマンス設計。

08_EXPRESSION_BRIDGE.md
各現象とCG・映像・生成AI表現の接続。

09_VALIDATION_PLAN.md
科学的正確性、数理検証、操作性、
視覚的理解、ブラウザ動作の検証方法。

10_IMPLEMENTATION_ROADMAP.md
開発フェーズ、優先順位、依存関係、
最初のプロトタイプ計画。

## 10. FIRST PROTOTYPE

最初の試作候補として次の3つを比較する。

A. TECTONIC COLLISION
2Dプレート衝突と地形隆起。

B. CLOUD FORMATION
温度・湿度・上昇気流による雲の形成。

C. LIGHT & SOUND
光学現象とソニフィケーション。

教育効果、視覚的魅力、科学的な理解、
実装難易度、制作への応用性から評価する。

最も価値の高いものを最初のプロトタイプに選ぶ。

## 11. WORKING RULES

今回は仕様設計・調査フェーズ。

いきなり大量のコードを書かない。

既存プロジェクトの構造や思想を
勝手に変更する前提にしない。

不明な科学的事項は調査し、
信頼できる資料を参照する。

事実、仮説、設計上の近似を区別する。

設計の矛盾や実現困難な点は、
遠慮なく指摘して改善案を出す。

成果物は実装担当のClaude Code / Codexが
そのまま引き継げる具体的な仕様にする。

まず全体構想と設計書を完成させ、
その後に最初のプロトタイプへ進む。

```

## 仕様設計で追加しておきたい重要なこと

私なら、もう一つだけ強く要求します。

「操作した結果を保存して、比較・再現できること」

例えば、

- 同じ地形生成条件を再現する
- 雲の形成条件AとBを並べる
- 光の角度を変えた結果を比較する
- パラメータをプリセットとして保存する
- 自分で発見した現象を画像やデータとして書き出す

これがあると、単なる学習教材ではなく、制作に使える実験環境になります。

## 最初に完成させたいもの



私の推奨

&#x20;TECTONIC COLLISION



[Mountain Volcanic Formation — Free Printable Diagram for Teachers | Kuraplan](https://images.openai.com/static-rsc-4/UfTO0p0f0etCjFjdYuHi6jE29L-AG7obr-XNGQrodMlDgk919mrjfN_GZd43N8HmkucN6JbNRMar9gOw5JdjhQUcTnmB713hRYx-Fg_H8VijOEMMW-4N0roUo4TQVd6fbzpdYfqE0c1I1q_EBPz_zW5I9gC1pYFWXheXSyThFxw?purpose=inline)

[ConceptViz | AI-Powered Science Diagrams for Teachers & Scientists](https://images.openai.com/static-rsc-4/vYQfkDTsgRQGyzJXhCggvEMjrecOcOYcAulvDn0nrnbwGZl6ZI_E5xAsTVWtiiCIyqv_7Xg0pSw2gCzZ3eaux3JNeie_7iyQK4OA6PE7AAnMxwT1L-wlCDDzdrzwZenrwDP9VdRaMXpgEcHjXtcwY1iyb94pF7jvRRTfVUjiBy4?purpose=inline)

[Types of Mountains | Fold Mountains, Volcanic Mountains, etc.](https://images.openai.com/static-rsc-4/Dp-0O6Ghjsh5VJZZPXClxK6dUsYCN0iXgY6hr11Djx-Pe1RVlqdA9ewITbas7oVF4Go_Z1FkFZuOEVsCyoKdGHxlj2Ajr7S5_VrgEaFWda5Khu1qqp0EcZ_Ff97tgplO71yskrq0lBlJivy1YR-K0T1T0FZFG-YAwLxb7VnxIIY?purpose=inline)

10

最初の題材として地形形成を推します。

理由は、プレートを動かすという直感的な操作から、圧縮・隆起・褶曲・沈み込みという因果関係が目で見えるからです。

2Dで仕組みを理解し、その後に3D地形へ変換してUnreal Engineで眺める。この展開はとても強いです。

そして、雲、煙、光、液体へ進めば、最終的にはCG・VFXの表現に必要な自然現象の基礎を一通り扱えるようになります。

目指したいのは「自然現象を知っているクリエイター」ではなく、「自然現象がなぜそう見えるのかを理解して、自分の表現に利用できるクリエイター」を育てるラボです。

まずはFableに上のMaster Design Briefを渡して、10本の教材の仕様設計まで出してもらうのがよいと思います。