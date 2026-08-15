秋草の日本語学校 V008 — Netlify Dropアップロード用
Build date: 2026-08-15
Source commit: 27ef9d13d5cad1973d10ad23d5bda6b3bbde85ac

重要:
- V007のZIPは使わず、このV008をアップロードしてください。
- このZIPを https://app.netlify.com/drop へそのままアップロードします。
- index.htmlはZIP直下です。dist/や二重フォルダへ入れ直さないでください。

アップロード互換性:
- 配布ZIP全体: 55ファイル（100以下）
- 公開アプリ本体: 53ファイル
- assets/: 39ファイル
- stroke-order/: 3ファイル
- 非ASCIIファイル名: 0
- 日本語名ファイル: 0

筆順修正:
- 旧版の日本語名SVG 160ファイルを廃止。
- ひらがな46字を stroke-order/hiragana.json へ集約。
- カタカナ46字を stroke-order/katakana.json へ集約。
- 一画再生、前後移動、なぞりガイドは維持。

ZIP直下の主な内容:
- index.html
- assets/
- learning.json
- content-library.json
- scenic.json
- stroke-order/
- sw.js
- manifest.webmanifest
- _headers

検証:
- Netlify静的生成 合格
- 全体100ファイル以下 合格
- 全パスASCII 合格
- 基本かな92字 欠落0
- 自動テスト5/5合格
- index.html直下／distラッパーなし
