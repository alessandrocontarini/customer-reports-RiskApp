import {
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Layout,
  Row,
  Space,
  Table,
  Typography,
  App as AntdApp,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layouts/AppLayout.tsx';
import {
  type Entity,
  useCreateEntityMutation,
  useGetEntitiesQuery,
} from '../services/reports.ts';

const { Text, Title } = Typography;

interface EntityFormValues {
  name: string;
  description: string;
}

export const Home: React.FC = () => {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const [entityForm] = Form.useForm<EntityFormValues>();

  const entitiesQuery = useGetEntitiesQuery();

  const [createEntity, createEntityState] = useCreateEntityMutation();

  const entities = useMemo(
    () => entitiesQuery.data?.data ?? [],
    [entitiesQuery.data],
  );

  const entityColumns: ColumnsType<Entity> = [
    {
      title: 'Cliente',
      dataIndex: 'name',
      key: 'name',
      render: (name, entity) => (
        <Space
          direction="vertical"
          size={0}
        >
          <Text strong={true}>{name}</Text>
          <Text type="secondary">{entity.description}</Text>
        </Space>
      ),
    },
    {
      title: 'Azioni',
      key: 'actions',
      width: 160,
      render: (_, entity) => (
        <Button
          size="small"
          type="primary"
          onClick={() => navigate(`/entities/${entity.id}`)}
        >
          Gestisci report
        </Button>
      ),
    },
  ];

  const handleCreateEntity = (values: EntityFormValues) => {
    createEntity(values)
      .unwrap()
      .then(() => {
        entityForm.resetFields();
        message.success('Cliente creato');
      })
      .catch(() => message.error('Creazione cliente non riuscita'));
  };

  return (
    <AppLayout>
      <Layout style={{ gap: 16, padding: 24, overflow: 'auto' }}>
        <Space
          direction="vertical"
          size={2}
        >
          <Title
            level={3}
            style={{ margin: 0 }}
          >
            Gestione clienti
          </Title>
          <Text type="secondary">
            Sistema di gestione dei clienti e dei relativi report.
          </Text>
        </Space>

        <Row gutter={[16, 16]}>
          <Col
            xs={24}
            lg={8}
          >
            <Card title="Nuovo cliente">
              <Form
                form={entityForm}
                layout="vertical"
                onFinish={handleCreateEntity}
              >
                <Form.Item
                  label="Nome"
                  name="name"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="Cliente C" />
                </Form.Item>
                <Form.Item
                  label="Descrizione"
                  name="description"
                >
                  <Input.TextArea
                    rows={3}
                    placeholder="Descrizione sintetica"
                  />
                </Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={createEntityState.isLoading}
                  block={true}
                >
                  Crea cliente
                </Button>
              </Form>
            </Card>
          </Col>

          <Col
            xs={24}
            lg={16}
          >
            <Card title="Clienti disponibili">
              <Table
                rowKey="id"
                columns={entityColumns}
                dataSource={entities}
                loading={entitiesQuery.isLoading}
                pagination={false}
                locale={{ emptyText: <Empty description="Nessun cliente" /> }}
              />
            </Card>
          </Col>
        </Row>
      </Layout>
    </AppLayout>
  );
};
