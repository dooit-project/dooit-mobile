const emptySharedPayloads: { value: string }[] = [];

export function useSharedCaptureIncomingShare() {
  return {
    clearSharedPayloads: () => undefined,
    sharedPayloads: emptySharedPayloads,
  };
}
