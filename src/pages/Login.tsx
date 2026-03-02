import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined, GithubOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { isMobileDevice } from '../utils/device';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await authService.login(values);
      notificationService.success('Login successful!');
      navigate(isMobileDevice() ? '/mobile-summary' : '/projects');
    } catch (error: any) {
      notificationService.error(error.response?.data || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = async () => {
    setGithubLoading(true);
    try {
      const response = await authService.getGitHubOAuthUrl();
      window.location.href = response.authUrl;
    } catch (error) {
      notificationService.error('Failed to initiate GitHub login');
      setGithubLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#141414'
    }}>
      <Card
        style={{
          width: 450,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          background: '#1f1f1f',
          border: '1px solid #303030'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ color: '#fff', marginBottom: 8 }}>
            Welcome Back
          </Title>
          <Text type="secondary">Sign in to continue</Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: 45 }}
            >
              Sign In
            </Button>
          </Form.Item>

          <Divider style={{ margin: '24px 0' }}>
            <Text type="secondary">or</Text>
          </Divider>

          <Button
            icon={<GithubOutlined />}
            onClick={handleGitHubLogin}
            loading={githubLoading}
            block
            style={{ 
              height: 45,
              background: '#24292e',
              borderColor: '#24292e',
              color: '#fff'
            }}
          >
            Sign in with GitHub
          </Button>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Text type="secondary">
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#1890ff' }}>
                Sign Up
              </Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
