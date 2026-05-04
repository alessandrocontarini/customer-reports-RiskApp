import { Form, Input } from 'antd';
import { LoginOutlined, UserOutlined } from '@ant-design/icons';

export const RegisterFormItems = () => {
  return (
    <>
      <Form.Item
        label="Username"
        name="email"
        rules={[{ required: true }]}
      >
        <Input
          prefix={<LoginOutlined />}
          placeholder="username"
        />
      </Form.Item>

      <Form.Item
        label="Nome"
        name="first_name"
        rules={[{ required: true }]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="nome"
        />
      </Form.Item>

      <Form.Item
        label="Cognome"
        name="last_name"
        rules={[{ required: true }]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="cognome"
        />
      </Form.Item>

      <Form.Item
        label="Password"
        name="password"
        rules={[{ required: true }]}
      >
        <Input.Password placeholder="password" />
      </Form.Item>

      <Form.Item
        label="Conferma password"
        name="password_confirm"
        dependencies={['password']}
        rules={[
          { required: true },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }

              return Promise.reject(new Error('Le password non coincidono'));
            },
          }),
        ]}
      >
        <Input.Password placeholder="conferma password" />
      </Form.Item>
    </>
  );
};
