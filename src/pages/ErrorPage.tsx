import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Result, Space } from 'antd';
import { commonStyling } from '../components/common/commonStyling.ts';

export const ErrorPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#fff',
      }}
    >
      <Card style={{ width: 400, boxShadow: commonStyling.boxShadow }}>
        <Result
          status={'warning'}
          title={'Si è verificato un errore'}
          subTitle={
            <>
              Spiacenti, qualcosa è andato storto. Contatta il supporto tecnico
              all'indirizzo:{' '}
              <a
                href={'mailto:support@riskapp.it'}
                target={'_blank'}
              >
                {' '}
                support@riskapp.it
              </a>
            </>
          }
          extra={
            <Space>
              <Button
                type="primary"
                key="home"
                onClick={() => navigate('/home')}
              >
                Torna alla Home
              </Button>
              <Button
                key="reload"
                onClick={() => window.location.reload()}
              >
                Ricarica la pagina
              </Button>
            </Space>
          }
        />
      </Card>
    </div>
  );
};
