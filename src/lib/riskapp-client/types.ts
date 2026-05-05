// I tipi sono il primo contratto tra backend, microservizio e frontend.
export interface ApiError {
  code: string;
  message: string;
}

export type ReportStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface Entity {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: number;
  title: string;
  entity_id: number;
  entity_name: string;
  status: ReportStatus;
  file_available: boolean;
  download_url: string | null;
  error: ApiError | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  uuid: string;
  username: string;
  is_active: boolean;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export interface ListResponse<T> {
  data: T[];
  meta: {
    count: number;
    limit: number;
    offset: number;
  };
}

export interface DataResponse<T> {
  data: T;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export type LoginResponse = DataResponse<User>;

export interface RegisterRequest {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
}

export type RegisterResponse = DataResponse<User>;

export interface CreateEntityRequest {
  name: string;
  description: string;
}

export interface UpdateEntityRequest {
  name?: string;
  description?: string;
}

export interface GetReportsRequest {
  entityId?: number;
  status?: ReportStatus;
}

export interface CreateReportRequest {
  title: string;
  entity_id: number;
  parameters: Record<string, unknown>;
}
