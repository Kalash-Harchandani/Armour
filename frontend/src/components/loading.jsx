import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Loading = () => {
  const [loadingText, setLoadingText] = useState('Initializing reconnaissance...');
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const domain = location.state?.domain || '';

  const loadingMessages = [
    'Initializing reconnaissance...',
    'Scanning domain infrastructure...',
    'Analyzing DNS records...',
    'Gathering subdomain information...',
    'Checking security configurations...',
    'Running AI-powered analysis...',
    'Finalizing results...'
  ];

  useEffect(() => {
    if (!domain) {
      navigate('/');
      return;
    }

    let messageIndex = 0;

    // Simulate loading progress with messages
    const messageInterval = setInterval(() => {
      if (messageIndex < loadingMessages.length - 1) {
        messageIndex++;
        setLoadingText(loadingMessages[messageIndex]);
        setProgress(Math.min((messageIndex + 1) * 15, 90));
      }
    }, 2000);

    // Simulate loading completion and navigate to dashboard
    const completeLoading = () => {
      // Mark that recon has been started
      localStorage.setItem('reconStarted', 'true');
      
      // Complete loading
      setLoadingText('Reconnaissance complete!');
      setProgress(100);
      
      // Wait a moment then navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard', { state: { domain } });
      }, 1000);
    };

    // Simulate the loading process
    const loadingTimeout = setTimeout(() => {
      completeLoading();
    }, 15000);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(loadingTimeout);
    };
  }, [domain, navigate]);

  return (
    <div className="loading-page min-vh-100 d-flex align-items-center justify-content-center position-relative">
      <div className="container text-center">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* Domain Display */}
            <div className="mb-5">
              <h1 className="text-cyan display-4 fw-bold mb-3">
                {domain}
              </h1>
            </div>

            {/* Minimalist Loading Animation */}
            <div className="loading-animation mb-5">
              <div className="minimal-spinner"></div>
            </div>

            {/* Loading Text */}
            <div className="loading-text">
              <p className="text-white fs-5 mb-4">{loadingText}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
