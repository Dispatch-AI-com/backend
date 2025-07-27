export enum CallLogStatus {
  Cancelled = 'Cancelled',
  Done = 'Done',
  Confirmed = 'Confirmed',
}

export const DEFAULT_CALLLOG_STATUS = CallLogStatus.Done;

export const CALLLOG_SORT_OPTIONS = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
} as const;

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
