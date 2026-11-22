# CHSOS Pigments Checker — 反射スペクトル（実測）

- 出どころ：Cultural Heritage Science Open Source（CHSOS）が無料で配布している
  「Reflectance Spectroscopy (350-950 nm) (Gorgias) Pigments-Checker」データ（https://chsopensource.org/fors/ → Download all FORS Spectra in a ZIP file）。
  2026-11-22 にユーザーの了承を得てダウンロード。
- 中身：顔料＋アクリルを厚紙に塗った 85 種の反射率。`spectra/*.txt` は「波長 nm　反射率 %」の 2 列（290〜1012 nm）。
- 元の ZIP：`chsos_pigments_checker_acrylic.zip`（展開したものが `spectra/`）。
- 使い方：`node wave/_tools/fit_measured.cjs` がここを読み、ニッカーの 12 色を組んで `_law/ph_pigment.js` の MEASURED を書き直す。
- 注意：全体に反射率が低め（チタン白が 80%）。fit_measured.cjs で全部に同じ倍率（1.14）を掛けて白をそろえている。
  濃い有機顔料（フタロブルー・フタログリーン）の原液は 2〜7% に張り付いていて形が読みにくい。
