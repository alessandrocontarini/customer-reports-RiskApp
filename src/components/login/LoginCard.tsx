import { Card, Typography } from 'antd';
import { LoginForm } from './LoginForm.tsx';
import { commonStyling } from '../common/commonStyling.ts';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;
export const LoginCard = () => {
  return (
    <Card style={{ width: 400, boxShadow: commonStyling.boxShadow }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={3}>Benvenuto</Title>
        <Text type="secondary">
          Inserisci Username e Password per accedere al sistema
        </Text>
      </div>
      <LoginForm />
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Text type="secondary">
          Non hai un account? <Link to="/register">Registrati</Link>
        </Text>
      </div>
    </Card>
  );
};
