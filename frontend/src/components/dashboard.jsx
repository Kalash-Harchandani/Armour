import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import scanData from '../mock/ScanData';
import mockGeminiAnalysis from '../mock/GeminiAnalysis';

// Component to parse and display Gemini Analysis
const GeminiAnalysisDisplay = ({ analysis, domain }) => {
  if (!analysis || !analysis.analysis) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-section">
          <h6 className="dashboard-section-title">GEMINI ANALYSIS</h6>
          <p className="text-white-50 mb-0">
            Analysis is being generated. Please wait...
          </p>
        </div>
      </div>
    );
  }

  const parseAnalysis = (text) => {
    const sections = {
      summary: '',
      detailed: [],
      riskAssessment: ''
    };

    // Extract AI Summary
    const summaryMatch = text.match(/AI Summary \(Short\):\s*([\s\S]*?)(?=Detailed Analysis:|$)/i);
    if (summaryMatch) {
      sections.summary = summaryMatch[1].trim();
    }

    // Extract Detailed Analysis sections
    const detailedMatch = text.match(/Detailed Analysis:([\s\S]*?)(?=Overall Risk Assessment:|$)/i);
    if (detailedMatch) {
      const detailedText = detailedMatch[1];
      // Split by numbered sections (1., 2., etc.) with optional bold formatting
      const sectionPattern = /(\d+)\.\s*(?:\*\*)?([^*\n]+?)(?:\*\*)?:\s*([\s\S]*?)(?=\d+\.\s*(?:\*\*)?[^*\n]+(?:\*\*)?:|Overall Risk Assessment:|$)/g;
      let match;
      while ((match = sectionPattern.exec(detailedText)) !== null) {
        sections.detailed.push({
          number: match[1],
          title: match[2].trim(),
          content: match[3].trim()
        });
      }
      
      // Fallback: if regex didn't work, try simpler approach
      if (sections.detailed.length === 0) {
        const lines = detailedText.split('\n');
        let currentSection = null;
        lines.forEach(line => {
          const sectionMatch = line.match(/(\d+)\.\s*(?:\*\*)?([^*\n:]+?)(?:\*\*)?:/);
          if (sectionMatch) {
            if (currentSection) {
              sections.detailed.push(currentSection);
            }
            currentSection = {
              number: sectionMatch[1],
              title: sectionMatch[2].trim(),
              content: ''
            };
          } else if (currentSection && line.trim()) {
            currentSection.content += (currentSection.content ? '\n' : '') + line.trim();
          }
        });
        if (currentSection) {
          sections.detailed.push(currentSection);
        }
      }
    }

    // Extract Overall Risk Assessment
    const riskMatch = text.match(/Overall Risk Assessment:\s*([\s\S]*?)$/i);
    if (riskMatch) {
      sections.riskAssessment = riskMatch[1].trim();
    }

    return sections;
  };

  const parsed = parseAnalysis(analysis.analysis);

  const getRiskColor = (risk) => {
    const riskLower = risk.toLowerCase();
    if (riskLower.includes('low')) return 'text-success';
    if (riskLower.includes('medium')) return 'text-warning';
    if (riskLower.includes('high')) return 'text-danger';
    return 'text-info';
  };

  const formatBulletPoints = (text) => {
    return text.split('\n').filter(line => line.trim().startsWith('-'));
  };

  const formatContent = (content) => {
    // Split by bullet points and format
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        return { type: 'bullet', text: trimmed.replace(/^[\*\-\s]+/, '') };
      }
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return { type: 'bold', text: trimmed.replace(/\*\*/g, '') };
      }
      return { type: 'paragraph', text: trimmed };
    }).filter(item => item.text);
  };

  return (
    <div className="dashboard-container">
      <div className="gemini-analysis-content">
        {/* AI Summary Section */}
        {parsed.summary && (
          <div className="dashboard-section">
            <h6 className="dashboard-section-title">
              <i className="fas fa-lightbulb me-2"></i>
              AI SUMMARY
            </h6>
            <div className="gemini-summary">
              {formatBulletPoints(parsed.summary).map((bullet, idx) => (
                <div key={idx} className="gemini-bullet-point">
                  <i className="fas fa-circle text-cyan me-2" style={{ fontSize: '0.5rem' }}></i>
                  <span className="text-white-50">{bullet.replace(/^-\s*/, '')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Analysis Sections */}
        {parsed.detailed.length > 0 && (
          <div className="dashboard-section">
            <h6 className="dashboard-section-title">
              <i className="fas fa-list-alt me-2"></i>
              DETAILED ANALYSIS
            </h6>
            <div className="gemini-detailed">
              {parsed.detailed.map((section, idx) => (
                <div key={idx} className="gemini-section-item mb-4">
                  <h6 className="text-cyan mb-3 fw-bold" style={{ fontSize: '1rem' }}>
                    {section.number || (idx + 1)}. {section.title}
                  </h6>
                  <div className="gemini-section-content">
                    {formatContent(section.content).map((item, itemIdx) => {
                      if (item.type === 'bullet') {
                        return (
                          <div key={itemIdx} className="gemini-bullet-point ms-3 mb-2">
                            <i className="fas fa-circle text-cyan me-2" style={{ fontSize: '0.4rem' }}></i>
                            <span className="text-white-50">{item.text}</span>
                          </div>
                        );
                      }
                      if (item.type === 'bold') {
                        return (
                          <div key={itemIdx} className="mb-2">
                            <strong className="text-cyan">{item.text}:</strong>
                          </div>
                        );
                      }
                      if (item.text) {
                        return (
                          <p key={itemIdx} className="text-white-50 mb-2" style={{ lineHeight: '1.6' }}>
                            {item.text}
                          </p>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Assessment */}
        {parsed.riskAssessment && (
          <div className="dashboard-section">
            <h6 className="dashboard-section-title">
              <i className="fas fa-shield-alt me-2"></i>
              OVERALL RISK ASSESSMENT
            </h6>
            <div className="gemini-risk-assessment">
              <div className={`risk-badge ${getRiskColor(parsed.riskAssessment)} mb-3`}>
                <h5 className="mb-0 fw-bold">
                  {parsed.riskAssessment.split('\n')[0]}
                </h5>
              </div>
              <p className="text-white-50 mb-0" style={{ lineHeight: '1.6' }}>
                {parsed.riskAssessment.split('\n').slice(1).join(' ').trim() || 
                 parsed.riskAssessment.split('\n').slice(1).join('\n').trim()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const location = useLocation();
  const domainFromState = location.state?.domain;
  const [data, setData] = useState(scanData);
  const [activeTab, setActiveTab] = useState('overview');
  const [geminiAnalysis, setGeminiAnalysis] = useState(null);

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

    // Load Gemini analysis (in production, this would be fetched from backend)
    // For now, using mock data
    const savedAnalysis = localStorage.getItem(`geminiAnalysis_${domainFromState || localStorage.getItem('currentDomain')}`);
    if (savedAnalysis) {
      try {
        setGeminiAnalysis(JSON.parse(savedAnalysis));
      } catch (e) {
        // If parsing fails, use mock data
        setGeminiAnalysis(mockGeminiAnalysis);
      }
    } else {
      // Use mock data for now
      setGeminiAnalysis(mockGeminiAnalysis);
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
          <GeminiAnalysisDisplay analysis={geminiAnalysis} domain={currentDomain} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
