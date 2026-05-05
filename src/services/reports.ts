import { baseApi } from './api';
import {
  entityPaths,
  reportPaths,
  type CreateEntityRequest,
  type CreateReportRequest,
  type DataResponse,
  type Entity,
  type GetReportsRequest,
  type ListResponse,
  type Report,
  type UpdateEntityRequest,
} from '../lib/riskapp-client';

export type { Entity, Report } from '../lib/riskapp-client';

export const reportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEntities: builder.query<ListResponse<Entity>, void>({
      query: () => ({ url: entityPaths.list, method: 'GET' }),
      providesTags: ['Entities'],
      keepUnusedDataFor: 0,
    }),
    getEntity: builder.query<Entity, number>({
      query: (entityId) => ({
        url: entityPaths.detail(entityId),
        method: 'GET',
      }),
      transformResponse: (response: DataResponse<Entity>) => response.data,
      providesTags: ['Entities'],
    }),
    createEntity: builder.mutation<Entity, CreateEntityRequest>({
      query: (body) => ({ url: entityPaths.list, method: 'POST', body }),
      transformResponse: (response: DataResponse<Entity>) => response.data,
      invalidatesTags: ['Entities'],
    }),

    updateEntity: builder.mutation<
      Entity,
      { entityId: number; body: UpdateEntityRequest }
    >({
      query: ({ entityId, body }) => ({
        url: entityPaths.detail(entityId),
        method: 'PATCH',
        body,
      }),
      transformResponse: (response: DataResponse<Entity>) => response.data,
      invalidatesTags: ['Entities'],
    }),


    getReports: builder.query<ListResponse<Report>, GetReportsRequest | void>({
      query: (params) => ({
        url: reportPaths.list,
        method: 'GET',
        params: {
          ...(params?.entityId ? { entity_id: params.entityId } : {}),
          ...(params?.status ? { status: params.status } : {}),
        },
      }),
      providesTags: ['Reports'],
      keepUnusedDataFor: 0,
    }),
    getReport: builder.query<Report, number>({
      query: (reportId) => ({
        url: reportPaths.detail(reportId),
        method: 'GET',
      }),
      transformResponse: (response: DataResponse<Report>) => response.data,
      providesTags: ['Reports'],
    }),
    createReport: builder.mutation<Report, CreateReportRequest>({
      query: (body) => ({ url: reportPaths.list, method: 'POST', body }),
      transformResponse: (response: DataResponse<Report>) => response.data,
      invalidatesTags: ['Reports'],
    }),
    cancelReport: builder.mutation<Report, number>({
      query: (reportId) => ({
        url: reportPaths.cancel(reportId),
        method: 'POST',
      }),
      transformResponse: (response: DataResponse<Report>) => response.data,
      invalidatesTags: ['Reports'],
    }),
    deleteReport: builder.mutation<void, number>({
      query: (reportId) => ({
        url: reportPaths.detail(reportId),
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
