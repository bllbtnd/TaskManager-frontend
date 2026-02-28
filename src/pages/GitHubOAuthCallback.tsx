import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Spin, Result } from 'antd';
import { gitHubService } from '../services/gitHubService';
import { notificationService } from '../services/notificationService';

const GitHubOAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        notificationService.error(`GitHub OAuth failed: ${error}`);
        navigate('/settings', { replace: true });
        return;
      }

      if (!code) {
        notificationService.error('No authorization code received');
        navigate('/settings', { replace: true });
        return;
      }

      try {
        const result = await gitHubService.handleOAuthCallback(code);
        notificationService.success(`GitHub account connected as ${result.githubUsername}`);
        // Reload settings or redirect
        const redirectUrl = sessionStorage.getItem('redirectAfterOAuth');
        sessionStorage.removeItem('redirectAfterOAuth');
        navigate(redirectUrl || '/settings', { replace: true });
      } catch (error: any) {
        notificationService.error(error.message || 'Failed to connect GitHub account');
        navigate('/settings', { replace: true });
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Spin size="large" tip="Connecting your GitHub account..." />
    </div>
  );
};

export default GitHubOAuthCallback;
