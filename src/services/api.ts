import {
  type BaseQueryFn,
  createApi,
  type FetchArgs,
  fetchBaseQuery,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';
import { setAuthenticated, setAuthPending } from '../store/authSlice';

const trimEndSlash = (value: string) => value.replace(/\/+$/, '');
const trimSlash = (value: string) => value.replace(/^\/+|\/+$/g, '');

const BASE_URL = import.meta.env.DEV
  ? trimEndSlash(import.meta.env.VITE_API_BASE_URL ?? '')
  : '';
const BASE_PATH = trimSlash(
  import.meta.env.VITE_API_BASE_PATHS?.split(',')?.at(0) ?? '',
);

const mutex = new Mutex();

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${BASE_URL}${BASE_PATH ? `/${BASE_PATH}` : ''}`,
  prepareHeaders: (headers) => {
    headers.set('content-type', 'application/json');
    return headers;
  },
  credentials: 'include',
});

const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  await mutex.waitForUnlock();

  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      try {
        api.dispatch(setAuthPending());
        const refreshResult = await rawBaseQuery(
          { url: '/auth/refresh-token/', method: 'POST' },
          api,
          extraOptions,
        );

        if (refreshResult.data) {
          api.dispatch(setAuthenticated(true));
          result = await rawBaseQuery(args, api, extraOptions);
        } else {
          await rawBaseQuery(
            { url: `/auth/logout/`, method: 'POST' },
            api,
            extraOptions,
          );
          api.dispatch(setAuthenticated(false));
        }
      } catch {
        api.dispatch(setAuthenticated(false));
      } finally {
        release();
      }
    } else {
      await mutex.waitForUnlock();
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export const publicApi = createApi({
  reducerPath: 'publicApi',
  baseQuery: rawBaseQuery,
  endpoints: () => ({}),
});

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQuery,
  tagTypes: ['Entities', 'Reports'],
  endpoints: () => ({}),
});
