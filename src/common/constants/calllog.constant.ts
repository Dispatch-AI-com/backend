export enum CallLogStatus {
  Missed = 'Missed',
  Completed = 'Completed',
  FollowUp = 'Follow-up',
}

export const DEFAULT_CALLLOG_STATUS = CallLogStatus.Completed;

export const CALLLOG_SORT_OPTIONS = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
} as const;

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
