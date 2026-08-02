# AGENTS.md

AI コーディングエージェント（Claude Code など）がこのリポジトリで作業する際の
指針です。詳しい背景や理由は `README.md` に書いてあるので、ここでは
「作業前に知っておくべきこと」を簡潔にまとめます。迷ったら README の該当節を
参照してください。

## 構成

TypeScript / pnpm workspaces のモノレポです。

```
.
├── frontend/   # フロントエンド（React）
├── backend/    # バックエンド
├── shared/     # frontend / backend が共通で参照するコード（@repo/shared）
```

### import 境界（重要）

- `frontend` ⇔ `backend`: 互いに import 不可
- `shared` → `frontend`/`backend`: import 不可
- `frontend`/`backend` → `shared`: OK（`@repo/shared` 経由）

この制約は `biome.json` の `noRestrictedImports` で lint エラーとして強制されて
います（相対パス・`@frontend/*`/`@backend/*` エイリアス経由の import も対象）。
`pnpm run check` で検出できるので、コードを書いたら必ず実行してください。

パッケージ内のエイリアスは `frontend` → `@frontend/*`、`backend` → `@backend/*`
（それぞれ `src/` を指す）。`shared` にはエイリアスは無く、常に `@repo/shared`
という import 名で参照します。

## 開発コマンド

| コマンド | 内容 |
| --- | --- |
| `pnpm run check` | Biome で lint / format チェック |
| `pnpm run check:fix` | Biome で自動修正 |
| `pnpm run check:versions` | 依存バージョンが完全固定かチェック |
| `pnpm run typecheck` | `tsc -b` で全ワークスペースを型チェック |
| `pnpm run test` | Vitest でテスト実行 |
| `pnpm run build` | `tsc -b` でビルド |
| `pnpm run new-adr -- "タイトル"` | 新しい ADR を雛形から生成 |

コードを変更したら、コミット前に少なくとも `pnpm run check`・
`pnpm run typecheck`・`pnpm run test` を実行して確認してください
（`.github/workflows/ci.yml` でも同様のチェックが走ります）。

## 守るべき規約

- **依存バージョンは完全固定**（`^`/`~` を使わない。例: `"typescript": "7.0.2"`）。
  `pnpm add`/`pnpm update` を使えば自動的にこの形式になります。手で
  `package.json` を編集する場合は要注意（`pnpm run check:versions` で検出可能）。
- **`@types/node` は Node の固定メジャーバージョン（`mise.toml`/`engines.node`）に
  一致させる**のが例外ルール。それ以外の依存は基本的に最新を追って構いません。
- **`.npmrc` ではなく `pnpm-workspace.yaml` に pnpm 固有設定を書く**（cooldown・
  `ignoreScripts`・`saveExact` など）。理由は README の該当節を参照。
- **テストファイルはテスト対象と同じディレクトリに置き、相対 import する**
  （例: `Greeting.tsx` と `Greeting.test.tsx`）。エイリアスは別ディレクトリの
  モジュールを参照するときだけ使います。
- **相対 import に拡張子を付けない**（`moduleResolution: "bundler"`）。

## ADR（設計判断の記録）

技術選定・ライブラリの採用や変更・アーキテクチャに関わる決定など、後から
理由を聞かれそうな判断をした場合は `docs/adr/` に ADR を残してください。

- 雛形生成: `pnpm run new-adr -- "タイトル"`
- Claude Code を使っている場合は `.claude/skills/adr/SKILL.md`（`/adr`）が
  会話や PR の議論内容から Context/Decision/Consequences のドラフトを
  作成します。内容は必ず自分（ユーザー）に確認してもらってからコミットして
  ください。
- 書き方・運用ルールの詳細は `docs/adr/0001-record-architecture-decisions.md`
  自体に書かれています。

## PR を作るとき

`.github/PULL_REQUEST_TEMPLATE.md` を使ってください。特に「動作確認」の
チェックリスト（`check`/`check:versions`/`typecheck`/`test`/`build`）は
実際に実行した項目だけにチェックを入れます。設計判断を含む変更には ADR の
追加も検討してください。

## Git hooks

[lefthook](https://lefthook.dev/) の pre-commit フックがステージされた変更に
`biome check --staged` を実行します。クローン後は一度だけ
`pnpm run setup-hooks` を実行してください（`postinstall` は
`ignoreScripts: true` の方針により無効化されているため自動実行されません）。
