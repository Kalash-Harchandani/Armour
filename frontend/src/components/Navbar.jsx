import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [imageError, setImageError] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  // Get user initials for fallback avatar
  const getUserInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Reset image error when user changes
  useEffect(() => {
    setImageError(false);
  }, [user?.picture]);

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
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item">
              <Link 
                className={`nav-link ${location.pathname === '/' ? 'active text-cyan' : 'text-white'}`} 
                aria-current={location.pathname === '/' ? 'page' : undefined} 
                to="/"
              >
                <i className="fas fa-home me-1"></i>Home
              </Link>
            </li>
            {isAuthenticated && (
              <>
                <li className="nav-item">
                  <Link 
                    className={`nav-link ${location.pathname === '/past-scans' ? 'active text-cyan' : 'text-white'}`}
                    to="/past-scans"
                  >
                    <i className="fas fa-history me-1"></i>Past Scans
                  </Link>
                </li>
                {user && (
                  <li className="nav-item dropdown">
                    <a
                      className="nav-link dropdown-toggle text-white"
                      href="#"
                      id="navbarDropdown"
                      role="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      {user.picture && !imageError ? (
                        <img
                          src={user.picture}
                          alt={user.name}
                          className="rounded-circle me-2"
                          style={{ width: '24px', height: '24px', objectFit: 'cover' }}
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <div
                          className="rounded-circle me-2 d-inline-flex align-items-center justify-content-center text-cyan bg-dark border border-cyan"
                          style={{ 
                            width: '24px', 
                            height: '24px', 
                            fontSize: '10px',
                            fontWeight: 'bold'
                          }}
                        >
                          {getUserInitials(user.name)}
                        </div>
                      )}
                      {user.name}
                    </a>
                    <ul className="dropdown-menu dropdown-menu-end bg-dark border-secondary">
                      <li>
                        <div className="dropdown-item-text text-white px-3">
                          <small>
                            <strong>Scans Remaining:</strong><br />
                            Quick: {user.scanLimits?.quick?.remaining || 0} | Full: {user.scanLimits?.full?.remaining || 0}
                          </small>
                        </div>
                      </li>
                      <li><hr className="dropdown-divider bg-secondary" /></li>
                      <li>
                        <button className="dropdown-item text-white" onClick={handleLogout}>
                          <i className="fas fa-sign-out-alt me-2"></i>Logout
                        </button>
                      </li>
                    </ul>
                  </li>
                )}
              </>
            )}
            {!isAuthenticated && (
              <li className="nav-item">
                <Link 
                  className="nav-link text-white"
                  to="/login"
                >
                  <i className="fas fa-sign-in-alt me-1"></i>Login
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

