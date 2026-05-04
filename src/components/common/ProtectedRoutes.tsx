import { type ReactElement, useEffect, useRef } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useLazyGetUserQuery } from '../../services/common.ts';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setAuthenticated } from '../../store/authSlice';
import { identify } from '../../../logrocket.ts';

const ProtectedRoutes = (): ReactElement => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const dispatch = useAppDispatch();

  const [getUser] = useLazyGetUserQuery();

  const verifyAuth = useRef(() => {
    getUser()
      .unwrap()
      .then((res) => {
        dispatch(setAuthenticated(true));
        identify(res);
      })
      .catch((e) => {
        console.error('not authenticated', e);
        dispatch(setAuthenticated(false));
      });
  });

  useEffect(() => {
    if (isAuthenticated === null) {
      verifyAuth.current();
    }
  }, [isAuthenticated]);

  return (
    <>
      {isAuthenticated === null && (
        <Spin
          size="large"
          fullscreen={true}
          indicator={<LoadingOutlined />}
        />
      )}
      {isAuthenticated === true && <Outlet />}
      {isAuthenticated === false && (
        <Navigate
          to="/login"
          replace
        />
      )}
    </>
  );
};

export default ProtectedRoutes;
