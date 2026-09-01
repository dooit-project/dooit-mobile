const urlPattern = /https?:\/\/[^\s]+/i;

export type SharedCaptureDraft = {
  title: string;
  url: string | null;
};

function stripTrailingPunctuation(value: string) {
  return value.replace(/[),.;!?]+$/, '');
}

export function getSharedCaptureDraft(values: string[]): SharedCaptureDraft {
  const normalized = values.map((value) => value.trim()).filter(Boolean);
  const combined = normalized.join('\n');
  const matchedUrl = combined.match(urlPattern)?.[0] ?? null;
  const url = matchedUrl ? stripTrailingPunctuation(matchedUrl) : null;
  const titleCandidate = normalized
    .flatMap((value) => value.split(/\r?\n/))
    .map((value) => value.replace(urlPattern, '').trim())
    .find(Boolean);

  if (titleCandidate) {
    return { title: titleCandidate.slice(0, 100), url };
  }

  if (url) {
    try {
      return { title: `${new URL(url).hostname.replace(/^www\./, '')} 링크`, url };
    } catch {
      return { title: '공유한 링크', url };
    }
  }

  return { title: '', url: null };
}

export function getSharedCaptureDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
