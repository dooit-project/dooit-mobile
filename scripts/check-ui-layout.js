const fs = require('node:fs');

const validBox = (box) =>
  box &&
  ['x', 'y', 'width', 'height'].every((key) => Number.isFinite(box[key])) &&
  box.width > 0 &&
  box.height > 0;
const center = (box) => box.y + box.height / 2;

function getUiLayoutErrors(report, { tolerance = 2 } = {}) {
  const errors = [];
  if (
    report?.schemaVersion !== 1 ||
    !Number.isFinite(report?.viewport?.width) ||
    !Number.isFinite(report?.viewport?.height) ||
    report.viewport.width <= 0 ||
    report.viewport.height <= 0 ||
    !Array.isArray(report.rows) ||
    !Array.isArray(report.targets)
  )
    return ['올바른 실제 DOM 측정 보고서가 필요합니다.'];
  if (report.rows.length === 0)
    errors.push('측정된 정렬 행이 없습니다. 통과로 처리할 수 없습니다.');
  if (
    !Number.isFinite(report.documentWidth) ||
    report.documentWidth > report.viewport.width + tolerance
  )
    errors.push('문서 가로 넘침 또는 문서 폭 측정 누락을 확인하세요.');
  for (const row of report.rows) {
    const prefix = row.name || '이름 없는 행';
    if (!['text-block', 'title-line'].includes(row.alignment)) {
      errors.push(`${prefix}: 전체 텍스트/제목 첫 줄 정렬 기준을 명시하세요.`);
      continue;
    }
    const anchor = row.alignment === 'text-block' ? row.text : row.titleLine;
    if (
      !validBox(row.bounds) ||
      !validBox(anchor) ||
      !Array.isArray(row.icons) ||
      !row.icons.length
    ) {
      errors.push(`${prefix}: 아이콘/텍스트/행 측정이 누락됐습니다.`);
      continue;
    }
    if (
      anchor.x < row.bounds.x - tolerance ||
      anchor.x + anchor.width > row.bounds.x + row.bounds.width + tolerance
    )
      errors.push(`${prefix}: 텍스트가 행의 가로 영역을 벗어났습니다.`);
    row.icons.forEach((icon, index) => {
      if (!validBox(icon)) {
        errors.push(`${prefix}: 아이콘 ${index} 측정이 올바르지 않습니다.`);
        return;
      }
      const delta = center(icon) - center(anchor);
      if (Math.abs(delta) > tolerance)
        errors.push(`${prefix}: 아이콘 ${index}의 수직 중심 차이 ${delta.toFixed(2)}px`);
      if (icon.x + icon.width > anchor.x + tolerance && icon.x < anchor.x + anchor.width)
        errors.push(`${prefix}: 아이콘 ${index}와 텍스트 가로 영역이 겹칩니다.`);
    });
  }
  for (const target of report.targets) {
    if (!validBox(target.bounds) || !Number.isFinite(target.minimum) || target.minimum < 44) {
      errors.push(`${target.name}: 조작 영역 또는 최소 크기 측정이 누락됐습니다.`);
      continue;
    }
    if (target.bounds.width + 0.5 < target.minimum || target.bounds.height + 0.5 < target.minimum)
      errors.push(`${target.name}: 조작 영역이 ${target.minimum}px보다 작습니다.`);
  }
  return errors;
}

if (require.main === module) {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error('실제 측정 JSON 경로를 전달하세요: npm run check:ui-layout -- <report.json>');
    process.exitCode = 1;
  }
  for (const file of files) {
    try {
      const report = JSON.parse(fs.readFileSync(file, 'utf8'));
      const errors = getUiLayoutErrors(report);
      if (errors.length) {
        console.error(`${file}:\n${errors.map((error) => `- ${error}`).join('\n')}`);
        process.exitCode = 1;
      } else {
        console.log(
          `${file}: ${report.rows.length}행 / ${report.targets.length}조작 영역 기하 검사 통과`,
        );
      }
    } catch (error) {
      console.error(`${file}: ${error.message}`);
      process.exitCode = 1;
    }
  }
}

module.exports = { getUiLayoutErrors };
