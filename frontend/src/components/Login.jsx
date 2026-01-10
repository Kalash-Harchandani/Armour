/**
 * Login Component
 * Google OAuth login page - matches home page theme
 */


import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import backendUrl from "../config/api";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const returnTo = location.state?.returnTo || '/';
      navigate(returnTo, { state: location.state });
    }
  }, [isAuthenticated, navigate, location.state]);

  const handleGoogleLogin = () => {
    window.location.href = `${backendUrl}/auth/google`;
  };

  return (
    <div className="home-page">
      <section className="hero-section min-vh-100 d-flex align-items-center justify-content-center position-relative">
        <div className="container text-center">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              {/* Main Heading */}
              <h1 className="main-heading display-1 fw-bold mb-4">
                <span className="text-cyan">ARMOUR</span>
              </h1>
              
              {/* Subheading */}
              <p className="subheading lead mb-5 text-white fade-in">
                <i className="fas fa-shield-alt me-2 text-cyan"></i>
                Sign in to start scanning domains
              </p>
              
              {/* Login Card */}
              <div className="mt-5 fade-in-delay">
                <div className="card bg-dark border-secondary mx-auto" style={{ maxWidth: '400px' }}>
                  <div className="card-body p-5 text-center">
                    <p className="text-white-50 mb-4">
                      Sign in with Google to access domain scanning features
                    </p>
                    <button
                      className="btn btn-outline-cyan btn-lg w-100 mb-3"
                      onClick={handleGoogleLogin}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="me-2"
                      >
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Sign in with Google
                    </button>
                    <div className="mt-4">
                      <small className="text-muted">
                        <strong>Free Tier:</strong> 3 Quick Scans + 2 Full Scans
                      </small>
                    </div>
                    <div className="mt-3">
                      <button
                        className="btn btn-link text-cyan text-decoration-none"
                        onClick={() => navigate('/')}
                      >
                        <i className="fas fa-arrow-left me-2"></i>
                        Back to Home
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Login;

