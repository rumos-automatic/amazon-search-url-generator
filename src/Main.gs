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
    .addItem('ブランド絞り込み', 'processAllWithBrandFilter')
    .addItem('キーワード検索', 'processAllWithKeyword')
    .addItem('ハイブリッド', 'processAllWithHybrid')
    .addSeparator()
    .addSubMenu(ui.createMenu('トリガー設定')
      .addSubMenu(ui.createMenu('ブランド絞り込み')
        .addItem('10分おきの自動処理を開始', 'setupKeepaSchedulerBrandFilter')
        .addItem('自動処理を停止', 'removeKeepaSchedulerBrandFilter'))
      .addSubMenu(ui.createMenu('キーワード検索')
        .addItem('10分おきの自動処理を開始', 'setupKeepaSchedulerKeyword')
        .addItem('自動処理を停止', 'removeKeepaSchedulerKeyword'))
      .addSubMenu(ui.createMenu('ハイブリッド')
        .addItem('10分おきの自動処理を開始', 'setupKeepaSchedulerHybrid')
        .addItem('自動処理を停止', 'removeKeepaSchedulerHybrid')))
    .addToUi();
}

/**
 * ブランド絞り込み方式で処理（推奨）
 * rh=i:category,p_89:Brand&s=sort
 */
function processAllWithBrandFilter() {
  processInBatchesGeneric(getAmazonDataViaKeepa, 'brand_filter');
}

/**
 * キーワード検索方式で処理（従来）
 * k=Brand&i=category&s=sort
 */
function processAllWithKeyword() {
  processInBatchesGeneric(getAmazonDataViaKeepa, 'keyword');
}

/**
 * ハイブリッド方式で処理
 * k=Brand&rh=p_89:Brand&i=category&s=sort
 */
function processAllWithHybrid() {
  processInBatchesGeneric(getAmazonDataViaKeepa, 'hybrid');
}

/**
 * 未処理の行をバッチ処理（設定で指定された件数ごとにシートに保存）
 * 既に処理済み（ブランド列に値がある）の行はスキップ
 * @param {function} getDataFunction - データ取得関数（getAmazonDataViaKeepa）
 * @param {string} urlType - URL生成方式（'brand_filter', 'keyword', 'hybrid'）
 */
function processInBatchesGeneric(getDataFunction, urlType) {
  let processedCount = 0;  // finally節でアクセスするため、先頭で宣言
  let sheet = null;
  let config = null;

  try {
    config = loadConfig();
    sheet = getTargetSheet(config.TARGET_SHEET_NAME);

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
      const data = getDataFunction(asin);

      if (data.error) {
        Logger.log(`Error for ASIN ${asin}: ${data.error}`);
        writeRowData(sheet, rowNum, config, {
          brand: `エラー: ${data.error}`,
          category: '',
          newUrl: '',
          relevanceUrl: ''
        }, urlType);
      } else {
        // URL生成（カテゴリを含む、URL方式を指定）
        const newUrl = createHyperlink(
          buildSearchUrl(data.brand, config.SORT_NEW_PARAM, data.category, urlType),
          config.NEW_LABEL
        );
        const relevanceUrl = createHyperlink(
          buildSearchUrl(data.brand, config.SORT_RELEVANCE_PARAM, data.category, urlType),
          config.RELEVANCE_LABEL
        );

        writeRowData(sheet, rowNum, config, {
          brand: data.brand,
          category: data.category,
          newUrl: newUrl,
          relevanceUrl: relevanceUrl
        }, urlType);
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
  } finally {
    // 処理が1件以上あった場合のみトークン情報更新
    if (processedCount > 0 && sheet) {
      try {
        const tokensInfo = getKeepaTokensLeft();
        if (tokensInfo.success) {
          updateHeaderWithTokenInfo(sheet, tokensInfo.tokensLeft, '処理完了');
        }
      } catch (finallyError) {
        Logger.log(`トークン情報更新エラー: ${finallyError.message}`);
      }
    }
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
