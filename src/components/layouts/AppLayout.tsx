import { type PropsWithChildren } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  Flex,
  Grid,
  Image,
  Layout,
  Menu,
  Tooltip,
  type MenuProps,
  Typography,
} from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { commonStyling } from '../common/commonStyling';
import { useDispatch } from 'react-redux';
import { setAuthenticated } from '../../store/authSlice.ts';
import { useLogoutMutation } from '../../services/common.ts';
import { baseApi } from '../../services/api.ts';

const { Header, Content } = Layout;

const { Text } = Typography;
const { useBreakpoint } = Grid;

export const AppLayout = ({ children }: PropsWithChildren) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sm } = useBreakpoint();
  const dispatch = useDispatch();

  const [logout] = useLogoutMutation();

  const menuItems: MenuProps['items'] = [
    {
      key: '/home',
      label: <Link to="/home">Home</Link>,
    },
  ];

  const handleLogout = () => {
    logout()
      .unwrap()
      .then(() => {
        dispatch(baseApi.util.resetApiState());
        dispatch(setAuthenticated(false));
        navigate('/login');
      })
      .catch((err) => {
        console.error('could not logout due to an error: ', err);
      });
  };

  return (
    <Layout style={{ height: '100dvh', width: '100dvw', overflow: 'hidden' }}>
      <Header
        style={{
          zIndex: 1,
          width: '100%',
          padding: '0 24px',
          background: '#fff',
          boxShadow: commonStyling.boxShadow,
          borderBottom: commonStyling.border,
        }}
      >
        <Flex
          justify={'space-between'}
          align={'center'}
        >
          <Flex gap={40}>
            <Flex align={'center'}>
              <Image
                src={'/riskapp.png'}
                preview={false}
                height={40}
                style={{ width: 'auto', display: 'block' }}
              />
              {sm && (
                <Text
                  strong={true}
                  style={{ fontSize: 18 }}
                >
                  RiskAPP
                </Text>
              )}
            </Flex>

            <Menu
              mode={'horizontal'}
              selectedKeys={[
                location.pathname.startsWith('/home')
                  ? '/home'
                  : location.pathname,
              ]}
              items={menuItems}
              style={{ borderBottom: 'none', minWidth: 300 }}
            />
          </Flex>

          <Flex
            align="center"
            gap={8}
          >
            <Tooltip title="Area personale">
              <Link to="/profile">
                <Button
                  type="text"
                  shape="circle"
                  icon={<UserOutlined />}
                />
              </Link>
            </Tooltip>

            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Flex>
        </Flex>
      </Header>

      <Content
        style={{
          height: 'calc(100dvh - 64px)',
          width: '100dvw',
          minHeight: 0,
          overflow: 'auto',
        }}
      >
        {children}
      </Content>
    </Layout>
  );
};
