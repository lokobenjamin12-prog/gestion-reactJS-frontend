export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
export type LogState = 'SUCCESS' | 'FAILED';

export interface AuthLog {
  id: string;
  actorId: string | null;
  actorName: string | null;
  module: string;
  action: string;
  level: LogLevel;
  entityId: string | null;
  entityName: string | null;
  state: LogState;
  reason: string | null;
  message: string;
  email: string | null;
  createdAt: string;
}
