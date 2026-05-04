import { Button, Form, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useCallback, useState } from 'react';
import { useRegisterMutation } from '../../services/auth';
import { RegisterFormItems } from '../common/formItems/registerForm/RegisterFormItems';
import type { RegisterFormValues } from '../common/formItems/registerForm/types';

const { Text } = Typography;

export const RegisterForm = () => {
  const navigate = useNavigate(); // navigate permette di fare redirect verso un'altra pagina
  const [form] = Form.useForm<RegisterFormValues>(); //istanza del form Ant Design, tipizzata
  const [register, { isLoading }] = useRegisterMutation(); //funzione che effettua la chiamata di registrazione al backend
  const [errorMessage, setErrorMessage] = useState<string | null>(null); //eventuale messaggio d'errore

  const onFinish = useCallback(
    (values: RegisterFormValues) => {
      register(values)
        .unwrap()
        .then(() => {
          navigate('/login');
        })
        .catch((err) => {
          console.error('Register failed', err);
          setErrorMessage('Registrazione non riuscita. Riprova.');
        });
    },
    [navigate, register],
  );

  return (
    <Form<RegisterFormValues>
      form={form}
      name="register"
      onFinish={onFinish}
      layout="vertical"
      size="large"
      onValuesChange={() => {
        if (errorMessage) setErrorMessage(null);
      }}
    >
      <RegisterFormItems />

      {errorMessage && (
        <Text
          type="danger"
          style={{ display: 'block', marginBottom: 16 }}
        >
          {errorMessage}
        </Text>
      )}

      <Button
        type="primary"
        htmlType="submit"
        loading={isLoading}
        disabled={isLoading}
        block={true}
      >
        Registrati
      </Button>
    </Form>
  );
};
