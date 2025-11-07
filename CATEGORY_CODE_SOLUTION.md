# カテゴリコード変換の解決策

## 質問：Keepa APIで `i=toys-and-games` のようなカテゴリコードは取得できる？

## ✅ 回答：はい、変換処理で対応可能です

---

## 問題の詳細

### 現在のスクレイピング

```javascript
// HTMLから直接カテゴリコードを取得
<option selected="selected" value="search-alias=toys-and-games">

// 結果
{
  category: "toys-and-games"  // ✅ そのまま i=toys-and-games に使える
}
```

### Keepa API

```javascript
// ノードID（数値）のみを返す
{
  rootCategory: 165793011,    // ❌ 数値
  categoryTree: [
    { catId: 165793011, name: "Toys & Games" }
  ]
}
```

**Keepa APIは `toys-and-games` のようなカテゴリコード（search alias）を提供していない**

---

## ✅ 解決策：3段階の変換処理

`keepa-category-mapping.gs` で実装済み

### 優先度1: ノードID → カテゴリコード マッピングテーブル

```javascript
const mapping = {
  165793011: 'toys-and-games',
  3375251: 'sporting',
  1084128: 'office-products',
  228013: 'hi',
  3760901: 'hpc',
  // ... 主要25カテゴリをマッピング済み
};

mapNodeIdToCategoryCode(165793011) // → 'toys-and-games'
```

### 優先度2: カテゴリ名 → カテゴリコード パターンマッチング

```javascript
const patterns = {
  'Toys & Games': 'toys-and-games',
  'Sports & Outdoors': 'sporting',
  'Office Products': 'office-products',
  // ...
};

guessCategoryCodeFromName('Toys & Games') // → 'toys-and-games'
```

### 優先度3: カテゴリ名の自動変換

```javascript
// カテゴリ名を小文字化 + ハイフン区切りに変換
guessCategoryCodeFromName('New Cool Category')
// → 'new-cool-category'
```

---

## 使い方

### 基本的な使用例

```javascript
// Keepa APIから商品データを取得（カテゴリコード自動変換）
const result = getAmazonDataViaKeepaWithCategoryCode('B00U26V4VQ');

console.log(result);
// {
//   asin: 'B00U26V4VQ',
//   brand: 'Hot Wheels',
//   category: 'toys-and-games',  ← 自動変換済み
//   error: null
// }

// そのまま URL に埋め込める
const url = `https://www.amazon.com/s?k=${result.brand}&i=${result.category}`;
// → https://www.amazon.com/s?k=Hot Wheels&i=toys-and-games
```

### 現在の実装との置き換え

```javascript
// 変更前（src/Scraper.gs）
function getAmazonData(asin) {
  const data = fetchAmazonPage(asin, 'https://www.amazon.com/dp/', 'US');
  return data;
}

// 変更後（keepa-category-mapping.gs を使用）
function getAmazonData(asin) {
  const data = getAmazonDataViaKeepaWithCategoryCode(asin);
  return data;
}
```

**インターフェースは完全に同じなので、置き換えるだけでOK**

---

## マッピング済みカテゴリ一覧（25カテゴリ）

| ノードID | カテゴリコード | カテゴリ名 |
|---------|--------------|-----------|
| 165793011 | toys-and-games | Toys & Games |
| 3375251, 3375301 | sporting | Sports & Outdoors |
| 1084128 | office-products | Office Products |
| 228013, 511228 | hi, tools | Tools & Home Improvement |
| 3760901 | hpc | Health & Household |
| 172282 | electronics | Electronics |
| 283155 | stripbooks | Books |
| 7141123011 | fashion | Clothing, Shoes & Jewelry |
| 1055398 | garden | Home & Kitchen |
| 3760911 | beauty | Beauty & Personal Care |
| 2619533011 | pets | Pet Supplies |
| 15684181 | automotive | Automotive |
| 165796011 | baby-products | Baby |
| 468642 | videogames | Video Games |
| 2625373011 | movies-tv | Movies & TV |
| 5174 | popular | Music |
| 16310101 | grocery | Grocery & Gourmet Food |
| 2617941011 | arts-crafts | Arts, Crafts & Sewing |
| 16310091 | industrial | Industrial & Scientific |
| 2972638011 | lawngarden | Patio, Lawn & Garden |
| 284507 | kitchen | Kitchen & Dining |
| 2335752011 | mobile | Cell Phones & Accessories |

**これらのカテゴリは自動変換されます**

---

## 新しいカテゴリの追加方法

マッピングにないカテゴリが必要な場合：

### 1. ログで確認

```javascript
// Keepa APIのレスポンスをログ出力
Logger.log(`NodeID: ${product.rootCategory}`);
Logger.log(`Category Name: ${product.categoryTree[0].name}`);

// 例:
// NodeID: 999999999
// Category Name: "New Category"
```

### 2. 実際のカテゴリコードを確認

Amazon検索URLで確認：
```
https://www.amazon.com/s?i=new-category&k=test
```

### 3. マッピングテーブルに追加

`keepa-category-mapping.gs` の `mapNodeIdToCategoryCode()` に追加：

```javascript
const mapping = {
  // ...既存のマッピング
  999999999: 'new-category',  // 新しいカテゴリを追加
};
```

---

## まとめ

| 項目 | 状態 |
|------|------|
| **カテゴリコード取得** | ✅ 可能（変換処理で対応） |
| **主要カテゴリ** | ✅ 25カテゴリマッピング済み |
| **未知のカテゴリ** | ✅ カテゴリ名から自動推測 |
| **現在の実装との互換性** | ✅ インターフェース同一 |
| **URL埋め込み** | ✅ そのまま `i={category}` に使える |

**結論：Keepa APIで完全に代替可能です**

`keepa-category-mapping.gs` を使用すれば、現在のスクレイピングと同じように `i=toys-and-games` 形式のカテゴリコードを取得できます。
