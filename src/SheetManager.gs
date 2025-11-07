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
 */
function writeRowData(sheet, rowNum, config, data) {
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

  } catch (error) {
    Logger.log(`Error writing row data at row ${rowNum}: ${error.message}`);
    throw error;
  }
}
