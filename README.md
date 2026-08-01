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

### frontend / backend / shared の import 境界

`frontend`・`backend`・`shared` は次のルールで互いの import を制限しています。
共有したいコードは `@repo/shared` に置いてください。

- `frontend` ⇔ `backend`: 互いに import 不可
- `shared` → `frontend`/`backend`: import 不可（`shared` は両方から参照される
  側なので、逆方向の依存を持つと循環しやすくなります）
- `frontend`/`backend` → `shared`: OK（`@repo/shared` 経由）

- `tsc -b`（`typecheck`/`build`）は各パッケージの `tsconfig.json` の `rootDir`
  制約により、相対パスで別パッケージを import すると型エラーになります
  （`TS6059`/`TS6307`）。
- ただし `tsx`/Vitest は型チェックをしないため `rootDir` 違反があっても
  実行できてしまいます。これを実際に検証した上で、`biome.json` の
  `overrides` に `lint/style/noRestrictedImports` を追加し、上記 3 方向すべてを
  lint エラーにしています（相対パスだけでなく `@frontend/*`/`@backend/*`
  エイリアス経由の import も対象です）。`pnpm run check` と lefthook の
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
  `*.test.tsx` も Vitest の対象）。コンポーネントのテスト例として
  `frontend/src/components/Greeting.tsx` と `frontend/src/Greeting.test.tsx`
  を用意しています（[Testing Library](https://testing-library.com/) +
  jsdom。テストファイル先頭の `// @vitest-environment jsdom` コメントで、
  この 1 ファイルだけ実行環境を `node` から `jsdom` に切り替えています）
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

「Use this template」で新しいリポジトリを生成したら、一度だけ次を実行してください
（[GitHub CLI](https://cli.github.com/) が必要。未認証なら先に `gh auth login`）。

```sh
pnpm run setup-repo-settings
```

`.github/repo-settings.json` の内容を `gh api` で現在のリポジトリに反映し、
続けて脆弱性アラート（Dependabot alerts）と自動セキュリティ修正を有効化します
（実体は `scripts/apply-repo-settings.sh`）。反映される設定:

- マージ済みブランチの自動削除
- 自動マージの有効化
- squash merge のみ許可（merge commit / rebase merge は無効化）
- Wiki を無効化
- 脆弱性アラートと自動セキュリティ修正の有効化

リポジトリ設定の変更には admin 権限が必要です。自分の `gh` 認証（新しく生成した
リポジトリの owner/admin であるはず）でそのまま実行できます。設定内容を変えたい
場合は `.github/repo-settings.json` を編集してください（[利用可能なフィールド一覧](https://docs.github.com/en/rest/repos/repos#update-a-repository)）。
ブランチ保護ルールなど、プロジェクトによって好みが分かれる設定はあえて含めて
いないので、必要なら `scripts/apply-repo-settings.sh` に `gh api` 呼び出しを
追記してください。

GitHub Actions 上で自動実行する方式（`push` イベント + `is_template` での判定）も
検討しましたが、リポジトリ設定の変更には admin 権限が要るのに `GITHUB_TOKEN` には
それを付与できず（`administration` という permission scope 自体が存在しない）、
admin 権限の PAT を Secrets に登録してもらう必要があるなど手間が増えるだけだった
ため、素直にユーザー自身が一度実行する形にしています。

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

### `@frontend/` / `@backend/` エイリアス

`frontend` 配下のファイルからは `@frontend/` で `frontend/src/` を、
`backend` 配下のファイルからは `@backend/` で `backend/src/` を指せます
（例: `import { Button } from "@frontend/components/Button"`）。`shared` には
付けていません（`@repo/shared` というパッケージ名で参照する形と混同しないため）。

`@frontend/`・`@backend/` のように、どちらのパッケージ向けか名前から分かる
prefix にしているのは、frontend/backend 間の import を禁止している都合上
（前述）、共通の `@/` のような prefix だと import 文だけでは
「これは自分のパッケージ内か、それとも境界を越えていないか」が分かりにくい
ためです。実際、`noRestrictedImports` の対象にも `@frontend/**`/`@backend/**`
というエイリアス経由の import を含めています。

実体はそれぞれ `frontend/tsconfig.json`・`backend/tsconfig.json` の
`compilerOptions.paths` だけです（`tsc -b` の型チェックはこれで解決します）。
それ以外のツールは tsconfig の `paths` を自動では読んでくれないので、
それぞれ次の形で追従させています。

- **Vitest**: [`vite-tsconfig-paths`](https://github.com/aleclarson/vite-tsconfig-paths)
  プラグインを `vitest.config.ts` の `plugins` に追加。手書きの `resolve.alias`
  を用意しなくても、モノレポ内の複数パッケージ（`frontend`・`backend`）の
  `tsconfig.json` を横断して `paths` を読んで解決してくれることを実際に
  確認済みです（`typescript` の peer dependency 指定が `^5.0.0` のままで pnpm が
  インストール時に警告を出しますが、TypeScript 7.0.2 でも実際の解決は
  問題なく動いています）。
- **tsx**: `package.json` の `dev:frontend`/`dev:backend` スクリプトで
  `tsx watch --tsconfig <package>/tsconfig.json ...` のように明示しています。
  tsx 自体は tsconfig の `paths` に対応していますが、実行時のカレントディレクトリを
  起点に tsconfig.json を探すため、`--tsconfig` を付けないとリポジトリルートから
  `pnpm run dev:frontend`/`dev:backend` で実行した際にエイリアスを解決できないことを
  実際に確認しています（各パッケージのディレクトリの中から実行すれば無くても
  動きますが、明示しておく方が安全です）。`vite-tsconfig-paths` は Vite/Vitest 用の
  プラグインなので tsx には使えません。

上の 2 つはあらかじめ設定済みなので、**新しいエイリアスを追加・変更したいときは
各パッケージの `tsconfig.json` の `paths` を編集するだけ**で OK です。実際に
`frontend/tsconfig.json` に `"@components/*": ["./src/components/*"]` を
追記しただけの状態で、`vitest.config.ts` と `package.json` を一切変更せずに
Vitest・`tsc -b`・tsx の 3 つとも解決できることを確認してから、サンプルとして
冗長になるため取り下げています（現状は `@frontend/*`/`@backend/*` それぞれ
1 本のみ）。
