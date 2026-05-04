import { Button, Form, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { LoginFormItems } from '../common/formItems/loginForm/LoginFormItems.tsx';
import { useCallback, useState } from 'react';
import type { LoginFormValues } from '../common/formItems/loginForm/types.ts';
import { useAppDispatch } from '../../store/hooks';
import { setAuthenticated } from '../../store/authSlice';
import { useLoginMutation } from '../../services/auth.ts';
import { getLoginErrorMessage } from '../../utils.ts';
import { baseApi } from '../../services/api.ts';

const { Text } = Typography;

export const LoginForm = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [form] = Form.useForm<LoginFormValues>();
  const [login, { isLoading }] = useLoginMutation();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onFinish = useCallback(
    (values: LoginFormValues) => {
      login({
        username: values.username,
        password: values.password,
      })
        .unwrap()
        .then(() => {
          dispatch(baseApi.util.resetApiState());
          dispatch(setAuthenticated(true));
          navigate('/home');
        })
        .catch((err) => {
          console.error('Login Cookie failed', err);
          setErrorMessage(getLoginErrorMessage(err.status));
        });
    },
    [dispatch, login, navigate],
  );

  return (
    <Form<LoginFormValues>
      form={form}
      name="login"
      initialValues={{ remember: true }}
      onFinish={onFinish}
      layout="vertical"
      size="large"
      onValuesChange={() => {
        if (errorMessage) setErrorMessage(null);
      }}
    >
      <LoginFormItems />
      {errorMessage && (
        <Text
          type="danger"
          style={{ display: 'block', marginTop: 8, marginBottom: 16 }}
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
        Accedi
      </Button>
    </Form>
  );
};
