# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [2.3.0] - 2025-11-07

### Added - ブランド絞り込みURL対応
- **3つのURL生成方式をメニューから選択可能**
  - ブランド絞り込み（`rh=p_89:Brand`）- 推奨
  - キーワード検索（`k=Brand`）- 従来方式
  - ハイブリッド（`k=Brand&rh=p_89:Brand`）- 最も厳格
- **シンプルな3メニュー構成**
  - スクレイピング、トリガー設定、初期設定メニューを削除
  - Keepa API専用のクリーンな構成

### Changed
- `src/Main.gs` - メニューを3つのシンプルな構成に変更
  - `processAllWithBrandFilter()` - ブランド絞り込み方式
  - `processAllWithKeyword()` - キーワード検索方式
  - `processAllWithHybrid()` - ハイブリッド方式
  - `processInBatchesGeneric()` に `urlType` パラメータ追加
- `src/UrlBuilder.gs` - `buildSearchUrl()` に `urlType` パラメータ追加
  - switch文で3方式を実装（brand_filter/keyword/hybrid）
  - デフォルトは `brand_filter`（ブランド絞り込み）
- README.md - 3つのURL方式の説明を追加

### Removed
- 選択行のみ処理機能（シンプル化のため）
- スクレイピング関連メニューとfunctions
- トリガー設定メニュー
- 初期設定メニュー

### Technical Details
- **ブランド絞り込み方式**: `https://www.amazon.com/s?rh=i:category,p_89:Brand&s=sort`
  - Amazonの `p_89` パラメータでブランドを完全指定
  - 他の商品が混ざるリスクを大幅に削減
- **キーワード検索方式**: `https://www.amazon.com/s?k=Brand&i=category&s=sort`
  - 従来のキーワード検索方式
- **ハイブリッド方式**: `https://www.amazon.com/s?k=Brand&rh=p_89:Brand&i=category&s=sort`
  - キーワードとブランド絞り込みの両方を併用

## [2.2.0] - 2025-11-07

### Added - Keepa API 自動処理スケジューラー
- **10分おきの自動処理トリガー**
  - `src/KeepaScheduler.gs` - トリガー処理の実装
  - `processKeepaScheduled()` - メイン処理関数
  - `getKeepaTokensLeft()` - トークン残数取得
  - `setupKeepaScheduler()` - トリガー設定
  - `removeKeepaScheduler()` - トリガー削除

- **トークン残数の可視化**
  - ヘッダー行（F列）にトークン情報を表示
  - 表示内容: 残トークン数、処理状況、更新日時
  - `updateHeaderWithTokenInfo()` - ヘッダー更新関数

- **インテリジェントなエラーハンドリング**
  - トークンエラー → B列空欄のまま、次回再試行
  - それ以外のエラー → B列にエラーメッセージ、処理完了扱い

- **メニュー拡張**
  - 「トリガー設定（自動処理）」サブメニュー追加
  - 「10分おきの自動処理を開始」
  - 「自動処理を停止」
  - 「今すぐ手動実行」

### Changed
- `src/KeepaApi.gs` - トークンエラー判定を追加（tokensLeft=0 を特別扱い）
- `src/SheetManager.gs` - `updateHeaderWithTokenInfo()` 関数を追加

### Technical Details
- トリガー間隔: 10分おき（カスタマイズ可能）
- 処理順序: 上から順に処理
- トークン管理: 残数をリアルタイムで可視化
- エラー分類: トークンエラーとAPIエラーを区別

### Documentation
- KEEPA_AUTO_SCHEDULER_GUIDE.md - 自動処理スケジューラーの完全ガイド


## [2.1.0] - 2025-11-07

### Added - カテゴリマッピング大幅拡張
- **89カテゴリに拡張**（25 → 89カテゴリ）
  - 主要カテゴリ: 44カテゴリ
  - 追加カテゴリ: 45カテゴリ
  - AMAZON_CATEGORY_CODES_REFERENCE.md に完全準拠
  - ファッション系細分化（womens, mens, girls, boys, baby）
  - スポーツ系細分化（baseball, basketball, golf, soccer など）
  - ホーム系細分化（furniture, lighting, bed-bath など）
  - エレクトロニクス系細分化（pc-parts, wearable-tech, smart-home など）

### Changed
- `initializeCategoryMappingSheet()` - 89カテゴリマッピングを初期投入
- カテゴリコード統一（sporting → sporting-goods、garden → home-garden）

## [2.0.0] - 2025-11-07

### Added - Keepa API 統合
- **Keepa API サポート**
  - `src/KeepaApi.gs` - Keepa API通信処理
  - `src/CategoryMapping.gs` - カテゴリマッピング管理
  - ノードID → カテゴリコード変換機能（初期25カテゴリ）
  - カテゴリ名からの自動推測機能（フォールバック）

- **カスタムメニュー拡張**
  - 【Keepa API】すべて処理
  - 【Keepa API】選択行のみ処理
  - 【スクレイピング】すべて処理（従来の処理）
  - 【スクレイピング】選択行のみ処理（従来の処理）
  - 初期設定（Keepa設定・カテゴリマッピング）

- **シート自動作成機能**
  - 「設定」シートに KEEPA_API_KEY 行を自動追加
  - 「カテゴリマッピング」シートを自動作成（25カテゴリ投入）
  - `initializeKeepaSheets()` - メニューから実行可能

- **ドキュメント**
  - KEEPA_SETUP_GUIDE.md - セットアップガイド
  - KEEPA_API_MIGRATION_GUIDE.md - 移行ガイド
  - CATEGORY_CODE_SOLUTION.md - カテゴリコード変換の解説

### Changed
- `src/Main.gs` - 処理関数を汎用化（`processInBatchesGeneric`, `processSelectedRowsGeneric`）
- `src/Config.gs` - KEEPA_API_KEY をデフォルト設定に追加
- README.md - Keepa API対応を明記

### Technical Details
- Keepa API は `getAmazonDataViaKeepa(asin)` で呼び出し
- スクレイピングは `getAmazonData(asin)` で呼び出し（既存）
- カテゴリマッピングは「カテゴリマッピング」シートから動的に読み込み
- エラーハンドリング: Keepa APIエラー時は詳細メッセージを表示

## [1.1.0] - 2025-11-07

### Added
- **エラーメッセージの詳細化**
  - HTTPエラー: `HTTP 403: Forbidden (アクセス拒否・レート制限の可能性)`
  - ブランド抽出失敗: `HTTP 200 OK だがブランド抽出失敗（3段階フォールバックすべて）`
  - タイムアウト: `タイムアウト: {詳細メッセージ}`
  - ネットワークエラー: `ネットワークエラー: {詳細メッセージ}`
  - その他: `例外エラー: {詳細メッセージ}`

### Changed
- エラーメッセージを Logger と同じレベルの詳細度に改善
- **Bot検知対策の強化**
  - HTTPヘッダーをモダンブラウザ（Chrome 131）仕様に更新
  - Sec-Fetch-* ヘッダー、DNT、Cache-Control を追加
  - WAIT_TIME_MS を 2000ms → 20000ms（20秒）に設定
- **HYPERLINK表示の変更**
  - URLラベルを削除し、URLそのものを表示するように変更
  - `=HYPERLINK("url", "ラベル")` → `=HYPERLINK("url")`

### Technical Details
- HTTPステータスコード別のエラーメッセージマッピング（403, 404, 429, 500, 503）
- 例外エラーの種類別判定（timeout, dns, network）
- リクエスト間隔を20秒に設定してAmazon Bot検知を回避
- クリック可能なURLリンクとして表示（ラベルなし）

### Removed
- Product Details のフォールバック（Brand Name, Manufacturer）を一時的に無効化
  - パフォーマンス問題（catastrophic backtracking の可能性）のため
  - 関数自体は残し、呼び出しのみコメントアウト
  - 元の3段階フォールバック（productOverview → bylineInfo → productTitle）に戻す

## [1.0.0] - 2025-11-07

### Added
- Initial release
- ASIN から Amazon 商品データ（ブランド名、カテゴリ）を自動取得
- カテゴリでフィルタリングされた Amazon 検索 URL を自動生成
- 新着順と関連順の2種類のソート URL 生成
- HYPERLINK 形式でのスプレッドシート出力
- バッチ処理機能（10件ごとに保存、タイムアウト対策）
- 未処理行のみをスキップする機能
- カスタムメニュー「Amazon URL生成」
  - すべて処理
  - 選択行のみ処理
- 設定シートによるカスタマイズ機能

### Technical Details
- **データ取得元**: Amazon.com のみ
- **ブランド抽出**: 3段階フォールバック（productOverview → bylineInfo → productTitle）
- **カテゴリ抽出**: 2段階フォールバック（検索ドロップダウン → nav-subnav）
- **URL形式**: `https://www.amazon.com/s?k={brand}&i={category}&s={sort}`
- **バッチ保存**: `SpreadsheetApp.flush()` で10件ごとに確実に保存

### Changed
- カテゴリパラメータを `i=category` 形式に変更（`url=search-alias%3D` から変更）
- Amazon.com のみから取得（Amazon.co.jp のフォールバックを削除）

### Removed
- F列（取得元）の出力を削除
- 「上書きあり」のすべて処理機能を削除
- 設定シート初期化メニューを削除
- 完了ダイアログを削除（放置運用のため）

### Fixed
- カテゴリコードの不一致問題（JP と US でカテゴリコードが異なる問題）
- カテゴリパラメータが正しく適用されない問題

## [0.1.0] - 2025-11-07

### Added
- プロトタイプ版
- Amazon.co.jp → Amazon.com のフォールバック処理
- F列に取得元（JP/US）を記録
- 完了ダイアログ表示
