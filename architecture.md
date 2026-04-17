# Pomodoro Timer Web App Architecture

## 目的

このドキュメントは、Flask と HTML/CSS/JavaScript を用いて実装するポモドーロタイマー Web アプリのアーキテクチャ案をまとめたものである。

主な目的は次の 3 点である。

- 実装初期の完成速度を高く保つ
- UI デザイン変更に強い構成にする
- ユニットテストしやすい責務分割にする

なお、ポモドーロ関連の実装ファイルは repository のルールに従い 1.pomodoro/ 配下に配置する。

## 前提

- サーバーサイドは Flask を使用する
- フロントエンドは HTML/CSS/JavaScript を使用する
- 初期段階では単一ユーザー、単一ブラウザ利用を前提とする
- タイマーの進行はサーバーではなくブラウザで管理する
- 初期の設定保存は localStorage を優先し、必要になれば Flask API と SQLite を追加する

## 全体方針

最初からサーバーで秒単位のタイマー進行を管理するのではなく、Flask は画面配信と将来のデータ保存 API に責務を限定する。
タイマー進行、状態遷移、画面更新はフロントエンドが担当する。

この方針により、次の利点がある。

- 実装が単純になる
- サーバー負荷が低い
- オフラインに近い使い方でも動作しやすい
- タイマーのドメインロジックをユニットテストしやすい

## アーキテクチャ概要

レイヤ構成は以下を推奨する。

1. Presentation Layer
2. Application Layer
3. Domain Layer
4. Infrastructure Layer

### Presentation Layer

UI 表示とユーザー操作を担当する。

- HTML: 画面構造
- CSS: レイアウト、テーマ、レスポンシブ、アニメーション
- JavaScript View: DOM 更新、イベント登録
- Flask Route: ページ返却と API エンドポイント

### Application Layer

UI とドメインの橋渡しを担当する。

- タイマー開始
- 一時停止
- リセット
- モード切替
- 設定反映
- セッション完了時の保存処理起点

### Domain Layer

ポモドーロのルールを表現する中核レイヤとする。

- 現在モードの保持
- 残り時間の計算
- focus 完了時の break 遷移
- long break への切替判定
- セッション完了回数の管理
- 設定値バリデーション

### Infrastructure Layer

外部依存をまとめる。

- localStorage
- Notification API
- Audio 再生
- Date.now や setInterval などの時刻とスケジューラ
- 将来の Flask API 通信
- 将来の SQLite 永続化

## 責務分割

### Flask 側の責務

Flask は薄く保つ。

- 初期画面を返す
- 必要に応じて設定や統計情報の API を返す
- 将来の履歴保存や分析用エンドポイントを提供する

Flask 側でタイマー秒数を進める責務は持たない。

### フロントエンド側の責務

ブラウザ側がアプリケーションの主制御を持つ。

- タイマー状態を保持する
- 現在時刻との差分から残り時間を計算する
- 操作ボタンに応答する
- モード遷移を行う
- 描画を更新する
- 必要に応じて設定や統計を保存する

## 状態管理方針

状態は単一の state オブジェクトに集約する。
散在するグローバル変数や DOM 依存の状態管理は避ける。

例として、以下の情報を保持する。

- mode: focus / shortBreak / longBreak
- durations: 各モードの設定秒数
- remainingSeconds: 現在の残り秒数
- isRunning: 実行中かどうか
- endAt: 終了予定時刻
- completedFocusCount: 完了した focus 回数
- longBreakInterval: 何回ごとに long break にするか
- autoStartBreak: break を自動開始するか
- autoStartFocus: focus を自動開始するか
- notificationsEnabled: 通知有効フラグ

### 時間管理の方針

残り秒数を単純に減算し続けるより、終了予定時刻を基準に現在時刻との差分で再計算する方式を推奨する。

この方式の利点は次の通りである。

- タブが非アクティブでも時間ずれに強い
- テストで時刻を差し替えやすい
- 再開や復元ロジックが単純になる

## フロントエンドの推奨分割

JavaScript は少なくとも以下の単位に分ける。

- pomodoro-state.js
  - state 定義
- pomodoro-engine.js
  - 純粋なタイマーロジック
- pomodoro-service.js
  - clock, storage, notifier など外部依存との橋渡し
- pomodoro-view.js
  - DOM 描画専用
- app.js
  - 初期化と依存注入

重要なのは、DOM 操作とタイマーのドメインロジックを混在させないことである。

## Flask の推奨分割

Flask は app factory 方式を採用する。

- app.py
  - create_app(config=None)
- routes.py
  - ルーティング定義
- services/settings_service.py
  - 設定取得・保存
- services/stats_service.py
  - セッション集計
- repositories/
  - 永続化処理の抽象と実装

初期段階では repository を未実装または localStorage 優先で進めてもよいが、API を増やす場合に備えて service 層と route 層は分離しておく。

## API 方針

初期版は単一ページ配信のみでもよいが、将来拡張を見据えるなら以下の API を想定する。

- GET /
  - アプリ画面を返す
- GET /api/settings
  - 設定を返す
- POST /api/settings
  - 設定を保存する
- GET /api/stats
  - 統計情報を返す
- POST /api/session/complete
  - セッション完了を記録する

初期フェーズでは localStorage を優先し、サーバー保存は本当に必要になってから追加する。

## ユニットテストしやすくするための改善点

会話で整理した内容を踏まえると、テスト容易性の観点では次の改善を必須に近いものとして採用する。

### 1. タイマーロジックの純粋化

ポモドーロの状態遷移や残り時間計算は、DOM や Flask に依存しない純粋関数、または副作用の少ないクラスとして実装する。

これにより次を容易に検証できる。

- 25 分開始後の残り時間
- pause と resume の整合性
- focus 完了後の short break 遷移
- 指定回数後の long break 遷移

### 2. Clock 抽象の導入

Date.now を直接呼ばず、clock.now() などの抽象を通して現在時刻を取得する。

これにより、テストでは固定時刻や任意の時刻進行を注入できる。

### 3. Storage 抽象の導入

localStorage を直接参照せず、SettingsRepository や SessionRepository のような薄い抽象を経由する。

これにより、テスト時に in-memory 実装へ差し替えられる。

### 4. Renderer の責務限定

renderer は render(state) を中心に設計し、残り時間計算や状態遷移の責務を持たせない。

これにより、UI テストとロジックテストの境界が明確になる。

### 5. Flask の app factory 化

create_app(config=None) により、テスト専用設定を差し込めるようにする。

将来 SQLite を使う場合も、テスト用 DB に切り替えやすい。

### 6. Route と Service の分離

Flask の route 関数に集計や保存のロジックを直書きせず、service 層に分離する。

これにより、HTTP を介さない単体テストが可能になる。

### 7. バリデーションの独立

作業時間、休憩時間、long break 間隔などの設定チェックは専用関数に切り出す。

これは境界値テストがしやすく、入力不正による不具合を防ぎやすい。

## テスト戦略

優先順位は以下とする。

1. Domain / Application のユニットテスト
2. Flask API のルートテスト
3. 最小限の UI 結合テスト

### ユニットテストの主対象

- タイマー開始時に正しい終了予定時刻が設定される
- pause 時に残り時間が保持される
- resume 後に正しく再開する
- focus 完了後に short break へ遷移する
- 規定回数到達後に long break へ遷移する
- 不正な設定値が弾かれる
- 保存済み state が正しく復元される

### API テストの主対象

- 設定取得 API が期待値を返す
- 設定保存 API が妥当な入力を保存できる
- 不正な入力を適切に拒否する
- セッション完了記録 API が正常に処理される

### UI テストの主対象

- 初期表示で主要コンポーネントが描画される
- 開始、停止、リセットの操作がイベントとして接続される
- モード切替時に表示が更新される

## ディレクトリ構成案

初期案としては以下のような構成が妥当である。

```text
1.pomodoro/
  app.py
  routes.py
  services/
    settings_service.py
    stats_service.py
  templates/
    index.html
  static/
    css/
      style.css
    js/
      app.js
      pomodoro-state.js
      pomodoro-engine.js
      pomodoro-service.js
      pomodoro-view.js
```

必要になった時点で以下を追加する。

```text
1.pomodoro/
  repositories/
  tests/
    test_engine.py
    test_routes.py
    frontend/
```

## 実装順序

推奨する実装順序は以下の通りである。

1. Flask で単一ページを返せる状態を作る
2. HTML/CSS で UI モックを再現する
3. 純粋なタイマーエンジンを実装する
4. View とイベント接続を実装する
5. localStorage による設定保存を追加する
6. 通知、音、統計表示を追加する
7. 必要になれば Flask API と SQLite を追加する

## 結論

このアプリでは、サーバーを薄く保ち、タイマーの状態遷移と時間計算をフロントエンドの独立したロジック層へ寄せる構成が最も適している。

特に、ユニットテストのしやすさを重視する場合は以下が重要である。

- タイマーエンジンの純粋ロジック化
- clock と storage の依存注入
- renderer の責務限定
- Flask の app factory 化
- route と service の分離

この方針で進めることで、初期開発を軽く保ちながら、後から機能追加しても壊れにくい Web アプリケーション構成にできる。