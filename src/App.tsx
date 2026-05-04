import { RouterProvider } from 'react-router-dom';
import { App as AntdApp, ConfigProvider } from 'antd';
import locale from 'antd/es/locale/it_IT';
import { initLogRocket } from '../logrocket.ts';
import dayjs from 'dayjs';
import 'dayjs/locale/it';
import { router } from './router.tsx';

initLogRocket();
dayjs.locale('it');

function App() {
  return (
    <ConfigProvider
      locale={locale}
      theme={{
        token: {
          fontFamily: 'Onest, sans-serif',
        },
        components: {
          Spin: {
            colorBgMask: 'rgba(255,255,255,0.45)',
          },
        },
      }}
    >
      <AntdApp>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
