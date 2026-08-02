# try-repo-template (common)

このブランチは `try-repo-template` の「言語非依存の共通部分」だけを持つ
ベースブランチです。単体では動くプロジェクトになりません。実際に使う
テンプレートは、このブランチから派生した言語別ブランチを参照してください。

- [`lang/typescript`](../../tree/lang/typescript) — TypeScript / pnpm workspaces 版
- [`lang/csharp`](../../tree/lang/csharp) — C# / .NET 版

## このブランチに含まれるもの

TypeScript 版と C# 版を実際に作って比較した結果
（[`docs/adr/0002-*.md`](../../blob/lang/csharp/docs/adr/0002-use-asp-net-core-web-api-and-xunit-for-the-c-equivalent-template.md)
参照）、無改造でそのまま使い回せると確認できたファイルだけを置いています。

- `.github/PULL_REQUEST_TEMPLATE.md` — 全体の構成は共通。「影響範囲」
  「動作確認」の中身（対象パッケージ名、実行コマンド）だけ言語版ごとに
  書き換える前提のプレースホルダーにしています。
- `.github/CODEOWNERS` — 雛形として空
- `.github/branch-protection.json` — `required_status_checks` の
  `context` が CI ジョブ ID `test` と一致している前提。言語版側の
  `ci.yml` でジョブ ID を変えないでください。
- `.github/repo-settings.json` / `scripts/apply-repo-settings.sh` —
  リポジトリ設定を適用するスクリプト
- `.github/workflows/dependency-review.yml` — GitHub の Dependency
  graph が manifest を解析するため言語を問わず無改造で動作
- `docs/adr/` の ADR の仕組み一式（`0001-record-architecture-decisions.md`、
  `template.md`）と `scripts/new-adr.sh`
- `.claude/skills/adr/SKILL.md` — Claude Code 用の ADR ドラフト作成スキル
- `CLAUDE.md`（`@AGENTS.md` を読み込むだけ）
- `.gitignore` の secrets/local config セクションのみ（ビルド成果物系の
  ignore は言語版ごとに追記）

言語別ブランチは、このブランチから分岐した上で `AGENTS.md`・`README.md`・
CI・依存管理・lint/format・テストなど、エコシステム固有の部分を追加します。

## 新しい言語版を追加するには

```sh
git checkout -b lang/<language> common
```

してから、上記の「含まれるもの」に無いエコシステム固有の設定
（パッケージ管理、lint/format、テスト、CI、Dependabot、`.gitignore` の
追記など）を追加してください。共通部分に変更が必要になった場合は、この
`common` ブランチ側を直接更新し、各言語ブランチにマージ/リベースして
反映してください。
