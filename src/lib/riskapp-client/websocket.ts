import type { ApiError, ReportStatus, User } from './types';

export type ReportsSocketState =
  | 'connecting'
  | 'connected'
  | 'authenticated'
  | 'closed';

export type ReportsSocketClientMessage =
  | { type: 'auth' }
  | {
      type: 'subscribe';
      filters: {
        report_statuses: ReportStatus[];
      };
    };

export type ReportsSocketMessage =
  | { type: 'auth.success'; user: User }
  | { type: 'auth.failed'; error: ApiError }
  | { type: 'subscribed'; filters: unknown }
  | { type: 'report.updated'; report_id: number; status: ReportStatus }
  | {
      type: 'report.ready';
      report_id: number;
      status: 'completed';
      payload: { download_url: string };
    }
  | {
      type: 'report.failed';
      report_id: number;
      status: 'failed';
      error: ApiError;
    };

export const reportStatusSubscriptions: ReportStatus[] = [
  'pending',
  'running',
  'completed',
  'failed',
];

export const parseReportsSocketMessage = (
  data: string,
): ReportsSocketMessage | null => {
  try {
    const message = JSON.parse(data) as Partial<ReportsSocketMessage>;
    return typeof message.type === 'string'
      ? (message as ReportsSocketMessage)
      : null;
  } catch {
    return null;
  }
};

export const serializeReportsSocketMessage = (
  message: ReportsSocketClientMessage,
) => JSON.stringify(message);
