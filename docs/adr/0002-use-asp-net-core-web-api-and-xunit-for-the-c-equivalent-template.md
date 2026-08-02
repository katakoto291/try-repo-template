# 0002. Use ASP.NET Core Web API and xUnit for the C# equivalent template

Date: 2026-08-02

## Status

Proposed

<!--
  Proposed / Accepted / Rejected / Deprecated / Superseded by ADR-XXXX
  のいずれか。最初は Proposed で PR を出し、マージされたら Accepted に
  更新するのが分かりやすいです。
-->

## Context

このリポジトリを「他の言語でも使えるテンプレート」に発展させる前段として、
`try/csharp-template` ブランチで TypeScript/pnpm 版と同等の設定を C# で
試作した。ゴールは実装そのものより、「どの部分が言語非依存（共通化できる）
で、どの部分が言語エコシステム固有か」を実際に手を動かして洗い出すこと。

TypeScript 版は `frontend`（React）/`backend`/`shared` の3パッケージ構成、
Biome による lint/format、Vitest によるテスト、pnpm workspaces による
依存管理・バージョン完全固定、mise による Node バージョン固定、という
構成だった。C# には直接対応する「フロントエンド」の概念がないため、
バックエンド寄りの2パッケージ（`backend`/`shared`）構成で試作した。

## Decision

- **バックエンド**: ASP.NET Core Web API（`Microsoft.NET.Sdk.Web`、Minimal
  API）。`shared` の `GreetingFactory.CreateGreeting` を使う
  `/greeting/{name}` エンドポイントを実装し、TypeScript 版の
  `createGreeting` サンプルと同じ振る舞いを再現した。
- **共有ライブラリ**: 素の class library（`Microsoft.NET.Sdk`）。
- **テスト**: xUnit。ただし C# の慣習では実行対象と同じディレクトリに
  テストファイルを置くのではなく、`backend.tests`/`shared.tests` という
  別プロジェクト（別アセンブリ）にする。プロダクションコードのアセンブリに
  テストフレームワークを混入させない、という制約があるため
  （AGENTS.md の「テストファイルはテスト対象と同じディレクトリに置く」
  規約とは異なる）。
- **依存関係の import 境界**: `noRestrictedImports` のような lint ルールを
  新設する必要はなかった。C# では `ProjectReference` を張らない限り他
  プロジェクトの型を一切参照できず、境界違反は `CS0246` のコンパイル
  エラーになる（`shared` から `backend` の型を使おうとして実際に確認
  済み）。lint ではなくコンパイラが境界を強制する。
- **バージョン完全固定**: NuGet の Central Package Management
  （`Directory.Packages.props` + `ManagePackageVersionsCentrally`）を
  pnpm の `saveExact`/`workspace.yaml` 相当として採用。ただし NuGet は
  `[1.0.0,2.0.0)` のようなレンジや `1.0.*` のようなワイルドカードも
  許可してしまうため、`check-exact-versions.mjs` 相当のチェックを
  `scripts/check-exact-versions.sh`（`Version="..."` の中に `[`/`]`/`(`/
  `)`/`*`/`,` が無いことを見る）として書き直した。
- **Node バージョン固定 → .NET SDK バージョン固定**: `mise.toml` の代わりに
  `global.json`（`rollForward: disable` で完全固定）。
- **lint/format**: Biome 相当は追加パッケージ不要の `dotnet format`
  （`.editorconfig` でルールを明示）。`dotnet format --verify-no-changes`
  が CI/lefthook 両方から呼べることを確認済み。
- **CI**: `pnpm install`/`pnpm run ...` を `dotnet restore`/`dotnet build`/
  `dotnet test` に置き換え。CodeQL は C# がコンパイル言語のため
  `autobuild` ステップが追加で必要（JS/TS には無かった）。
- **Dependabot**: `npm` エコシステムを `nuget` に置き換え。react 用の
  グループ分けは対応物が無いため削除し、単一グループに統合。

以下は **変更しなかった**（= 言語非依存の「共通部分」だと確認できた）:
`.github/PULL_REQUEST_TEMPLATE.md` の構成そのもの（チェックリストの
コマンド名だけ更新）、`.github/CODEOWNERS`、`.github/branch-protection.json`
（CI のジョブ ID を `test` のまま揃えたため無変更で通用）、
`.github/repo-settings.json`、`.github/workflows/dependency-review.yml`
（GitHub の Dependency graph が NuGet manifest も解析するため無変更）、
ADR の仕組み一式（`docs/adr/`、`scripts/new-adr.sh`）。ただし
`scripts/new-adr.sh` を呼ぶ側（PR テンプレートや `.claude/skills/adr/`）が
`pnpm run new-adr -- "title"` という pnpm ラッパー経由の呼び出しを直書き
していたため、`sh scripts/new-adr.sh "title"` という直接呼び出しに変更した
（これは pnpm 依存のバグに近く、TypeScript 版にも将来バックポートすべき）。

## Consequences

- 「共通部分から言語別セットアップが派生する」という当初の構想は、
  実際には ADR/PR テンプレート/CODEOWNERS/branch protection/
  dependency-review のようなリポジトリ運用系ファイルはほぼ無改造で
  使い回せることが分かった。一方でセットアップ手順（README・
  AGENTS.md・lefthook・CI・Dependabot・.gitignore）は完全に
  エコシステム固有で、言語ごとに書き直しが要る。
- 今後 `common` ブランチ/ディレクトリを切り出す場合、上記の「変更
  しなかったファイル群」がそのまま共通部分の候補になる。
- テストの配置規約（同一ディレクトリ co-locate）は C# では成立しない
  ため、AGENTS.md 側の規約を「言語ごとのテスト配置規約は各言語版の
  AGENTS.md に書く」という形に一段抽象化する必要がある。
- NuGet には pnpm の `minimumReleaseAge`（cooldown）に相当する
  インストール時のブロック機構が無い。Dependabot 側の
  `cooldown.default-days` は使えるが、`dotnet add package` で
  公開直後のバージョンを直接指定した場合は防げない。これは
  TypeScript 版に対する明確な劣化点であり、フォローアップが必要。
- この試作は `try/csharp-template` ブランチのみに閉じており、
  `main`/`claude/repository-template-setup-wsluce` 側には影響しない。
  正式に「共通 + 言語別」構成へ移行するかどうかは別途判断が必要。
