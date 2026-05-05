export const reportPaths = {
  list: '/reports/',
  detail: (id: number) => `/reports/${id}/`,
  cancel: (id: number) => `/reports/${id}/cancel/`,
  download: (id: number) => `/reports/${id}/download/`,
};
