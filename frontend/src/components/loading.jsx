import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { scanDomain, analyzeScan } from '../services/api';

const Loading = () => {
  const [loadingText, setLoadingText] = useState('Initializing reconnaissance...');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const domain = location.state?.domain || localStorage.getItem('currentDomain') || '';
  const scanType = location.state?.scanType || localStorage.getItem('scanType') || 'quick';
  const hasStartedRef = useRef(false);
  const hasNavigatedRef = useRef(false);

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
    // Check authentication first
    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: '/loading', domain, scanType } });
      return;
    }

    if (!domain) {
      navigate('/');
      return;
    }

    // Clear any previous errors when component mounts
    setError(null);

    // Prevent duplicate scans (React StrictMode runs effects twice in dev)
    if (hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;

    // Prevent duplicate scans - check if scan is already in progress
    const scanKey = `scanning_${domain}_${scanType}`;
    if (localStorage.getItem(scanKey)) {
      // Scan already in progress, don't start another one
      return;
    }

    // Mark scan as in progress
    localStorage.setItem(scanKey, 'true');

    // Save domain to localStorage immediately when loading starts
    localStorage.setItem('currentDomain', domain);
    localStorage.setItem('scanType', scanType);

    let messageIndex = 0;
    let scanId = null;

    // Update loading messages
    const messageInterval = setInterval(() => {
      if (messageIndex < loadingMessages.length - 1) {
        messageIndex++;
        setLoadingText(loadingMessages[messageIndex]);
        setProgress(Math.min((messageIndex + 1) * 15, 90));
      }
    }, 2000);

    // Start the actual scan
    const startScan = async () => {
      try {
        setLoadingText('Starting domain scan...');
        setProgress(10);
        setError(null); // Clear any previous errors
        
        // Call the scan API (this will wait for the scan to complete)
        setLoadingText(`Scanning ${domain} (this may take ${scanType === 'quick' ? '60-90' : '300-500'} seconds)...`);
        setProgress(20);
        
        const scanResult = await scanDomain(domain, scanType);
        
        // Clear any errors if scan succeeded
        setError(null);
        scanId = scanResult.scanId;
        
        // Save scanId to localStorage
        localStorage.setItem('currentScanId', scanId);
        localStorage.setItem('scanData', JSON.stringify(scanResult.data));
        
        setLoadingText('Scan completed!');
        setProgress(100);

        // Clean up scan flag immediately
        localStorage.removeItem(scanKey);
      
        // Navigate immediately after scan completes
        // Analysis will be generated manually by user clicking the button
      setLoadingText('Reconnaissance complete!');
        setError(null);
        
        // Save data to localStorage for dashboard to access
        const dashboardData = {
          domain,
          scanId,
          scanData: scanResult.data,
          analysis: null // No automatic analysis - user must click button
        };
        localStorage.setItem('dashboardData', JSON.stringify(dashboardData));
        
        // Navigate immediately - use multiple approaches to ensure it works
        if (!hasNavigatedRef.current) {
          hasNavigatedRef.current = true;
          
          // Use setTimeout to ensure state updates are complete
          setTimeout(() => {
            try {
              navigate('/dashboard', { 
                state: dashboardData,
                replace: true
              });
            } catch (navError) {
              console.error('Navigation error:', navError);
              // Fallback to window.location if navigate fails
              window.location.href = '/dashboard';
            }
          }, 100);
        }

      } catch (scanError) {
        console.error('Scan error:', scanError);
        
        // Show error and navigate
        setError(`Scan failed: ${scanError.message}`);
        setLoadingText('Scan failed. Please try again.');
        setProgress(0);
        
        // Clean up scan flag
        localStorage.removeItem(scanKey);
        
        // Navigate back to home after error
      setTimeout(() => {
          if (!hasNavigatedRef.current) {
            hasNavigatedRef.current = true;
            navigate('/', { state: { error: scanError.message }, replace: true });
          }
        }, 3000);
      }
    };

    // Start the scan process
    startScan();

    return () => {
      clearInterval(messageInterval);
      // Clean up the scan flag if component unmounts
      localStorage.removeItem(scanKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, scanType, navigate, isAuthenticated]);

  return (
    <div className="home-page">
      <section className="hero-section min-vh-100 d-flex align-items-center justify-content-center position-relative">
        <div className="container text-center">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              {/* Main Heading */}
              <h1 className="main-heading display-1 fw-bold mb-4">
                <span className="text-cyan">ARMOUR</span>
              </h1>
              
              {/* Domain Display */}
              <div className="mb-5 fade-in">
                <p className="subheading lead mb-3 text-white">
                  <i className="fas fa-globe me-2 text-cyan"></i>
                  Scanning: <span className="text-cyan">{domain}</span>
                </p>
              </div>

              {/* Minimalist Loading Animation */}
              <div className="loading-animation mb-5 fade-in-delay">
                <div className="minimal-spinner"></div>
              </div>

              {/* Loading Text */}
              <div className="loading-text fade-in-delay-2">
                <p className="text-white fs-5 mb-4">{loadingText}</p>
                {error && progress < 100 && (
                  <div className="alert alert-danger mt-3 bg-dark border-danger" role="alert">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {error}
                  </div>
                )}
                {progress === 100 && (
                  <div className="mt-4">
                    <button
                      className="btn btn-outline-cyan btn-lg"
                      onClick={() => {
                        const scanId = localStorage.getItem('currentScanId');
                        const scanData = localStorage.getItem('scanData');
                        const savedDomain = localStorage.getItem('currentDomain');
                        
                        navigate('/dashboard', {
                          state: {
                            domain: savedDomain || domain,
                            scanId,
                            scanData: scanData ? JSON.parse(scanData) : null
                          },
                          replace: true
                        });
                      }}
                    >
                      <i className="fas fa-arrow-right me-2"></i>
                      View Results
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Loading;
