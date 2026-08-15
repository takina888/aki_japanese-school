秋草の日本語学校 V010 — GitHub Pagesアップロード用
Build date: 2026-08-15
Source commit: 0a64078cdae7b177db65b6a20d58f758e23c7a4e

V010の内容:
- V009で修正したGitHub Pages用の相対パス、平坦配置、キャッシュ更新、CSS・画像・JavaScript読込対策をすべて収録しています。
- ラジオへ「Box Radio Jazz」を1局だけ追加し、合計7局にしました。
- assets/ と stroke-order/ のフォルダはありません。公開ファイルはすべて同じ階層です。
- 花・犬猫の写真は、静的GitHub PagesからWikimedia Commonsへ直接接続して1日5枚を取得します。

アップロード手順:
1. このZIPを展開します。
2. 展開後の親フォルダではなく、中にある55ファイルをすべて選びます。
3. GitHubの aki_japanese-school リポジトリの main ブランチ直下へ、55ファイルを一度にアップロードします。
4. 同名の旧ファイルは上書きします。旧版だけに存在する不要ファイルがあれば削除します。
5. GitHub PagesのSourceは main / (root) のままにします。
6. 公開完了後、次のURLを最初に開きます。
   https://takina888.github.io/aki_japanese-school/?v=V010

重要:
- フォルダは1つもありません。assetsやstroke-orderを別操作でアップロードする必要はありません。
- 55ファイルなので、GitHub Webの1回100ファイル制限内です。
- index.htmlだけをアップロードしないでください。55ファイル全部を同じ場所へ置きます。
- github-pages-upload、dist、V010などの親フォルダはリポジトリへ作らないでください。

検証結果:
- 公開アプリ本体: 53ファイル
- README・ハッシュ込み: 55ファイル
- サブフォルダ: 0
- 非ASCIIファイル名: 0
- 日本語名ファイル: 0
- ひらがな46字＋カタカナ46字: 92字、欠落0
- CSS・JavaScript・画像・JSONの相対参照: 欠落0
- ラジオ: 7局、Box Radio Jazz収録
- 自動テスト: 6/6合格

主なファイル:
- index.html
- index-*.css / page-*.css
- index-*.js / page-*.js / framework-*.js
- 画像36点
- learning.json / content-library.json / scenic.json
- stroke-order-hiragana.json / stroke-order-katakana.json
- sw.js / manifest.webmanifest / .nojekyll
