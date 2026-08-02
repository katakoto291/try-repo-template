# AGENTS.md

AI コーディングエージェント（Claude Code など）がこのリポジトリで作業する際の
指針です。詳しい背景や理由は `README.md` に書いてあるので、ここでは
「作業前に知っておくべきこと」を簡潔にまとめます。迷ったら README の該当節を
参照してください。

このブランチ（`try/csharp-template`）は、TypeScript/pnpm 版テンプレートの
「共通部分 vs エコシステム固有部分」を確かめるための C# 試作版です。詳しい
経緯・比較結果は `docs/adr/0002-*.md` を参照してください。

## 構成

.NET のソリューション構成です（`TryRepoTemplate.sln`）。

```
.
├── backend/         # ASP.NET Core Web API
├── backend.tests/   # backend の xUnit テスト（別プロジェクト）
├── shared/          # backend が参照する共有ライブラリ
├── shared.tests/    # shared の xUnit テスト（別プロジェクト）
```

TypeScript 版にあった `frontend` に直接対応するものは無い（C# 単体では
UI 層の定番構成が定まらないため今回は対象外）。

### プロジェクト境界（重要）

- `shared` → `backend`: 参照不可
- `backend`/`*.tests` → `shared`: OK（`ProjectReference` 経由）

TypeScript 版はこれを `biome.json` の `noRestrictedImports` で lint
エラーとして強制していたが、C# では **lint ルールが不要**。
`ProjectReference` を張っていないプロジェクトの型は最初から参照できず、
違反はコンパイルエラー（`CS0246` 等）になる。境界を破る `.csproj` の
編集をしても、それだけではビルドが通らない。

## 開発コマンド

| コマンド | 内容 |
| --- | --- |
| `dotnet format --verify-no-changes` | フォーマット/コーディングスタイルのチェック |
| `dotnet format` | 自動修正 |
| `sh scripts/check-exact-versions.sh` | NuGet パッケージのバージョンが完全固定かチェック |
| `dotnet build` | ビルド（コンパイルエラー = 型チェック） |
| `dotnet test` | xUnit でテスト実行 |
| `sh scripts/new-adr.sh "タイトル"` | 新しい ADR を雛形から生成 |

コードを変更したら、コミット前に少なくとも `dotnet format --verify-no-changes`・
`dotnet build`・`dotnet test` を実行して確認してください
（`.github/workflows/ci.yml` でも同様のチェックが走ります）。

## 守るべき規約

- **依存バージョンは完全固定**（NuGet の範囲指定 `[1.0.0,2.0.0)` やワイルドカード
  `1.0.*` を使わない）。バージョンは `Directory.Packages.props` 1箇所に集約
  （Central Package Management）。各 `.csproj` の `PackageReference` に
  `Version` を書かないこと。`sh scripts/check-exact-versions.sh` で検出可能。
- **.NET SDK のバージョンは `global.json` で完全固定**（`rollForward: disable`）。
- **テストは対象と別プロジェクト**（`backend` → `backend.tests`、
  `shared` → `shared.tests`）。C# では実行アセンブリにテストフレームワークを
  混ぜられないため、TypeScript 版のような同一ディレクトリ co-locate はできない。
  テストプロジェクトから対象プロジェクトへは `ProjectReference` で参照する。

## ADR（設計判断の記録）

技術選定・ライブラリの採用や変更・アーキテクチャに関わる決定など、後から
理由を聞かれそうな判断をした場合は `docs/adr/` に ADR を残してください。

- 雛形生成: `sh scripts/new-adr.sh "タイトル"`
- Claude Code を使っている場合は `.claude/skills/adr/SKILL.md`（`/adr`）が
  会話や PR の議論内容から Context/Decision/Consequences のドラフトを
  作成します。内容は必ず自分（ユーザー）に確認してもらってからコミットして
  ください。
- 書き方・運用ルールの詳細は `docs/adr/0001-record-architecture-decisions.md`
  自体に書かれています。

## PR を作るとき

`.github/PULL_REQUEST_TEMPLATE.md` を使ってください。特に「動作確認」の
チェックリスト（format/exact-versions/build/test）は実際に実行した項目
だけにチェックを入れます。設計判断を含む変更には ADR の追加も検討してください。

## Git hooks

[lefthook](https://lefthook.dev/) の pre-commit フックが `dotnet format
--verify-no-changes` とバージョン固定チェックを実行します。TypeScript 版の
`biome check --staged` と異なり、`dotnet format` はステージされたファイル
だけに絞れないため、ソリューション全体を毎回チェックする点に注意してください。
