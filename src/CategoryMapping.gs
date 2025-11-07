/**
 * Amazon Search URL Generator - CategoryMapping.gs
 * カテゴリマッピング管理（ノードID ↔ カテゴリコード）
 */

/**
 * カテゴリマッピングシートからマッピングを読み込む
 * @return {Object} ノードID → カテゴリコードのマッピング
 */
function loadCategoryMapping() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const mappingSheet = ss.getSheetByName('カテゴリマッピング');

    if (!mappingSheet) {
      Logger.log('カテゴリマッピングシートが見つかりません。空のマッピングを返します。');
      return {};
    }

    // カテゴリマッピングシートの値を取得（A列: NodeID, B列: CategoryCode）
    const data = mappingSheet.getRange('A2:B100').getValues();
    const mapping = {};

    data.forEach(row => {
      const nodeId = row[0];
      const categoryCode = row[1];

      if (nodeId && categoryCode) {
        // NodeIDを文字列として扱う（大きな数値対策）
        mapping[nodeId.toString()] = categoryCode;
      }
    });

    Logger.log(`Loaded ${Object.keys(mapping).length} category mappings from sheet`);
    return mapping;

  } catch (error) {
    Logger.log(`Error loading category mapping: ${error.message}`);
    return {};
  }
}

/**
 * ノードIDをカテゴリコードに変換
 * @param {number|string} nodeId - Keepa カテゴリノードID
 * @return {string|null} カテゴリコード（例: "toys-and-games"）、見つからない場合はnull
 */
function mapNodeIdToCategoryCode(nodeId) {
  if (!nodeId) {
    return null;
  }

  // シートからマッピングを読み込む
  const mapping = loadCategoryMapping();

  // ノードIDを文字列に変換して検索
  const nodeIdStr = nodeId.toString();

  if (mapping[nodeIdStr]) {
    Logger.log(`Mapped node ${nodeIdStr} → ${mapping[nodeIdStr]}`);
    return mapping[nodeIdStr];
  }

  // マッピングが見つからない場合はnullを返す
  Logger.log(`No mapping found for node ${nodeIdStr}`);
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
