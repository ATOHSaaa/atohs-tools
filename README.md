# atohs-tools

ブラウザ完結の小さな Web ツール集（ポータル）。公開想定: [tools.atohs.me](https://tools.atohs.me/)

## ローカルで見る

静的ファイルのため、任意の HTTP サーバーでルートを配信してください（`/assets/...` の絶対パスを使っています）。

```sh
cd /path/to/atohs-tools
python3 -m http.server 8080
```

ブラウザで `http://localhost:8080/` を開きます。

## GitHub Pages

1. リポジトリ `atohs/atohs-tools` を GitHub に作成し、`main` を push
2. **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: `main` / **`/ (root)`**
3. カスタムドメイン: **Settings → Pages → Custom domain** に `tools.atohs.me` を設定（リポジトリ直下の `CNAME` と整合）
4. DNS（例）: `tools` の CNAME を `<user>.github.io` へ向ける

## 構成

```
index.html      … トップ
tools/font-simulator/ … Google Fonts プレビュー（ウェイト・行間・字間など）
tools/shakai-futekigo/ … 社会不適合タイプ診断（16問・8タイプ）
about.html      … サイト説明
privacy.html    … プライバシー
404.html        … GitHub Pages 用
assets/css/     … 共通スタイル
assets/js/      … テーマ切替など
```

## ツールを足すとき

1. 例: `tools/text-tidy/index.html` を追加
2. トップの `tool-grid` にリンク付きカードを追加（`badge` を外す）
3. そのツールページで「データの保存先」「外部通信の有無」を明記