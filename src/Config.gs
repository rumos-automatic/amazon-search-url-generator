/**
 * Amazon Search URL Generator - Config.gs
 * 設定管理
 */

/**
 * 設定シートから設定を読み込む
 * 設定シートがない場合はデフォルト設定を返す
 * @return {Object} 設定オブジェクト
 */
function loadConfig() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = ss.getSheetByName('設定');

    if (!configSheet) {
      Logger.log('設定シートが見つかりません。デフォルト設定を使用します。');
      return getDefaultConfig();
    }

    // 設定シートの値を取得（A列: 設定名, B列: 値）
    const data = configSheet.getRange('A2:B20').getValues();
    const config = getDefaultConfig(); // デフォルトから開始

    // 設定シートの値で上書き
    data.forEach(row => {
      const key = row[0];
      const value = row[1];

      if (key && value !== '') {
        config[key] = value;
      }
    });

    return config;

  } catch (error) {
    Logger.log(`Error loading config: ${error.message}`);
    return getDefaultConfig();
  }
}

/**
 * デフォルト設定を取得
 * @return {Object} デフォルト設定
 */
function getDefaultConfig() {
  return {
    ASIN_COLUMN: 'A',
    BRAND_COLUMN: 'B',
    CATEGORY_COLUMN: 'C',
    NEW_URL_COLUMN: 'D',
    RELEVANCE_URL_COLUMN: 'E',
    TARGET_SHEET_NAME: '商品データ',
    WAIT_TIME_MS: 2000,
    BATCH_SIZE: 10,
    SORT_NEW_PARAM: 'date-desc-rank',
    SORT_RELEVANCE_PARAM: 'relevanceblender',
    NEW_LABEL: '新着順',
    RELEVANCE_LABEL: '関連順'
  };
}

