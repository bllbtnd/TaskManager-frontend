import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { isMobileDevice } from '../utils/device';

const GitHubOAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error' | 'pending'>('loading');
  const [errorMsg, setErrorMsg] = React.useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setErrorMsg(`GitHub OAuth failed: ${error}`);
        setStatus('error');
        return;
      }

      if (!code) {
        setErrorMsg('No authorization code received');
        setStatus('error');
        return;
      }

      try {
        await authService.handleGitHubCallback(code);
        notificationService.success('GitHub login successful!');
        setStatus('success');
        // Redirect to main page after 1 second
        setTimeout(() => {
          navigate(isMobileDevice() ? '/mobile-summary' : '/projects', { replace: true });
        }, 1000);
      } catch (error: any) {
        const message = error.response?.data?.message || error.message || 'GitHub login failed';
        
        // Check if account is pending approval
        if (message.includes('pending approval')) {
          setErrorMsg('Your account has been created and is pending admin approval. You will be notified once approved.');
          setStatus('pending');
        } else {
          setErrorMsg(message);
          setStatus('error');
        }
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Authenticating with GitHub..." />
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: 24 }}>
        <Result
          status="info"
          title="Account Pending Approval"
          subTitle={errorMsg}
          extra={
            <Button type="primary" onClick={() => navigate('/login', { replace: true })}>
              Go to Login
            </Button>
          }
        />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: 24 }}>
        <Result
          status="error"
          title="GitHub Login Failed"
          subTitle={errorMsg}
          extra={
            <Button type="primary" onClick={() => navigate('/login', { replace: true })}>
              Go Back to Login
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Result
        status="success"
        title="Login Successful!"
        subTitle="Redirecting to your projects..."
        extra={
          <Button type="primary" onClick={() => navigate('/projects', { replace: true })}>
            Go to Projects
          </Button>
        }
      />
    </div>
  );
};

export default GitHubOAuthCallback;
