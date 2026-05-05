import { useEffect, useMemo, useState } from 'react';
import {
  parseReportsSocketMessage,
  reportStatusSubscriptions,
  serializeReportsSocketMessage,
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

    const socket = new WebSocket(getWsUrl());
    setState('connecting');

    socket.addEventListener('open', () => {
      setState('connected');
      socket.send(serializeReportsSocketMessage({ type: 'auth' }));
    });

    socket.addEventListener('message', (event) => {
      const message = parseReportsSocketMessage(event.data);
      if (!message) return;

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
    });

    socket.addEventListener('close', () => setState('closed'));

    return () => socket.close();
  }, [dispatch, enabled]);

  return useMemo(() => ({ state, lastMessage }), [lastMessage, state]);
};
