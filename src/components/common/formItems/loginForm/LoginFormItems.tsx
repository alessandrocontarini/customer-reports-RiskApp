import { Form, Input } from 'antd';
import { LoginOutlined } from '@ant-design/icons';

export const LoginFormItems = () => {
  return (
    <>
      <Form.Item
        label={'Username'}
        name={'username'}
        required={true}
        rules={[{ required: true }]}
      >
        <Input
          prefix={<LoginOutlined />}
          placeholder={'username'}
        />
      </Form.Item>

      <Form.Item
        label={'Password'}
        name={'password'}
        required={true}
        rules={[{ required: true }]}
      >
        <Input.Password placeholder={'password'} />
      </Form.Item>
    </>
  );
};
