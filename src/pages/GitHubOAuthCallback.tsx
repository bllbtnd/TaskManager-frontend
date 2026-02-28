import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import { gitHubService } from '../services/gitHubService';
import { notificationService } from '../services/notificationService';

const GitHubOAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
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
        const result = await gitHubService.handleOAuthCallback(code);
        notificationService.success(`GitHub account connected as ${result.githubUsername}`);
        setStatus('success');
        // Redirect to settings after 2 seconds
        setTimeout(() => {
          const redirectUrl = sessionStorage.getItem('redirectAfterOAuth');
          sessionStorage.removeItem('redirectAfterOAuth');
          navigate(redirectUrl || '/settings', { replace: true });
        }, 2000);
      } catch (error: any) {
        const message = error.response?.data?.message || error.message || 'Failed to connect GitHub account';
        setErrorMsg(message);
        setStatus('error');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Connecting your GitHub account..." />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: 24 }}>
        <Result
          status="error"
          title="GitHub Connection Failed"
          subTitle={errorMsg}
          extra={
            <Button type="primary" onClick={() => navigate('/settings', { replace: true })}>
              Go Back to Settings
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
        title="GitHub Connected Successfully"
        subTitle="Redirecting to settings..."
        extra={
          <Button type="primary" onClick={() => navigate('/settings', { replace: true })}>
            Go to Settings
          </Button>
        }
      />
    </div>
  );
};

export default GitHubOAuthCallback;
