// 共通で使う便利な関数
function getFriday(baseDate, weeksAhead) {
  var date = new Date(baseDate);
  var day = date.getDay();
  var daysUntilFriday = (5 - day + 7) % 7;
  date.setDate(date.getDate() + daysUntilFriday + weeksAhead * 7);
  return date;
}

function formatDate(date) {
  var y = date.getFullYear();
  var m = String(date.getMonth() + 1).padStart(2, "0");
  var d = String(date.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}

// SpreadsheetApp は時刻セルを Date として返す場合があるため、両方に対応する。
// 不正な値（"TBD" など）は null を返す。呼び出し側は null チェックを行うこと。
function parseTime(timeVal) {
  var result = new Date();
  if (timeVal instanceof Date) {
    if (isNaN(timeVal.getTime())) return null;
    result.setHours(timeVal.getHours(), timeVal.getMinutes(), 0, 0);
    return result;
  }
  var parts = String(timeVal).split(":");
  if (parts.length < 2) return null;
  var h = parseInt(parts[0], 10);
  var m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  result.setHours(h, m, 0, 0);
  return result;
}

// Node.js（テスト実行時）のみ module.exports を定義する。GAS環境には module が無いため無視される。
if (typeof module !== "undefined") {
  module.exports = { getFriday, formatDate, parseTime };
}
