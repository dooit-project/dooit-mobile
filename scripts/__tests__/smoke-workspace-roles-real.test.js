const { createCascadeTaskRequest } = require('../smoke-workspace-roles-real');

describe('workspace role real smoke fixtures', () => {
  it('cascade 삭제 검증용 반복 일정에 series가 생성될 필드를 포함한다', () => {
    expect(createCascadeTaskRequest('run-id')).toMatchObject({
      title: '삭제 회귀 반복 일정 run-id',
      type: 'SCHEDULE',
      allDay: false,
      recurrence: { frequency: 'WEEKLY', interval: 1, recurrenceCount: 3 },
    });
  });
});
