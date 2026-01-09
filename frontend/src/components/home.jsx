import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCurrentUser } from '../services/api';

const Home = () => {
  const [domain, setDomain] = useState('');
  const [error, setError] = useState('');
  const [scanType, setScanType] = useState(null); // 'quick' or 'full'
  const [showInfo, setShowInfo] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser, isAuthenticated } = useAuth();

  // Check for error from previous navigation
  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error);
      // Clear the error from state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Refresh user data to get updated scan limits (only if authenticated)
  useEffect(() => {
    const refreshUserData = async () => {
      if (isAuthenticated) {
        try {
          const response = await getCurrentUser();
          if (response.success) {
            updateUser(response.user);
          }
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
      }
    };
    refreshUserData();
  }, [updateUser, isAuthenticated]);
  
  const fullText = "Armour is built for beginners, developers, and security learners who want clear visibility into how a domain is exposed on the internet. Results are displayed in a structured dashboard and explained using AI-generated analysis to help you understand potential risks and misconfigurations.";

  const validateDomain = (domainInput) => {
    const trimmedDomain = domainInput.trim().toLowerCase();
    
    // Remove http:// or https:// if present
    const cleanDomain = trimmedDomain.replace(/^https?:\/\//, '').replace(/^www\./, '');
    
    // Basic domain regex pattern
    // Allows: letters, numbers, hyphens, dots
    // Must have at least one dot
    // TLD must be at least 2 characters
    const domainPattern = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
    
    if (!cleanDomain) {
      return 'Please enter a domain';
    }
    
    if (cleanDomain.length < 4) {
      return 'Domain is too short';
    }
    
    if (cleanDomain.length > 253) {
      return 'Domain is too long';
    }
    
    if (!cleanDomain.includes('.')) {
      return 'Invalid domain format. Domain must contain a dot (e.g., example.com)';
    }
    
    if (cleanDomain.startsWith('.') || cleanDomain.endsWith('.')) {
      return 'Domain cannot start or end with a dot';
    }
    
    if (cleanDomain.includes('..')) {
      return 'Domain cannot contain consecutive dots';
    }
    
    if (!domainPattern.test(cleanDomain)) {
      return 'Invalid domain format. Please enter a valid domain (e.g., example.com)';
    }
    
    // Check TLD length (after last dot)
    const parts = cleanDomain.split('.');
    const tld = parts[parts.length - 1];
    if (tld.length < 2) {
      return 'Invalid domain. Top-level domain must be at least 2 characters';
    }
    
    return null; // Valid domain
  };

  const handleSubmit = async (e, type) => {
    e.preventDefault();
    const trimmedDomain = domain.trim();
    
    if (!trimmedDomain) {
      setError('Please enter a domain');
      return;
    }
    
    const validationError = validateDomain(trimmedDomain);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    if (!type) {
      setError('Please select a scan type');
      return;
    }

    // Check if user is authenticated - redirect to login if not
    if (!user || !isAuthenticated) {
      navigate('/login', { state: { returnTo: '/loading', domain: trimmedDomain, scanType: type } });
      return;
    }

    // Check scan limits
    const remaining = user.scanLimits?.[type]?.remaining || 0;
    if (remaining <= 0) {
      setError(`You have reached your ${type} scan limit. Remaining: Quick: ${user.scanLimits?.quick?.remaining || 0}, Full: ${user.scanLimits?.full?.remaining || 0}`);
      return;
    }
    
    // Clear error and save domain to localStorage
    setError('');
    const cleanDomain = trimmedDomain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
    
    // Check if we already have scan data for this domain
    const savedScanData = localStorage.getItem('scanData');
    const savedDomain = localStorage.getItem('currentDomain');
    const savedScanId = localStorage.getItem('currentScanId');
    
    // If we have existing scan data for the same domain, navigate directly to dashboard
    if (savedDomain === cleanDomain && savedScanData && savedScanId) {
      try {
        const parsedScanData = JSON.parse(savedScanData);
        // Check if the saved data is for the same domain
        if (parsedScanData.domain === cleanDomain) {
          // Navigate directly to dashboard with existing data
          navigate('/dashboard', {
            state: {
              domain: cleanDomain,
              scanId: savedScanId,
              scanData: parsedScanData
            }
          });
          return;
        }
      } catch (e) {
        // If parsing fails, continue with new scan
        console.error('Failed to parse saved scan data:', e);
      }
    }
    
    // Save domain and scan type temporarily to localStorage
    localStorage.setItem('currentDomain', cleanDomain);
    localStorage.setItem('scanType', type);
    
    navigate('/loading', { state: { domain: cleanDomain, scanType: type } });
  };

  const handleChange = (e) => {
    setDomain(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section min-vh-100 d-flex align-items-center justify-content-center position-relative">
        <div className="container text-center">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              {/* Main Heading with Glow Effect */}
              <h1 className="main-heading display-1 fw-bold mb-4">
                <span className="text-cyan">ARMOUR</span>
              </h1>
              
              {/* Subheading */}
              <p className="subheading lead mb-5 text-white fade-in">
                <i className="fas fa-crosshairs me-2 text-cyan"></i>
                Advanced Domain Intelligence & Reconnaissance Platform
              </p>
              
              {/* Domain Input Form */}
              <div className="mt-5 fade-in-delay">
                <form onSubmit={(e) => e.preventDefault()} className="d-flex flex-column gap-3 justify-content-center">
                  <div className="flex-grow-1 max-w-600 mx-auto w-100">
                    <div className="input-group">
                      <span className="input-group-text bg-dark text-cyan border-secondary">
                        <i className="fas fa-globe"></i>
                      </span>
                      <input
                        type="text"
                        className={`form-control form-control-lg bg-dark text-white border-secondary ${error ? 'border-danger' : ''}`}
                        placeholder="Enter domain (e.g., example.com)"
                        value={domain}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    {error && (
                      <div className="text-danger small mt-2 text-start ps-5">
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {error}
                      </div>
                    )}
                  </div>
                  
                  {/* Scan Type Selection */}
                  <div className="scan-options-container mt-3">
                    <div className="scan-info-header d-flex align-items-center justify-content-center gap-2 mb-3 position-relative">
                      <span className="text-white-50 small me-2">Select scan type:</span>
                      <i 
                        className="fas fa-info-circle text-cyan"
                        style={{ fontSize: '1.2rem', cursor: 'pointer' }}
                        onClick={() => setShowInfo(!showInfo)}
                        onMouseEnter={() => setShowInfo(true)}
                        onMouseLeave={() => setShowInfo(false)}
                        title="Click for more information"
                      ></i>
                      {showInfo && (
                        <div className="scan-info-tooltip">
                          <div className="tooltip-content">
                            <h6 className="mb-2 text-cyan">Scan Types</h6>
                            <p className="mb-2"><strong>Quick Scan:</strong> Fast scan that completes in approximately 90 seconds.</p>
                            <p className="mb-0"><strong>Full Scan:</strong> Comprehensive scan that depends on the range of the domain entered. Can take anywhere from 300 to 500 seconds.</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="d-flex flex-column flex-md-row gap-3 justify-content-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          setScanType('quick');
                          handleSubmit(e, 'quick');
                        }}
                        disabled={user && (user.scanLimits?.quick?.remaining || 0) <= 0}
                        className={`btn px-4 text-uppercase fw-bold scan-btn ${scanType === 'quick' ? 'btn-info' : 'btn-outline-info'} ${user && (user.scanLimits?.quick?.remaining || 0) <= 0 ? 'disabled opacity-50' : ''}`}
                      >
                        <i className="fas fa-bolt me-2"></i>
                        Quick Scan
                        <small className="d-block mt-1" style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                          ~90 seconds
                        </small>
                        {user && (
                          <small className="d-block mt-1 text-warning" style={{ fontSize: '0.65rem' }}>
                            {user.scanLimits?.quick?.remaining || 0} remaining
                          </small>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          setScanType('full');
                          handleSubmit(e, 'full');
                        }}
                        disabled={user && (user.scanLimits?.full?.remaining || 0) <= 0}
                        className={`btn px-4 text-uppercase fw-bold scan-btn ${scanType === 'full' ? 'btn-info' : 'btn-outline-info'} ${user && (user.scanLimits?.full?.remaining || 0) <= 0 ? 'disabled opacity-50' : ''}`}
                      >
                        <i className="fas fa-search me-2"></i>
                        Full Scan
                        <small className="d-block mt-1" style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                          300-500 seconds
                        </small>
                        {user && (
                          <small className="d-block mt-1 text-warning" style={{ fontSize: '0.65rem' }}>
                            {user.scanLimits?.full?.remaining || 0} remaining
                          </small>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
              
              {/* Scroll Indicator */}
              <div className="mt-5 pt-5 fade-in-delay-2">
                <p className="text-secondary small mb-3">Scroll to learn more</p>
                <i className="fas fa-chevron-down text-cyan fs-4 animate-bounce"></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Description Section with Typewriter Effect */}
      <section className="description-section py-5 position-relative">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10 col-xl-9">
              <div className="text-content">
                <h2 className="section-title text-cyan mb-5 text-center">
                  <i className="fas fa-shield-alt me-2"></i>
                  About Armour
                </h2>
                
                <div className="typewriter-text text-center">
                  <p className="description-text text-white mx-auto">
                    {fullText}
                  </p>
                </div>

                {/* Feature Highlights */}
                <div className="features-section mt-5 pt-5">
                  <div className="row g-4">
                    <div className="col-md-4">
                      <div className="feature-item">
                        <i className="fas fa-chart-line text-cyan fs-1 mb-3"></i>
                        <h4 className="text-cyan mb-3">Structured Dashboard</h4>
                        <p className="text-white-50">
                          Results are displayed in a structured dashboard for easy analysis and understanding.
                        </p>
                      </div>
                    </div>
                    
                    <div className="col-md-4">
                      <div className="feature-item">
                        <i className="fas fa-robot text-cyan fs-1 mb-3"></i>
                        <h4 className="text-cyan mb-3">AI-Powered Analysis</h4>
                        <p className="text-white-50">
                          Explained using AI-generated analysis to help you understand potential risks and misconfigurations.
                        </p>
                      </div>
                    </div>
                    
                    <div className="col-md-4">
                      <div className="feature-item">
                        <i className="fas fa-share-alt text-cyan fs-1 mb-3"></i>
                        <h4 className="text-cyan mb-3">Shareable Recon Report</h4>
                        <p className="text-white-50">
                          Generate and share comprehensive reconnaissance reports with your team or stakeholders.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-center mt-5 pt-4">
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="btn btn-outline-info btn-lg px-5"
                  >
                    <i className="fas fa-arrow-up me-2"></i>
                    Start Your Recon
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
