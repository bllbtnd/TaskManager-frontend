import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Spin,
  message,
  Row,
  Col,
  Divider,
  Statistic,
  Space,
} from 'antd';
import {
  LockOutlined,
  MailOutlined,
  UserOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { userService } from '../services/userService';
import type { UserSettings } from '../services/userService';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordForm] = Form.useForm();
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        console.log('Fetching settings...');
        setLoading(true);
        setError(null);
        const data = await userService.getUserSettings();
        console.log('Settings loaded successfully:', data);
        setSettings(data);
        setLoading(false);
      } catch (err: any) {
        console.error('Error loading settings:', err);
        console.error('Error details:', err.response?.status, err.response?.data);
        const errorMsg = err.response?.data?.message || err.message || 'Failed to load settings. Make sure backend is running.';
        setError(errorMsg);
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleChangePassword = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('New password and confirm password do not match');
      return;
    }

    setPasswordLoading(true);
    try {
      await userService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      message.success('Password changed successfully');
      passwordForm.resetFields();
    } catch (error: any) {
      message.error(
        error.response?.data?.error || 'Failed to change password'
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const formatTime = (ms: number): string => {
    if (!ms || ms === 0) return '0h 0m 0s';
    
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);

    return parts.length > 0 ? parts.join(' ') : '0h 0m 0s';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" tip="Loading settings..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '24px' }}>Settings</h1>
        <Card style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#ff4d4f', fontSize: '16px', marginBottom: '16px' }}>{error}</p>
          <Button type="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '24px' }}>Settings</h1>

      <Row gutter={[24, 24]}>
        {/* User Information Card */}
        <Col xs={24} lg={12}>
          <Card
            title="Profile Information"
            style={{ height: '100%' }}
            bordered={false}
            className="settings-card"
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <label style={{ color: '#999', fontSize: '12px', textTransform: 'uppercase' }}>
                  <UserOutlined style={{ marginRight: '8px' }} />
                  Full Name
                </label>
                <div style={{ fontSize: '16px', marginTop: '4px', color: '#fff' }}>
                  {settings?.firstName || 'N/A'} {settings?.lastName || ''}
                </div>
              </div>

              <div>
                <label style={{ color: '#999', fontSize: '12px', textTransform: 'uppercase' }}>
                  <MailOutlined style={{ marginRight: '8px' }} />
                  Email
                </label>
                <div style={{ fontSize: '16px', marginTop: '4px', color: '#fff' }}>
                  {settings?.email || 'N/A'}
                </div>
              </div>

              <div>
                <label style={{ color: '#999', fontSize: '12px', textTransform: 'uppercase' }}>
                  Role
                </label>
                <div style={{ fontSize: '16px', marginTop: '4px', color: '#fff' }}>
                  {settings?.role || 'N/A'}
                </div>
              </div>

              <div>
                <label style={{ color: '#999', fontSize: '12px', textTransform: 'uppercase' }}>
                  Status
                </label>
                <div style={{ fontSize: '16px', marginTop: '4px', color: '#fff' }}>
                  {settings?.status || 'N/A'}
                </div>
              </div>

              <Divider />

              <div style={{ fontSize: '12px', color: '#999' }}>
                <div>Member since: {settings?.createdAt || 'N/A'}</div>
                <div>Last login: {settings?.lastLogin || 'Never'}</div>
              </div>
            </Space>
          </Card>
        </Col>

        {/* Statistics Card */}
        <Col xs={24} lg={12}>
          <Card
            title="Your Statistics"
            style={{ height: '100%' }}
            bordered={false}
            className="settings-card"
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Statistic
                  title="Total Projects"
                  value={settings?.totalProjects || 0}
                  prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: '#fff' }}
                />
              </Col>
              <Col xs={24} sm={12}>
                <Statistic
                  title="Total Tasks"
                  value={settings?.totalTasks || 0}
                  prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#fff' }}
                />
              </Col>
              <Col xs={24}>
                <Statistic
                  title="Time Spent"
                  value={formatTime(settings?.totalTimeSpentMs || 0)}
                  prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
                  valueStyle={{ color: '#fff' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Change Password Card */}
      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={12}>
          <Card
            title="Change Password"
            bordered={false}
            className="settings-card"
          >
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
            >
              <Form.Item
                name="currentPassword"
                label="Current Password"
                rules={[
                  { required: true, message: 'Please enter your current password' },
                ]}
              >
                <Input.Password
                  placeholder="Enter your current password"
                  prefix={<LockOutlined />}
                />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="New Password"
                rules={[
                  { required: true, message: 'Please enter a new password' },
                  {
                    min: 6,
                    message: 'Password must be at least 6 characters',
                  },
                ]}
              >
                <Input.Password
                  placeholder="Enter your new password"
                  prefix={<LockOutlined />}
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirm Password"
                rules={[
                  { required: true, message: 'Please confirm your new password' },
                ]}
              >
                <Input.Password
                  placeholder="Confirm your new password"
                  prefix={<LockOutlined />}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={passwordLoading}
                  style={{ width: '100%' }}
                >
                  Change Password
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Settings;
