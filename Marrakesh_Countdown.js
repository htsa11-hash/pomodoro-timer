// Variables used by Scriptable.
// icon-color: orange; icon-glyph: plane;

// ===== 設定 =====
// 目標日時: 2026年8月9日 午前2:00 (モロッコ/マラケシュ時間, UTC+1)
const targetDate = new Date(Date.UTC(2026, 7, 9, 1, 0, 0)); // = Marrakesh 02:00 (UTC+1)

// 起算日 (フライトパスが0%になる基準日。必要に応じて変更してください)
const startDate = new Date(Date.UTC(2026, 1, 19, 0, 0, 0)); // 2026-02-19

const label = "Marrakeshまで";

// ===== 計算 =====
const now = new Date();
const totalMs = targetDate - startDate;
const remainMs = targetDate - now;
const elapsedMs = now - startDate;

const clampedProgress = Math.max(0, Math.min(1, elapsedMs / totalMs));
const percent = Math.round(clampedProgress * 100);

const isPast = remainMs <= 0;
const absMs = Math.abs(remainMs);
const totalMinutes = Math.floor(absMs / 60000);
const days = Math.floor(totalMinutes / (60 * 24));
const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
const minutes = totalMinutes % 60;

let bigText;
if (isPast) {
  bigText = "到着済み";
} else if (days > 0) {
  bigText = `${days}日 ${hours}h`;
} else {
  bigText = `${hours}h ${minutes}m`;
}

// ===== フライトパス風の進捗表現 =====
// 📍 ┄┄┄ ✈️ ┄┄┄┄┄ 📍  のように、飛行機の位置で進捗を表す
const pathLength = 12;
const filled = Math.max(0, Math.min(pathLength, Math.round((percent / 100) * pathLength)));
const remainDashes = pathLength - filled;
const leftDashes = "┄".repeat(filled);
const rightDashes = "┄".repeat(remainDashes);

// ===== 飛行機アイコン (横向きのシンプルなシルエット) =====
const planeSymbol = SFSymbol.named("airplane");
planeSymbol.applyFont(Font.systemFont(12));
const planeTint = Color.dynamic(Color.black(), Color.white());

// ===== ウィジェット構築 =====
let widget = new ListWidget();
widget.setPadding(6, 10, 6, 10);

const family = config.widgetFamily;

if (family === "accessoryCircular") {
  // ロック画面: 円形
  const stack = widget.addStack();
  stack.layoutVertically();
  stack.centerAlignContent();

  const plane = stack.addImage(planeSymbol.image);
  plane.imageSize = new Size(13, 13);
  plane.tintColor = planeTint;
  plane.centerAlignImage();

  const pctText = stack.addText(`${percent}%`);
  pctText.font = Font.boldSystemFont(16);
  pctText.centerAlignText();

  const dayText = stack.addText(isPast ? "到着" : `${days}日`);
  dayText.font = Font.systemFont(10);
  dayText.centerAlignText();

} else if (family === "accessoryInline") {
  // ロック画面: 1行インライン
  const text = widget.addText(`✈️ ${label} ${bigText}`);
  text.font = Font.systemFont(14);

} else {
  // ロック画面: 長方形 (accessoryRectangular) / ホーム画面小
  const titleText = widget.addText(label);
  titleText.font = Font.systemFont(11);

  widget.addSpacer(3);

  const pathStack = widget.addStack();
  pathStack.layoutHorizontally();
  pathStack.centerAlignContent();

  const startPin = pathStack.addText("📍");
  startPin.font = Font.systemFont(9);

  const leftDashText = pathStack.addText(leftDashes);
  leftDashText.font = Font.systemFont(12);
  leftDashText.minimumScaleFactor = 0.6;

  const planeImg = pathStack.addImage(planeSymbol.image);
  planeImg.imageSize = new Size(12, 12);
  planeImg.tintColor = planeTint;

  const rightDashText = pathStack.addText(rightDashes);
  rightDashText.font = Font.systemFont(12);
  rightDashText.minimumScaleFactor = 0.6;

  const endPin = pathStack.addText("📍");
  endPin.font = Font.systemFont(9);

  widget.addSpacer(3);

  const bottomStack = widget.addStack();
  bottomStack.layoutHorizontally();
  bottomStack.centerAlignContent();

  const bigLabel = bottomStack.addText(bigText);
  bigLabel.font = Font.boldSystemFont(16);
  bigLabel.minimumScaleFactor = 0.7;

  bottomStack.addSpacer();

  const pctLabel = bottomStack.addText(`${percent}%`);
  pctLabel.font = Font.systemFont(12);
}

// 1時間ごとを目安に更新
widget.refreshAfterDate = new Date(Date.now() + 60 * 60 * 1000);

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentMedium();
}
Script.complete();
