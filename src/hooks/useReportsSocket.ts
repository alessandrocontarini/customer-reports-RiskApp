import { useEffect, useMemo, useState } from 'react';
import {
  createReportsCryptoContext,
  decryptReportsSocketMessage,
  parseReportsSocketMessage,
  reportStatusSubscriptions,
  serializeReportsSocketMessage,
  type ReportsSocketMessage,
  type ReportsSocketState,
} from '../lib/riskapp-client';

import { baseApi } from '../services/api';
import { useAppDispatch } from '../store/hooks';

const getWsUrl = () => {
  if (import.meta.env.VITE_REPORT_WS_URL) {
    return import.meta.env.VITE_REPORT_WS_URL;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.host}/ws/reports/`;
};

export const useReportsSocket = (enabled: boolean) => {
  const dispatch = useAppDispatch();
  const [state, setState] = useState<ReportsSocketState>('closed');
  const [lastMessage, setLastMessage] = useState<string>('Nessun evento live');

  useEffect(() => {
    if (!enabled) return;

    let isDisposed = false;
    let privateKey: CryptoKey | null = null;

    const socket = new WebSocket(getWsUrl());
    queueMicrotask(() => {
      if (!isDisposed) setState('connecting');
    });

    const handleReportMessage = (message: ReportsSocketMessage) => {
      if (message.type === 'auth.success') {
        setState('authenticated');
        socket.send(
          serializeReportsSocketMessage({
            type: 'subscribe',
            filters: {
              report_statuses: reportStatusSubscriptions,
            },
          }),
        );
        return;
      }

      if (message.type === 'report.updated') {
        setLastMessage(`Report #${message.report_id}: ${message.status}`);
        dispatch(baseApi.util.invalidateTags(['Reports']));
        return;
      }

      if (message.type === 'report.ready') {
        setLastMessage(`Report #${message.report_id} pronto per il download`);
        dispatch(baseApi.util.invalidateTags(['Reports']));
        return;
      }

      if (message.type === 'report.failed') {
        setLastMessage(`Report #${message.report_id} fallito`);
        dispatch(baseApi.util.invalidateTags(['Reports']));
      }
    };

    socket.addEventListener('open', () => {
      setState('connected');

      createReportsCryptoContext()
        .then((cryptoContext) => {
          if (isDisposed || socket.readyState !== WebSocket.OPEN) return;

          privateKey = cryptoContext.privateKey;
          socket.send(
            serializeReportsSocketMessage({
              type: 'auth',
              public_key: cryptoContext.publicKeyJwk,
            }),
          );
        })
        .catch(() => {
          if (isDisposed || socket.readyState !== WebSocket.OPEN) return;
          socket.send(serializeReportsSocketMessage({ type: 'auth' }));
        });
    });

    socket.addEventListener('message', (event) => {
      const message = parseReportsSocketMessage(event.data);
      if (!message) return;

      if (message.type !== 'encrypted') {
        handleReportMessage(message);
        return;
      }

      if (!privateKey) return;

      decryptReportsSocketMessage(privateKey, message.ciphertext)
        .then((plaintext) => {
          if (isDisposed) return;

          const decryptedMessage = parseReportsSocketMessage(plaintext);
          if (!decryptedMessage) return;

          handleReportMessage(decryptedMessage);
        })
        .catch(() => {
          setLastMessage('Evento live cifrato non leggibile');
        });
    });

    socket.addEventListener('close', () => setState('closed'));

    return () => {
      isDisposed = true;
      socket.close();
    };
  }, [dispatch, enabled]);

  return useMemo(() => ({ state, lastMessage }), [lastMessage, state]);
};
