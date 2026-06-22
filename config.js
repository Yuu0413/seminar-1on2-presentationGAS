// 設定値・定数

var SHEET_NAMES = {
  COUNTER: "counter"
};

var COLUMNS = {
  PERIOD:       1,
  START:        2,
  END:          3,
  NAME:         4,
  STATUS:       5,
  CONSULTATION: 6,
  REQUEST:      7,
  TEACHER_INFO: 8
};

var COLORS = {
  ACTIVE:       "#00ff00",
  DONE_SIGNAL:  "#999999",
  HEADER_TITLE: "#cccccc",
  HEADER_ROW:   "#d9d9d9"
};

var FONTS = {
  TITLE_SIZE: 16,
  BODY_SIZE:  10
};

var STATUSES = {
  DONE:          "済(Done)",
  NOT_AVAILABLE: "対応不可",
  BREAK:         "休憩",
  TEACHER:       "先生からの共有"
};

// スケジュール定義（type: "teacher" | "presentation" | "break"）
var SCHEDULE = [
  { start: "13:10", end: "13:30", type: "teacher",      period: "3rd" },
  { start: "13:30", end: "13:50", type: "presentation" },
  { start: "13:50", end: "14:00", type: "break" },
  { start: "14:00", end: "14:20", type: "presentation" },
  { start: "14:20", end: "14:30", type: "break" },
  { start: "14:30", end: "14:50", type: "presentation" },
  { start: "14:50", end: "15:00", type: "break" },
  { start: "15:00", end: "15:20", type: "presentation", period: "4th" },
  { start: "15:20", end: "15:30", type: "break" },
  { start: "15:30", end: "15:50", type: "presentation" },
  { start: "15:50", end: "16:00", type: "break" },
  { start: "16:00", end: "16:20", type: "presentation" },
  { start: "16:20", end: "16:30", type: "break" },
  { start: "16:30", end: "16:50", type: "teacher" },
  { start: "16:50", end: "17:00", type: "presentation", period: "5th" },
  { start: "17:00", end: "17:10", type: "break" },
  { start: "17:10", end: "17:30", type: "presentation" },
  { start: "17:30", end: "17:40", type: "break" },
  { start: "17:40", end: "18:00", type: "presentation" },
  { start: "18:00", end: "18:10", type: "break" },
  { start: "18:10", end: "18:30", type: "presentation" },
  { start: "18:30", end: "18:40", type: "break" },
  { start: "18:40", end: "19:00", type: "presentation", period: "6th" },
  { start: "19:00", end: "19:10", type: "break" },
  { start: "19:10", end: "19:30", type: "presentation" },
  { start: "19:30", end: "19:40", type: "break" },
  { start: "19:40", end: "20:00", type: "presentation" },
  { start: "20:00", end: "20:10", type: "break" },
  { start: "20:10", end: "20:30", type: "presentation" }
];

// 行番号定義（SCHEDULE 定義の後に配置する必要あり）
var ROWS = {
  DATA_START:         3,
  LAST_DATA_ROW:      3 + SCHEDULE.length - 1,
  COUNTER_DATA_START: 3,
  COUNTER_SORT_START: 3
};

// counterシートの列番号定義
var COUNTER_COLS = {
  STUDENT_ID: 1,
  NAME:       2,
  GRADE:      3,
  COUNT:      4
};
