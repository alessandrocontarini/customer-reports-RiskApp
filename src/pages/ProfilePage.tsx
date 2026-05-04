import React from 'react';
import { Alert, Card, Descriptions, Layout, Spin, Typography } from 'antd';
import { AppLayout } from '../components/layouts/AppLayout.tsx';
import { useGetUserQuery } from '../services/common.ts';

const { Text, Title } = Typography;

export const ProfilePage: React.FC = () => {
  const { data: user, isError, isLoading } = useGetUserQuery();

  return (
    <AppLayout>
      <Layout style={{ gap: 16, padding: 24, overflow: 'auto' }}>
        <Card>
          <Title
            level={3}
            style={{ marginTop: 0 }}
          >
            Area personale
          </Title>

          {isLoading && <Spin />}

          {isError && (
            <Alert
              type="error"
              showIcon={true}
              message="Impossibile caricare le informazioni utente"
            />
          )}

          {user && (
            <Descriptions
              bordered={true}
              column={1}
            >
              <Descriptions.Item label="Username">
                {user.username}
              </Descriptions.Item>
              <Descriptions.Item label="Nome">
                {user.first_name ?? <Text type="secondary">Non indicato</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="Cognome">
                {user.last_name ?? <Text type="secondary">Non indicato</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="Stato account">
                {user.is_active ? 'Attivo' : 'Non attivo'}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Card>
      </Layout>
    </AppLayout>
  );
};
