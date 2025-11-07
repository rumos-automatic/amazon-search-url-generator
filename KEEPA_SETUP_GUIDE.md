# Keepa API セットアップガイド

Keepa APIを使ってAmazon商品データを取得する機能が追加されました。このガイドでは、初期設定と使い方を説明します。

---

## 📋 目次

1. [初期設定](#初期設定)
2. [使い方](#使い方)
3. [カテゴリマッピングの追加](#カテゴリマッピングの追加)
4. [トラブルシューティング](#トラブルシューティング)

---

## 初期設定

### 1. Keepa API Keyの取得

1. [Keepa.com](https://keepa.com/) にアクセス
2. アカウント登録（€19/月プラン）
3. API Keyを取得

### 2. スプレッドシートで初期設定を実行

1. スプレッドシートを開く
2. メニュー「Amazon URL生成」→「**初期設定（Keepa設定・カテゴリマッピング）**」を実行

これにより以下が自動で作成されます：
- **「設定」シート**にKEEPA_API_KEY行を追加
- **「カテゴリマッピング」シート**を作成し、**89カテゴリ**（主要44 + 追加45）を追加

### 3. API Keyを設定

1. 「設定」シートを開く
2. `KEEPA_API_KEY` 行のB列に、取得したAPI Keyを入力

```
| 設定名          | 値                     |
|----------------|------------------------|
| KEEPA_API_KEY  | YOUR_API_KEY_HERE      |
```

---

## 使い方

### カスタムメニュー

スプレッドシートのメニュー「Amazon URL生成」に以下の選択肢が追加されました：

#### Keepa API（推奨）

- **【Keepa API】すべて処理**
  - 未処理の行をすべてKeepa APIで処理
  - 安定性が高く、Bot認定のリスクなし

- **【Keepa API】選択行のみ処理**
  - 選択した行のみをKeepa APIで処理

#### スクレイピング（従来の方法）

- **【スクレイピング】すべて処理**
  - 従来のスクレイピング方式
  - Bot認定のリスクあり

- **【スクレイピング】選択行のみ処理**
  - 選択した行のみをスクレイピングで処理

### 使用例

#### 1. Keepa APIで処理

```
1. A列にASINを入力
2. メニュー「Amazon URL生成」→「【Keepa API】すべて処理」を実行
3. 自動で以下が入力されます：
   - B列: ブランド名
   - C列: カテゴリコード（例: toys-and-games）
   - D列: 新着順検索URL
   - E列: 関連順検索URL
```

#### 2. 結果例

| ASIN | ブランド | カテゴリ | 新着順URL | 関連順URL |
|------|---------|---------|----------|-----------|
| B00U26V4VQ | Hot Wheels | toys-and-games | [新着順](URL) | [関連順](URL) |

---

## カテゴリマッピングの追加

初期設定では主要25カテゴリが登録されていますが、新しいカテゴリを追加することもできます。

### 登録済みカテゴリ（一部）

| NodeID | CategoryCode | CategoryName |
|--------|--------------|--------------|
| 165793011 | toys-and-games | Toys & Games |
| 3375251 | sporting-goods | Sports & Outdoors |
| 468642 | office-products | Office Products |
| 228013 | tools | Tools & Home Improvement |
| 3760901 | hpc | Health & Household |
| 172282 | electronics | Electronics |
| 283155 | stripbooks | Books |
| 1055398 | home-garden | Home & Kitchen |
| 16310101 | grocery | Grocery & Gourmet Food |
| 2619533011 | pets | Pet Supplies |

→ **全89カテゴリ**は「カテゴリマッピング」シートで確認できます

### 新しいカテゴリの追加方法

#### 1. ノードIDの確認

Keepa APIで処理すると、Loggerに以下のように出力されます：

```
No mapping found for node 999999999
Fallback to category name: New Category
```

→ ノードID `999999999` が新しいカテゴリです

#### 2. カテゴリコードの確認

Amazon検索URLで確認します：

```
https://www.amazon.com/s?i=new-category&k=test
```

→ `i=new-category` がカテゴリコードです

#### 3. カテゴリマッピングシートに追加

「カテゴリマッピング」シートに新しい行を追加：

| NodeID | CategoryCode | CategoryName |
|--------|--------------|--------------|
| 999999999 | new-category | New Category |

---

## トラブルシューティング

### Q1: 「KEEPA_API_KEY が設定されていません」エラー

**A**: 「設定」シートの `KEEPA_API_KEY` にAPIキーを入力してください。

### Q2: カテゴリコードが正しく変換されない

**A**: 以下を確認してください：
1. 「カテゴリマッピング」シートにノードIDが登録されているか
2. カテゴリマッピングシートのB列（CategoryCode）が正しいか
3. 新しいカテゴリの場合は、手動で追加してください

### Q3: エラー: HTTP 403 (Keepa API)

**A**: 以下の可能性があります：
- API Keyが間違っている
- トークンが不足している
- API Keyの有効期限が切れている

→ Keepa.comで確認してください

### Q4: スクレイピングとKeepa API、どちらを使うべき？

**A**: Keepa APIを推奨します。理由：
- ✅ Bot認定のリスクなし
- ✅ 安定性が高い
- ✅ メンテナンス不要
- ❌ 有料（€19/月）

大量処理や安定性を重視する場合はKeepa API、少量でコストを抑えたい場合はスクレイピングをお使いください。

### Q5: トークンが足りなくなった

**A**: Keepa APIの基本プランは1トークン/分です。より高速なプランが必要な場合は、Keepaに問い合わせてください。

---

## 設定ファイル

### 「設定」シート

| 設定名 | 値 | 説明 |
|--------|-----|------|
| KEEPA_API_KEY | YOUR_KEY | Keepa APIキー |
| WAIT_TIME_MS | 20000 | リクエスト間隔（ミリ秒） |

### 「カテゴリマッピング」シート

| NodeID | CategoryCode | CategoryName |
|--------|--------------|--------------|
| 165793011 | toys-and-games | Toys & Games |
| ... | ... | ... |

---

## 料金について

### Keepa API基本プラン

- **料金**: €19/月（約3,000円/月）
- **レート**: 1トークン/分 = 1製品/分
- **処理時間**: 100件 → 約1.7時間

### コスト試算

| 月間処理件数 | Keepa APIコスト |
|-------------|-----------------|
| 100件 | €19（約3,000円） |
| 1,000件 | €19（約3,000円） |
| 10,000件 | €19 + 追加トークン購入 |

---

## まとめ

### 推奨フロー

1. **初期設定**
   - メニュー「初期設定（Keepa設定・カテゴリマッピング）」を実行
   - 「設定」シートに API Key を入力

2. **日常使用**
   - A列にASINを入力
   - メニュー「【Keepa API】すべて処理」を実行
   - 自動でブランド、カテゴリ、URLが入力される

3. **新しいカテゴリ**
   - LoggerでノードIDを確認
   - 「カテゴリマッピング」シートに追加

---

## サポート

問題が解決しない場合は、以下のドキュメントを参照してください：

- [Keepa API Documentation](https://keepa.com/#!api)
- [KEEPA_API_MIGRATION_GUIDE.md](./KEEPA_API_MIGRATION_GUIDE.md)
- [CATEGORY_CODE_SOLUTION.md](./CATEGORY_CODE_SOLUTION.md)

---

**Enjoy Keepa API!** 🚀
