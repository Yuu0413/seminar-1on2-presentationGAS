// スプレッドシートを開いたときにメニューを追加する
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("シート管理")
    .addSubMenu(ui.createMenu("発表回数")
      .addItem("名前順でソート",                       "sortCounterByName"      )
      .addItem("学年順でソート（昇順: B1→M2）",        "sortCounterByGradeAsc"  )
      .addItem("学年順でソート（降順: M2→B1）",        "sortCounterByGradeDesc" )
      .addItem("発表回数順でソート（昇順: 少ない順）",  "sortCounterByCountAsc"  )
      .addItem("発表回数順でソート（降順: 多い順）",    "sortCounterByCountDesc" )
      .addItem("学籍番号順でソート",                   "sortCounterByStudentId" )
      .addItem("counterシートのヘッダーを設定",        "setupCounterSheet"      ))
    .addSeparator()
    .addSubMenu(ui.createMenu("シート全般")
      .addItem("予約なし未来シートを再生成",           "rebuildEmptyFutureSheets")
      .addItem("全未来シートを再生成（予約含む）",      "rebuildAllFutureSheets"  )
      .addItem("シートをソート",                       "sortDateSheets"          ))
      .addSeparator()
    .addSubMenu(ui.createMenu("テスト")
      .addItem("発表者セルの背景を緑にする",           "markActiveSlotsOnTestSheet"  )
      .addItem("発表済の人のE列セルに済をマーク",       "checkAndMarkDoneOnTestSheet" )
      .addItem("テストシートを作成",                   "createTestSheet"         ))
    .addToUi();
}

// --- ソート共通処理 ---

function getCounterSortRange_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.COUNTER);
  if (!sheet) return null;
  var lastRow = sheet.getLastRow();
  if (lastRow < ROWS.COUNTER_SORT_START) return null;
  return sheet.getRange(ROWS.COUNTER_SORT_START, 1, lastRow - ROWS.COUNTER_SORT_START + 1, 4);
}

function sortCounter_(compareFn) {
  var range = getCounterSortRange_();
  if (!range) return;
  var data = range.getValues();
  data.sort(compareFn);
  range.setValues(data);
}

// counterシートを名前のアルファベット順でソートする
function sortCounterByName() {
  sortCounter_(function(a, b) {
    return a[COUNTER_COLS.NAME - 1].toString().localeCompare(b[COUNTER_COLS.NAME - 1].toString(), "ja");
  });
}

// counterシートを学年順でソートする（asc: 昇順, desc: 降順）
function sortCounterByGrade_(order) {
  sortCounter_(function(a, b) {
    var diff = gradeOrder_(String(a[COUNTER_COLS.GRADE - 1])) - gradeOrder_(String(b[COUNTER_COLS.GRADE - 1]));
    return order === "desc" ? -diff : diff;
  });
}

function sortCounterByGradeAsc()  { sortCounterByGrade_("asc");  }
function sortCounterByGradeDesc() { sortCounterByGrade_("desc"); }

// counterシートを発表回数順でソートする（asc: 昇順, desc: 降順）
function sortCounterByCount_(order) {
  sortCounter_(function(a, b) {
    var diff = a[COUNTER_COLS.COUNT - 1] - b[COUNTER_COLS.COUNT - 1];
    return order === "desc" ? -diff : diff;
  });
}

function sortCounterByCountAsc()  { sortCounterByCount_("asc");  }
function sortCounterByCountDesc() { sortCounterByCount_("desc"); }

// counterシートを学籍番号の昇順でソートする
function sortCounterByStudentId() {
  sortCounter_(function(a, b) {
    var idA = String(a[COUNTER_COLS.STUDENT_ID - 1]);
    var idB = String(b[COUNTER_COLS.STUDENT_ID - 1]);
    return idA.localeCompare(idB);
  });
}

// --- ヘルパー ---

// "B2" → ソート用の数値（B<M、数字は昇順）
function gradeOrder_(grade) {
  var typeOrder = { "B": 0, "M": 1 };
  var type = grade.charAt(0).toUpperCase();
  var num = parseInt(grade.slice(1)) || 0;
  return (typeOrder[type] !== undefined ? typeOrder[type] : 9) * 10 + num;
}

// "Tanaka(B2)" → { name: "Tanaka", grade: "B2" }
function parseName_(nameStr) {
  var str = String(nameStr).trim();
  var match = str.match(/^(.+?)\(([^)]+)\)\s*$/);
  if (match) {
    return { name: match[1].trim(), grade: match[2].trim() };
  }
  return { name: str, grade: "" };
}

// --- カウント加算 ---

// counterシートの学年・名前（大文字小文字不問）でマッチしてカウントを加算する
function addCount(ss, name) {
  var counterSheet = ss.getSheetByName(SHEET_NAMES.COUNTER);
  if (!counterSheet) return;

  var parsed = parseName_(name);
  if (!parsed.grade) {
    Logger.log("addCount: 学年が取得できませんでした（学年なし入力）: " + name);
    return;
  }

  var lastRow = counterSheet.getLastRow();
  if (lastRow < ROWS.COUNTER_DATA_START) return;

  var numRows = lastRow - ROWS.COUNTER_DATA_START + 1;
  var data = counterSheet.getRange(ROWS.COUNTER_DATA_START, 1, numRows, 4).getValues();

  for (var i = 0; i < data.length; i++) {
    var rowName  = String(data[i][COUNTER_COLS.NAME  - 1]).trim();
    var rowGrade = String(data[i][COUNTER_COLS.GRADE - 1]).trim();
    if (rowName.toLowerCase()  === parsed.name.toLowerCase() &&
        rowGrade.toLowerCase() === parsed.grade.toLowerCase()) {
      var current = Number(data[i][COUNTER_COLS.COUNT - 1]) || 0;
      counterSheet.getRange(ROWS.COUNTER_DATA_START + i, COUNTER_COLS.COUNT).setValue(current + 1);
      return;
    }
  }

  Logger.log("addCount: counterシートに未登録の学生です: " + name);
}

// --- 学年自動更新（毎年4月に実行） ---

function updateGrades() {
  var counterSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.COUNTER);
  if (!counterSheet) return;

  var lastRow = counterSheet.getLastRow();
  if (lastRow < ROWS.COUNTER_DATA_START) return;

  var numRows    = lastRow - ROWS.COUNTER_DATA_START + 1;
  var gradeRange = counterSheet.getRange(ROWS.COUNTER_DATA_START, COUNTER_COLS.GRADE, numRows, 1);
  var grades     = gradeRange.getValues();

  var GRADE_MAP = {
    "B1": "B2", "B2": "B3", "B3": "B4", "B4": "卒業",
    "M1": "M2", "M2": "修了"
  };

  for (var i = 0; i < grades.length; i++) {
    var g = String(grades[i][0]).trim().toUpperCase();
    if (GRADE_MAP[g]) {
      grades[i][0] = GRADE_MAP[g];
    }
  }

  gradeRange.setValues(grades);
}

// --- counterシートのヘッダー設定（初回のみ実行） ---

function setupCounterSheet() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.COUNTER);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAMES.COUNTER);
  }

  sheet.getRange("A1:D1").merge();
  sheet.getRange("A1").setValue("This is a sheet for recording the number of 1-on-1 sessions you've participated in; please do not edit it.");
  sheet.getRange("A1").setFontWeight("bold").setBackground(COLORS.HEADER_TITLE).setFontSize(FONTS.TITLE_SIZE);

  sheet.getRange("A2:D2").setValues([[
    "学籍番号(Students Number)", "名前(Name)", "学年(Grade)", "回数(Number of participants)"
  ]]);
  sheet.getRange("A2:D2").setFontWeight("bold").setBackground(COLORS.HEADER_ROW).setFontSize(FONTS.BODY_SIZE);
}
