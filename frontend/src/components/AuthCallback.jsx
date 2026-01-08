/**
 * Auth Callback Component
 * Handles OAuth callback and stores JWT token - matches home page theme
 */

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCurrentUser } from '../services/api';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      console.error('Authentication error:', error);
      navigate('/login', { state: { error: 'authentication_failed' } });
      return;
    }

    if (token) {
      // Store token temporarily
      localStorage.setItem('authToken', token);

      // Fetch user data
      getCurrentUser()
        .then((response) => {
          if (response.success) {
            // Store user data and token
            login(token, response.user);
            // Navigate to home or returnTo location
            const returnTo = location.state?.returnTo || '/';
            navigate(returnTo, { 
              state: location.state?.domain ? { domain: location.state.domain, scanType: location.state.scanType } : null 
            });
          } else {
            throw new Error('Failed to get user data');
          }
        })
        .catch((error) => {
          console.error('Error fetching user data:', error);
          localStorage.removeItem('authToken');
          navigate('/login', { state: { error: 'authentication_failed' } });
        });
    } else {
      navigate('/login', { state: { error: 'no_token' } });
    }
  }, [searchParams, navigate, login, location.state]);

  return (
    <div className="home-page">
      <section className="hero-section min-vh-100 d-flex align-items-center justify-content-center position-relative">
        <div className="container text-center">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <h1 className="main-heading display-1 fw-bold mb-4">
                <span className="text-cyan">ARMOUR</span>
              </h1>
              <div className="text-white fade-in">
                <div className="spinner-border text-cyan mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="lead">Completing authentication...</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AuthCallback;

