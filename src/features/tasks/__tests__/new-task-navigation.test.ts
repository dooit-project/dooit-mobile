import { leaveNewTaskScreen } from '@/features/tasks/new-task-navigation';

describe('leaveNewTaskScreen', () => {
  it('앱 안에서 진입했으면 이전 화면으로 돌아간다', () => {
    const router = {
      back: jest.fn(),
      canGoBack: jest.fn(() => true),
      replace: jest.fn(),
    };

    leaveNewTaskScreen(router);

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('직접 진입했으면 Today로 이동한다', () => {
    const router = {
      back: jest.fn(),
      canGoBack: jest.fn(() => false),
      replace: jest.fn(),
    };

    leaveNewTaskScreen(router);

    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/');
  });
});
