import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [domain, setDomain] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const fullText = "Armour is built for beginners, developers, and security learners who want clear visibility into how a domain is exposed on the internet. Results are displayed in a structured dashboard and explained using AI-generated analysis to help you understand potential risks and misconfigurations.";

  const validateDomain = (domainInput) => {
    const trimmedDomain = domainInput.trim().toLowerCase();
    
    // Remove http:// or https:// if present
    const cleanDomain = trimmedDomain.replace(/^https?:\/\//, '').replace(/^www\./, '');
    
    // Basic domain regex pattern
    // Allows: letters, numbers, hyphens, dots
    // Must have at least one dot
    // TLD must be at least 2 characters
    const domainPattern = /^([a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
    
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

  const handleSubmit = (e) => {
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
    
    // Clear error and navigate
    setError('');
    const cleanDomain = trimmedDomain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
    navigate('/loading', { state: { domain: cleanDomain } });
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
                <form onSubmit={handleSubmit} className="d-flex flex-column flex-md-row gap-3 justify-content-center">
                  <div className="flex-grow-1 max-w-600">
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
                  <button
                    type="submit"
                    className="btn btn-lg btn-outline-info px-5 text-uppercase fw-bold"
                  >
                    <i className="fas fa-search me-2"></i>
                    Start Recon
                  </button>
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
