import { useEffect, useMemo, useState } from 'react';
import { baseApi } from '../services/api';
import { useAppDispatch } from '../store/hooks';

type SocketState = 'connecting' | 'connected' | 'authenticated' | 'closed';

const getWsUrl = () => {
  if (import.meta.env.VITE_REPORT_WS_URL) {
    return import.meta.env.VITE_REPORT_WS_URL;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.host}/ws/reports/`;
};

export const useReportsSocket = (enabled: boolean) => {
  const dispatch = useAppDispatch();
  const [state, setState] = useState<SocketState>('closed');
  const [lastMessage, setLastMessage] = useState<string>('Nessun evento live');

  useEffect(() => {
    if (!enabled) return;

    const socket = new WebSocket(getWsUrl());

    socket.addEventListener('open', () => {
      setState('connected');
      socket.send(JSON.stringify({ type: 'auth' }));
    });

    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'auth.success') {
        setState('authenticated');
        socket.send(
          JSON.stringify({
            type: 'subscribe',
            filters: {
              report_statuses: ['pending', 'running', 'completed', 'failed'],
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
