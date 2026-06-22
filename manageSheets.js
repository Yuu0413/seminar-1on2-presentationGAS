// シートの生成とアーカイブ

// 予約が入っていない未来シートのみ削除して再生成する
function rebuildEmptyFutureSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  ss.getSheets().forEach(function(sheet) {
    var name = sheet.getName();
    if (!isDateSheetName_(name)) return;
    var sheetDate = parseDateSheetName_(name);
    if (sheetDate < today) return;
    if (hasBooking_(sheet)) return;
    ss.deleteSheet(sheet);
  });

  createFourWeekSheets(ss);
}

// 予約の有無に関わらず全ての未来シートを削除して再生成する
function rebuildAllFutureSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  ss.getSheets().forEach(function(sheet) {
    var name = sheet.getName();
    if (!isDateSheetName_(name)) return;
    var sheetDate = parseDateSheetName_(name);
    if (sheetDate < today) return;
    ss.deleteSheet(sheet);
  });

  createFourWeekSheets(ss);
}

// NAME列にひとつでも値があれば予約ありとみなす
function hasBooking_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < ROWS.DATA_START) return false;
  var names = sheet.getRange(ROWS.DATA_START, COLUMNS.NAME, lastRow - ROWS.DATA_START + 1, 1).getValues();
  return names.some(function(row, i) {
    return SCHEDULE[i] && SCHEDULE[i].type === "presentation" && row[0] !== "";
  });
}

// トリガーから呼ばれるメイン関数
function manageSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  createFourWeekSheets(ss);
  archiveOldSheets(ss);
}

function createFourWeekSheets(ss) {
  var today = new Date();
  var counterSheet = ss.getSheetByName(SHEET_NAMES.COUNTER);
  var counterIndex = counterSheet
    ? ss.getSheets().indexOf(counterSheet)
    : ss.getSheets().length;

  for (var i = 0; i < 4; i++) {
    var friday = getFriday(today, i);
    var sheetName = formatDate(friday);
    if (ss.getSheetByName(sheetName)) continue;
    var sheet = ss.insertSheet(sheetName, counterIndex);
    setupSheet(sheet);
    counterIndex++;
  }
}

function archiveOldSheets(ss) {
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  var oldestKeepDate = getFriday(new Date(), 0);
  oldestKeepDate.setHours(0, 0, 0, 0);

  var allSheets = ss.getSheets();
  var counterIndex = allSheets.findIndex(function(s) {
    return s.getName() === SHEET_NAMES.COUNTER;
  });
  if (counterIndex === -1) return;

  ss.getSheets().forEach(function(sheet) {
    var name = sheet.getName();
    if (name === SHEET_NAMES.COUNTER) return;
    if (!isDateSheetName_(name)) return;

    var sheetDate = parseDateSheetName_(name);
    if (sheetDate < oldestKeepDate) {
      sheet.activate();
      ss.moveActiveSheet(ss.getSheets().length);
    }
  });
}

function isDateSheetName_(name) {
  return /^\d{4}-\d{2}-\d{2}$/.test(name);
}

function parseDateSheetName_(name) {
  var parts = name.split("-");
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
}
