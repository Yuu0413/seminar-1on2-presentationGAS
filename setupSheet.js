// シートのレイアウト・初期データを設定する
// スケジュール定義は config.js の SCHEDULE を参照

function setupSheet(sheet) {
  sheet.getRange("1:1").breakApart();
  sheet.getRange("A1:J1").merge();
  sheet.getRange("A1").setValue(
    "Please secure your slots by filling your name. Let's do 1 on 1 at least every couple of weeks."
  );
  sheet.getRange("A1").setBackground(COLORS.HEADER_TITLE);
  sheet.getRange("A1").setFontSize(FONTS.TITLE_SIZE);
  sheet.getRange("A1").setFontWeight("bold");

  sheet.getRange("A2:H" + ROWS.LAST_DATA_ROW).breakApart();
  sheet.getRange("A2:H2").setValues([[
    "時限(Period)", "開始時間(Start)", "終了時間(End)",
    "予約者名(Student name)", "状態(situation) ※空欄でお願いします！",
    "相談内容(Consultation content)", "要望(Request)",
    "先生からの連絡(teacher's info)"
  ]]);
  sheet.getRange("A2:H2").setBackground(COLORS.HEADER_ROW);
  sheet.getRange("A2:H2").setFontSize(FONTS.BODY_SIZE);
  sheet.setColumnWidth(1, 125);
  sheet.setColumnWidths(2, 4, 130);
  sheet.setColumnWidth(6, 215);
  sheet.setColumnWidth(7, 130);
  sheet.setColumnWidth(8, 225);

  SCHEDULE.forEach(function(slot, i) {
    var row = ROWS.DATA_START + i;
    sheet.getRange(row, 1, 1, 8).setBackground(null);
    sheet.getRange(row, COLUMNS.PERIOD).setValue(slot.period || "");
    sheet.getRange(row, COLUMNS.START).setValue(slot.start);
    sheet.getRange(row, COLUMNS.END).setValue(slot.end || "");

    if (slot.type === "presentation") {
      sheet.getRange(row, COLUMNS.NAME).setValue("");
    } else {
      var label = slot.type === "teacher" ? STATUSES.TEACHER : STATUSES.BREAK;
      sheet.getRange(row, COLUMNS.NAME).setValue(label);
    }
    sheet.getRange(row, COLUMNS.STATUS).setValue("");
  });

  sheet.getRange("A2:H" + ROWS.LAST_DATA_ROW).setFontSize(FONTS.BODY_SIZE);
}

// GASエディタから直接テスト実行するためのラッパー（アクティブシートに上書き）
function setupSheetTest() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  setupSheet(sheet);
}

// テスト用シートを1枚新規作成する（既存の「テスト」シートは削除して再作成）
// 位置はcounterシートの直後に固定する
function createTestSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var existing = ss.getSheetByName(SHEET_NAMES.TEST);
  if (existing) ss.deleteSheet(existing);

  var counterSheet = ss.getSheetByName(SHEET_NAMES.COUNTER);
  var index = counterSheet ? ss.getSheets().indexOf(counterSheet) + 1 : ss.getSheets().length;
  var sheet = ss.insertSheet(testSheetName, index);
  setupSheet(sheet);
}
