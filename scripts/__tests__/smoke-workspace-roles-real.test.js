const {
  checklistPath,
  createCascadeTaskRequest,
  membershipStatusBody,
} = require('../smoke-workspace-roles-real');

describe('workspace role real smoke fixtures', () => {
  it('cascade 삭제 검증용 반복 일정에 series가 생성될 필드를 포함한다', () => {
    expect(createCascadeTaskRequest('run-id')).toMatchObject({
      title: '삭제 회귀 반복 일정 run-id',
      type: 'SCHEDULE',
      allDay: false,
      recurrence: { frequency: 'WEEKLY', interval: 1, recurrenceCount: 3 },
    });
    expect(createCascadeTaskRequest('123456789012').title).toBe('삭제 회귀 반복 일정 56789012');
  });

  it('초대 수락과 거절 status body를 생성한다', () => {
    expect(membershipStatusBody('ACTIVE')).toBe('{"status":"ACTIVE"}');
    expect(membershipStatusBody('REMOVED')).toBe('{"status":"REMOVED"}');
  });

  it('Workspace Task도 공통 checklist endpoint를 사용한다', () => {
    expect(checklistPath(41)).toBe('/api/v1/tasks/41/checklist-items');
  });
});
