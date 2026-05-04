import React from 'react';
import {
  App as AntdApp,
  Alert,
  Button,
  Card,
  Descriptions,
  Empty,
  Layout,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  Popconfirm,
  Form,
  Input,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '../components/layouts/AppLayout.tsx';
import {
  type Report,
  useCancelReportMutation,
  useDeleteReportMutation,
  useGetEntityQuery,
  useGetReportQuery,
  useGetReportsQuery,
  useUpdateEntityMutation,
} from '../services/reports.ts';
import { useReportsSocket } from '../hooks/useReportsSocket.ts';

const { Text, Title } = Typography;

const trimEndSlash = (value: string) => value.replace(/\/+$/, '');
const apiBaseUrl = trimEndSlash(import.meta.env.VITE_API_BASE_URL ?? '');
const API_ORIGIN = apiBaseUrl;

const statusColors: Record<Report['status'], string> = {
  pending: 'default',
  running: 'processing',
  completed: 'success',
  failed: 'error',
  cancelled: 'warning',
};

export const EntityDetailPage: React.FC = () => {
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const { entityId } = useParams();
  const parsedEntityId = Number(entityId);
  const [selectedReportId, setSelectedReportId] = React.useState<number | null>(
    null,
  );

  const entityQuery = useGetEntityQuery(parsedEntityId, {
    skip: Number.isNaN(parsedEntityId),
  });
  const reportsQuery = useGetReportsQuery(
    { entityId: parsedEntityId },
    { skip: Number.isNaN(parsedEntityId) },
  );
  const reportDetailQuery = useGetReportQuery(selectedReportId!, {
    skip: selectedReportId === null,
  });
  const { state: socketState, lastMessage } = useReportsSocket(true);
  const [cancelReport] = useCancelReportMutation();
  const [deleteReport] = useDeleteReportMutation(); //crea la funzione deleteReport a partire dalla mutation definita nei services, che effettua la chiamata di eliminazione al backend

  const entity = entityQuery.data;
  const reports = (reportsQuery.data?.data ?? []).filter(
    (report) => report.entity_id === parsedEntityId,
  );
  
  const latestReportUpdatedAt = reports
    .map((report) => report.updated_at)
    .sort()
    .at(-1);

  const latestUpdatedAt =
    entity && latestReportUpdatedAt && latestReportUpdatedAt > entity.updated_at
      ? latestReportUpdatedAt
      : entity?.updated_at;



  // Operazioni eseguite dopo la conferma del Popconfirm.
  const handleDeleteReport = (reportId: number) => {
    deleteReport(reportId)
      .unwrap() //trasforma la chiamata in una Promise che si risolve se la chiamata ha successo e si rifiuta se c'è un errore
      .then(() => {
        if (selectedReportId === reportId) {
          setSelectedReportId(null);
        }
        reportsQuery.refetch();
        message.success('Report eliminato');
      })
      .catch(() =>
        message.error(
          'Eliminazione consentita solo per report completati o annullati',
        ),
      );
  };

  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editForm] = Form.useForm<{
    name: string;
    description: string;
  }>(); //crea un'istanza del form controllabile
  const [updateEntity, updateEntityState] = useUpdateEntityMutation();

  const openEditModal = () => {
    if (!entity) return;

    editForm.setFieldsValue({
      name: entity.name,
      description: entity.description,
    });

    setIsEditModalOpen(true);
  };

  const handleUpdateEntity = (values: {
  name: string;
  description: string;
}) => {
  if (!entity) return;

  updateEntity({
    entityId: entity.id,
    body: {
      name: values.name,
      description: values.description,
    },
  })
    .unwrap()
    .then(() => {
      setIsEditModalOpen(false);
      message.success('Cliente aggiornato');
    })
    .catch(() => {
      message.error('Aggiornamento cliente non riuscito');
    });
};

  

  const reportColumns: ColumnsType<Report> = [
    {
      title: 'Report',
      dataIndex: 'title',
      key: 'title',
      render: (title) => <Text strong={true}>{title}</Text>,
    },
    {
      title: 'Stato',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: Report['status']) => (
        <Tag color={statusColors[status]}>{status}</Tag>
      ),
    },
    {
      title: 'Aggiornato',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 190,
      render: (value: string) => new Date(value).toLocaleString('it-IT'),
    },
    {
      title: 'Azioni',
      key: 'actions',
      width: 220,
      render: (_, report) => (
        <Space>
          <Button
            size="small"
            disabled={!report.file_available || !report.download_url}
            href={
              report.download_url ? `${API_ORIGIN}${report.download_url}` : '#'
            }
          >
            Scarica PDF
          </Button>
          <Button
            size="small"
            danger={true}
            disabled={!['pending', 'running'].includes(report.status)}
            onClick={() => cancelReport(report.id)}
          >
            Annulla
          </Button>
          <Button
            size="small"
            onClick={() => setSelectedReportId(report.id)}
          >
            Dettagli
          </Button>
          <Popconfirm
            title="Eliminare il report?"
            description="L'operazione non può essere annullata."
            okText="Elimina"
            cancelText="Annulla"
            onConfirm={() => handleDeleteReport(report.id)}
          >
            <Button
              size="small"
              danger={true}
              disabled={!['completed', 'cancelled'].includes(report.status)}
            >
              Elimina
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
            Gestione cliente
          </Title>
          <Text type="secondary">
            Dettagli e operazioni disponibili per il cliente selezionato.
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

          {entity && (
            <Space
              direction="vertical"
              size={16}
              style={{ width: '100%' }}
            >
              <Descriptions
                bordered={true}
                column={1}
              >
                <Descriptions.Item label="Nome">
                  {entity.name}
                </Descriptions.Item>
                <Descriptions.Item label="Descrizione">
                  {entity.description || (
                    <Text type="secondary">Non indicata</Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Creato il">
                  {new Date(entity.created_at).toLocaleString('it-IT')}
                </Descriptions.Item>
                <Descriptions.Item label="Aggiornato il">
                  {latestUpdatedAt
                    ? new Date(latestUpdatedAt).toLocaleString('it-IT')
                    : 'Non disponibile'}
                </Descriptions.Item>
              </Descriptions>

              <Space>
                <Button
                  type="primary"
                  onClick={() => navigate(`/entities/${entity.id}/reports/new`)}
                >
                  Genera report
                </Button>
                <Button
                  onClick={openEditModal}
                >
                  Modifica Cliente
                </Button>
              </Space>
            </Space>
          )}
        </Card>

        <Alert
          type={socketState === 'authenticated' ? 'success' : 'info'}
          showIcon={true}
          message={`WebSocket: ${socketState}`}
          description={lastMessage}
        />

        <Card title="Report PDF">
          <Table
            rowKey="id"
            columns={reportColumns}
            dataSource={reports}
            loading={reportsQuery.isLoading}
            pagination={false}
            locale={{ emptyText: <Empty description="Nessun report" /> }}
          />
        </Card>


  <Modal
    title="Modifica cliente"
    open={isEditModalOpen}
    onCancel={() => setIsEditModalOpen(false)}
    footer={null}
  >
    <Form
      form={editForm}
      layout="vertical"
      onFinish={handleUpdateEntity}
  >
      <Form.Item
        label="Nome"
        name="name"
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Descrizione"
        name="description"
      >
        <Input.TextArea rows={3} />
      </Form.Item>

      <Button
        type="primary"
        htmlType="submit"
        loading={updateEntityState.isLoading}
        block={true}
      >
        Salva modifiche
      </Button>
    </Form>
  </Modal>





        <Modal
          title="Dettagli report"
          open={selectedReportId !== null}
          onCancel={() => setSelectedReportId(null)}
          footer={null}
        >
          {reportDetailQuery.isLoading && <Text>Caricamento dettagli...</Text>}

          {reportDetailQuery.isError && (
            <Alert
              type="error"
              showIcon={true}
              message="Impossibile caricare i dettagli del report"
            />
          )}

          {reportDetailQuery.data && (
            <Space
              direction="vertical"
              size={16}
              style={{ width: '100%' }}
            >
              <Descriptions
                bordered={true}
                column={1}
                size="small"
              >
                <Descriptions.Item label="Titolo">
                  {reportDetailQuery.data.title}
                </Descriptions.Item>
                <Descriptions.Item label="Cliente">
                  {reportDetailQuery.data.entity_name}
                </Descriptions.Item>
                <Descriptions.Item label="Stato">
                  <Tag color={statusColors[reportDetailQuery.data.status]}>
                    {reportDetailQuery.data.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Creato il">
                  {new Date(reportDetailQuery.data.created_at).toLocaleString(
                    'it-IT',
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Aggiornato il">
                  {new Date(reportDetailQuery.data.updated_at).toLocaleString(
                    'it-IT',
                  )}
                </Descriptions.Item>
              </Descriptions>

              {reportDetailQuery.data.error && (
                <Alert
                  type="error"
                  showIcon={true}
                  message={reportDetailQuery.data.error.code}
                  description={reportDetailQuery.data.error.message}
                />
              )}

              <Button
                disabled={
                  !reportDetailQuery.data.file_available ||
                  !reportDetailQuery.data.download_url
                }
                href={
                  reportDetailQuery.data.download_url
                    ? `${API_ORIGIN}${reportDetailQuery.data.download_url}`
                    : '#'
                }
              >
                Scarica PDF
              </Button>
            </Space>
          )}
        </Modal>
      </Layout>
    </AppLayout>
  );
};
