import React from 'react';
import { Layout, Menu, Avatar, Dropdown } from 'antd';
import {
  ProjectOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  SettingOutlined,
  BugOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { authService } from '../services/authService';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();
  const isAdmin = authService.isAdmin();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: 'Projects',
      onClick: () => navigate('/projects'),
    },
      {
        key: '/time-tracker',
        icon: <ClockCircleOutlined />,
        label: 'Time Tracker',
        onClick: () => navigate('/time-tracker'),
      },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate('/settings'),
    },
    {
      key: '/bug-report',
      icon: <BugOutlined />,
      label: 'Feedback',
      onClick: () => navigate('/bug-report'),
    },
    ...(isAdmin
      ? [
          {
            key: '/admin',
            icon: <DashboardOutlined />,
            label: 'Admin Dashboard',
            onClick: () => navigate('/admin'),
          },
        ]
      : []),
  ];

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  const selectedKey = location.pathname.startsWith('/projects/') 
    ? '/projects' 
    : location.pathname;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        style={{
          background: '#141414',
          borderRight: '1px solid #303030',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 18,
            fontWeight: 'bold',
            borderBottom: '1px solid #303030',
          }}
        >
          Task Manager
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          style={{ background: '#141414' }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#1f1f1f',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            borderBottom: '1px solid #303030',
          }}
        >
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} style={{ background: '#1890ff' }} />
              <span style={{ color: '#fff' }}>
                {user?.firstName} {user?.lastName}
              </span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ background: '#141414', minHeight: 'calc(100vh - 64px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
