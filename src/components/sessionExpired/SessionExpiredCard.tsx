import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Result, Typography } from 'antd';
import { commonStyling } from '../common/commonStyling.ts';

export const SessionExpiredCard: React.FC = () => {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState<number>(5);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);

    const timeoutId = window.setTimeout(() => {
      navigate('/login', { replace: true });
    }, 5 * 1000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [navigate]);

  return (
    <Card style={{ width: 400, boxShadow: commonStyling.boxShadow }}>
      <Result
        status="warning"
        title="Sessione scaduta"
        subTitle={
          <Typography.Paragraph style={{ marginBottom: 0 }}>
            Il tuo token di accesso è scaduto o non è più valido. Verrai
            reindirizzato alla pagina di login tra <b>{secondsLeft}</b> secondi.
          </Typography.Paragraph>
        }
        extra={[
          <Button
            key="login"
            type="primary"
            onClick={() => navigate('/login', { replace: true })}
          >
            Vai al login ora
          </Button>,
        ]}
      />
    </Card>
  );
};
