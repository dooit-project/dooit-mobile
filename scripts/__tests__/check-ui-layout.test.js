const { getUiLayoutErrors } = require('../check-ui-layout');

const report = () => ({
  schemaVersion: 1,
  viewport: { width: 390, height: 844 },
  documentWidth: 390,
  rows: [
    {
      name: 'date',
      alignment: 'text-block',
      bounds: { x: 20, y: 100, width: 350, height: 64 },
      text: { x: 60, y: 110, width: 280, height: 44 },
      titleLine: { x: 60, y: 110, width: 280, height: 18 },
      icons: [{ x: 20, y: 120, width: 24, height: 24 }],
    },
  ],
  targets: [{ name: 'check', minimum: 44, bounds: { x: 16, y: 100, width: 44, height: 44 } }],
});

test('두 줄 정보의 전체 중앙을 허용하고 라벨 첫 줄에 붙은 아이콘은 검출한다', () => {
  const measured = report();
  expect(getUiLayoutErrors(measured)).toEqual([]);
  measured.rows[0].icons[0].y = 107;
  expect(getUiLayoutErrors(measured).join(' ')).toContain('수직 중심 차이 -13.00px');
});

test('여러 줄 제목의 첫 줄 체크와 전체 텍스트 중앙을 구분한다', () => {
  const measured = report();
  measured.rows[0].alignment = 'title-line';
  measured.rows[0].titleLine.height = 24;
  measured.rows[0].text.height = 72;
  measured.rows[0].icons[0].y = 110;
  expect(getUiLayoutErrors(measured)).toEqual([]);
});

test('작은 그림 대신 실제 조작 영역을 검사하며 44 미만과 겹침/넘침을 검출한다', () => {
  const measured = report();
  measured.targets[0].bounds.height = 32;
  measured.rows[0].icons[0].x = 55;
  measured.documentWidth = 430;
  const errors = getUiLayoutErrors(measured).join(' ');
  expect(errors).toContain('44px보다 작습니다');
  expect(errors).toContain('겹칩니다');
  expect(errors).toContain('가로 넘침');
});

test('측정 누락/0행/알 수 없는 정렬은 통과시키지 않는다', () => {
  expect(getUiLayoutErrors({})).not.toEqual([]);
  expect(getUiLayoutErrors({ ...report(), rows: [] })).not.toEqual([]);
  const measured = report();
  measured.rows[0].alignment = 'guess';
  expect(getUiLayoutErrors(measured).join(' ')).toContain('정렬 기준');
  measured.rows[0].alignment = 'text-block';
  measured.rows[0].text = null;
  expect(getUiLayoutErrors(measured).join(' ')).toContain('측정이 누락');
});
