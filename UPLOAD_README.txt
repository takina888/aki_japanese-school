秋草の日本語学校 V014 — GitHub Pages完全上書き用
Build date: 2026-08-15
Source base commit: fce4ced50b7b2dd96d46f65ce2fb5b845da464c5
Source snapshot manifest SHA-256: 1f3b896ae60789545663dbe677b2f970cf8ef4d65678732b291c4ae558b697dc

このZIPは差分ではなく、GitHub Pages公開物の完全セットです。
既存の公開リポジトリへ、中身をすべて完全上書きしてください。

アップロード方法
1. このZIPを展開します。
2. 展開後に見える66ファイルをすべて選択します。
3. GitHubの aki_japanese-school リポジトリの main ブランチ直下へアップロードします。
4. 同名ファイルの置換確認が出たら、すべて上書きします。
5. ZIPや展開フォルダそのものは入れず、66ファイルそのものをリポジトリのルートへ置きます。
6. GitHub PagesのSourceは main / (root) のままにします。

古いハッシュ付きJS/CSSが残ってもV014からは参照されません。整理したい場合だけ、旧版の
index-*.js、page-*.js、index-*.css、page-*.css等を削除してから、この完全セットを入れてください。

V014の主な更新
- STEP 0を190件・19カテゴリへ拡張し、色、数量、1〜10、方向・場所を追加。
- 生活漢字300件・15カテゴリを、かな、Romaji、VI語義・補足付きで追加。
- 現地時刻に合う挨拶、土日の言葉、50件の生活ヒントを追加。
- 任意操作の現在地天気に、現在・今日・明日のJA＋VI＋繁中表示を追加。位置情報は保存しません。
- 主要な学習・進捗・風景・ラジオ操作のVI補助とスマートフォン配置を改善。
- release情報、復旧ページ、Service Worker akigusa-school-v20で旧キャッシュからの更新を強化。

検証結果
- 公開アプリ本体: 64ファイル
- README・SHA一覧込み: 66/100ファイル
- サブフォルダ: 0
- 非ASCIIファイル名: 0
- シンボリックリンク: 0
- 自動テスト: 41/41合格
- ESLint: エラー0、警告30
- 教材内容検査・本番ビルド・静的公開変換・内部SHA・ZIP CRC: 合格

主なファイル
- index.html / index-*.css / page-*.css / index-*.js / page-*.js / framework-*.js
- quick-words.json / life-kanji.json / life-advice.json
- learning.json / content-library.json / scenic.json / praise.json
- stroke-order-hiragana.json / stroke-order-katakana.json / stroke-order-license.txt
- release.json / reset.html / sw.js / manifest.webmanifest / .nojekyll
- UPLOAD_README.txt / SHA256SUMS.txt

公開後の確認URL
https://takina888.github.io/aki_japanese-school/?v=V014
