// computeSortedSheetOrder_ の純粋ロジックだけをテストする（GAS APIには依存しない）
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { computeSortedSheetOrder_ } = require("./manageSheets.js");

test("日付シートだけの配列は昇順に並び替わる", () => {
  const input = ["2026-08-28", "2026-08-14", "2026-08-21"];
  const result = computeSortedSheetOrder_(input);
  assert.deepEqual(result, ["2026-08-14", "2026-08-21", "2026-08-28"]);
});

test("非日付シート(counterなど)を挟んでいても、それぞれの区間内で日付シートがソートされる", () => {
  // counterの前後で別区間になるため、各区間は単独では既に昇順（2026-08-28は1件だけ、14<21）→ 変化しない
  const input = ["2026-08-28", "counter", "2026-08-14", "2026-08-21"];
  const result = computeSortedSheetOrder_(input);
  assert.deepEqual(result, ["2026-08-28", "counter", "2026-08-14", "2026-08-21"]);
});

test("同一区間内なら非日付シートを挟まなくても日付シートだけがソートされる", () => {
  const input = ["2026-08-28", "2026-08-14", "2026-08-21", "counter"];
  const result = computeSortedSheetOrder_(input);
  assert.deepEqual(result, ["2026-08-14", "2026-08-21", "2026-08-28", "counter"]);
});

test("既に正しい順序なら変化しない", () => {
  const input = ["2026-08-14", "counter", "2026-08-21", "2026-08-28"];
  const result = computeSortedSheetOrder_(input);
  assert.deepEqual(result, input);
});

test("日付シートが0件でもエラーにならない", () => {
  const input = ["counter", "設定"];
  const result = computeSortedSheetOrder_(input);
  assert.deepEqual(result, input);
});

test("日付シートが1件でもエラーにならない", () => {
  const input = ["counter", "2026-08-14"];
  const result = computeSortedSheetOrder_(input);
  assert.deepEqual(result, input);
});

test("counterを挟んで未来ブロックと過去ブロックがある場合、それぞれ独立に昇順ソートされる", () => {
  // counterより前=今週から4週間の未来シート、counterより後ろ=アーカイブ済みの過去シート
  const input = ["2026-09-01", "2026-08-25", "counter", "2020-01-01", "2021-01-01"];
  const result = computeSortedSheetOrder_(input);
  assert.deepEqual(result, ["2026-08-25", "2026-09-01", "counter", "2020-01-01", "2021-01-01"]);
});
