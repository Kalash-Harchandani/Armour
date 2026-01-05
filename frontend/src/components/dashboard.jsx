import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import scanData from '../mock/ScanData';

const Dashboard = () => {
  const location = useLocation();
  const domainFromState = location.state?.domain;
  const [data, setData] = useState(scanData);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (domainFromState) {
      localStorage.setItem('currentDomain', domainFromState);
      setData({ ...scanData, domain: domainFromState });
    } else {
      const savedDomain = localStorage.getItem('currentDomain');
      if (!savedDomain) {
        window.location.href = '/';
      } else {
        setData({ ...scanData, domain: savedDomain });
      }
    }
  }, [domainFromState]);

  const currentDomain = domainFromState || localStorage.getItem('currentDomain') || data.domain;

  return (
    <div className="dashboard-page bg-black min-vh-100 py-4">
      <div className="container">
        {/* Header */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="text-cyan fw-bold mb-2 dashboard-title">{currentDomain}</h1>
              <span className="text-secondary small">{data.status}</span>
            </div>
            <button 
              className="btn btn-outline-info" 
              onClick={() => window.location.href = '/'}
            >
              <i className="fas fa-search me-2"></i>New Scan
            </button>
          </div>

          {/* Tabs */}
          <div className="dashboard-tabs">
            <button
              className={`dashboard-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`dashboard-tab ${activeTab === 'analysis' ? 'active' : ''}`}
              onClick={() => setActiveTab('analysis')}
            >
              <i className="fas fa-robot me-2"></i>Gemini Analysis
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="dashboard-container">
            {/* Left Column: Subdomains, Ports, Technology */}
            <div className="dashboard-column">
              {/* Subdomains */}
              <div className="dashboard-section">
                <h6 className="dashboard-section-title">SUBDOMAINS</h6>
                <div className="dashboard-list">
                  {data.subdomains.map((subdomain, index) => (
                    <div key={index} className="dashboard-item">
                      {subdomain}
                    </div>
                  ))}
                </div>
              </div>

              {/* Ports */}
              <div className="dashboard-section">
                <h6 className="dashboard-section-title">PORTS</h6>
                <div className="dashboard-badges">
                  {Object.entries(data.ports).map(([port, isOpen]) => (
                    <span key={port} className={`dashboard-badge ${isOpen ? 'badge-open' : 'badge-closed'}`}>
                      {port}
                    </span>
                  ))}
                </div>
              </div>

              {/* Technology */}
              <div className="dashboard-section">
                <h6 className="dashboard-section-title">TECHNOLOGY</h6>
                <div className="dashboard-badges">
                  {data.tech.map((tech, index) => (
                    <span key={index} className="dashboard-badge badge-tech">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: DNS Records, Security */}
            <div className="dashboard-column">
              {/* DNS Records */}
              <div className="dashboard-section">
                <h6 className="dashboard-section-title">DNS RECORDS</h6>
                <div className="dashboard-dns">
                  <div className="dns-group">
                    <div className="dns-label">A Records</div>
                    {data.dns.A.map((record, index) => (
                      <div key={index} className="dns-record">
                        <span className="dns-value">{record.value}</span>
                        <span className="dns-meta">TTL: {record.ttl}</span>
                      </div>
                    ))}
                  </div>
                  <div className="dns-group">
                    <div className="dns-label">MX Records</div>
                    {data.dns.MX.map((record, index) => (
                      <div key={index} className="dns-record">
                        <span className="dns-value">{record.value}</span>
                        <span className="dns-meta">Priority: {record.priority}</span>
                      </div>
                    ))}
                  </div>
                  <div className="dns-group">
                    <div className="dns-label">NS Records</div>
                    {data.dns.NS.map((record, index) => (
                      <div key={index} className="dns-record">
                        <span className="dns-value">{record.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Security */}
              <div className="dashboard-section">
                <h6 className="dashboard-section-title">SECURITY</h6>
                {data.ssl[data.domain] && (
                  <div className="security-info">
                    <div className="security-item">
                      <span className="security-label">SSL: </span>
                      <span className={data.ssl[data.domain].valid ? 'text-success' : 'text-danger'}>
                        {data.ssl[data.domain].valid ? 'Valid' : 'Invalid'}
                      </span>
                    </div>
                    <div className="security-item">
                      <span className="security-label">Expires: </span>
                      <span className="text-white">{data.ssl[data.domain].expiresAt}</span>
                    </div>
                  </div>
                )}
                {data.http[data.domain] && (
                  <div className="security-info">
                    <div className="security-item">
                      <span className="security-label">HTTP: </span>
                      <span className="text-cyan">{data.http[data.domain].status}</span>
                    </div>
                    {data.http[data.domain].title && (
                      <div className="security-item">
                        <span className="security-label">Title: </span>
                        <span className="text-white">{data.http[data.domain].title}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="dashboard-container">
            <div className="dashboard-section">
              <h6 className="dashboard-section-title">GEMINI ANALYSIS</h6>
              <p className="text-white-50 mb-0">
                Gemini analysis will appear here. This feature analyzes the reconnaissance data 
                and provides insights about potential security risks and misconfigurations.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
