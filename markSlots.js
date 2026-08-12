// 金曜13:10に実行：予約者名が入っている行を緑色に変更
function markActiveSlots() {
  var sheetName = formatDate(getFriday(new Date(), 0));
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return;
  markActiveSlotsOnSheet_(sheet);
}

// 指定したシートに対して、発表者セルの背景を緑にする（GAS API依存部分）
function markActiveSlotsOnSheet_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < ROWS.DATA_START) return;

  var numRows = lastRow - ROWS.DATA_START + 1;
  var names       = sheet.getRange(ROWS.DATA_START, COLUMNS.NAME, numRows, 1).getValues();
  var backgrounds = sheet.getRange(ROWS.DATA_START, COLUMNS.NAME, numRows, 1).getBackgrounds();

  var updated = computeActiveBackgrounds_(SCHEDULE, names, backgrounds, COLORS.ACTIVE, COLORS.DONE_SIGNAL);

  sheet.getRange(ROWS.DATA_START, COLUMNS.NAME, numRows, 1).setBackgrounds(updated);
}

// 発表行かつ名前が入っている行だけを緑にする（GAS APIに依存しない純粋関数）
// すでに済(DONE_SIGNAL)のサインが出ている行は、緑で上書きしない
function computeActiveBackgrounds_(schedule, names, backgrounds, activeColor, doneSignalColor) {
  return backgrounds.map(function(row, i) {
    var current = row[0];
    if (!schedule[i] || schedule[i].type !== "presentation") return [current];
    if (current === doneSignalColor) return [current];
    if (names[i][0]) return [activeColor];
    return [current];
  });
}

// 15分おきに実行：グレーかつ終了時刻を過ぎた行に「済(Done)」をつける
function checkAndMarkDone() {
  var sheetName = formatDate(getFriday(new Date(), 0));
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return;
  checkAndMarkDoneOnSheet_(sheet);
}

// 指定したシートに対して、発表済の人のE列に済をマークする（GAS API依存部分）
// incrementCount: false の場合、counterシートへのカウント加算は行わない
// （「テスト」シートでの動作確認が、本物のcounterシートを書き換えてしまうのを防ぐため）
function checkAndMarkDoneOnSheet_(sheet, options) {
  var incrementCount = !options || options.incrementCount !== false;

  var now = new Date();
  var lastRow = sheet.getLastRow();
  if (lastRow < ROWS.DATA_START) return;

  var numRows = lastRow - ROWS.DATA_START + 1;
  // START(col2)〜STATUS(col5) の4列をまとめて読む
  var data        = sheet.getRange(ROWS.DATA_START, COLUMNS.START, numRows, 4).getValues();
  var backgrounds = sheet.getRange(ROWS.DATA_START, COLUMNS.NAME,  numRows, 1).getBackgrounds();

  var updates = computeDoneUpdates_(
    SCHEDULE, data, backgrounds, now,
    COLORS.DONE_SIGNAL, STATUSES.DONE, STATUSES.NOT_AVAILABLE
  );

  var ss = sheet.getParent();
  // ステータスを先に確定してから加算（例外時の重複カウント防止）
  updates.forEach(function(update) {
    var row = ROWS.DATA_START + update.index;
    sheet.getRange(row, COLUMNS.STATUS).setValue(STATUSES.DONE);
    if (incrementCount) addCount(ss, update.name);
  });
}

// 発表行のうち「名前あり・灰色(done signal)・終了時刻を過ぎている・まだ済/対応不可でない」行を
// 済にすべき対象として返す（GAS APIに依存しない純粋関数）
function computeDoneUpdates_(schedule, data, backgrounds, now, doneSignalColor, doneStatus, notAvailableStatus) {
  var updates = [];

  for (var i = 0; i < data.length; i++) {
    if (!schedule[i] || schedule[i].type !== "presentation") continue;

    var start = data[i][0];
    var end   = data[i][1];
    if (!start || !end) continue;

    var endTime = parseTime(end);
    if (!endTime || now < endTime) continue;

    var name    = data[i][2];
    var status  = data[i][3];
    var bgColor = backgrounds[i][0];

    // グレー(done signal)＝学生が1on1終了の合図を出した行のみ済みにする
    if (name && bgColor === doneSignalColor &&
        status !== doneStatus && status !== notAvailableStatus) {
      updates.push({ index: i, name: name });
    }
  }

  return updates;
}

// --- 「テスト」シートに対する手動動作確認（メニューから呼ぶ） ---

// 「テスト」シートを取得する。無ければ案内を出して null を返す
function getTestSheet_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.TEST);
  if (!sheet) {
    SpreadsheetApp.getUi().alert("「テスト」シートが見つかりません。先に「テストシートを作成」を実行してください。");
  }
  return sheet;
}

// メニュー「発表者セルの背景を緑にする」：「テスト」シートに対して markActiveSlots と同じ処理を行う
function markActiveSlotsOnTestSheet() {
  var sheet = getTestSheet_();
  if (!sheet) return;
  markActiveSlotsOnSheet_(sheet);
}

// メニュー「発表済の人のE列セルに済をマーク」：「テスト」シートに対して checkAndMarkDone と同じ処理を行う
// counterシートへのカウント加算は行わない（テストデータで本物の発表回数が増えるのを防ぐため）
function checkAndMarkDoneOnTestSheet() {
  var sheet = getTestSheet_();
  if (!sheet) return;
  checkAndMarkDoneOnSheet_(sheet, { incrementCount: false });
}

// Node.js（テスト実行時）のみ module.exports を定義する。GAS環境には module が無いため無視される。
if (typeof module !== "undefined") {
  var { parseTime } = require("./utils.js");
  module.exports = { computeActiveBackgrounds_, computeDoneUpdates_ };
}
