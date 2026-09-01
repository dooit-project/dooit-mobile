import { getSharedCaptureDomain, getSharedCaptureDraft } from '../shared-capture-presentation';

describe('shared capture presentation', () => {
  it('공유 텍스트와 URL에서 편집 제목과 원문 링크를 분리한다', () => {
    expect(
      getSharedCaptureDraft(['팀 회의 준비 체크리스트\nhttps://example.com/meeting-notes']),
    ).toEqual({
      title: '팀 회의 준비 체크리스트',
      url: 'https://example.com/meeting-notes',
    });
  });

  it('URL만 공유되면 domain을 기본 제목으로 사용한다', () => {
    expect(getSharedCaptureDraft(['https://www.example.com/meeting-notes'])).toEqual({
      title: 'example.com 링크',
      url: 'https://www.example.com/meeting-notes',
    });
  });

  it('일반 텍스트 공유는 링크 preview 없이 제목만 만든다', () => {
    expect(getSharedCaptureDraft(['장보기 목록 정리'])).toEqual({
      title: '장보기 목록 정리',
      url: null,
    });
    expect(getSharedCaptureDomain('https://www.dooit.app/path')).toBe('dooit.app');
  });
});
