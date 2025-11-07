# Keepa API 移行ガイド

## 概要

現在のAmazonスクレイピングは **Bot認定のリスク** が高いため、Keepa APIへの移行を推奨します。

---

## 比較表

| 項目 | 現在（スクレイピング） | Keepa API |
|------|----------------------|-----------|
| **安定性** | ❌ Bot認定でエラー頻発 | ✅ 公式API、安定 |
| **メンテナンス** | ❌ HTML構造変更で動作不能 | ✅ 不要 |
| **速度** | ⚠️ 30秒/件（Bot対策） | ⚠️ 60秒/件（基本プラン） |
| **料金** | ✅ 無料 | ❌ €19/月（約3,000円） |
| **実装難易度** | 難（正規表現、フォールバック） | 簡単（REST API） |
| **データ品質** | ⚠️ 抽出失敗のリスク | ✅ 構造化データ |

---

## 取得可能な情報

### 現在のスクレイピング

```javascript
// src/Scraper.gs
{
  asin: 'B00U26V4VQ',
  brand: 'Hot Wheels',        // HTML解析（3段階フォールバック）
  category: 'toys-and-games',  // HTML解析（2段階フォールバック）
  source: 'US',
  error: null
}
```

### Keepa API

```javascript
// keepa-api-example.gs
{
  asin: 'B00U26V4VQ',
  brand: 'Hot Wheels',         // API: product.brand
  category: 'toys-and-games',  // API: product.rootCategory
  error: null
}
```

**✅ 完全に同じデータが取得可能**

---

## Keepa API の仕様

### エンドポイント

```
GET https://api.keepa.com/product
```

### リクエストパラメータ

| パラメータ | 必須 | 説明 | 例 |
|-----------|------|------|-----|
| `key` | ✅ | Keepa API Key | `abc123...` |
| `domain` | ✅ | Amazonドメイン | `1` (Amazon.com) |
| `asin` | ✅ | 商品ASIN | `B00U26V4VQ` |

### レスポンス

```json
{
  "tokensLeft": 100,
  "products": [
    {
      "asin": "B00U26V4VQ",
      "title": "Hot Wheels 9-Car Gift Pack",
      "brand": "Hot Wheels",
      "categories": [165793011, 2625374011],
      "rootCategory": 165793011,
      ...
    }
  ]
}
```

---

## 料金・制限

### 基本プラン: €19/月（約3,000円/月）

- **レート**: 1トークン/分 = **1製品/分**
- トークンは60分で期限切れ
- 処理時間: 100件 = 約1.7時間（現在: 50分）

### コスト試算

| 月間処理件数 | 現在のコスト | Keepa APIコスト |
|-------------|-------------|-----------------|
| 100件 | ✅ 無料 | €19（約3,000円） |
| 1,000件 | ✅ 無料 | €19（約3,000円） |
| 10,000件 | ✅ 無料 | €19 + 追加トークン購入 |

**安定性を重視するなら、€19/月のコストは妥当**

---

## 移行手順

### 1. Keepa API Keyを取得

1. [Keepa.com](https://keepa.com/) にアクセス
2. アカウント登録（€19/月プラン）
3. API Keyを取得

### 2. API Keyをスクリプトに設定

```javascript
function setKeepaApiKey() {
  const apiKey = 'YOUR_KEEPA_API_KEY_HERE';
  PropertiesService.getScriptProperties().setProperty('KEEPA_API_KEY', apiKey);
}
```

Apps Scriptエディタで実行。

### 3. 実装を置き換え

#### 変更前（src/Scraper.gs）

```javascript
function getAmazonData(asin) {
  // スクレイピング処理
  const data = fetchAmazonPage(asin, 'https://www.amazon.com/dp/', 'US');
  ...
}
```

#### 変更後（Keepa API）

```javascript
function getAmazonData(asin) {
  // Keepa API処理
  const data = getAmazonDataViaKeepa(asin);
  ...
}
```

`keepa-api-example.gs` の `getAmazonDataViaKeepa()` を使用。

### 4. カテゴリマッピングを組み込む

`keepa-category-mapping.gs` を使用します。これは以下の3段階でカテゴリコードを取得します：

#### 変換ロジック

```javascript
// 優先1: ノードID → カテゴリコード マッピングテーブル
165793011 → 'toys-and-games'
3375251   → 'sporting'
1084128   → 'office-products'

// フォールバック1: カテゴリ名 → カテゴリコード パターンマッチング
"Toys & Games"        → 'toys-and-games'
"Sports & Outdoors"   → 'sporting'

// フォールバック2: カテゴリ名を自動変換
"New Category Name"   → 'new-category-name'
```

**主要25カテゴリは既にマッピング済み**なので、ほとんどのケースで正確に変換できます。

### 5. 待機時間を調整

```javascript
// src/Config.gs
function getDefaultConfig() {
  return {
    ...
    WAIT_TIME_MS: 60000,  // 30秒 → 60秒に変更（Keepa制限）
    ...
  };
}
```

---

## メリット・デメリット

### ✅ メリット

1. **Bot認定リスクなし** - 公式APIなので安定
2. **メンテナンス不要** - Amazon側のHTML変更の影響なし
3. **実装がシンプル** - 正規表現不要、JSON解析のみ
4. **データ品質向上** - 構造化データで抽出ミスなし
5. **エラー処理が簡単** - HTTPステータスとエラーメッセージが明確

### ❌ デメリット

1. **有料** - €19/月（約3,000円/月）
2. **レート制限** - 基本プランは1リクエスト/分（現在より遅い）
3. **カテゴリマッピング** - ノードID→カテゴリコードの変換が必要

---

## 推奨事項

### 📌 **移行を推奨します**

理由：
- 現在のスクレイピングは **Bot認定で頻繁にエラー** が発生している
- Amazon側の構造変更で **定期的なメンテナンスが必要**
- Keepa APIは **月3,000円で安定性が大幅に向上**
- ビジネス用途なら **コストパフォーマンスが高い**

### 段階的な移行案

#### フェーズ1: テスト運用（1週間）

- 少数のASIN（10〜20件）でKeepa APIをテスト
- カテゴリマッピングを追加・検証
- エラーハンドリングを確認

#### フェーズ2: 並行運用（1週間）

- スクレイピングとKeepa APIを両方実行
- データ品質を比較
- エラー率を測定

#### フェーズ3: 完全移行

- Keepa APIに完全移行
- スクレイピングコードを削除（または保守モードに）
- 運用監視

---

## サンプルコード

### `keepa-category-mapping.gs`（推奨）

カテゴリコード変換機能を含む完全版：

```javascript
// ASINから商品データ取得（カテゴリコード自動変換）
const data = getAmazonDataViaKeepaWithCategoryCode('B00U26V4VQ');
// → { asin: 'B00U26V4VQ', brand: 'Hot Wheels', category: 'toys-and-games' }
```

主要な関数：
- `getAmazonDataViaKeepaWithCategoryCode(asin)` - **カテゴリコード変換付き**取得
- `mapNodeIdToCategoryCode(nodeId)` - ノードID → カテゴリコード変換
- `guessCategoryCodeFromName(categoryName)` - カテゴリ名から推測
- `setKeepaApiKey()` - API Key設定
- `testKeepaWithCategoryCode()` - テスト実行

### `keepa-api-example.gs`（基本版）

基本的な実装例（カテゴリコード変換なし）：

- `getAmazonDataViaKeepa(asin)` - ASINから商品データ取得
- `getCategoryCode(nodeId)` - シンプルなカテゴリノードID変換

---

## 参考リンク

- [Keepa.com](https://keepa.com/)
- [Keepa API Documentation](https://keepa.com/#!api)
- [Keepa API Python SDK Docs](https://keepaapi.readthedocs.io/)
- [Keepa API GitHub - Product.java](https://github.com/keepacom/api_backend/blob/master/src/main/java/com/keepa/api/backend/structs/Product.java)

---

## FAQ

### Q1: 無料トライアルはありますか？

**A**: Keepa APIに無料トライアルはありません。€19/月のサブスクリプションが必要です。

### Q2: 1分に1件しか処理できないのは遅すぎませんか？

**A**: 基本プランは1トークン/分ですが、より高速なプランも提供されています。詳細はKeepaに問い合わせてください。また、GASの実行時間制限（6分）を考えると、バッチ処理で十分対応可能です。

### Q3: カテゴリマッピングはどうやって作成しますか？

**A**: `keepa-category-mapping.gs` に**主要25カテゴリは既にマッピング済み**です。新しいカテゴリが必要な場合は、以下の手順で追加します：

1. Keepa APIで返される `rootCategory` をログで確認
2. 実際のAmazon検索URLで使われているカテゴリコード（`i=`パラメータ）を確認
3. `mapNodeIdToCategoryCode()` のマッピングテーブルに追加

マッピングがない場合は、カテゴリ名から自動推測されるため、ほとんどのケースで問題ありません。

### Q4: エラーが発生した場合、スクレイピングにフォールバックできますか？

**A**: 可能です。Keepa APIでエラーが発生した場合、現在のスクレイピング処理を実行するフォールバック機構を実装できます。

```javascript
function getAmazonData(asin) {
  // 優先: Keepa API
  const keepaData = getAmazonDataViaKeepa(asin);
  if (keepaData.brand && !keepaData.error) {
    return keepaData;
  }

  // フォールバック: スクレイピング
  Logger.log(`Keepa API failed, falling back to scraping for ${asin}`);
  return fetchAmazonPage(asin, 'https://www.amazon.com/dp/', 'US');
}
```

---

## まとめ

Keepa APIは、**安定性を重視するなら最適な選択** です。月3,000円のコストで、Bot認定のリスクとメンテナンス負担を大幅に削減できます。

段階的な移行で、リスクを最小限に抑えながら移行することを推奨します。
