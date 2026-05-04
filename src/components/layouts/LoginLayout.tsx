import React from 'react';
import { Flex } from 'antd';
import { Outlet } from 'react-router-dom';

export const LoginLayout: React.FC = () => {
  return (
    <Flex
      justify={'center'}
      align={'center'}
      style={{
        height: '100dvh',
      }}
    >
      <Outlet />
    </Flex>
  );
};
