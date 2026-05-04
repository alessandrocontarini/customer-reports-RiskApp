import React from 'react';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Layout,
  Space,
  Typography,
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '../components/layouts/AppLayout.tsx';
import {
  useCreateReportMutation,
  useGetEntityQuery,
} from '../services/reports.ts';

const { Text, Title } = Typography;

interface ReportFormValues {
  title: string;
}

export const GenerateReportPage: React.FC = () => {
  const navigate = useNavigate();
  const { entityId } = useParams();
  const parsedEntityId = Number(entityId);
  const [form] = Form.useForm<ReportFormValues>();

  const entityQuery = useGetEntityQuery(parsedEntityId, {
    skip: Number.isNaN(parsedEntityId),
  });
  const [createReport, createReportState] = useCreateReportMutation();

  const handleCreateReport = (values: ReportFormValues) => {
    createReport({
      title: values.title,
      entity_id: parsedEntityId,
      parameters: { include_charts: true, language: 'it' },
    })
      .unwrap()
      .then(() => navigate(`/entities/${parsedEntityId}`))
      .catch(() => undefined);
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
            Genera report
          </Title>
          <Text type="secondary">
            Il report verrà creato per il cliente selezionato.
          </Text>
        </Space>

        <Card>
          {entityQuery.isError && (
            <Alert
              type="error"
              showIcon={true}
              message="Cliente non trovato"
            />
          )}

          {entityQuery.data && (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleCreateReport}
            >
              <Alert
                type="info"
                showIcon={true}
                message={`Cliente: ${entityQuery.data.name}`}
                description={entityQuery.data.description || undefined}
                style={{ marginBottom: 24 }}
              />

              <Form.Item
                label="Titolo"
                name="title"
                rules={[{ required: true }]}
              >
                <Input placeholder="Report rischio cliente" />
              </Form.Item>

              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={createReportState.isLoading}
                >
                  Avvia generazione
                </Button>
                <Button onClick={() => navigate(`/entities/${parsedEntityId}`)}>
                  Annulla
                </Button>
              </Space>
            </Form>
          )}
        </Card>
      </Layout>
    </AppLayout>
  );
};
