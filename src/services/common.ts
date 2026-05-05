import { baseApi } from './api';
import {
  authPaths,
  type DataResponse,
  type User,
} from '../lib/riskapp-client';

export type { User } from '../lib/riskapp-client';

type GetUserRequest = void;
type GetUserResponse = User;

const commonApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    logout: builder.mutation<void, void>({
      query: () => ({
        url: authPaths.logout,
        method: 'POST',
      }),
    }),
    getUser: builder.query<GetUserResponse, GetUserRequest>({
      query: () => ({
        url: authPaths.me,
        method: 'GET',
      }),
      transformResponse: (response: DataResponse<User>) => response.data,
    }),
  }),
});

export const { useGetUserQuery, useLazyGetUserQuery, useLogoutMutation } =
  commonApi;
