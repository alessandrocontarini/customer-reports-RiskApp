import { publicApi } from './api';

type CreateLoginResponse = { detail: string };
type CreateLoginRequest = { username: string; password: string };

type RegisterResponse = {
  data: {
    id: number;
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
};

type RegisterRequest = {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
};

const authApi = publicApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<CreateLoginResponse, CreateLoginRequest>({
      query: (credentials) => ({
        url: '/auth/login/',
        method: 'POST',
        body: { ...credentials },
      }),
    }),
    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (body) => ({
        url: '/auth/register/',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation } = authApi;
