import { Card, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { RegisterForm } from './RegisterForm';
import { commonStyling } from '../common/commonStyling';

const { Title, Text } = Typography;

export const RegisterCard = () => {
  return (
    <Card style={{ width: 400, boxShadow: commonStyling.boxShadow }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={3}>Crea account</Title>
        <Text type="secondary">Inserisci i dati per registrarti</Text>
      </div>

      <RegisterForm />

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Text type="secondary">
          Hai già un account? <Link to="/login">Accedi</Link>
        </Text>
      </div>
    </Card>
  );
};
