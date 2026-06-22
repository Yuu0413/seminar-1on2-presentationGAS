// 金曜13:10に実行：予約者名が入っている行を緑色に変更
function markActiveSlots() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = formatDate(getFriday(new Date(), 0));
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;

  var lastRow = sheet.getLastRow();
  if (lastRow < ROWS.DATA_START) return;

  var numRows = lastRow - ROWS.DATA_START + 1;
  var names       = sheet.getRange(ROWS.DATA_START, COLUMNS.NAME, numRows, 1).getValues();
  var backgrounds = sheet.getRange(ROWS.DATA_START, COLUMNS.NAME, numRows, 1).getBackgrounds();

  for (var i = 0; i < numRows; i++) {
    if (!SCHEDULE[i] || SCHEDULE[i].type !== "presentation") continue;
    var row = ROWS.DATA_START + i;
    if (names[i][0]) {
      backgrounds[i][0] = COLORS.ACTIVE;
    }
  }

  sheet.getRange(ROWS.DATA_START, COLUMNS.NAME, numRows, 1).setBackgrounds(backgrounds);
}

// 15分おきに実行：グレーかつ終了時刻を過ぎた行に「済(Done)」をつける
function checkAndMarkDone() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = formatDate(getFriday(new Date(), 0));
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;

  var now = new Date();
  var lastRow = sheet.getLastRow();
  if (lastRow < ROWS.DATA_START) return;

  var numRows = lastRow - ROWS.DATA_START + 1;
  // START(col2)〜STATUS(col5) の4列をまとめて読む
  var data        = sheet.getRange(ROWS.DATA_START, COLUMNS.START, numRows, 4).getValues();
  var backgrounds = sheet.getRange(ROWS.DATA_START, COLUMNS.NAME,  numRows, 1).getBackgrounds();

  for (var i = 0; i < numRows; i++) {
    if (!SCHEDULE[i] || SCHEDULE[i].type !== "presentation") continue;
    var row = ROWS.DATA_START + i;

    var start  = data[i][0];
    var end    = data[i][1];
    if (!start || !end) continue;

    var endTime = parseTime(end);
    if (!endTime || now < endTime) continue;

    var name    = data[i][2];
    var status  = data[i][3];
    var bgColor = backgrounds[i][0];

    // グレー(DONE_SIGNAL)＝学生が1on1終了の合図を出した行のみ済みにする
    // ステータスを先に確定してから加算（例外時の重複カウント防止）
    if (name && bgColor === COLORS.DONE_SIGNAL &&
        status !== STATUSES.DONE && status !== STATUSES.NOT_AVAILABLE) {
      sheet.getRange(row, COLUMNS.STATUS).setValue(STATUSES.DONE);
      addCount(ss, name);
    }
  }
}
