# 0001. Record architecture decisions

Date: 2026-08-01

## Status

Accepted

## Context

PR やコードレビューでの議論の末に決まった設計判断が、マージされた後に
「なぜそうしたのか」という背景ごと失われてしまうことがある。次に似た
変更をするとき、同じ議論を繰り返したり、過去の決定を理由も分からないまま
覆してしまったりする。

## Decision

`docs/adr/` に Architecture Decision Record（ADR）を残す。フォーマットは
Michael Nygard が提唱した軽量な形式（Context / Decision / Consequences）を
使う（`docs/adr/template.md`）。

- 番号は 4 桁の連番（`0001`, `0002`, ...）
- ファイル名は `NNNN-slug-form-of-title.md`
- `docs/adr/template.md` を手でコピーするか、`pnpm run new-adr "タイトル"`
  で次の番号のファイルを自動生成できる
- PR の議論の中で「なぜこうしたか」を後から追いたくなるような判断が
  出てきたら、その PR に ADR を追加する（追加してから PR を出しても、
  議論の結果を受けて後から追加してもよい）
- 決定を覆すときは、既存の ADR を書き換えるのではなく新しい ADR を書き、
  古い方の Status を `Superseded by ADR-000X` に更新する

## Consequences

- 設計判断の背景が Git 履歴に残り、後から参照できるようになる
- 決定を覆すときも履歴が消えず、「なぜ以前はそうしていたか」まで追える
- ADR を書く一手間が増える。些細な変更にまで書く必要はなく、
  「後から理由を聞かれそうな判断」に絞る
