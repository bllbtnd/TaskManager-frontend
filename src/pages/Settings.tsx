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
  Tabs,
  Modal,
  Typography,
} from 'antd';
import {
  LockOutlined,
  MailOutlined,
  UserOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { userService } from '../services/userService';
import type { UserSettings, UpdateProfileRequest } from '../services/userService';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordForm] = Form.useForm();
  const [profileForm] = Form.useForm();
  const [deleteForm] = Form.useForm();
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        console.log('Fetching settings...');
        setLoading(true);
        setError(null);
        const data = await userService.getUserSettings();
        console.log('Settings loaded successfully:', data);
        setSettings(data);
        profileForm.setFieldsValue({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
        });
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
  }, [profileForm]);

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

  const handleUpdateProfile = async (values: UpdateProfileRequest) => {
    setProfileLoading(true);
    try {
      const updated = await userService.updateProfile(values);
      setSettings(updated);
      message.success('Profile updated successfully');
      setIsEditingProfile(false);
    } catch (error: any) {
      message.error(
        error.response?.data?.error || 'Failed to update profile'
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDeleteAccount = async (values: { password: string }) => {
    setDeleteLoading(true);
    try {
      await userService.deleteAccount({ password: values.password });
      message.success('Account deleted successfully. Redirecting...');
      deleteForm.resetFields();
      // Redirect to login after 2 seconds
      setTimeout(() => {
        localStorage.removeItem('token');
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      message.error(
        error.response?.data?.error || 'Failed to delete account'
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const showDeleteConfirmation = () => {
    Modal.confirm({
      title: 'Delete Account',
      content: (
        <div>
          <p style={{ color: '#ff4d4f', marginBottom: 16 }}>
            <strong>Warning: This action is irreversible!</strong>
          </p>
          <p>Deleting your account will permanently remove:</p>
          <ul style={{ color: '#ff4d4f' }}>
            <li>Your user account</li>
            <li>All projects you own</li>
            <li>All tasks in your projects</li>
            <li>All time logs and history</li>
            <li>All personal data</li>
          </ul>
          <p>To confirm, please enter your password below:</p>
        </div>
      ),
      okText: 'Delete Account',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        deleteForm.submit();
      },
    });
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

      <Tabs
        defaultActiveKey="profile"
        items={[
          {
            key: 'profile',
            label: 'Profile',
            children: (
              <Row gutter={[24, 24]}>
                {/* User Profile Card */}
                <Col xs={24} lg={12}>
                  <Card
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Profile Information</span>
                        {!isEditingProfile && (
                          <Button
                            type="text"
                            icon={<EditOutlined />}
                            size="small"
                            onClick={() => setIsEditingProfile(true)}
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                    }
                    style={{ height: '100%' }}
                    bordered={false}
                    className="settings-card"
                  >
                    {!isEditingProfile ? (
                      <Space direction="vertical" style={{ width: '100%' }} size="large">
                        <div>
                          <label style={{ color: '#999', fontSize: '12px', textTransform: 'uppercase' }}>
                            <UserOutlined style={{ marginRight: '8px' }} />
                            First Name
                          </label>
                          <div style={{ fontSize: '16px', marginTop: '4px', color: '#fff' }}>
                            {settings?.firstName || 'N/A'}
                          </div>
                        </div>

                        <div>
                          <label style={{ color: '#999', fontSize: '12px', textTransform: 'uppercase' }}>
                            <UserOutlined style={{ marginRight: '8px' }} />
                            Last Name
                          </label>
                          <div style={{ fontSize: '16px', marginTop: '4px', color: '#fff' }}>
                            {settings?.lastName || 'N/A'}
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
                    ) : (
                      <Form
                        form={profileForm}
                        layout="vertical"
                        onFinish={handleUpdateProfile}
                      >
                        <Form.Item
                          name="firstName"
                          label="First Name"
                          rules={[
                            { required: true, message: 'Please enter your first name' },
                          ]}
                        >
                          <Input placeholder="Enter your first name" />
                        </Form.Item>

                        <Form.Item
                          name="lastName"
                          label="Last Name"
                          rules={[
                            { required: true, message: 'Please enter your last name' },
                          ]}
                        >
                          <Input placeholder="Enter your last name" />
                        </Form.Item>

                        <Form.Item
                          name="email"
                          label="Email"
                          rules={[
                            { required: true, message: 'Please enter your email' },
                            { type: 'email', message: 'Please enter a valid email' },
                          ]}
                        >
                          <Input placeholder="Enter your email" />
                        </Form.Item>

                        <Form.Item>
                          <Space>
                            <Button
                              type="primary"
                              htmlType="submit"
                              loading={profileLoading}
                              icon={<SaveOutlined />}
                            >
                              Save Changes
                            </Button>
                            <Button
                              onClick={() => {
                                setIsEditingProfile(false);
                                profileForm.setFieldsValue({
                                  firstName: settings?.firstName,
                                  lastName: settings?.lastName,
                                  email: settings?.email,
                                });
                              }}
                              icon={<CloseOutlined />}
                            >
                              Cancel
                            </Button>
                          </Space>
                        </Form.Item>
                      </Form>
                    )}
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
            ),
          },
          {
            key: 'security',
            label: 'Security',
            children: (
              <Row gutter={[24, 24]}>
                {/* Change Password Card */}
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

                {/* Delete Account Card */}
                <Col xs={24} lg={12}>
                  <Card
                    title={<Text style={{ color: '#ff4d4f' }}>Delete Account</Text>}
                    bordered={false}
                    style={{ borderColor: '#ff4d4f' }}
                    className="settings-card"
                  >
                    <div>
                      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </Text>
                      <Form
                        form={deleteForm}
                        layout="vertical"
                        onFinish={handleDeleteAccount}
                      >
                        <Form.Item
                          name="password"
                          label="Enter Your Password to Confirm"
                          rules={[
                            { required: true, message: 'Please enter your password' },
                          ]}
                        >
                          <Input.Password
                            placeholder="Enter your password"
                            prefix={<LockOutlined />}
                          />
                        </Form.Item>

                        <Form.Item>
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            loading={deleteLoading}
                            onClick={showDeleteConfirmation}
                            style={{ width: '100%' }}
                          >
                            Delete Account
                          </Button>
                        </Form.Item>
                      </Form>
                    </div>
                  </Card>
                </Col>
              </Row>
            ),
          },
        ]}
      />
    </div>
  );
};

export default Settings;
