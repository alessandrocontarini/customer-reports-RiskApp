import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginLayout } from './components/layouts/LoginLayout.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { SessionExpiredPage } from './pages/SessionExpiredPage.tsx';
import ProtectedRoutes from './components/common/ProtectedRoutes.tsx';
import { Home } from './pages/Home.tsx';
import { ErrorPage } from './pages/ErrorPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { GenerateReportPage } from './pages/GenerateReportPage.tsx';
import { EntityDetailPage } from './pages/EntityDetailPage.tsx';

export const router = createBrowserRouter([
  {
    errorElement: <ErrorPage />,
    children: [
      {
        element: <LoginLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
          { path: '/session-expired', element: <SessionExpiredPage /> },
        ],
      },
      {
        element: <ProtectedRoutes />,
        children: [
          { path: 'home', element: <Home /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'entities/:entityId', element: <EntityDetailPage /> },
          {
            path: 'entities/:entityId/reports/new',
            element: <GenerateReportPage />,
          },
        ],
      },
      {
        path: '*',
        element: (
          <Navigate
            to="/home"
            replace
          />
        ),
      },
    ],
  },
]);
