# try-repo-template

TypeScript / pnpm workspaces を使ったモノレポテンプレートです。

## 構成

```
.
├── frontend/   # フロントエンド
├── backend/    # バックエンド
├── shared/     # frontend / backend が共通で参照するコード
```

`shared` は pnpm workspace パッケージとして `frontend` / `backend` から
`workspace:*` 依存として参照されます（`shared` という import 名で利用可能）。

## ツールチェイン

- **バージョン管理**: [mise](https://mise.jdx.dev/)（`.mise.toml` に Node / pnpm のバージョンを固定）
- **パッケージマネージャ**: pnpm workspaces
- **モジュール形式**: ES Modules（各 `package.json` に `"type": "module"`、TS は `NodeNext`）
- **Lint / Format**: [Biome](https://biomejs.dev/)
- **テスト**: [Vitest](https://vitest.dev/)
- **型チェック**: TypeScript（Project References による増分ビルド）
- **CI**: 型チェック + テスト（`.github/workflows/ci.yml`）
- **セキュリティ**: CodeQL 解析、Dependency Review（いずれもパブリックリポジトリで無料利用可）、
  依存パッケージの install script 無効化、pnpm cooldown（後述）

## セットアップ

```sh
mise install          # Node / pnpm をバージョン固定でインストール
pnpm install           # 依存関係をインストール（install script は無効化済み）
pnpm run setup-hooks    # pre-commit フックを有効化（git config core.hooksPath .githooks）
```

### install script について

`.npmrc` で `ignore-scripts=true` を設定し、依存パッケージのライフサイクルスクリプト
（`postinstall` など）を実行しないようにしています。ビルドスクリプトの実行が
必要なパッケージがある場合は、無効化を解除する代わりに `pnpm-workspace.yaml` の
[`allowBuilds`](https://pnpm.io/settings#allowbuilds) でパッケージ単位に許可してください。

```yaml
allowBuilds:
  esbuild: false      # 明示的に拒否（デフォルト）
  some-native-pkg: true  # 個別に許可する場合
```

`pnpm install` 時にビルドスクリプトを要求する新しい依存が追加されると
`ERR_PNPM_IGNORED_BUILDS` で止まるので、内容を確認したうえで
`allowBuilds` に `true`/`false` を明示してください（`pnpm approve-builds` でも追加できます）。

### 依存の cooldown（供給網対策）

`.npmrc` の `minimum-release-age=1440` により、公開されてから 24 時間
（1440 分）未満のバージョンはインストールされません。公開直後に混入した
悪意あるバージョンを踏むリスクを下げるための設定です。必要に応じて分単位で
延長・短縮できます。

自分たちのスコープ付きパッケージなど、公開直後でも即座に取得したいものは
`.npmrc` ではなく `pnpm-workspace.yaml` の `minimumReleaseAgeExclude` に
書く必要があります（`.npmrc` では効きません）。

## よく使うコマンド

| コマンド | 内容 |
| --- | --- |
| `pnpm run typecheck` | `tsc -b` で全ワークスペースを型チェック |
| `pnpm run test` | Vitest でテスト実行 |
| `pnpm run lint` | Biome で lint / format チェック |
| `pnpm run lint:fix` | Biome で自動修正 |
| `pnpm run build` | `tsc -b` でビルド |

## Git hooks

`.githooks/pre-commit` はステージされた変更に対して `biome check --staged` を実行します。
クローン後に一度だけ `pnpm run setup-hooks`（または `mise run setup-hooks`）を実行してください。
install script 経由の自動セットアップ（husky の `prepare` script 等）は
`ignore-scripts=true` の方針とバッティングするため、意図的に手動セットアップにしています。

## モジュール解決の注意

TypeScript は `moduleResolution: "bundler"` を使用しているため、相対 import に
拡張子を付ける必要はありません（`import { foo } from "./foo"` のように書けます）。

ただし `tsc -b` は型チェック用の import 指定をそのまま出力に転写するだけなので、
`dist/` 配下のコンパイル済み JS を素の `node` で直接実行すると、Node の ESM ローダーは
拡張子なしの相対 import を解決できずエラーになります。現状このテンプレートには
`tsc -b` による型チェック/宣言ファイル生成しかなく、コンパイル済み JS を直接実行する
ステップは含まれていません。将来サーバーの起動コマンドなどを追加する場合は、
`tsx` や esbuild/rollup などバンドラー系のランタイムで実行してください
（それらは拡張子なしの相対 import を解決できます）。
