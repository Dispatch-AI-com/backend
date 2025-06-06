export enum CallLogStatus {
  Missed = 'missed',
  Completed = 'completed',
  FollowUp = 'follow-up',
  InProgress = 'in-progress',
}

export const DEFAULT_CALLLOG_STATUS = CallLogStatus.Completed;

export const CALLLOG_SORT_OPTIONS = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
} as const;

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
