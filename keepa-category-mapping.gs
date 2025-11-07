/**
 * Keepa API カテゴリマッピング
 * ノードID → Amazonカテゴリコード（i=パラメータ）の変換
 */

/**
 * KeepaのノードIDをAmazonのカテゴリコード（search alias）に変換
 * @param {number} nodeId - Keepa カテゴリノードID
 * @return {string} カテゴリコード（例: "toys-and-games"）
 */
function mapNodeIdToCategoryCode(nodeId) {
  // ノードID → カテゴリコード（i=パラメータ）のマッピング
  const mapping = {
    // Toys & Games
    165793011: 'toys-and-games',

    // Sports & Outdoors
    3375251: 'sporting',
    3375301: 'sporting',  // Sports & Outdoors の別のノードID

    // Office Products
    1084128: 'office-products',

    // Tools & Home Improvement
    228013: 'hi',
    511228: 'tools',

    // Health & Household
    3760901: 'hpc',

    // Electronics
    172282: 'electronics',

    // Books
    283155: 'stripbooks',

    // Clothing, Shoes & Jewelry
    7141123011: 'fashion',

    // Home & Kitchen
    1055398: 'garden',

    // Beauty & Personal Care
    3760911: 'beauty',

    // Pet Supplies
    2619533011: 'pets',

    // Automotive
    15684181: 'automotive',

    // Baby
    165796011: 'baby-products',

    // Video Games
    468642: 'videogames',

    // Movies & TV
    2625373011: 'movies-tv',

    // Music
    5174: 'popular',

    // Grocery & Gourmet Food
    16310101: 'grocery',

    // Arts, Crafts & Sewing
    2617941011: 'arts-crafts',

    // Industrial & Scientific
    16310091: 'industrial',

    // Patio, Lawn & Garden
    2972638011: 'lawngarden',

    // Kitchen & Dining
    284507: 'kitchen',

    // Cell Phones & Accessories
    2335752011: 'mobile',
  };

  if (mapping[nodeId]) {
    Logger.log(`Mapped node ${nodeId} → ${mapping[nodeId]}`);
    return mapping[nodeId];
  }

  // マッピングが見つからない場合はnullを返す（カテゴリ名から推測するため）
  Logger.log(`No mapping found for node ${nodeId}`);
  return null;
}

/**
 * カテゴリ名からカテゴリコードを推測
 * マッピングテーブルにない場合のフォールバック
 * @param {string} categoryName - カテゴリ名（例: "Toys & Games"）
 * @return {string} カテゴリコード（例: "toys-and-games"）
 */
function guessCategoryCodeFromName(categoryName) {
  if (!categoryName) {
    return '';
  }

  // カテゴリ名の特殊パターンを処理
  const patterns = {
    'Toys & Games': 'toys-and-games',
    'Sports & Outdoors': 'sporting',
    'Office Products': 'office-products',
    'Tools & Home Improvement': 'hi',
    'Health & Household': 'hpc',
    'Health & Personal Care': 'hpc',
    'Electronics': 'electronics',
    'Books': 'stripbooks',
    'Clothing, Shoes & Jewelry': 'fashion',
    'Home & Kitchen': 'garden',
    'Beauty & Personal Care': 'beauty',
    'Pet Supplies': 'pets',
    'Automotive': 'automotive',
    'Baby': 'baby-products',
    'Video Games': 'videogames',
    'Movies & TV': 'movies-tv',
    'Music': 'popular',
    'Grocery & Gourmet Food': 'grocery',
    'Arts, Crafts & Sewing': 'arts-crafts',
    'Industrial & Scientific': 'industrial',
    'Patio, Lawn & Garden': 'lawngarden',
    'Kitchen & Dining': 'kitchen',
    'Cell Phones & Accessories': 'mobile',
  };

  // 完全一致を試す
  if (patterns[categoryName]) {
    Logger.log(`Category name matched: ${categoryName} → ${patterns[categoryName]}`);
    return patterns[categoryName];
  }

  // 部分一致を試す（大文字小文字を無視）
  const lowerCategoryName = categoryName.toLowerCase();
  for (const [key, value] of Object.entries(patterns)) {
    if (lowerCategoryName.includes(key.toLowerCase())) {
      Logger.log(`Category name partial match: ${categoryName} → ${value}`);
      return value;
    }
  }

  // 推測できない場合は、カテゴリ名を小文字化してハイフンに変換
  const guessed = categoryName
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  Logger.log(`Category name guess: ${categoryName} → ${guessed}`);
  return guessed;
}

/**
 * Keepa APIでASINから商品データを取得（カテゴリコード付き）
 * @param {string} asin - Amazon ASIN
 * @return {Object} {asin, brand, category, error}
 */
function getAmazonDataViaKeepaWithCategoryCode(asin) {
  try {
    const apiKey = PropertiesService.getScriptProperties().getProperty('KEEPA_API_KEY');

    if (!apiKey) {
      return {
        asin: asin,
        brand: null,
        category: null,
        error: 'KEEPA_API_KEY が設定されていません'
      };
    }

    const url = `https://api.keepa.com/product?key=${apiKey}&domain=1&asin=${asin}`;
    Logger.log(`Fetching from Keepa API: ${asin}`);

    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true
    });

    const statusCode = response.getResponseCode();
    if (statusCode !== 200) {
      return {
        asin: asin,
        brand: null,
        category: null,
        error: `Keepa API エラー: HTTP ${statusCode}`
      };
    }

    const data = JSON.parse(response.getContentText());

    if (data.error) {
      return {
        asin: asin,
        brand: null,
        category: null,
        error: `Keepa API エラー: ${data.error.message || data.error}`
      };
    }

    if (data.tokensLeft !== undefined) {
      Logger.log(`Keepa tokens remaining: ${data.tokensLeft}`);
    }

    if (!data.products || data.products.length === 0) {
      return {
        asin: asin,
        brand: null,
        category: null,
        error: '製品が見つかりませんでした'
      };
    }

    const product = data.products[0];

    // ブランド名を取得
    const brand = product.brand || 'N/A';

    // ノードIDを取得
    let nodeId = null;
    if (product.rootCategory) {
      nodeId = product.rootCategory;
    } else if (product.categories && product.categories.length > 0) {
      nodeId = product.categories[0];
    }

    // ノードIDをカテゴリコードに変換（優先）
    let category = '';
    if (nodeId) {
      category = mapNodeIdToCategoryCode(nodeId);

      // マッピングが見つからない場合は、カテゴリ名から推測（フォールバック）
      if (!category && product.categoryTree && product.categoryTree.length > 0) {
        const categoryName = product.categoryTree[0].name;
        Logger.log(`Fallback to category name: ${categoryName}`);
        category = guessCategoryCodeFromName(categoryName);
      }
    }

    Logger.log(`Success: ASIN=${asin}, Brand=${brand}, NodeID=${nodeId}, Category=${category}`);

    return {
      asin: asin,
      brand: brand,
      category: category,
      error: null
    };

  } catch (error) {
    Logger.log(`Error fetching from Keepa API for ASIN ${asin}: ${error.message}`);
    return {
      asin: asin,
      brand: null,
      category: null,
      error: `例外エラー: ${error.message}`
    };
  }
}

/**
 * テスト用関数
 */
function testKeepaWithCategoryCode() {
  const testCases = [
    'B00U26V4VQ',  // Toys & Games
    'B08L5VG8XN',  // Sporting Goods (例)
    'B07PDHSJ1N',  // Office Products (例)
  ];

  testCases.forEach(asin => {
    const result = getAmazonDataViaKeepaWithCategoryCode(asin);
    Logger.log(JSON.stringify(result, null, 2));
  });
}
