import { useLocalSearchParams } from 'expo-router';
import { WorkspaceDetail } from '@/features/workspaces';

export default function WorkspaceDetailScreen() {
  const { workspaceId } = useLocalSearchParams<{ workspaceId?: string | string[] }>();
  const value = Array.isArray(workspaceId) ? workspaceId[0] : workspaceId;
  const parsed = Number(value);
  return <WorkspaceDetail workspaceId={Number.isInteger(parsed) && parsed > 0 ? parsed : null} />;
}
