秋草の日本語学校 V011 — GitHub Pages完全上書き用
Build date: 2026-08-15
Source commit: d01f4d888ccd156a8cd11da30b099d8cbcf35722

V011の重要修正:
- 公開版V010で、最初の約0.5秒だけ画面が見えた後、肌色の背景だけになる現象を実サイトで再現しました。
- 起動後に遅延読込されるCSSが、リポジトリ配下ではなくドメイン直下を参照していたことが原因です。
- V011では遅延CSSを必ず現在のリポジトリ配下から相対読込します。
- Box Radio Jazzを含む7局、教材、写真、かな筆順、イラストなどV010の全内容を維持しています。

上書き方法:
1. このZIPを展開します。
2. 中にある55ファイルをすべて選択します。
3. GitHubの aki_japanese-school リポジトリの main ブランチ直下へアップロードします。
4. 同名ファイルの置換確認が出た場合は、すべて上書きします。
5. ZIP名や展開フォルダをリポジトリへ入れず、55ファイルそのものをルートへ置きます。
6. GitHub PagesのSourceは main / (root) のままにします。

上書き互換性:
- V010公開本体53ファイルとV011公開本体53ファイルは、ファイル名が完全一致します。
- V011は差分ファイルではなく、アプリ全体を置き換える完全セットです。
- サブフォルダは0、ファイル総数は55で、1回100ファイル以内です。

公開後の確認URL:
https://takina888.github.io/aki_japanese-school/?v=V011

検証結果:
- 公開アプリ本体: 53ファイル
- README・ハッシュ込み: 55ファイル
- V010との公開ファイル名差分: 0
- サブフォルダ: 0
- 非ASCIIファイル名: 0
- ルート絶対参照: 0
- 遅延CSSの相対参照: 確認済み
- 自動テスト: 6/6合格
- 本番ビルド・教材検査: 合格

主なファイル:
- index.html
- index-*.css / page-*.css
- index-*.js / page-*.js / framework-*.js
- 画像36点
- learning.json / content-library.json / scenic.json
- stroke-order-hiragana.json / stroke-order-katakana.json
- sw.js / manifest.webmanifest / .nojekyll
