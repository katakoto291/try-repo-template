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
- **セキュリティ**: CodeQL 解析、Dependency Review（いずれもパブリックリポジトリで無料利用可）

## セットアップ

```sh
mise install          # Node / pnpm をバージョン固定でインストール
pnpm install           # 依存関係をインストール（install script は無効化済み）
pnpm run setup-hooks    # pre-commit フックを有効化（git config core.hooksPath .githooks）
```

### install script について

`.npmrc` で `ignore-scripts=true` を設定し、依存パッケージのライフサイクルスクリプト
（`postinstall` など）を実行しないようにしています。ビルドスクリプトの実行が
必要なパッケージがある場合は、無効化を解除する代わりに pnpm の
[`pnpm.onlyBuiltDependencies`](https://pnpm.io/settings#onlybuiltdependencies)
でパッケージ単位に許可リストを追加してください。

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

TypeScript の `moduleResolution: "NodeNext"` を使用しているため、
同一パッケージ内の相対 import には拡張子 `.js` を明示する必要があります
（例: `import { foo } from "./foo.js"`、ソースは `foo.ts` のままで問題ありません）。
