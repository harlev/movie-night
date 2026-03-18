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
  const latestVisibleReply = thread.replies
    .filter((reply) => reply.status === 'visible')
    .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at))[0];

  return latestVisibleReply
    ? Date.parse(latestVisibleReply.created_at)
    : Date.parse(thread.created_at);
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

export function sortFeedbackThreads<T extends FeedbackSortableThread>(
  threads: T[],
  sortMode: FeedbackSortMode
): T[] {
  return [...threads].sort((left, right) => {
    if (sortMode === 'new') {
      return Date.parse(right.created_at) - Date.parse(left.created_at);
    }

    const activityDifference =
      getThreadActivityTimestamp(right) - getThreadActivityTimestamp(left);

    if (activityDifference !== 0) {
      return activityDifference;
    }

    return Date.parse(right.created_at) - Date.parse(left.created_at);
  });
}
