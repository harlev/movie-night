import type { FeedbackSortMode } from '@/lib/types';

interface FeedbackAuthorLabelInput {
  isAnonymous: boolean;
  authorDisplayNameSnapshot: string;
}

interface FeedbackSortableReply {
  created_at: string;
  status: 'visible' | 'hidden';
}

interface FeedbackSortableThread {
  created_at: string;
  replies: FeedbackSortableReply[];
}

function getThreadActivityTimestamp(thread: FeedbackSortableThread): number {
  let latestTimestamp = Date.parse(thread.created_at);

  for (const reply of thread.replies) {
    if (reply.status !== 'visible') continue;

    const replyTimestamp = Date.parse(reply.created_at);
    if (replyTimestamp > latestTimestamp) {
      latestTimestamp = replyTimestamp;
    }
  }

  return latestTimestamp;
}

export function getFeedbackAuthorLabel({
  isAnonymous,
  authorDisplayNameSnapshot,
}: FeedbackAuthorLabelInput): string {
  return isAnonymous ? 'Anonymous' : authorDisplayNameSnapshot;
}

export function buildDirectedReplyPrefix(publicAuthorLabel: string): string {
  const normalizedLabel = publicAuthorLabel.trim().replace(/\s+/g, ' ');
  return normalizedLabel ? `@${normalizedLabel} ` : '';
}

export function getNextFeedbackComposerContent({
  currentContent,
  previousInitialContent,
  nextInitialContent,
}: {
  currentContent: string;
  previousInitialContent: string;
  nextInitialContent: string;
}): string {
  return currentContent === previousInitialContent ? nextInitialContent : currentContent;
}

export function sortFeedbackThreads<T extends FeedbackSortableThread>(
  threads: T[],
  sortMode: FeedbackSortMode
): T[] {
  const activityTimestamps = new Map<T, number>();

  for (const thread of threads) {
    activityTimestamps.set(thread, getThreadActivityTimestamp(thread));
  }

  return [...threads].sort((left, right) => {
    if (sortMode === 'new') {
      return Date.parse(right.created_at) - Date.parse(left.created_at);
    }

    const activityDifference =
      (activityTimestamps.get(right) || 0) - (activityTimestamps.get(left) || 0);

    if (activityDifference !== 0) {
      return activityDifference;
    }

    return Date.parse(right.created_at) - Date.parse(left.created_at);
  });
}
