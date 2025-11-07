# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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

### Technical Details
- HTTPステータスコード別のエラーメッセージマッピング（403, 404, 429, 500, 503）
- 例外エラーの種類別判定（timeout, dns, network）

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
