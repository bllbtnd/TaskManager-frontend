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
  GithubOutlined,
  BellOutlined
} from '@ant-design/icons';
import { userService } from '../services/userService';
import type { UserSettings, UpdateProfileRequest, EmailPreferences } from '../services/userService';
import { gitHubService } from '../services/gitHubService';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../services/notificationService';

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
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [githubConnecting, setGithubConnecting] = useState(false);
  const [emailPreferences, setEmailPreferences] = useState<EmailPreferences | null>(null);
  const [preferencesLoading, setPreferencesLoading] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        console.log('Fetching settings...');
        setLoading(true);
        setError(null);
        const data = await userService.getUserSettings();
        console.log('Settings loaded successfully:', data);
        setSettings(data);
        if (data.githubUsername) {
          setGithubUsername(data.githubUsername);
        }
        profileForm.setFieldsValue({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
        });
        
                // Load email preferences
                try {
                  const preferences = await userService.getEmailPreferences();
                  setEmailPreferences(preferences);
                } catch (prefErr) {
                  console.error('Error loading email preferences:', prefErr);
                }
        
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

  const handleDeleteAccount = async (values: { password?: string }) => {
    setDeleteLoading(true);
    try {
      // Check if user has a password (GitHub-only users don't have passwords)
      const isGitHubOnlyUser = !settings?.hasPassword && settings?.githubUsername != null;
      
      if (isGitHubOnlyUser) {
        // GitHub-only users don't need password
        await userService.deleteAccount({ password: '' });
      } else {
        // Email+password users must provide password
        if (!values.password) {
          message.error('Password is required');
          setDeleteLoading(false);
          return;
        }
        await userService.deleteAccount({ password: values.password });
      }
      
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
    const isGitHubOnlyUser = !settings?.hasPassword && settings?.githubUsername != null;
    
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
          {!isGitHubOnlyUser && <p>To confirm, please enter your password below:</p>}
          {isGitHubOnlyUser && <p>Click "Delete Account" to confirm deletion.</p>}
        </div>
      ),
      okText: 'Delete Account',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        if (isGitHubOnlyUser) {
          // For GitHub-only users, delete immediately
          handleDeleteAccount({});
        } else {
          // For email+password users, show password form
          deleteForm.submit();
        }
      },
    });
  };

  const handleConnectGitHub = async () => {
    setGithubConnecting(true);
    try {
      const { authUrl } = await gitHubService.getOAuthUrl();
      // Store the current URL to return to after OAuth
      sessionStorage.setItem('redirectAfterOAuth', window.location.href);
      window.location.href = authUrl;
    } catch (error) {
      notificationService.error('Failed to initiate GitHub connection');
      setGithubConnecting(false);
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
                    {!settings?.hasPassword ? (
                      // GitHub-only users don't have passwords
                      <div style={{ padding: '20px 0' }}>
                        <Text type="secondary">
                          Your account is authenticated via GitHub. Password management is not available for GitHub-only accounts.
                        </Text>
                      </div>
                    ) : (
                      // Email+password users can change password
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
                    )}
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
          {
            key: 'integrations',
            label: <Space><GithubOutlined />Integrations</Space>,
            children: (
              <Row gutter={[24, 24]}>
                {/* GitHub Integration Card */}
                <Col xs={24} lg={12}>
                  <Card
                    title={<Space><GithubOutlined />GitHub Integration</Space>}
                    bordered={false}
                    className="settings-card"
                  >
                    <div>
                      {githubUsername ? (
                        <>
                          <div style={{ marginBottom: 16 }}>
                            <Text strong>
                              {!settings?.hasPassword ? 'Logged in with GitHub:' : 'Connected as:'}
                            </Text>
                            <Text style={{ display: 'block', marginTop: 8, color: '#1890ff' }}>
                              {githubUsername}
                            </Text>
                          </div>
                          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                            You can now create tasks that sync to GitHub issues and close them when tasks are marked as done.
                          </Text>
                          {!settings?.hasPassword && (
                            <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontStyle: 'italic' }}>
                              Note: You signed up using GitHub. To remove your account, use the Delete Account option.
                            </Text>
                          )}
                        </>
                      ) : (
                        <>
                          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                            Connect your GitHub account to automatically create and manage issues from tasks.
                          </Text>
                          <Button
                            type="primary"
                            icon={<GithubOutlined />}
                            loading={githubConnecting}
                            onClick={handleConnectGitHub}
                            style={{ width: '100%' }}
                          >
                            Connect GitHub
                          </Button>
                        </>
                      )}
                    </div>
                  </Card>
                </Col>

                {/* Integration Info Card */}
                <Col xs={24} lg={12}>
                  <Card
                    title="How It Works"
                    bordered={false}
                    className="settings-card"
                  >
                    <div style={{ color: '#8c8c8c' }}>
                      <p><strong>Create Issues:</strong> When creating a task, you can optionally create a GitHub issue automatically.</p>
                      <p><strong>Sync Status:</strong> Task status syncs to GitHub automatically:</p>
                      <ul style={{ marginLeft: 16 }}>
                        <li>Moving a task to "Done" closes the GitHub issue</li>
                        <li>GitHub issue state changes are reflected in your tasks</li>
                      </ul>
                      <p><strong>Permissions:</strong> Ensure your GitHub account has write access to the repository.</p>
                    </div>
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'notifications',
            label: <Space><BellOutlined />Email Notifications</Space>,
            children: (
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                  <Card
                    title="Email Notification Preferences"
                    bordered={false}
                    className="settings-card"
                  >
                    {emailPreferences ? (
                      <Spin spinning={preferencesLoading}>
                      <Form layout="vertical">
                        <Divider>Important Notifications</Divider>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                          These emails keep you informed about key project activities
                        </Text>
                        
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div><strong>Project Invitations</strong></div>
                              <Text type="secondary">Receive emails when you're invited to a project</Text>
                            </div>
                            <Button
                              type={emailPreferences.projectInvitations ? 'primary' : 'default'}
                              onClick={async () => {
                                setPreferencesLoading(true);
                                try {
                                  const updated = await userService.updateEmailPreferences({
                                    ...emailPreferences,
                                    projectInvitations: !emailPreferences.projectInvitations
                                  });
                                  setEmailPreferences(updated);
                                  message.success('Preferences updated');
                                } catch (err) {
                                  message.error('Failed to update preferences');
                                } finally {
                                  setPreferencesLoading(false);
                                }
                              }}
                            >
                              {emailPreferences.projectInvitations ? 'Enabled' : 'Disabled'}
                            </Button>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div><strong>Task Assignments</strong></div>
                              <Text type="secondary">Receive emails when assigned to a task</Text>
                            </div>
                            <Button
                              type={emailPreferences.taskAssignments ? 'primary' : 'default'}
                              onClick={async () => {
                                setPreferencesLoading(true);
                                try {
                                  const updated = await userService.updateEmailPreferences({
                                    ...emailPreferences,
                                    taskAssignments: !emailPreferences.taskAssignments
                                  });
                                  setEmailPreferences(updated);
                                  message.success('Preferences updated');
                                } catch (err) {
                                  message.error('Failed to update preferences');
                                } finally {
                                  setPreferencesLoading(false);
                                }
                              }}
                            >
                              {emailPreferences.taskAssignments ? 'Enabled' : 'Disabled'}
                            </Button>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div><strong>Project Deletion</strong></div>
                              <Text type="secondary">Receive emails when a project you're in gets deleted</Text>
                            </div>
                            <Button
                              type={emailPreferences.projectDeletion ? 'primary' : 'default'}
                              onClick={async () => {
                                setPreferencesLoading(true);
                                try {
                                  const updated = await userService.updateEmailPreferences({
                                    ...emailPreferences,
                                    projectDeletion: !emailPreferences.projectDeletion
                                  });
                                  setEmailPreferences(updated);
                                  message.success('Preferences updated');
                                } catch (err) {
                                  message.error('Failed to update preferences');
                                } finally {
                                  setPreferencesLoading(false);
                                }
                              }}
                            >
                              {emailPreferences.projectDeletion ? 'Enabled' : 'Disabled'}
                            </Button>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div><strong>Task Deadline Reminders</strong></div>
                              <Text type="secondary">Receive reminders when task deadlines approach</Text>
                            </div>
                            <Button
                              type={emailPreferences.taskDeadlineReminders ? 'primary' : 'default'}
                              onClick={async () => {
                                setPreferencesLoading(true);
                                try {
                                  const updated = await userService.updateEmailPreferences({
                                    ...emailPreferences,
                                    taskDeadlineReminders: !emailPreferences.taskDeadlineReminders
                                  });
                                  setEmailPreferences(updated);
                                  message.success('Preferences updated');
                                } catch (err) {
                                  message.error('Failed to update preferences');
                                } finally {
                                  setPreferencesLoading(false);
                                }
                              }}
                            >
                              {emailPreferences.taskDeadlineReminders ? 'Enabled' : 'Disabled'}
                            </Button>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div><strong>Project Removal</strong></div>
                              <Text type="secondary">Receive emails when removed from a project</Text>
                            </div>
                            <Button
                              type={emailPreferences.projectRemoval ? 'primary' : 'default'}
                              onClick={async () => {
                                setPreferencesLoading(true);
                                try {
                                  const updated = await userService.updateEmailPreferences({
                                    ...emailPreferences,
                                    projectRemoval: !emailPreferences.projectRemoval
                                  });
                                  setEmailPreferences(updated);
                                  message.success('Preferences updated');
                                } catch (err) {
                                  message.error('Failed to update preferences');
                                } finally {
                                  setPreferencesLoading(false);
                                }
                              }}
                            >
                              {emailPreferences.projectRemoval ? 'Enabled' : 'Disabled'}
                            </Button>
                          </div>
                        </Space>

                        <Divider style={{ marginTop: 24 }}>Activity Updates</Divider>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                          These emails keep you updated on task and project activity
                        </Text>

                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div><strong>Task Status Changes</strong></div>
                              <Text type="secondary">Receive emails when task status changes</Text>
                            </div>
                            <Button
                              type={emailPreferences.taskStatusChanges ? 'primary' : 'default'}
                              onClick={async () => {
                                setPreferencesLoading(true);
                                try {
                                  const updated = await userService.updateEmailPreferences({
                                    ...emailPreferences,
                                    taskStatusChanges: !emailPreferences.taskStatusChanges
                                  });
                                  setEmailPreferences(updated);
                                  message.success('Preferences updated');
                                } catch (err) {
                                  message.error('Failed to update preferences');
                                } finally {
                                  setPreferencesLoading(false);
                                }
                              }}
                            >
                              {emailPreferences.taskStatusChanges ? 'Enabled' : 'Disabled'}
                            </Button>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div><strong>Task Completion</strong></div>
                              <Text type="secondary">Receive emails when tasks are completed</Text>
                            </div>
                            <Button
                              type={emailPreferences.taskCompletion ? 'primary' : 'default'}
                              onClick={async () => {
                                setPreferencesLoading(true);
                                try {
                                  const updated = await userService.updateEmailPreferences({
                                    ...emailPreferences,
                                    taskCompletion: !emailPreferences.taskCompletion
                                  });
                                  setEmailPreferences(updated);
                                  message.success('Preferences updated');
                                } catch (err) {
                                  message.error('Failed to update preferences');
                                } finally {
                                  setPreferencesLoading(false);
                                }
                              }}
                            >
                              {emailPreferences.taskCompletion ? 'Enabled' : 'Disabled'}
                            </Button>
                          </div>
                        </Space>

                        <Divider style={{ marginTop: 24 }}>Digest Emails</Divider>
                        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                          Periodic summaries of your tasks and projects
                        </Text>

                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div><strong>Weekly Summary</strong></div>
                              <Text type="secondary">Receive a weekly summary of your activity</Text>
                            </div>
                            <Button
                              type={emailPreferences.weeklySummary ? 'primary' : 'default'}
                              onClick={async () => {
                                setPreferencesLoading(true);
                                try {
                                  const updated = await userService.updateEmailPreferences({
                                    ...emailPreferences,
                                    weeklySummary: !emailPreferences.weeklySummary
                                  });
                                  setEmailPreferences(updated);
                                  message.success('Preferences updated');
                                } catch (err) {
                                  message.error('Failed to update preferences');
                                } finally {
                                  setPreferencesLoading(false);
                                }
                              }}
                            >
                              {emailPreferences.weeklySummary ? 'Enabled' : 'Disabled'}
                            </Button>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div><strong>Daily Digest</strong></div>
                              <Text type="secondary">Receive a daily digest of activity</Text>
                            </div>
                            <Button
                              type={emailPreferences.dailyDigest ? 'primary' : 'default'}
                              onClick={async () => {
                                setPreferencesLoading(true);
                                try {
                                  const updated = await userService.updateEmailPreferences({
                                    ...emailPreferences,
                                    dailyDigest: !emailPreferences.dailyDigest
                                  });
                                  setEmailPreferences(updated);
                                  message.success('Preferences updated');
                                } catch (err) {
                                  message.error('Failed to update preferences');
                                } finally {
                                  setPreferencesLoading(false);
                                }
                              }}
                            >
                              {emailPreferences.dailyDigest ? 'Enabled' : 'Disabled'}
                            </Button>
                          </div>
                        </Space>
                      </Form>
                      </Spin>
                    ) : (
                      <Spin />
                    )}
                  </Card>
                </Col>

                <Col xs={24} lg={8}>
                  <Card
                    title="About Email Notifications"
                    bordered={false}
                    className="settings-card"
                  >
                    <div style={{ color: '#8c8c8c' }}>
                      <p><strong>Stay Informed:</strong> Email notifications help you stay up-to-date with your projects.</p>
                      <p><strong>Control Your Inbox:</strong> Enable only the notifications you need.</p>
                      <p><strong>Unsubscribe Anytime:</strong> Each email includes an unsubscribe link for that notification type.</p>
                      <p style={{ marginTop: 16 }}>
                        <Text type="warning">Note: Welcome emails cannot be disabled.</Text>
                      </p>
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
