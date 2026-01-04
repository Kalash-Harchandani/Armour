import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [hasReconStarted, setHasReconStarted] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check if recon has been started (stored in localStorage)
    const reconStarted = localStorage.getItem('reconStarted') === 'true';
    setHasReconStarted(reconStarted);
  }, [location]);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-black border-bottom border-secondary">
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <i className="fas fa-shield-alt me-2 text-cyan"></i>
          <span className="fw-bold text-cyan">ARMOUR</span>
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link 
                className={`nav-link ${location.pathname === '/' ? 'active text-cyan' : 'text-white'}`} 
                aria-current={location.pathname === '/' ? 'page' : undefined} 
                to="/"
              >
                <i className="fas fa-home me-1"></i>Home
              </Link>
            </li>
            {hasReconStarted && (
              <li className="nav-item">
                <Link 
                  className={`nav-link ${location.pathname === '/dashboard' ? 'active text-cyan' : 'text-white'}`}
                  to="/dashboard"
                >
                  <i className="fas fa-tachometer-alt me-1"></i>Dashboard
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

