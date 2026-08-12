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

  sortDateSheets_(ss);
}

// メニューから呼ばれる：日付シートを日付昇順に並び替える
function sortDateSheets() {
  sortDateSheets_(SpreadsheetApp.getActiveSpreadsheet());
}

// 日付シートだけを日付昇順に並び替える（counterシート等の位置は変えない）
function sortDateSheets_(ss) {
  var currentNames = ss.getSheets().map(function(sheet) { return sheet.getName(); });
  var targetNames = computeSortedSheetOrder_(currentNames);

  targetNames.forEach(function(name, i) {
    var sheet = ss.getSheetByName(name);
    sheet.activate();
    ss.moveActiveSheet(i + 1);
  });
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

// 日付シート名だけを日付昇順に並び替えた新しい配列を返す（非日付シートの位置は変えない）
// 日付シートが非日付シート（counterなど）で分断されている場合、区間ごとに独立してソートする
// （例：counterより前の「今週から4週間」ブロックと、counterより後ろの「過去のアーカイブ」ブロックを
// 　まとめて1本でソートすると、過去と未来が逆転して混ざってしまうため）
// GAS APIに依存しない純粋関数（Node.jsでテスト可能）
function computeSortedSheetOrder_(sheetNames) {
  var result = sheetNames.slice();
  var i = 0;
  while (i < result.length) {
    if (!isDateSheetName_(result[i])) {
      i++;
      continue;
    }
    var j = i;
    while (j < result.length && isDateSheetName_(result[j])) j++;

    // "YYYY-MM-DD" は文字列の辞書順ソートがそのまま日付の昇順になる
    var run = result.slice(i, j).sort();
    for (var k = 0; k < run.length; k++) {
      result[i + k] = run[k];
    }
    i = j;
  }
  return result;
}

// Node.js（テスト実行時）のみ module.exports を定義する。GAS環境には module が無いため無視される。
if (typeof module !== "undefined") {
  module.exports = { computeSortedSheetOrder_ };
}
