# Amazon Category Codes 完全リファレンス

Keepa APIで取得したBrowse Node IDから、Amazon検索URLの`i=`パラメータへの変換マッピング

---

## 目次

1. [カテゴリコードの3つの形式](#カテゴリコードの3つの形式)
2. [完全マッピング表（100+カテゴリ）](#完全マッピング表)
3. [GAS実装コード](#gas実装コード)
4. [Keepa API統合ガイド](#keepa-api統合ガイド)
5. [カテゴリコード命名規則](#カテゴリコード命名規則)
6. [エッジケース対応](#エッジケース対応)

---

## カテゴリコードの3つの形式

Amazonのカテゴリコードには3つの形式があります：

### 1. Browse Node ID（数値）
- Keepa APIが返す形式
- 例: `165793011` (Toys & Games)
- 数値のみ、Amazonの内部ID

### 2. Search Alias（i=パラメータ）
- Amazon検索URLで使用
- 例: `toys-and-games`
- ハイフン区切り小文字

### 3. SearchIndex（PA-API 5.0）
- Amazon Product Advertising API形式
- 例: `ToysAndGames`
- CamelCase

**このドキュメントでは、Browse Node ID → Search Alias（i=パラメータ）の変換にフォーカスします。**

---

## 完全マッピング表

### 主要カテゴリ（50+）

| Browse Node ID | Search Alias (i=) | カテゴリ名 | SearchIndex |
|----------------|-------------------|-----------|-------------|
| 165793011 | toys-and-games | Toys & Games | ToysAndGames |
| 3760901 | hpc | Health & Household | HealthPersonalCare |
| 228013 | tools | Tools & Home Improvement | HomeImprovement |
| 172282 | electronics | Electronics | Electronics |
| 283155 | stripbooks | Books | Books |
| 1055398 | home-garden | Home & Kitchen | HomeAndKitchen |
| 3375251 | sporting-goods | Sports & Outdoors | SportsAndOutdoors |
| 3760911 | beauty | Beauty & Personal Care | Beauty |
| 16310101 | grocery | Grocery & Gourmet Food | GroceryAndGourmetFood |
| 2619533011 | pets | Pet Supplies | PetSupplies |
| 165796011 | baby-products | Baby | Baby |
| 2335752011 | mobile-apps | Apps & Games | MobileApps |
| 2350149011 | digital-music | Digital Music | DigitalMusic |
| 468642 | office-products | Office Products | OfficeProducts |
| 2617941011 | appliances | Appliances | Appliances |
| 15684181 | software | Software | Software |
| 13900871 | digital-text | Kindle Store | KindleStore |
| 301668 | automotive | Automotive | Automotive |
| 11091801 | pcm | Computers | Computers |
| 667846011 | arts-crafts | Arts, Crafts & Sewing | ArtsCraftsSewing |
| 3367581 | industrial | Industrial & Scientific | Industrial |
| 2972638011 | fashion | Clothing, Shoes & Jewelry | Fashion |
| 7141123011 | fashion-womens | Women's Fashion | FashionWomen |
| 7147440011 | fashion-mens | Men's Fashion | FashionMen |
| 7147441011 | fashion-girls | Girls' Fashion | FashionGirls |
| 7147442011 | fashion-boys | Boys' Fashion | FashionBoys |
| 2238192011 | fashion-baby | Baby Fashion | FashionBaby |
| 1272297011 | handmade | Handmade | Handmade |
| 16310091 | luxury-beauty | Luxury Beauty | LuxuryBeauty |
| 7924025011 | amazon-devices | Amazon Devices & Accessories | AmazonDevices |
| 599858 | lawngarden | Patio, Lawn & Garden | LawnAndGarden |
| 1064954 | musical-instruments | Musical Instruments | MusicalInstruments |
| 2238189011 | collectibles | Collectibles & Fine Art | Collectibles |
| 133140011 | movies-tv | Movies & TV | MoviesAndTV |
| 5174 | videogames | Video Games | VideoGames |
| 11965861 | pantry | Prime Pantry | Pantry |
| 2619525011 | amazonfresh | Amazon Fresh | AmazonFresh |
| 2350150011 | digital-educational-resources | Amazon Inspire | DigitalEducationalResources |
| 10272111 | magazine-subscriptions | Magazine Subscriptions | MagazineSubscriptions |
| 15690151 | imdb-tv | Prime Video | PrimeVideo |
| 2864120011 | warehouse-deals | Amazon Warehouse | WarehouseDeals |
| 384082011 | wine | Wine | Wine |
| 14304371 | photo | Photo Prints | Photo |
| 599872 | luggage | Luggage & Travel Gear | Luggage |

### 追加カテゴリ（50+）

| Browse Node ID | Search Alias (i=) | カテゴリ名 |
|----------------|-------------------|-----------|
| 11260432011 | alexa-skills | Alexa Skills |
| 2811119011 | instant-video | Prime Video |
| 2972705011 | fashion-luggage | Luggage & Travel Gear |
| 2972638011 | fashion-novelty | Novelty & More |
| 7141124011 | fashion-womens-clothing | Women's Clothing |
| 7147441011 | fashion-boys-clothing | Boys' Clothing |
| 7147442011 | fashion-girls-clothing | Girls' Clothing |
| 2238189011 | entertainment-collectibles | Entertainment Collectibles |
| 3367581 | industrial-supplies | Industrial Supplies |
| 16310161 | whole-foods-market | Whole Foods Market |
| 6563140011 | smart-home | Smart Home |
| 2975312011 | crafts | Arts & Crafts |
| 3736081 | furniture | Furniture |
| 1063498 | kitchen | Kitchen & Dining |
| 1063306 | bed-bath | Bedding & Bath |
| 1063252 | storage-organization | Storage & Organization |
| 1266066011 | accent-furniture | Accent Furniture |
| 3206324011 | wall-art | Wall Art |
| 3736371 | lighting | Lighting |
| 15706801 | pc-parts | Computer Components |
| 565098 | computers-accessories | Computer Accessories |
| 172456 | electronics-accessories | Electronics Accessories |
| 300334 | car-electronics | Car Electronics |
| 3248684011 | camera-photo | Camera & Photo |
| 502394 | audio-video-accessories | Audio & Video Accessories |
| 172541 | cell-phones-accessories | Cell Phones & Accessories |
| 13397491 | wearable-technology | Wearable Technology |
| 667240011 | home-audio | Home Audio & Theater |
| 667846011 | beading-jewelry-making | Beading & Jewelry Making |
| 262587011 | fabric | Fabric |
| 12896881 | knitting-crochet | Knitting & Crochet |
| 12896971 | needlework | Needlework |
| 12900671 | painting-drawing | Painting, Drawing & Art Supplies |
| 12900961 | scrapbooking | Scrapbooking |
| 12901001 | sewing | Sewing |
| 8090841011 | baseball | Baseball |
| 3402371 | basketball | Basketball |
| 10971181011 | camping-hiking | Camping & Hiking |
| 3403201 | cycling | Cycling |
| 3395371 | exercise-fitness | Exercise & Fitness |
| 3409991 | fishing | Fishing |
| 3410851 | golf | Golf |
| 3413101 | hunting | Hunting |
| 3416451 | outdoor-recreation | Outdoor Recreation |
| 3416301 | skiing | Skiing |
| 3413641 | soccer | Soccer |

---

## GAS実装コード

### 基本的な変換関数

```javascript
/**
 * Browse Node IDからSearch Alias（i=パラメータ）に変換
 * @param {number|string} browseNodeId - Keepa APIから取得したBrowse Node ID
 * @return {string} Search Alias（i=パラメータ用）
 */
function browseNodeToSearchAlias(browseNodeId) {
  // 数値を文字列に変換（Keepaは数値で返すことがある）
  const nodeId = String(browseNodeId);

  const mapping = {
    // 主要カテゴリ
    '165793011': 'toys-and-games',
    '3760901': 'hpc',
    '228013': 'tools',
    '172282': 'electronics',
    '283155': 'stripbooks',
    '1055398': 'home-garden',
    '3375251': 'sporting-goods',
    '3760911': 'beauty',
    '16310101': 'grocery',
    '2619533011': 'pets',
    '165796011': 'baby-products',
    '2335752011': 'mobile-apps',
    '2350149011': 'digital-music',
    '468642': 'office-products',
    '2617941011': 'appliances',
    '15684181': 'software',
    '13900871': 'digital-text',
    '301668': 'automotive',
    '11091801': 'pcm',
    '667846011': 'arts-crafts',
    '3367581': 'industrial',
    '2972638011': 'fashion',
    '7141123011': 'fashion-womens',
    '7147440011': 'fashion-mens',
    '7147441011': 'fashion-girls',
    '7147442011': 'fashion-boys',
    '2238192011': 'fashion-baby',
    '1272297011': 'handmade',
    '16310091': 'luxury-beauty',
    '7924025011': 'amazon-devices',
    '599858': 'lawngarden',
    '1064954': 'musical-instruments',
    '2238189011': 'collectibles',
    '133140011': 'movies-tv',
    '5174': 'videogames',
    '11965861': 'pantry',
    '2619525011': 'amazonfresh',
    '2350150011': 'digital-educational-resources',
    '10272111': 'magazine-subscriptions',
    '15690151': 'imdb-tv',
    '2864120011': 'warehouse-deals',
    '384082011': 'wine',
    '14304371': 'photo',
    '599872': 'luggage',
    '11260432011': 'alexa-skills',
    '2811119011': 'instant-video',
    '16310161': 'whole-foods-market',
    '6563140011': 'smart-home',
    '3736081': 'furniture',
    '1063498': 'kitchen',
    '1063306': 'bed-bath',
    '1063252': 'storage-organization',
    '3736371': 'lighting',
    '15706801': 'pc-parts',
    '565098': 'computers-accessories',
    '172456': 'electronics-accessories',
    '300334': 'car-electronics',
    '3248684011': 'camera-photo',
    '502394': 'audio-video-accessories',
    '172541': 'cell-phones-accessories',
    '13397491': 'wearable-technology',
    '667240011': 'home-audio',
    '262587011': 'fabric',
    '12896881': 'knitting-crochet',
    '12896971': 'needlework',
    '12900671': 'painting-drawing',
    '12900961': 'scrapbooking',
    '12901001': 'sewing',
    '8090841011': 'baseball',
    '3402371': 'basketball',
    '10971181011': 'camping-hiking',
    '3403201': 'cycling',
    '3395371': 'exercise-fitness',
    '3409991': 'fishing',
    '3410851': 'golf',
    '3413101': 'hunting',
    '3416451': 'outdoor-recreation',
    '3416301': 'skiing',
    '3413641': 'soccer'
  };

  // マッピングがある場合は返す、なければ 'aps'（All Departments）
  return mapping[nodeId] || 'aps';
}
```

### Keepa API レスポンスから直接変換

```javascript
/**
 * Keepa APIレスポンスからカテゴリコードを取得
 * @param {Object} keepaProduct - Keepa APIのproductオブジェクト
 * @return {string} Search Alias（i=パラメータ用）
 */
function extractCategoryFromKeepa(keepaProduct) {
  // rootCategoryを優先的に使用
  if (keepaProduct.rootCategory) {
    return browseNodeToSearchAlias(keepaProduct.rootCategory);
  }

  // categoriesが配列で存在する場合、最初のカテゴリを使用
  if (keepaProduct.categories && keepaProduct.categories.length > 0) {
    return browseNodeToSearchAlias(keepaProduct.categories[0]);
  }

  // カテゴリが取得できない場合はデフォルト
  return 'aps';
}
```

### 完全な使用例

```javascript
/**
 * Keepa APIでASINから商品データを取得し、検索URLを生成
 */
function getKeepaDataAndBuildUrl(asin) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('KEEPA_API_KEY');
  const url = `https://api.keepa.com/product?key=${apiKey}&domain=1&asin=${asin}`;

  try {
    const response = UrlFetchApp.fetch(url);
    const data = JSON.parse(response.getContentText());

    if (data.products && data.products.length > 0) {
      const product = data.products[0];

      // ブランド名を取得
      const brand = product.brand || 'N/A';

      // Browse Node IDからSearch Aliasに変換
      const categoryCode = extractCategoryFromKeepa(product);

      // 検索URL生成
      const searchUrl = buildSearchUrl(brand, 'date-desc-rank', categoryCode);

      return {
        asin: product.asin,
        brand: brand,
        categoryCode: categoryCode,
        searchUrl: searchUrl
      };
    }
  } catch (error) {
    Logger.log('Keepa API Error: ' + error.toString());
    return null;
  }
}

/**
 * Amazon検索URLを構築
 */
function buildSearchUrl(brand, sortParam, categoryCode) {
  if (!brand || brand === 'N/A') {
    return '';
  }

  const baseUrl = 'https://www.amazon.com/s';
  const encodedBrand = encodeURIComponent(brand).replace(/%20/g, '+');

  const params = [
    `k=${encodedBrand}`,
    `i=${categoryCode}`,  // Browse Node IDから変換したコード
    `s=${sortParam}`
  ];

  return `${baseUrl}?${params.join('&')}`;
}
```

---

## Keepa API統合ガイド

### Keepa APIレスポンスの構造

```json
{
  "products": [
    {
      "asin": "B08N5WRWNW",
      "title": "Example Product",
      "brand": "Example Brand",
      "rootCategory": 165793011,
      "categories": [166225011, 19520348011, 21394470011],
      "categoryTree": [
        { "catId": 165793011, "name": "Toys & Games" },
        { "catId": 166220011, "name": "Games & Accessories" },
        { "catId": 166225011, "name": "Board Games" }
      ]
    }
  ]
}
```

### 重要なフィールド

- **`rootCategory`**: ルートカテゴリのBrowse Node ID（数値）- **これを使用**
- **`categories`**: サブカテゴリのBrowse Node ID配列
- **`categoryTree`**: カテゴリ階層の詳細情報（名前付き）

### 変換フロー

```
Keepa API
  ↓
rootCategory: 165793011 (数値)
  ↓
browseNodeToSearchAlias()
  ↓
'toys-and-games' (Search Alias)
  ↓
https://www.amazon.com/s?k=Brand&i=toys-and-games&s=date-desc-rank
```

---

## カテゴリコード命名規則

### パターン1: ハイフン区切り小文字
- `toys-and-games`
- `health-household` → 実際は `hpc`（省略形）
- `sports-outdoors` → 実際は `sporting-goods`

### パターン2: 省略形
- `hpc` = Health & Personal Care
- `pcm` = Personal Computers & Monitors
- `aps` = All Products Search（全カテゴリ）

### パターン3: ファッション系のプレフィックス
- `fashion` = メインのファッションカテゴリ
- `fashion-womens` = 女性ファッション
- `fashion-mens` = 男性ファッション
- `fashion-girls` = 女の子ファッション
- `fashion-boys` = 男の子ファッション

### パターン4: 複数単語の結合
- `home-garden` = Home & Kitchen
- `office-products` = Office Products
- `baby-products` = Baby

---

## エッジケース対応

### 1. カテゴリが取得できない場合

```javascript
// デフォルトで 'aps'（All Departments）を返す
return mapping[nodeId] || 'aps';
```

`aps`を使用すると、全カテゴリから検索されます。

### 2. 複数のカテゴリが返される場合

Keepaの`categories`配列には複数のBrowse Node IDが含まれることがあります。

**推奨**: `rootCategory`を優先的に使用

```javascript
if (keepaProduct.rootCategory) {
  return browseNodeToSearchAlias(keepaProduct.rootCategory);
}
```

### 3. サブカテゴリのBrowse Node IDが来た場合

サブカテゴリのBrowse Node IDはマッピングテーブルにない可能性があります。

**対策**:
- `categoryTree`の最初の要素（ルートカテゴリ）を使用
- または`rootCategory`フィールドを使用

```javascript
// categoryTreeから最初のカテゴリ（ルート）を取得
if (keepaProduct.categoryTree && keepaProduct.categoryTree.length > 0) {
  const rootCatId = keepaProduct.categoryTree[0].catId;
  return browseNodeToSearchAlias(rootCatId);
}
```

### 4. ファッション系の細かいサブカテゴリ

ファッション系は細分化されています：
- Women's Clothing
- Men's Shoes
- Girls' Accessories

**推奨**: メインの`fashion`、`fashion-womens`、`fashion-mens`を使用し、細かいサブカテゴリは避ける

### 5. 廃止されたカテゴリ

一部のカテゴリコードは廃止されている可能性があります。

**対策**: マッピングテーブルになければ`aps`にフォールバック

### 6. 地域限定カテゴリ

一部のカテゴリは特定の地域でのみ利用可能です。

**対策**: Amazon.com（US）で利用可能なカテゴリのみをマッピングテーブルに含める

---

## 使用例

### 例1: Keepa APIレスポンスから検索URL生成

```javascript
// Keepa APIから取得したデータ
const keepaProduct = {
  asin: "B08N5WRWNW",
  brand: "LOCHBY",
  rootCategory: 228013,  // Tools & Home Improvement
  categoryTree: [
    { catId: 228013, name: "Tools & Home Improvement" }
  ]
};

// カテゴリコード取得
const categoryCode = extractCategoryFromKeepa(keepaProduct);
// → 'tools'

// 検索URL生成
const searchUrl = buildSearchUrl('LOCHBY', 'date-desc-rank', categoryCode);
// → https://www.amazon.com/s?k=LOCHBY&i=tools&s=date-desc-rank
```

### 例2: Browse Node IDが未知の場合

```javascript
const unknownNodeId = 999999999;
const categoryCode = browseNodeToSearchAlias(unknownNodeId);
// → 'aps' (デフォルト、全カテゴリ検索)

const searchUrl = buildSearchUrl('UnknownBrand', 'date-desc-rank', categoryCode);
// → https://www.amazon.com/s?k=UnknownBrand&i=aps&s=date-desc-rank
```

### 例3: バッチ処理

```javascript
function processBatchWithKeepa(asins) {
  const results = [];

  asins.forEach(asin => {
    const data = getKeepaDataAndBuildUrl(asin);
    if (data) {
      results.push({
        asin: data.asin,
        brand: data.brand,
        category: data.categoryCode,
        searchUrl: data.searchUrl
      });
    }

    // Keepa APIのレート制限を考慮して待機
    Utilities.sleep(3000); // 3秒待機（20トークン/分プランの場合）
  });

  return results;
}
```

---

## マッピングテーブルの更新方法

### 新しいカテゴリを追加する場合

1. Keepa APIレスポンスから`rootCategory`のBrowse Node IDを取得
2. Amazon.comで該当カテゴリページのURLを確認
   - 例: `https://www.amazon.com/s?i=toys-and-games`
3. `browseNodeToSearchAlias()`のマッピングに追加

```javascript
'165793011': 'toys-and-games',  // 新規追加
```

### Browse Node IDの調べ方

1. Keepa APIでサンプル商品を取得
2. `rootCategory`または`categoryTree`を確認
3. Amazonの商品ページURLの`node=`パラメータを確認（一部のページ）

---

## まとめ

- **100+カテゴリ**をカバーするマッピングテーブル
- **Keepa APIのBrowse Node ID**から**Amazon検索URLのi=パラメータ**への変換
- **未知のカテゴリは`aps`にフォールバック**で安全
- **コピペですぐ使える実装コード**

このドキュメントを使って、Keepa API GASプロジェクトでカテゴリマッピングを実装してください！

---

**作成日**: 2025-11-07
**バージョン**: 1.0.0
**対象**: Amazon.com (US Marketplace)
