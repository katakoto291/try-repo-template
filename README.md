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
`workspace:*` 依存として参照されます（`@repo/shared` という import 名で利用可能）。
無 scope の `shared` という名前だと将来同名の npm パッケージと衝突しうるため、
`@repo/*` スコープを付けています。

### frontend ⇔ backend の import 境界

`frontend` と `backend` は互いに import できません。共有したいコードは
`@repo/shared` に置いてください。

- `tsc -b`（`typecheck`/`build`）は各パッケージの `tsconfig.json` の `rootDir`
  制約により、相対パスで隣のパッケージを import すると型エラーになります
  （`TS6059`/`TS6307`）。
- ただし `tsx`/Vitest は型チェックをしないため `rootDir` 違反があっても
  実行できてしまいます。これを実際に検証した上で、`biome.json` の
  `overrides` に `lint/style/noRestrictedImports` を追加し、`frontend/**` から
  `**/backend/**` 相当のパス、`backend/**` から `**/frontend/**` 相当のパスへの
  import を lint エラーにしています。`pnpm run check` と lefthook の
  pre-commit で拾われるので、`tsc -b` を待たずに気付けます。

## ツールチェイン

- **バージョン管理**: [mise](https://mise.jdx.dev/)（`mise.toml` に Node / pnpm のバージョンを固定。
  `package.json` の `packageManager` フィールドはあえて書いていません。バージョンの
  正を `mise.toml` 一箇所に保つためです）
- **パッケージマネージャ**: pnpm workspaces（pnpm 固有の設定は `.npmrc` ではなく
  `pnpm-workspace.yaml` に一本化。理由は後述）
- **モジュール形式**: ES Modules（各 `package.json` に `"type": "module"`）
- **`.ts` 直接実行**: [tsx](https://tsx.is/)（`pnpm run dev:backend` / `dev:frontend`）
- **UI**: React（`frontend` のみ。`tsconfig.json` で `jsx: "react-jsx"`、
  `*.test.tsx` も Vitest の対象）
- **Lint / Format**: [Biome](https://biomejs.dev/)
- **Git hooks**: [lefthook](https://lefthook.dev/)
- **テスト**: [Vitest](https://vitest.dev/)
- **型チェック**: TypeScript（Project References による増分ビルド）
- **CI**: バージョン固定チェック + 型チェック + テスト（`.github/workflows/ci.yml`）
- **セキュリティ**: CodeQL 解析、Dependency Review（利用可否をジョブ内で実際にチェックしてから
  実行。後述）、依存パッケージの install script 無効化、pnpm cooldown、依存バージョンの完全固定、
  GitHub Actions のコミットハッシュ固定 + Dependabot（後述）

## セットアップ

```sh
mise install          # Node / pnpm をバージョン固定でインストール
pnpm install           # 依存関係をインストール（install script は無効化済み）
pnpm run setup-hooks    # lefthook の git hooks を有効化（lefthook install）
```

## GitHub の「テンプレートリポジトリ」として使う場合

このリポジトリを「Use this template」で生成したときに、新しいリポジトリの設定
（マージ方式、Wiki 無効化、脆弱性アラートなど）を自動でいい感じにする仕組みを
`.github/workflows/template-setup.yml` に用意しています。

### 前提: このリポジトリ側で一度だけやること

GitHub の Settings → General → **Template repository** にチェックを入れてください。
これをやっていないと、`template-setup.yml` は「テンプレートから生成された新しい
リポジトリ」と「テンプレート自身（このリポジトリ）」を区別できず、**このリポジトリ
自身への次回 push で誤って自己削除しようとします**（後述の仕組み参照）。

### 仕組み

GitHub には「テンプレートから生成された」ことを検知する専用のイベントが存在しません
（[公式コミュニティディスカッションで明言済み](https://github.com/orgs/community/discussions/52965)）。
そのため `template-setup.yml` は毎回の `push` で起動しつつ、
`github.event.repository.is_template` を見て次のように動作を分けています。

- テンプレート自身（`is_template: true`）: 何もしない
- テンプレートから生成された新しいリポジトリ（`is_template: false`）: 設定を反映し、
  最後に自分自身（このワークフローファイル）を削除するコミットを push します。
  これにより 2 回目以降の push では起動すらしなくなります。

### 設定変更には admin 権限の PAT が必要

リポジトリ設定（マージ方式、Wiki、脆弱性アラートなど）を API から変更するには
リポジトリの admin 権限が必要ですが、`GITHUB_TOKEN` にはその権限を一切付与でき
ません（`administration` という permission scope 自体が存在しないため。詳細は
CodeQL/Dependency Review の項を参照）。そのため、新しいリポジトリの Settings →
Secrets and variables → Actions で **`TEMPLATE_SETUP_TOKEN`** という名前の
シークレットに、admin 権限を持つ Personal Access Token（Fine-grained PAT の
"Administration: write" など）を登録してください。登録しなければ設定変更は
スキップされますが、ワークフロー自身の自己削除は行われます。

反映される設定（`template-setup.yml` 内で調整可能）:

- マージ済みブランチの自動削除
- 自動マージの有効化
- squash merge のみ許可（merge commit / rebase merge は無効化）
- Wiki を無効化
- 脆弱性アラート（Dependabot alerts）と自動セキュリティ修正を有効化

ブランチ保護ルールなど、プロジェクトによって好みが分かれる設定はあえて含めて
いません。必要なら同じ `gh api` の要領で `template-setup.yml` に追記してください。

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

### 依存バージョンの完全固定

すべての `package.json` の依存は `^`/`~` の無い完全固定バージョン
（例: `"typescript": "7.0.2"`）で書きます。`pnpm-workspace.yaml` の
`saveExact: true` により `pnpm add`/`pnpm update` は常に完全固定で書き込みますが、
手で `^1.2.3` のように書き換えてしまう事故は防げないため、
`scripts/check-exact-versions.mjs` で全 `package.json` を走査し、完全固定でない
バージョンがあればエラーにしています（`pnpm run check:versions`）。

このチェックは CI と lefthook の pre-commit（`package.json` が変更された時のみ）
の両方で強制しています。`workspace:*` はローカルパッケージ間の参照であり
外部レジストリの供給網リスクとは無関係なため、このチェックの対象外です。

他の依存は基本的に最新メジャーバージョンを追いますが、`@types/node` だけは例外で、
`mise.toml`/`engines.node` で固定している Node のメジャーバージョン（現在は 24）に
一致させます。型定義なので実行環境の Node バージョンとズレると意味がないためです。

### GitHub Actions のバージョン固定

`.github/workflows/*.yml` の `uses:` はすべて `@v4` のような可変タグではなく、
コミットハッシュで固定しています（例: `actions/checkout@3d3c42e5... # v7.0.1`）。
可変タグは同じタグ名のまま参照先のコードが差し替えられうるため、CI 上でリポジトリの
シークレットにアクセスできる Action は特に固定しておくのが安全です。バージョン番号は
コメントとして残しています。

`.github/dependabot.yml` で `github-actions` エコシステムの週次アップデートを
有効にしているので、新しいバージョンが出ればハッシュとバージョンコメントの両方を
更新する PR が自動的に作成されます。`package.json`（`npm` エコシステム）も同じ
ファイルで月次アップデート対象にしており、`cooldown.default-days: 3` で
`pnpm-workspace.yaml` の `minimumReleaseAge` と同じ 3 日を設定しています
（揃えないと、CI の cooldown チェックで弾かれる更新 PR を Dependabot が
提案してしまうため）。

`@types/node` のように更新頻度の高いパッケージだけ PR が乱発されるのを避けるため、
`groups` でまとめています。`npm` エコシステムは `react`（react/react-dom/
@types/react/@types/react-dom）と `dev-tooling`（それ以外全部）の 2 グループ、
`github-actions` は 1 グループにまとめ、更新の種類（major/minor/patch）に
関わらず該当パッケージが同時に更新されれば 1 本の PR にまとまります。

### CodeQL / Dependency Review の利用可否チェック

どちらもパブリックリポジトリなら無料ですが、プライベートリポジトリでは
GitHub Advanced Security（GHAS）が有効でないと使えません。将来このリポジトリが
プライベートになる可能性を考慮し、各ワークフローの先頭に `check-eligibility`
ジョブを置いて、本体のジョブは `needs` + `if` でその結果を見てから実行するように
しています。

ただし `security_and_analysis`（GHAS の有効状態）を読むには repo の admin 権限が
必要で、`GITHUB_TOKEN` にはそもそも付与できる権限一覧に `administration` が
存在しません。そのため実際にチェックできるのは「パブリックかどうか」だけで、
プライベートかつ GHAS 有効という組み合わせは自動検出できず、常にスキップされます。
その場合は該当ワークフローの `check-eligibility` ジョブ内のコメントに従って、
`eligible=true` を無条件で返すように変更するか、リポジトリ変数などで
明示的に上書きしてください。

## よく使うコマンド

| コマンド | 内容 |
| --- | --- |
| `pnpm run typecheck` | `tsc -b` で全ワークスペースを型チェック |
| `pnpm run test` | Vitest でテスト実行 |
| `pnpm run check` | Biome で lint / format チェック |
| `pnpm run check:fix` | Biome で自動修正 |
| `pnpm run check:versions` | 依存バージョンが完全固定かチェック |
| `pnpm run build` | `tsc -b` でビルド |
| `pnpm run dev:backend` | tsx で `backend/src/index.ts` を直接実行（watch モード） |
| `pnpm run dev:frontend` | tsx で `frontend/src/index.ts` を直接実行（watch モード） |

## Git hooks

[lefthook](https://lefthook.dev/) を使用しています。設定は `lefthook.yml` で、
pre-commit フックがステージされた変更に対して `biome check --staged` を実行します。

クローン後に一度だけ `pnpm run setup-hooks`（内部で `lefthook install` を実行）を
実行してください。lefthook 自身の postinstall スクリプトは `lefthook install` を
自動実行するものですが、`ignoreScripts: true` の方針と合わせるため意図的に
無効化し、手動セットアップにしています。

## モジュール解決の注意

TypeScript は `moduleResolution: "bundler"` を使用しているため、相対 import に
拡張子を付ける必要はありません（`import { foo } from "./foo"` のように書けます）。

`tsc -b` は型チェック用の import 指定をそのまま出力に転写するだけなので、
`dist/` 配下のコンパイル済み JS を素の `node` で直接実行すると、Node の ESM ローダーは
拡張子なしの相対 import を解決できずエラーになります。`pnpm run dev:backend` /
`dev:frontend`（内部は [tsx](https://tsx.is/)）はソースの `.ts` を直接読んで
esbuild で都度変換するため、この問題が起きません。実行したいエントリポイントが
増えたら `tsx watch <path>` の形で `package.json` にスクリプトを足してください。

`@repo/shared` パッケージは外部に公開せずこのモノレポ内でのみ参照する前提のため、
`package.json` の `main`/`types`/`exports` はビルド後の `dist/` ではなく
`src/index.ts` を直接指しています。これにより `tsx` や Vitest がビルド不要で
即座にソースを解決できます（`tsc -b` によるビルド/宣言ファイル生成自体は
`build`/`typecheck` スクリプトとして引き続き利用できます）。
