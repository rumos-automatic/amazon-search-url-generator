/**
 * Amazon Search URL Generator - Main.gs
 * メイン処理とカスタムメニュー
 */

/**
 * スプレッドシートを開いたときに実行される
 * カスタムメニューを追加
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Amazon URL生成')
    .addItem('すべて処理', 'processInBatches')
    .addItem('選択行のみ処理', 'processSelectedRows')
    .addToUi();
}

/**
 * 選択された行のみ処理
 */
function processSelectedRows() {
  try {
    const config = loadConfig();
    const sheet = SpreadsheetApp.getActiveSheet();
    const selection = sheet.getActiveRange();

    if (!selection) {
      SpreadsheetApp.getUi().alert('情報', '行を選択してください。', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }

    const startRow = selection.getRow();
    const numRows = selection.getNumRows();
    const asinColumn = columnLetterToIndex(config.ASIN_COLUMN);

    let processedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < numRows; i++) {
      const rowNum = startRow + i;
      if (rowNum < 2) continue; // ヘッダー行をスキップ

      const asin = sheet.getRange(rowNum, asinColumn).getValue();

      if (!asin || asin.toString().trim() === '') {
        continue;
      }

      Logger.log(`Processing row ${rowNum}: ASIN = ${asin}`);

      const data = getAmazonData(asin);

      if (data.error) {
        Logger.log(`Error for ASIN ${asin}: ${data.error}`);
        writeRowData(sheet, rowNum, config, {
          brand: `エラー: ${data.error}`,
          category: '',
          newUrl: '',
          relevanceUrl: ''
        });
        errorCount++;
      } else {
        const newUrl = createHyperlink(
          buildSearchUrl(data.brand, config.SORT_NEW_PARAM, data.category),
          config.NEW_LABEL
        );
        const relevanceUrl = createHyperlink(
          buildSearchUrl(data.brand, config.SORT_RELEVANCE_PARAM, data.category),
          config.RELEVANCE_LABEL
        );

        writeRowData(sheet, rowNum, config, {
          brand: data.brand,
          category: data.category,
          newUrl: newUrl,
          relevanceUrl: relevanceUrl
        });
        processedCount++;
      }

      if (i < numRows - 1) {
        Utilities.sleep(config.WAIT_TIME_MS);
      }
    }

    SpreadsheetApp.getUi().alert(
      '完了',
      `処理完了\n成功: ${processedCount}件\nエラー: ${errorCount}件`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (error) {
    Logger.log(`Error in processSelectedRows: ${error.message}`);
    SpreadsheetApp.getUi().alert('エラー', `処理中にエラーが発生しました: ${error.message}`, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * 未処理の行をバッチ処理（設定で指定された件数ごとにシートに保存）
 * 既に処理済み（ブランド列に値がある）の行はスキップ
 */
function processInBatches() {
  try {
    const config = loadConfig();
    const sheet = getTargetSheet(config.TARGET_SHEET_NAME);

    if (!sheet) {
      return;
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return;
    }

    const asinColumn = columnLetterToIndex(config.ASIN_COLUMN);
    const brandColumn = columnLetterToIndex(config.BRAND_COLUMN);
    const batchSize = config.BATCH_SIZE || 10;

    let processedCount = 0;
    let batchCount = 0;

    // 未処理の行をすべて処理
    for (let rowNum = 2; rowNum <= lastRow; rowNum++) {
      const asin = sheet.getRange(rowNum, asinColumn).getValue();

      // ASINが空の場合はスキップ
      if (!asin || asin.toString().trim() === '') {
        continue;
      }

      // 既に処理済み（ブランド列に値がある）の場合はスキップ
      if (isRowProcessed(sheet, rowNum, brandColumn)) {
        continue;
      }

      Logger.log(`Processing row ${rowNum}: ASIN = ${asin}`);

      // Amazon データ取得
      const data = getAmazonData(asin);

      if (data.error) {
        Logger.log(`Error for ASIN ${asin}: ${data.error}`);
        writeRowData(sheet, rowNum, config, {
          brand: `エラー: ${data.error}`,
          category: '',
          newUrl: '',
          relevanceUrl: ''
        });
      } else {
        // URL生成（カテゴリを含む）
        const newUrl = createHyperlink(
          buildSearchUrl(data.brand, config.SORT_NEW_PARAM, data.category),
          config.NEW_LABEL
        );
        const relevanceUrl = createHyperlink(
          buildSearchUrl(data.brand, config.SORT_RELEVANCE_PARAM, data.category),
          config.RELEVANCE_LABEL
        );

        writeRowData(sheet, rowNum, config, {
          brand: data.brand,
          category: data.category,
          newUrl: newUrl,
          relevanceUrl: relevanceUrl
        });
      }

      processedCount++;
      batchCount++;

      // バッチサイズごとにシートに確実に保存
      if (batchCount >= batchSize) {
        SpreadsheetApp.flush();
        Logger.log(`Flushed ${batchCount} rows to sheet`);
        batchCount = 0;
      }

      // 待機（Amazon負荷対策）
      Utilities.sleep(config.WAIT_TIME_MS);
    }

    // 最後の残りを保存
    if (batchCount > 0) {
      SpreadsheetApp.flush();
      Logger.log(`Flushed remaining ${batchCount} rows to sheet`);
    }

    Logger.log(`processInBatches completed: ${processedCount} rows processed`);

  } catch (error) {
    Logger.log(`Error in processInBatches: ${error.message}`);
    // エラー時もダイアログは出さない
  }
}

/**
 * 行が既に処理済みかチェック
 * @param {Sheet} sheet - シートオブジェクト
 * @param {number} rowNum - 行番号
 * @param {number} brandColumn - ブランド列のインデックス
 * @return {boolean} 処理済みならtrue
 */
function isRowProcessed(sheet, rowNum, brandColumn) {
  const brandValue = sheet.getRange(rowNum, brandColumn).getValue();
  return brandValue && brandValue.toString().trim() !== '';
}

/**
 * 列のアルファベットを数値インデックスに変換
 * @param {string} letter - 列のアルファベット（A, B, C...）
 * @return {number} 1から始まるインデックス
 */
function columnLetterToIndex(letter) {
  let column = 0;
  for (let i = 0; i < letter.length; i++) {
    column = column * 26 + (letter.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return column;
}
