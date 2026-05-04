import LogRocket from 'logrocket';
import type { User } from './src/services/common.ts';

const APP_ID = import.meta.env.VITE_LOGROCKET_APP_ID;

export const initLogRocket = () => {
  // Disabilita LogRocket in ambiente di sviluppo locale
  if (import.meta.env.DEV) {
    console.warn('LogRocket initialization skipped in development mode');
    return;
  }

  if (!APP_ID) {
    console.warn(
      'LogRocket initialization skipped due to missing env variable',
    );
    return;
  }

  LogRocket.init(APP_ID, {
    network: {
      requestSanitizer: (request) => {
        // hide request / response pair with sensitive data
        const extractedUrl = request.url;

        const sensitiveEndpoint = ['login'];

        const conditionsForHidingResponse = sensitiveEndpoint.some((el) =>
          extractedUrl.includes(el),
        );

        if (conditionsForHidingResponse) {
          return null;
        }

        // hide token
        request.headers = {};
        return request;
      },
      responseSanitizer: (response) => {
        const sensitiveEndpoint = ['user', 's3'];
        if (sensitiveEndpoint.includes(response.reqId)) {
          response.body = '';
        }
        return response;
      },
    },
    // Tracciamento dei log di console
    console: {
      isEnabled: {
        log: true,
        info: true,
        debug: false,
        warn: true,
        error: true,
      },
    },
  });
};

export const identify = (user: User) => {
  if (!APP_ID) return;
  const { uuid } = user;
  LogRocket.identify(uuid, {
    //il tipo di environment dipenderà dall'ambiente in cui viene eseguito il progetto (staging, collaudo o produzione)
    environment: 'staging',
  });
};

export default LogRocket;
