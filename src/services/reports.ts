import { baseApi } from './api';

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
  error: { code: string; message: string } | null;
  created_at: string;
  updated_at: string;
}

interface ListResponse<T> {
  data: T[];
  meta: {
    count: number;
    limit: number;
    offset: number;
  };
}

interface DataResponse<T> {
  data: T;
}

interface GetReportsRequest {
  entityId?: number;
}

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEntities: builder.query<ListResponse<Entity>, void>({
      query: () => ({ url: '/entities/', method: 'GET' }),
      providesTags: ['Entities'],
      keepUnusedDataFor: 0,
    }),
    getEntity: builder.query<Entity, number>({
      query: (entityId) => ({ url: `/entities/${entityId}/`, method: 'GET' }),
      transformResponse: (response: DataResponse<Entity>) => response.data,
      providesTags: ['Entities'],
    }),
    createEntity: builder.mutation<
      Entity,
      { name: string; description: string }
    >({
      query: (body) => ({ url: '/entities/', method: 'POST', body }),
      transformResponse: (response: DataResponse<Entity>) => response.data,
      invalidatesTags: ['Entities'],
    }),

    updateEntity: builder.mutation<
      Entity,
      { entityId: number; body: { name?: string; description?: string } }
    >({
      query: ({ entityId, body }) => ({
        url: `/entities/${entityId}/`,
        method: 'PATCH',
        body,
      }),
      transformResponse: (response: DataResponse<Entity>) => response.data,
      invalidatesTags: ['Entities'],
    }),


    getReports: builder.query<ListResponse<Report>, GetReportsRequest | void>({
      query: (params) => ({
        url: '/reports/',
        method: 'GET',
        params: params?.entityId ? { entity_id: params.entityId } : undefined,
      }),
      providesTags: ['Reports'],
      keepUnusedDataFor: 0,
    }),
    getReport: builder.query<Report, number>({
      query: (reportId) => ({ url: `/reports/${reportId}/`, method: 'GET' }),
      transformResponse: (response: DataResponse<Report>) => response.data,
      providesTags: ['Reports'],
    }),
    createReport: builder.mutation<
      Report,
      { title: string; entity_id: number; parameters: Record<string, unknown> }
    >({
      query: (body) => ({ url: '/reports/', method: 'POST', body }),
      transformResponse: (response: DataResponse<Report>) => response.data,
      invalidatesTags: ['Reports'],
    }),
    cancelReport: builder.mutation<Report, number>({
      query: (reportId) => ({
        url: `/reports/${reportId}/cancel/`,
        method: 'POST',
      }),
      transformResponse: (response: DataResponse<Report>) => response.data,
      invalidatesTags: ['Reports'],
    }),
    deleteReport: builder.mutation<void, number>({
      query: (reportId) => ({
        url: `/reports/${reportId}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Reports'],
    }),
  }),
});

export const {
  useCancelReportMutation,
  useCreateEntityMutation,
  useCreateReportMutation,
  useGetEntitiesQuery,
  useGetEntityQuery,
  useGetReportQuery,
  useGetReportsQuery,
  useDeleteReportMutation,
  useUpdateEntityMutation,
} = reportsApi;
