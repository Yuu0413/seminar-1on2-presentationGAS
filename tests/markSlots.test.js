// computeActiveBackgrounds_ の純粋ロジックだけをテストする（GAS APIには依存しない）
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { computeActiveBackgrounds_, computeDoneUpdates_ } = require("../markSlots.js");

const ACTIVE = "#00ff00";
const DONE_SIGNAL = "#999999";
const NONE = "#ffffff";
const DONE_STATUS = "済(Done)";
const NOT_AVAILABLE_STATUS = "対応不可";

// parseTime は内部で「今日の日付」+ 指定した時刻 を組み立てるため、
// テスト側の now も同じ「今日の日付」を基準にしないと比較がずれる
function todayAt(hour, minute) {
  var d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

test("発表行で名前が入っていれば緑にする", () => {
  const schedule = [{ type: "presentation" }];
  const names = [["Tanaka(B2)"]];
  const backgrounds = [[NONE]];
  const result = computeActiveBackgrounds_(schedule, names, backgrounds, ACTIVE, DONE_SIGNAL);
  assert.deepEqual(result, [[ACTIVE]]);
});

test("発表行でも名前が空欄なら背景を変更しない", () => {
  const schedule = [{ type: "presentation" }];
  const names = [[""]];
  const backgrounds = [[NONE]];
  const result = computeActiveBackgrounds_(schedule, names, backgrounds, ACTIVE, DONE_SIGNAL);
  assert.deepEqual(result, [[NONE]]);
});

test("休憩行はD列に「休憩」という文字列が入っていても背景を変更しない", () => {
  const schedule = [{ type: "break" }];
  const names = [["休憩"]];
  const backgrounds = [[NONE]];
  const result = computeActiveBackgrounds_(schedule, names, backgrounds, ACTIVE, DONE_SIGNAL);
  assert.deepEqual(result, [[NONE]]);
});

test("先生の行はD列に「先生からの共有」という文字列が入っていても背景を変更しない", () => {
  const schedule = [{ type: "teacher" }];
  const names = [["先生からの共有"]];
  const backgrounds = [[NONE]];
  const result = computeActiveBackgrounds_(schedule, names, backgrounds, ACTIVE, DONE_SIGNAL);
  assert.deepEqual(result, [[NONE]]);
});

test("すでに済(灰色)になっている行は、名前が入っていても緑で上書きしない", () => {
  const schedule = [{ type: "presentation" }];
  const names = [["Tanaka(B2)"]];
  const backgrounds = [[DONE_SIGNAL]];
  const result = computeActiveBackgrounds_(schedule, names, backgrounds, ACTIVE, DONE_SIGNAL);
  assert.deepEqual(result, [[DONE_SIGNAL]]);
});

test("SCHEDULEに対応する定義が無い行はエラーにならず何もしない", () => {
  const schedule = [];
  const names = [["Tanaka(B2)"]];
  const backgrounds = [[NONE]];
  const result = computeActiveBackgrounds_(schedule, names, backgrounds, ACTIVE, DONE_SIGNAL);
  assert.deepEqual(result, [[NONE]]);
});

// computeDoneUpdates_ の純粋ロジックだけをテストする（GAS APIには依存しない）

test("発表行・名前あり・灰色・終了時刻を過ぎている場合は済の対象になる", () => {
  const schedule = [{ type: "presentation" }];
  const data = [["13:10", "13:30", "Tanaka(B2)", ""]];
  const backgrounds = [[DONE_SIGNAL]];
  const now = todayAt(14, 0);
  const result = computeDoneUpdates_(schedule, data, backgrounds, now, DONE_SIGNAL, DONE_STATUS, NOT_AVAILABLE_STATUS);
  assert.deepEqual(result, [{ index: 0, name: "Tanaka(B2)" }]);
});

test("時間が過ぎていても緑色のままなら対象にしない", () => {
  const schedule = [{ type: "presentation" }];
  const data = [["13:10", "13:30", "Tanaka(B2)", ""]];
  const backgrounds = [[ACTIVE]];
  const now = todayAt(14, 0);
  const result = computeDoneUpdates_(schedule, data, backgrounds, now, DONE_SIGNAL, DONE_STATUS, NOT_AVAILABLE_STATUS);
  assert.deepEqual(result, []);
});

test("時間が過ぎておらず緑色のままなら対象にしない", () => {
  const schedule = [{ type: "presentation" }];
  const data = [["13:10", "13:30", "Tanaka(B2)", ""]];
  const backgrounds = [[ACTIVE]];
  const now = todayAt(13, 15);
  const result = computeDoneUpdates_(schedule, data, backgrounds, now, DONE_SIGNAL, DONE_STATUS, NOT_AVAILABLE_STATUS);
  assert.deepEqual(result, []);
});

test("nowとendTimeの「日付」がずれていても、時刻だけを見て終了時刻を過ぎているか判定する", () => {
  // parseTime()は内部で「実行時点の実際の今日」を使ってendTimeを組み立てるため、
  // テストのnowが違う年月日を指していると、時刻としては過ぎていても日付比較で
  // 「まだ過ぎていない」と誤判定されないことを確認する
  const schedule = [{ type: "presentation" }];
  const data = [["13:10", "13:30", "Tanaka(B2)", ""]];
  const backgrounds = [[DONE_SIGNAL]];
  const now = new Date(2020, 0, 1, 14, 0); // 日付は2020年だが、時刻は14:00（13:30より後）
  const result = computeDoneUpdates_(schedule, data, backgrounds, now, DONE_SIGNAL, DONE_STATUS, NOT_AVAILABLE_STATUS);
  assert.deepEqual(result, [{ index: 0, name: "Tanaka(B2)" }]);
});

test("灰色になっていても、まだ終了時刻を過ぎていなければ対象にしない（時刻を過ぎたら次回に回る）", () => {
  const schedule = [{ type: "presentation" }];
  const data = [["13:10", "13:30", "Tanaka(B2)", ""]];
  const backgrounds = [[DONE_SIGNAL]];
  const now = todayAt(13, 15);
  const result = computeDoneUpdates_(schedule, data, backgrounds, now, DONE_SIGNAL, DONE_STATUS, NOT_AVAILABLE_STATUS);
  assert.deepEqual(result, []);
});

test("時間が過ぎていても名前欄が空欄なら対象にしない", () => {
  const schedule = [{ type: "presentation" }];
  const data = [["13:10", "13:30", "", ""]];
  const backgrounds = [[DONE_SIGNAL]];
  const now = todayAt(14, 0);
  const result = computeDoneUpdates_(schedule, data, backgrounds, now, DONE_SIGNAL, DONE_STATUS, NOT_AVAILABLE_STATUS);
  assert.deepEqual(result, []);
});

test("休憩行は灰色かつ時間を過ぎていても対象外（発表行だけが対象）", () => {
  const schedule = [{ type: "break" }];
  const data = [["13:50", "14:00", "休憩", ""]];
  const backgrounds = [[DONE_SIGNAL]];
  const now = todayAt(14, 30);
  const result = computeDoneUpdates_(schedule, data, backgrounds, now, DONE_SIGNAL, DONE_STATUS, NOT_AVAILABLE_STATUS);
  assert.deepEqual(result, []);
});

test("すでに済(Done)になっている行は、重複してカウント対象にしない", () => {
  const schedule = [{ type: "presentation" }];
  const data = [["13:10", "13:30", "Tanaka(B2)", DONE_STATUS]];
  const backgrounds = [[DONE_SIGNAL]];
  const now = todayAt(14, 0);
  const result = computeDoneUpdates_(schedule, data, backgrounds, now, DONE_SIGNAL, DONE_STATUS, NOT_AVAILABLE_STATUS);
  assert.deepEqual(result, []);
});

test("対応不可になっている行は対象にしない", () => {
  const schedule = [{ type: "presentation" }];
  const data = [["13:10", "13:30", "Tanaka(B2)", NOT_AVAILABLE_STATUS]];
  const backgrounds = [[DONE_SIGNAL]];
  const now = todayAt(14, 0);
  const result = computeDoneUpdates_(schedule, data, backgrounds, now, DONE_SIGNAL, DONE_STATUS, NOT_AVAILABLE_STATUS);
  assert.deepEqual(result, []);
});

test("START/ENDが空欄（休憩枠など）でもエラーにならず対象外になる", () => {
  const schedule = [{ type: "presentation" }];
  const data = [["", "", "", ""]];
  const backgrounds = [[DONE_SIGNAL]];
  const now = todayAt(14, 0);
  const result = computeDoneUpdates_(schedule, data, backgrounds, now, DONE_SIGNAL, DONE_STATUS, NOT_AVAILABLE_STATUS);
  assert.deepEqual(result, []);
});
