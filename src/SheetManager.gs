/**
 * Amazon Search URL Generator - SheetManager.gs
 * スプレッドシート操作
 */

/**
 * 対象シートを取得
 * @param {string} sheetName - シート名
 * @return {Sheet|null} シートオブジェクト
 */
function getTargetSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  let isNewSheet = false;

  // シートが存在しない場合は作成
  if (!sheet) {
    Logger.log(`シート "${sheetName}" が見つかりません。新規作成します。`);
    sheet = ss.insertSheet(sheetName);
    isNewSheet = true;
  }

  // ヘッダー行をチェック（新規シートまたは1行目が空の場合）
  const headerCell = sheet.getRange('A1').getValue();
  if (isNewSheet || !headerCell || headerCell === '') {
    Logger.log('ヘッダー行を作成します。');

    // ヘッダー行を作成
    sheet.getRange('A1').setValue('ASIN');
    sheet.getRange('B1').setValue('ブランド');
    sheet.getRange('C1').setValue('カテゴリ');
    sheet.getRange('D1').setValue('新着順URL');
    sheet.getRange('E1').setValue('関連順URL');

    // ヘッダー行のフォーマット
    const headerRange = sheet.getRange('A1:E1');
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285F4');
    headerRange.setFontColor('#FFFFFF');

    // 列幅を調整
    sheet.setColumnWidth(1, 120); // ASIN
    sheet.setColumnWidth(2, 150); // ブランド
    sheet.setColumnWidth(3, 100); // カテゴリ
    sheet.setColumnWidth(4, 150); // 新着順URL
    sheet.setColumnWidth(5, 150); // 関連順URL
  }

  return sheet;
}

/**
 * 行データを書き込む
 * @param {Sheet} sheet - シートオブジェクト
 * @param {number} rowNum - 行番号（1から開始）
 * @param {Object} config - 設定オブジェクト
 * @param {Object} data - データオブジェクト {brand, category, newUrl, relevanceUrl, source}
 * @param {string} urlType - URL生成方式（'brand_filter', 'keyword', 'hybrid'）オプション
 */
function writeRowData(sheet, rowNum, config, data, urlType) {
  try {
    const brandCol = columnLetterToIndex(config.BRAND_COLUMN);
    const categoryCol = columnLetterToIndex(config.CATEGORY_COLUMN);
    const newUrlCol = columnLetterToIndex(config.NEW_URL_COLUMN);
    const relevanceUrlCol = columnLetterToIndex(config.RELEVANCE_URL_COLUMN);

    // ブランド名を書き込み
    if (data.brand) {
      sheet.getRange(rowNum, brandCol).setValue(data.brand);
    }

    // カテゴリを書き込み
    if (data.category) {
      sheet.getRange(rowNum, categoryCol).setValue(data.category);
    }

    // 新着順URLを書き込み（HYPERLINK形式）
    if (data.newUrl) {
      if (data.newUrl.startsWith('=HYPERLINK')) {
        sheet.getRange(rowNum, newUrlCol).setFormula(data.newUrl);
      } else {
        sheet.getRange(rowNum, newUrlCol).setValue(data.newUrl);
      }
    }

    // 関連順URLを書き込み（HYPERLINK形式）
    if (data.relevanceUrl) {
      if (data.relevanceUrl.startsWith('=HYPERLINK')) {
        sheet.getRange(rowNum, relevanceUrlCol).setFormula(data.relevanceUrl);
      } else {
        sheet.getRange(rowNum, relevanceUrlCol).setValue(data.relevanceUrl);
      }
    }

    // F列にURL方式を記録
    if (urlType) {
      const urlTypeColumn = columnLetterToIndex('F');
      const urlTypeLabels = {
        'brand_filter': 'ブランド絞り込み',
        'keyword': 'キーワード検索',
        'hybrid': 'ハイブリッド'
      };
      const urlTypeLabel = urlTypeLabels[urlType] || urlType;
      sheet.getRange(rowNum, urlTypeColumn).setValue(urlTypeLabel);
    }

  } catch (error) {
    Logger.log(`Error writing row data at row ${rowNum}: ${error.message}`);
    throw error;
  }
}

/**
 * Keepa設定とカテゴリマッピングシートを初期化
 * メニューから実行される
 */
function initializeKeepaSheets() {
  try {
    initializeConfigSheet();
    initializeCategoryMappingSheet();

    SpreadsheetApp.getUi().alert(
      '初期設定完了',
      '「設定」シートにKEEPA_API_KEYを追加しました。\n「カテゴリマッピング」シートに89カテゴリを追加しました。\n\n次の手順：\n1. 「設定」シートのKEEPA_API_KEYにあなたのAPIキーを入力\n2. 「カテゴリマッピング」シートで必要に応じてカテゴリを追加・編集',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (error) {
    Logger.log(`Error in initializeKeepaSheets: ${error.message}`);
    SpreadsheetApp.getUi().alert('エラー', `初期設定中にエラーが発生しました: ${error.message}`, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * 設定シートにKEEPA_API_KEYを追加
 */
function initializeConfigSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let configSheet = ss.getSheetByName('設定');

  // 設定シートが存在しない場合は作成
  if (!configSheet) {
    Logger.log('設定シートを新規作成します。');
    configSheet = ss.insertSheet('設定');

    // ヘッダー行を作成
    configSheet.getRange('A1').setValue('設定名');
    configSheet.getRange('B1').setValue('値');

    const headerRange = configSheet.getRange('A1:B1');
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285F4');
    headerRange.setFontColor('#FFFFFF');

    // デフォルト設定を追加
    const defaultSettings = [
      ['ASIN_COLUMN', 'A'],
      ['BRAND_COLUMN', 'B'],
      ['CATEGORY_COLUMN', 'C'],
      ['NEW_URL_COLUMN', 'D'],
      ['RELEVANCE_URL_COLUMN', 'E'],
      ['TARGET_SHEET_NAME', '商品データ'],
      ['WAIT_TIME_MS', 20000],
      ['BATCH_SIZE', 10],
      ['SORT_NEW_PARAM', 'date-desc-rank'],
      ['SORT_RELEVANCE_PARAM', 'relevanceblender'],
      ['NEW_LABEL', '新着順'],
      ['RELEVANCE_LABEL', '関連順'],
      ['KEEPA_API_KEY', '']
    ];

    configSheet.getRange(2, 1, defaultSettings.length, 2).setValues(defaultSettings);
    configSheet.setColumnWidth(1, 200);
    configSheet.setColumnWidth(2, 200);

    Logger.log('設定シートを作成しました。');
    return;
  }

  // 設定シートが存在する場合は、KEEPA_API_KEYが存在するかチェック
  const data = configSheet.getRange('A2:A20').getValues();
  let keepaKeyExists = false;

  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === 'KEEPA_API_KEY') {
      keepaKeyExists = true;
      break;
    }
  }

  // KEEPA_API_KEYが存在しない場合は追加
  if (!keepaKeyExists) {
    const lastRow = configSheet.getLastRow();
    configSheet.getRange(lastRow + 1, 1).setValue('KEEPA_API_KEY');
    configSheet.getRange(lastRow + 1, 2).setValue('');
    Logger.log('設定シートにKEEPA_API_KEYを追加しました。');
  } else {
    Logger.log('KEEPA_API_KEYは既に存在します。');
  }
}

/**
 * カテゴリマッピングシートを作成
 */
function initializeCategoryMappingSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let mappingSheet = ss.getSheetByName('カテゴリマッピング');

  // カテゴリマッピングシートが既に存在する場合は何もしない
  if (mappingSheet) {
    Logger.log('カテゴリマッピングシートは既に存在します。');
    return;
  }

  // カテゴリマッピングシートを作成
  Logger.log('カテゴリマッピングシートを新規作成します。');
  mappingSheet = ss.insertSheet('カテゴリマッピング');

  // ヘッダー行を作成
  mappingSheet.getRange('A1').setValue('NodeID');
  mappingSheet.getRange('B1').setValue('CategoryCode');
  mappingSheet.getRange('C1').setValue('CategoryName');

  const headerRange = mappingSheet.getRange('A1:C1');
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4285F4');
  headerRange.setFontColor('#FFFFFF');

  // 完全マッピング（89カテゴリ）- AMAZON_CATEGORY_CODES_REFERENCE.md 準拠
  const categoryMappings = [
    // === 主要カテゴリ（44カテゴリ） ===
    [165793011, 'toys-and-games', 'Toys & Games'],
    [3760901, 'hpc', 'Health & Household'],
    [228013, 'tools', 'Tools & Home Improvement'],
    [172282, 'electronics', 'Electronics'],
    [283155, 'stripbooks', 'Books'],
    [1055398, 'home-garden', 'Home & Kitchen'],
    [3375251, 'sporting-goods', 'Sports & Outdoors'],
    [3760911, 'beauty', 'Beauty & Personal Care'],
    [16310101, 'grocery', 'Grocery & Gourmet Food'],
    [2619533011, 'pets', 'Pet Supplies'],
    [165796011, 'baby-products', 'Baby'],
    [2335752011, 'mobile-apps', 'Apps & Games'],
    [2350149011, 'digital-music', 'Digital Music'],
    [468642, 'office-products', 'Office Products'],
    [2617941011, 'appliances', 'Appliances'],
    [15684181, 'software', 'Software'],
    [13900871, 'digital-text', 'Kindle Store'],
    [301668, 'automotive', 'Automotive'],
    [11091801, 'pcm', 'Computers'],
    [667846011, 'arts-crafts', 'Arts, Crafts & Sewing'],
    [3367581, 'industrial', 'Industrial & Scientific'],
    [2972638011, 'fashion', 'Clothing, Shoes & Jewelry'],
    [7141123011, 'fashion-womens', "Women's Fashion"],
    [7147440011, 'fashion-mens', "Men's Fashion"],
    [7147441011, 'fashion-girls', "Girls' Fashion"],
    [7147442011, 'fashion-boys', "Boys' Fashion"],
    [2238192011, 'fashion-baby', 'Baby Fashion'],
    [1272297011, 'handmade', 'Handmade'],
    [16310091, 'luxury-beauty', 'Luxury Beauty'],
    [7924025011, 'amazon-devices', 'Amazon Devices & Accessories'],
    [599858, 'lawngarden', 'Patio, Lawn & Garden'],
    [1064954, 'musical-instruments', 'Musical Instruments'],
    [2238189011, 'collectibles', 'Collectibles & Fine Art'],
    [133140011, 'movies-tv', 'Movies & TV'],
    [5174, 'videogames', 'Video Games'],
    [11965861, 'pantry', 'Prime Pantry'],
    [2619525011, 'amazonfresh', 'Amazon Fresh'],
    [2350150011, 'digital-educational-resources', 'Amazon Inspire'],
    [10272111, 'magazine-subscriptions', 'Magazine Subscriptions'],
    [15690151, 'imdb-tv', 'Prime Video'],
    [2864120011, 'warehouse-deals', 'Amazon Warehouse'],
    [384082011, 'wine', 'Wine'],
    [14304371, 'photo', 'Photo Prints'],
    [599872, 'luggage', 'Luggage & Travel Gear'],

    // === 追加カテゴリ（45カテゴリ） ===
    [11260432011, 'alexa-skills', 'Alexa Skills'],
    [2811119011, 'instant-video', 'Prime Video (Alt)'],
    [16310161, 'whole-foods-market', 'Whole Foods Market'],
    [6563140011, 'smart-home', 'Smart Home'],
    [3736081, 'furniture', 'Furniture'],
    [1063498, 'kitchen', 'Kitchen & Dining'],
    [1063306, 'bed-bath', 'Bedding & Bath'],
    [1063252, 'storage-organization', 'Storage & Organization'],
    [3736371, 'lighting', 'Lighting'],
    [15706801, 'pc-parts', 'Computer Components'],
    [565098, 'computers-accessories', 'Computer Accessories'],
    [172456, 'electronics-accessories', 'Electronics Accessories'],
    [300334, 'car-electronics', 'Car Electronics'],
    [3248684011, 'camera-photo', 'Camera & Photo'],
    [502394, 'audio-video-accessories', 'Audio & Video Accessories'],
    [172541, 'cell-phones-accessories', 'Cell Phones & Accessories'],
    [13397491, 'wearable-technology', 'Wearable Technology'],
    [667240011, 'home-audio', 'Home Audio & Theater'],
    [262587011, 'fabric', 'Fabric'],
    [12896881, 'knitting-crochet', 'Knitting & Crochet'],
    [12896971, 'needlework', 'Needlework'],
    [12900671, 'painting-drawing', 'Painting, Drawing & Art Supplies'],
    [12900961, 'scrapbooking', 'Scrapbooking'],
    [12901001, 'sewing', 'Sewing'],
    [8090841011, 'baseball', 'Baseball'],
    [3402371, 'basketball', 'Basketball'],
    [10971181011, 'camping-hiking', 'Camping & Hiking'],
    [3403201, 'cycling', 'Cycling'],
    [3395371, 'exercise-fitness', 'Exercise & Fitness'],
    [3409991, 'fishing', 'Fishing'],
    [3410851, 'golf', 'Golf'],
    [3413101, 'hunting', 'Hunting'],
    [3416451, 'outdoor-recreation', 'Outdoor Recreation'],
    [3416301, 'skiing', 'Skiing'],
    [3413641, 'soccer', 'Soccer'],
    [2975312011, 'crafts', 'Arts & Crafts'],
    [1266066011, 'accent-furniture', 'Accent Furniture'],
    [3206324011, 'wall-art', 'Wall Art'],
    [2972705011, 'fashion-luggage', 'Luggage & Travel Gear (Fashion)'],
    [2972638011, 'fashion-novelty', 'Novelty & More'],
    [7141124011, 'fashion-womens-clothing', "Women's Clothing"],
    [7147441011, 'fashion-boys-clothing', "Boys' Clothing"],
    [7147442011, 'fashion-girls-clothing', "Girls' Clothing"],
    [2238189011, 'entertainment-collectibles', 'Entertainment Collectibles'],
    [3367581, 'industrial-supplies', 'Industrial Supplies']
  ];

  mappingSheet.getRange(2, 1, categoryMappings.length, 3).setValues(categoryMappings);

  // 列幅を調整
  mappingSheet.setColumnWidth(1, 120); // NodeID
  mappingSheet.setColumnWidth(2, 180); // CategoryCode
  mappingSheet.setColumnWidth(3, 250); // CategoryName

  Logger.log(`カテゴリマッピングシートに${categoryMappings.length}カテゴリを追加しました。`);
}

/**
 * ヘッダー行の右端にトークン情報を表示
 * @param {Sheet} sheet - シートオブジェクト
 * @param {number|null} tokensLeft - 残トークン数（nullの場合は「-」表示）
 * @param {string} status - 処理状況（例: "処理完了", "トークン不足"）
 */
function updateHeaderWithTokenInfo(sheet, tokensLeft, status) {
  try {
    // ヘッダー行の最右列を取得（既存の列 + 1）
    const config = loadConfig();
    const tokenInfoColumn = columnLetterToIndex('F');  // F列に固定

    // 現在の日時を取得
    const now = new Date();
    const dateStr = Utilities.formatDate(now, Session.getScriptTimeZone(), 'MM/dd HH:mm');

    // トークン情報を整形
    const tokensDisplay = tokensLeft !== null ? tokensLeft : '-';
    const statusDisplay = status || '不明';

    // ヘッダーに表示する文字列
    const headerText = `Keepa残トークン: ${tokensDisplay} | ${statusDisplay} | 更新: ${dateStr}`;

    // ヘッダー行（1行目）に書き込み
    const headerCell = sheet.getRange(1, tokenInfoColumn);
    headerCell.setValue(headerText);

    // フォント設定（小さめ、灰色）
    headerCell.setFontSize(9);
    headerCell.setFontColor('#666666');
    headerCell.setHorizontalAlignment('right');

    // 列幅を調整（長い文字列に対応）
    sheet.setColumnWidth(tokenInfoColumn, 300);

    Logger.log(`Token info updated: ${headerText}`);

  } catch (error) {
    Logger.log(`Error in updateHeaderWithTokenInfo: ${error.message}`);
  }
}

/**
 * トリガー設定状況をK1-N1に表示
 * @param {Sheet} sheet - シートオブジェクト
 */
function updateTriggerStatus(sheet) {
  try {
    const triggers = ScriptApp.getProjectTriggers();

    // トリガー関数名のマッピング
    const triggerNames = {
      'processKeepaScheduledBrandFilter': 'ブランド絞り込み',
      'processKeepaScheduledKeyword': 'キーワード検索',
      'processKeepaScheduledHybrid': 'ハイブリッド'
    };

    const activeTriggers = [];

    triggers.forEach(trigger => {
      const funcName = trigger.getHandlerFunction();
      if (triggerNames[funcName]) {
        activeTriggers.push(triggerNames[funcName]);
      }
    });

    // K1: アクティブトリガー
    if (activeTriggers.length > 0) {
      sheet.getRange('K1').setValue(activeTriggers.join(', '));
    } else {
      sheet.getRange('K1').setValue('なし');
    }

    // L1: 次回実行（概算）
    if (activeTriggers.length > 0) {
      const now = new Date();
      const next = new Date(now.getTime() + 10 * 60 * 1000); // 10分後と仮定
      const nextStr = Utilities.formatDate(next, Session.getScriptTimeZone(), 'HH:mm');
      sheet.getRange('L1').setValue(nextStr);
    } else {
      sheet.getRange('L1').setValue('-');
    }

    // M1: 実行間隔
    if (activeTriggers.length > 0) {
      sheet.getRange('M1').setValue('10分おき');
    } else {
      sheet.getRange('M1').setValue('-');
    }

    // N1: 最終実行（プロパティサービスから取得）
    const lastExecution = PropertiesService.getScriptProperties().getProperty('LAST_TRIGGER_EXECUTION');
    if (lastExecution) {
      sheet.getRange('N1').setValue(lastExecution);
    } else {
      sheet.getRange('N1').setValue('-');
    }

    // フォント設定
    const statusRange = sheet.getRange('K1:N1');
    statusRange.setFontSize(9);
    statusRange.setFontColor('#666666');

    Logger.log(`Trigger status updated: ${activeTriggers.join(', ')}`);

  } catch (error) {
    Logger.log(`Error in updateTriggerStatus: ${error.message}`);
  }
}
