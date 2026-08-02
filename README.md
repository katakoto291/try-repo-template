# try-repo-template (C# 試作版)

`try-repo-template` の TypeScript/pnpm 版と同等の設定を .NET / C# で
試作したブランチ（`try/csharp-template`）です。目的は実装そのものより、
「テンプレートのどの部分が言語非依存で、どの部分が言語エコシステム固有か」を
実際に手を動かして確かめることです。詳しい経緯・比較結果は
[`docs/adr/0002-use-asp-net-core-web-api-and-xunit-for-the-c-equivalent-template.md`](docs/adr/0002-use-asp-net-core-web-api-and-xunit-for-the-c-equivalent-template.md)
を参照してください。

## 構成

.NET のソリューション（`TryRepoTemplate.sln`）です。

```
.
├── backend/         # ASP.NET Core Web API
├── backend.tests/   # backend の xUnit テスト（別プロジェクト）
├── shared/          # backend が参照する共有ライブラリ
├── shared.tests/    # shared の xUnit テスト（別プロジェクト）
```

TypeScript 版の `frontend`（React）に直接対応するものはありません。C# 単体
では UI 層の定番構成が定まらないため、今回はバックエンド寄りの構成に留めて
います（Blazor などを使う場合は別途追加が必要です）。

### プロジェクト境界

- `shared` → `backend`: 参照不可
- `backend`/`*.tests` → `shared`: OK（`ProjectReference` 経由）

TypeScript 版はこの制約を `biome.json` の `noRestrictedImports` で lint
エラーとして強制していましたが、C# では同等の lint ルールが不要でした。
`ProjectReference` を張っていないプロジェクトの型は最初から参照できず、
境界違反はコンパイルエラー（`CS0246`）になります（実際に `shared` から
`backend` の型を参照するコードを書いて確認済み）。

## ツールチェイン

- **バージョン管理**: .NET SDK は `global.json`（`rollForward: disable` で
  完全固定）。TypeScript 版の `mise.toml` に相当します。
- **依存関係**: NuGet + Central Package Management
  （`Directory.Packages.props` に `ManagePackageVersionsCentrally: true`）。
  バージョンはこの1ファイルに集約し、各 `.csproj` の `PackageReference` には
  バージョンを書きません。pnpm の `saveExact`/workspace 設定の集約に相当します。
- **Lint / Format**: [`dotnet format`](https://learn.microsoft.com/dotnet/core/tools/dotnet-format)
  （追加パッケージ不要、`.editorconfig` でルールを明示）。Biome に相当します。
- **テスト**: [xUnit](https://xunit.net/)。TypeScript 版と異なり、テストは
  対象と同一ディレクトリではなく別プロジェクト（`backend.tests`/
  `shared.tests`）に置きます。C# では実行アセンブリにテストフレームワークを
  混ぜられないためです。
- **Git hooks**: [lefthook](https://lefthook.dev/)（TypeScript 版と同じツール
  をそのまま利用可能）。
- **CI**: バージョン固定チェック + フォーマットチェック + ビルド + テスト
  （`.github/workflows/ci.yml`）。
- **セキュリティ**: CodeQL 解析（C# はコンパイル言語のため `autobuild`
  ステップが追加で必要）、Dependency Review、依存バージョンの完全固定、
  GitHub Actions のコミットハッシュ固定 + Dependabot（`nuget` エコシステム）。

## セットアップ

```sh
dotnet restore
dotnet build
```

lefthook を使う場合はリポジトリルートで一度だけ:

```sh
lefthook install
```

## よく使うコマンド

| コマンド | 内容 |
| --- | --- |
| `dotnet build` | ビルド（コンパイルエラー = 型チェック） |
| `dotnet test` | xUnit でテスト実行 |
| `dotnet format --verify-no-changes` | フォーマット/コーディングスタイルのチェック |
| `dotnet format` | 自動修正 |
| `sh scripts/check-exact-versions.sh` | NuGet パッケージのバージョンが完全固定かチェック |
| `sh scripts/new-adr.sh "タイトル"` | 新しい ADR（`docs/adr/`）を雛形から生成 |

## GitHub の「テンプレートリポジトリ」として使う場合

TypeScript 版と同じく `pnpm run setup-repo-settings`（実体は
`scripts/apply-repo-settings.sh`）がそのまま使えます。このスクリプトと
`.github/repo-settings.json`・`.github/branch-protection.json`・
`.github/CODEOWNERS` は言語に依存しないため、C# 版でも無改造で流用しました
（`branch-protection.json` の必須ステータスチェック名 `test` を CI 側の
ジョブ ID と揃えているため）。

## 依存バージョンの完全固定

すべての NuGet パッケージのバージョンは `Directory.Packages.props` に
完全固定（レンジ指定 `[1.0.0,2.0.0)` やワイルドカード `1.0.*` を使わない）
で書きます。`scripts/check-exact-versions.sh` が `.props`/`.csproj` 内の
`Version="..."` を走査し、レンジ/ワイルドカードがあればエラーにします
（CI と lefthook の両方から呼ばれます）。

**TypeScript 版との違い**: pnpm には `pnpm-workspace.yaml` の
`minimumReleaseAge`（cooldown）という、公開直後のバージョンのインストール
自体をブロックする機構がありましたが、NuGet には直接の相当機能がありません。
Dependabot 側の `cooldown.default-days`（`.github/dependabot.yml`）で
自動更新 PR の作成を遅らせることはできますが、`dotnet add package` で
公開直後のバージョンを手動指定した場合は防げません。これは TypeScript 版に
対する明確な劣化点です。

## GitHub Actions のバージョン固定

TypeScript 版と同じ方針で、`.github/workflows/*.yml` の `uses:` はすべて
コミットハッシュで固定しています（`actions/setup-dotnet@a98b568... # v6.0.0`
など）。

## CodeQL / Dependency Review の利用可否チェック

チェック方法は TypeScript 版と同じ（`check-eligibility` ジョブでパブリック
リポジトリかどうかだけ判定）ですが、C# はコンパイル言語のため CodeQL の
`analyze` ステップの前に `github/codeql-action/autobuild` が追加で必要です
（JavaScript/TypeScript では不要でした）。Dependency Review は GitHub の
Dependency graph が NuGet の manifest（`.csproj`/`Directory.Packages.props`）
も解析するため、ワークフロー自体は無改造で動作します。

## ADR（Architecture Decision Record）

PR やレビューで議論して決まった設計判断は `docs/adr/` に記録します。
書き方・運用ルールは最初の ADR
（[`docs/adr/0001-record-architecture-decisions.md`](docs/adr/0001-record-architecture-decisions.md)）
に、この C# 試作版で分かったことは
[`docs/adr/0002-*.md`](docs/adr/0002-use-asp-net-core-web-api-and-xunit-for-the-c-equivalent-template.md)
に書いてあります。

新しい ADR を作るには:

```sh
sh scripts/new-adr.sh "タイトル"
```

TypeScript 版では `pnpm run new-adr -- "タイトル"` という pnpm ラッパー
経由でしたが、`scripts/new-adr.sh` 自体はただの POSIX shell スクリプトで
言語非依存だったため、C# 版では直接呼び出す形にしました。

## Git hooks

[lefthook](https://lefthook.dev/) を使用しています。設定は `lefthook.yml`
で、pre-commit フックが `dotnet format --verify-no-changes` と
`sh scripts/check-exact-versions.sh` を実行します。

**TypeScript 版との違い**: Biome の `--staged` フラグはステージされた
ファイルだけを対象にできましたが、`dotnet format` にはステージ済みファイル
だけを対象にする仕組みが無く、ソリューション全体を毎回チェックします。

**未解決の課題**: TypeScript 版では lefthook 自体を pnpm 経由
（`node_modules/.bin/lefthook`）でインストールしていました。この C# 版には
npm 相当のローカルインストール手段が無いため、lefthook 本体は各自
[公式の別インストール方法](https://lefthook.dev/installation/)（Homebrew /
Go install / 単体バイナリなど）で用意する必要があります。この試作では未検証
です。

## この試作で分かったこと（共通 vs エコシステム固有）

**ほぼ無改造で流用できた（= 言語非依存の「共通部分」）**:

- `.github/PULL_REQUEST_TEMPLATE.md`（チェックリストのコマンド名だけ更新）
- `.github/CODEOWNERS`
- `.github/branch-protection.json`（CI のジョブ ID を揃えれば無変更）
- `.github/repo-settings.json` / `scripts/apply-repo-settings.sh`
- `.github/workflows/dependency-review.yml`
- ADR の仕組み一式（`docs/adr/`、`scripts/new-adr.sh`、
  `.claude/skills/adr/SKILL.md`）

**エコシステム固有で書き直しが必要だった**:

- パッケージ管理・バージョン固定の仕組み（pnpm workspaces → NuGet CPM）
- lint/format ツール（Biome → dotnet format）
- テストの配置規約（同一ディレクトリ co-locate → 別テストプロジェクト）
- import/参照境界の強制方法（lint ルール → コンパイラ・ProジェクトReference）
- CI のインストール/ビルド/テストコマンド
- Dependabot のエコシステム指定とグルーピング
- `.gitignore`（`node_modules`/`dist` → `bin/`/`obj/`）

詳しい理由・トレードオフは ADR 0002 を参照してください。
