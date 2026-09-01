export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    const url = new URL(path);
    return url.hostname === 'expo-sharing' ? '/share-review' : path;
  } catch {
    return '/';
  }
}
