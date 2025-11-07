# Amazon Search URL Generator

Google Apps Script (GAS) を使って、Amazon の商品 ASIN からブランド名とカテゴリを自動取得し、カテゴリでフィルタリングされた検索 URL を生成するツールです。

## 機能

- **ASIN からデータ自動取得**: Amazon.com の商品ページからブランド名とカテゴリコードをスクレイピング
- **検索 URL 生成**: 取得したブランド名とカテゴリで絞り込んだ Amazon 検索 URL を自動生成
- **2種類のソート**: 新着順と関連順の URL を両方生成
- **HYPERLINK 形式**: スプレッドシート上でクリック可能なリンクとして表示
- **バッチ処理**: 10件ごとにシートに保存（タイムアウト対策）
- **スマート処理**: 既に処理済みの行はスキップ

## スプレッドシート構成

| A列 | B列 | C列 | D列 | E列 |
|-----|-----|-----|-----|-----|
| ASIN | ブランド | カテゴリ | 新着順URL | 関連順URL |

## 使い方

### 1. セットアップ

1. Google スプレッドシートを開く
2. 拡張機能 → Apps Script を開く
3. このプロジェクトのコードをコピー

または clasp でデプロイ：

```bash
npm install -g @google/clasp
clasp login
clasp create --type sheets --title "Amazon Search URL Generator"
clasp push
```

### 2. 使用方法

1. A列に ASIN を入力
2. メニュー「Amazon URL生成」から処理方式を選択
   - **ブランド絞り込み** - `p_89` パラメータでブランド指定（推奨）
   - **キーワード検索** - 従来のキーワード検索方式
   - **ハイブリッド** - 両方を併用した厳格な絞り込み
3. 自動で以下が入力されます：
   - B列: ブランド名
   - C列: カテゴリコード
   - D列: 新着順検索 URL（HYPERLINK）
   - E列: 関連順検索 URL（HYPERLINK）

### カスタムメニュー

- **ブランド絞り込み**: `rh=p_89:Brand` でブランド完全指定（推奨）
- **キーワード検索**: `k=Brand` で従来のキーワード検索
- **ハイブリッド**: `k=Brand&rh=p_89:Brand` で両方併用

## 設定

`設定` シートで以下をカスタマイズ可能：

| 設定名 | デフォルト | 説明 |
|--------|-----------|------|
| ASIN_COLUMN | A | ASIN列の位置 |
| BRAND_COLUMN | B | ブランド列の位置 |
| CATEGORY_COLUMN | C | カテゴリ列の位置 |
| NEW_URL_COLUMN | D | 新着順URL列の位置 |
| RELEVANCE_URL_COLUMN | E | 関連順URL列の位置 |
| TARGET_SHEET_NAME | 商品データ | 処理対象シート名 |
| WAIT_TIME_MS | 20000 | リクエスト間隔（ミリ秒） |
| BATCH_SIZE | 10 | バッチ処理の件数 |
| SORT_NEW_PARAM | date-desc-rank | 新着順ソートパラメータ |
| SORT_RELEVANCE_PARAM | relevanceblender | 関連順ソートパラメータ |
| NEW_LABEL | 新着順 | 新着順リンクのラベル |
| RELEVANCE_LABEL | 関連順 | 関連順リンクのラベル |

## プロジェクト構成

```
amazon-search-url-generator/
├── src/
│   ├── Main.gs              # メイン処理とカスタムメニュー
│   ├── Scraper.gs           # Amazon スクレイピング処理
│   ├── UrlBuilder.gs        # URL 生成処理
│   ├── Config.gs            # 設定管理
│   └── SheetManager.gs      # スプレッドシート操作
├── appsscript.json          # GAS プロジェクト設定
├── .clasp.json              # clasp 設定
├── README.md
└── CHANGELOG.md
```

## 技術仕様

### データ取得

- **取得元**: Amazon.com のみ
- **ブランド抽出（3段階フォールバック）**:
  1. `productOverview` の `po-brand` テーブル行
  2. `bylineInfo` の "Visit the {Brand} Store" パターン
  3. `productTitle` の最初の単語（最終フォールバック）
- **カテゴリ抽出（2段階フォールバック）**:
  1. 検索ドロップダウンの selected option の value
  2. `nav-subnav` の `data-category` 属性（フォールバック）

### URL 形式

#### ブランド絞り込み（推奨）
```
https://www.amazon.com/s?rh=i:{カテゴリ},p_89:{ブランド名}&s={ソート}
```
例:
```
https://www.amazon.com/s?rh=i:tools,p_89:LOCHBY&s=date-desc-rank
```

#### キーワード検索（従来）
```
https://www.amazon.com/s?k={ブランド名}&i={カテゴリ}&s={ソート}
```
例:
```
https://www.amazon.com/s?k=LOCHBY&i=tools&s=date-desc-rank
```

#### ハイブリッド
```
https://www.amazon.com/s?k={ブランド名}&rh=p_89:{ブランド名}&i={カテゴリ}&s={ソート}
```
例:
```
https://www.amazon.com/s?k=LOCHBY&rh=p_89:LOCHBY&i=tools&s=date-desc-rank
```

## 🆕 Keepa API 対応（v2.2.0）

**Bot認定を回避する安定版として、Keepa APIに対応しました！**

### 新機能

- ✅ **Keepa API 統合** - 公式APIで安定したデータ取得
- ✅ **自動処理スケジューラー** - 10分おきに自動実行、放置でOK
- ✅ **トークン残数の可視化** - ヘッダー行にリアルタイム表示
- ✅ **カテゴリマッピング89種** - Amazon主要カテゴリを95%以上カバー
- ✅ **カスタムメニュー拡張** - Keepa APIとスクレイピングを選択可能
- ✅ **初期設定自動化** - メニューから簡単セットアップ

### 使い方（自動処理）

1. メニュー「Amazon URL生成」→「初期設定（Keepa設定・カテゴリマッピング）」を実行
2. 「設定」シートに Keepa API Key を入力
3. メニュー「トリガー設定（自動処理）」→「10分おきの自動処理を開始」をクリック
4. あとは放置！自動的にデータ取得が完了します

詳細は以下を参照：
- [KEEPA_AUTO_SCHEDULER_GUIDE.md](./KEEPA_AUTO_SCHEDULER_GUIDE.md) - 自動処理ガイド
- [KEEPA_SETUP_GUIDE.md](./KEEPA_SETUP_GUIDE.md) - セットアップガイド

---

## 制限事項

### スクレイピング版

- ⚠️ Amazon.com の HTML 構造が変更されると動作しなくなる可能性があります
- ⚠️ Bot認定のリスクがあります
- リクエスト間隔（デフォルト20秒）を設けているため、大量処理には時間がかかります
- GAS の実行時間制限（6分）により、一度に大量の ASIN は処理できません

### Keepa API版

- 💰 有料（€19/月、約3,000円/月）
- 基本プランは1トークン/分（1製品/分）
- トークン消費に注意

---

## ライセンス

MIT License

## 作者

Created with Claude Code
