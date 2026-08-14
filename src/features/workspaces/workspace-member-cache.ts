import type { WorkspaceMemberResponse } from '@/types';

export function upsertWorkspaceMember(
  members: WorkspaceMemberResponse[] | undefined,
  member: WorkspaceMemberResponse,
) {
  const current = members ?? [];
  if (member.status !== 'ACTIVE') return current.filter((item) => item.id !== member.id);
  return current.some((item) => item.id === member.id)
    ? current.map((item) => (item.id === member.id ? member : item))
    : [...current, member];
}

export function removeWorkspaceMember(
  members: WorkspaceMemberResponse[] | undefined,
  memberId: number,
) {
  return (members ?? []).filter((member) => member.id !== memberId);
}
