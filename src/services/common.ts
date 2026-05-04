import { baseApi } from './api';

type CreateLogoutRequest = void;
type CreateLogoutResponse = void;

export interface User {
  uuid: string;
  username: string;
  is_active: boolean;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

type GetUserRequest = void;
type GetUserResponse = User;

const commonApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    logout: builder.mutation<CreateLogoutRequest, CreateLogoutResponse>({
      query: () => ({
        url: '/auth/logout/',
        method: 'POST',
      }),
    }),
    getUser: builder.query<GetUserResponse, GetUserRequest>({
      query: () => ({
        url: '/me/',
        method: 'GET',
      }),
      transformResponse: (response: { data: User }) => response.data,
    }),
  }),
});

export const { useGetUserQuery, useLazyGetUserQuery, useLogoutMutation } =
  commonApi;
