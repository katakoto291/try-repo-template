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
- **パッケージマネージャ**: pnpm workspaces（pnpm 固有の設定は `.npmrc` ではなく
  `pnpm-workspace.yaml` に一本化。理由は後述）
- **モジュール形式**: ES Modules（各 `package.json` に `"type": "module"`）
- **Lint / Format**: [Biome](https://biomejs.dev/)
- **Git hooks**: [lefthook](https://lefthook.dev/)
- **テスト**: [Vitest](https://vitest.dev/)
- **型チェック**: TypeScript（Project References による増分ビルド）
- **CI**: 型チェック + テスト（`.github/workflows/ci.yml`）
- **セキュリティ**: CodeQL 解析、Dependency Review（いずれもパブリックリポジトリで無料利用可）、
  依存パッケージの install script 無効化、pnpm cooldown（後述）

## セットアップ

```sh
mise install          # Node / pnpm をバージョン固定でインストール
pnpm install           # 依存関係をインストール（install script は無効化済み）
pnpm run setup-hooks    # lefthook の git hooks を有効化（lefthook install）
```

### なぜ `.npmrc` ではなく `pnpm-workspace.yaml` なのか

pnpm 11 で実際に検証した結果、`.npmrc` の `ignore-scripts=true`（npm 由来の
kebab-case キー）は **依存パッケージの build script には効くものの、
ルートパッケージ自身の `postinstall`/`prepare` スクリプトには効きません**
でした。同じ設定を `pnpm-workspace.yaml` に `ignoreScripts: true`（camelCase）
として書くと、ルート自身のスクリプトも含めて確実にブロックされることを確認済みです。
`minimumReleaseAge` や `engineStrict` も同様に `pnpm-workspace.yaml`側でのみ
確実に機能したため、pnpm 固有の設定はすべてこちらに寄せています。

### install script について

`pnpm-workspace.yaml` で `ignoreScripts: true` を設定し、依存パッケージのライフ
サイクルスクリプト（`postinstall` など）やルートパッケージ自身のスクリプトを
実行しないようにしています。ビルドスクリプトの実行が必要なパッケージがある場合は、
無効化を解除する代わりに同じファイルの
[`allowBuilds`](https://pnpm.io/settings#allowbuilds) でパッケージ単位に許可してください。

```yaml
allowBuilds:
  esbuild: false      # 明示的に拒否（デフォルト）
  lefthook: false     # 拒否しても postinstall が自動実行する `lefthook install` を手動で行うだけ
  some-native-pkg: true  # 個別に許可する場合
```

`pnpm install` 時にビルドスクリプトを要求する新しい依存が追加されると
`ERR_PNPM_IGNORED_BUILDS` で止まるので、内容を確認したうえで
`allowBuilds` に `true`/`false` を明示してください（`pnpm approve-builds` でも追加できます）。

### 依存の cooldown（供給網対策）

`pnpm-workspace.yaml` の `minimumReleaseAge: 4320` により、公開されてから
72 時間（3 日 / 4320 分）未満のバージョンはインストールされません。公開直後に
混入した悪意あるバージョンを踏むリスクを下げるための設定です。必要に応じて
分単位で延長・短縮できます。

同じファイルの `minimumReleaseAgeStrict: true` も重要です。これがないと
`pnpm add <pkg>@<公開直後のバージョン>` のように明示的に指定した場合は
cooldown をすり抜けて `minimumReleaseAgeExclude` に自動追加されてしまうため、
strict モードで明示指定でも必ずエラーで止まるようにしています
（実際に公開 1 日以内のバージョンを指定してエラーになることを確認済み）。

自分たちのスコープ付きパッケージなど、公開直後でも即座に取得したいものは
`pnpm-workspace.yaml` の `minimumReleaseAgeExclude` に書いてください。

## よく使うコマンド

| コマンド | 内容 |
| --- | --- |
| `pnpm run typecheck` | `tsc -b` で全ワークスペースを型チェック |
| `pnpm run test` | Vitest でテスト実行 |
| `pnpm run check` | Biome で lint / format チェック |
| `pnpm run check:fix` | Biome で自動修正 |
| `pnpm run build` | `tsc -b` でビルド |

## Git hooks

[lefthook](https://lefthook.dev/) を使用しています。設定は `lefthook.yml` で、
pre-commit フックがステージされた変更に対して `biome check --staged` を実行します。

クローン後に一度だけ `pnpm run setup-hooks`（内部で `lefthook install` を実行、
`mise run setup-hooks` でも可）を実行してください。lefthook 自身の postinstall
スクリプトは `lefthook install` を自動実行するものですが、`ignoreScripts: true`
の方針と合わせるため意図的に無効化し、手動セットアップにしています。

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
