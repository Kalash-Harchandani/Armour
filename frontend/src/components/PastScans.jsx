/**
 * Past Scans Component
 * Displays user's scan history with links to dashboard
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserScans } from '../services/api';

const PastScans = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchScans = async () => {
      try {
        setLoading(true);
        const response = await getUserScans();
        if (response.success) {
          setScans(response.scans);
        }
      } catch (err) {
        setError(err.message || 'Failed to load scans');
      } finally {
        setLoading(false);
      }
    };

    fetchScans();
  }, [isAuthenticated, navigate]);

  const handleViewScan = (scanId, domain) => {
    navigate('/dashboard', {
      state: {
        scanId,
        domain,
      },
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="home-page">
        <section className="hero-section min-vh-100 d-flex align-items-center justify-content-center position-relative">
          <div className="container text-center">
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <h1 className="main-heading display-1 fw-bold mb-4">
                  <span className="text-cyan">ARMOUR</span>
                </h1>
                <div className="text-white fade-in">
                  <div className="spinner-border text-cyan mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="lead">Loading your scan history...</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="home-page">
      <section className="hero-section min-vh-100 d-flex align-items-center justify-content-center position-relative py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              {/* Header */}
              <div className="text-center mb-5 fade-in">
                <h1 className="main-heading display-1 fw-bold mb-4">
                  <span className="text-cyan">PAST SCANS</span>
                </h1>
                <p className="subheading lead text-white">
                  <i className="fas fa-history me-2 text-cyan"></i>
                  View and access your previous domain scans
                </p>
              </div>

            {/* Error Message */}
            {error && (
              <div className="alert alert-danger mb-4 bg-dark border-danger fade-in-delay" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}

            {/* Scans List */}
            {scans.length === 0 ? (
              <div className="text-center py-5 fade-in-delay">
                <i className="fas fa-history text-cyan mb-3" style={{ fontSize: '4rem' }}></i>
                <h3 className="text-white mb-3">No Scans Yet</h3>
                <p className="text-white-50 mb-4">
                  Start scanning domains to see your history here
                </p>
                <button
                  className="btn btn-outline-cyan btn-lg"
                  onClick={() => navigate('/')}
                >
                  <i className="fas fa-search me-2"></i>
                  Start Your First Scan
                </button>
              </div>
            ) : (
              <div className="row g-4 fade-in-delay">
                {scans.map((scan) => (
                  <div key={scan.scanId} className="col-md-6 col-lg-4">
                    <div className="card bg-dark border-secondary h-100 hover-lift">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <h5 className="card-title text-cyan mb-1">
                              <i className="fas fa-globe me-2"></i>
                              {scan.domain}
                            </h5>
                            <span className={`badge ${scan.mode === 'quick' ? 'bg-info' : 'bg-warning'} text-dark`}>
                              {scan.mode === 'quick' ? 'Quick' : 'Full'} Scan
                            </span>
                          </div>
                          <span className={`badge ${scan.status === 'completed' ? 'bg-success' : 'bg-secondary'}`}>
                            {scan.status}
                          </span>
                        </div>
                        <p className="text-white-50 small mb-3">
                          <i className="fas fa-clock me-1"></i>
                          {formatDate(scan.createdAt)}
                        </p>
                        <button
                          className="btn btn-outline-cyan w-100"
                          onClick={() => handleViewScan(scan.scanId, scan.domain)}
                        >
                          <i className="fas fa-eye me-2"></i>
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PastScans;

