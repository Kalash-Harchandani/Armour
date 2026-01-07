import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import scanData from '../mock/ScanData';
import { getScan, getAnalysis, analyzeScan } from '../services/api';

// Component to parse and display Gemini Analysis
const GeminiAnalysisDisplay = ({ analysis, domain, onGenerateAnalysis, isGenerating, scanId }) => {
  if (!analysis || !analysis.analysis) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-section">
          <h6 className="dashboard-section-title">GEMINI ANALYSIS</h6>
          {isGenerating ? (
            <div className="text-center py-4">
              <div className="spinner-border text-info mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-white-50 mb-0">
                Generating AI analysis... This may take 30-60 seconds.
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-white-50 mb-4">
                AI analysis is not available for this domain yet.
              </p>
              {scanId && onGenerateAnalysis && (
                <button
                  className="btn btn-info btn-lg"
                  onClick={() => onGenerateAnalysis(scanId)}
                  disabled={isGenerating}
                >
                  <i className="fas fa-robot me-2"></i>
                  Generate AI Analysis
                </button>
              )}
              {!scanId && (
                <p className="text-warning small mt-3">
                  Scan ID not found. Please run a new scan to generate analysis.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  const parseAnalysis = (text) => {
    const sections = {
      summary: '',
      detailed: [],
      riskAssessment: '',
      riskLevel: ''
    };

    // Extract AI Summary - handle both "AI Summary (Short):" and "AI Summary:"
    const summaryMatch = text.match(/AI Summary\s*(?:\(Short\))?:\s*([\s\S]*?)(?=\n\nDetailed Analysis:|Detailed Analysis:|$)/i);
    if (summaryMatch) {
      sections.summary = summaryMatch[1].trim();
    } else {
      // Fallback: try without the colon pattern
      const summaryMatch2 = text.match(/AI Summary[:\s]*([\s\S]*?)(?=Detailed Analysis:|$)/i);
      if (summaryMatch2) {
        sections.summary = summaryMatch2[1].trim();
      }
    }

    // Extract Detailed Analysis sections
    const detailedMatch = text.match(/Detailed Analysis:([\s\S]*?)(?=Overall Risk Assessment:|$)/i);
    if (detailedMatch) {
      const detailedText = detailedMatch[1].trim();
      
      // Improved parsing: handle multiple formats
      // Pattern 1: Try to match numbered sections with content
      // Handle formats like: "1. **Subdomains:**" or "1. Subdomains:"
      // Match: number, optional **, title (match until colon), optional **, colon, then content
      const sectionPattern = /(\d+)\.\s*(\*\*)?([^:\n]+?)(\*\*)?:\s*([\s\S]*?)(?=\d+\.\s*(?:\*\*)?[^:\n]+(?:\*\*)?:|Overall Risk Assessment:|$)/g;
      let match;
      while ((match = sectionPattern.exec(detailedText)) !== null) {
        // Clean title: remove ** markers if present
        let cleanTitle = match[3].trim().replace(/\*\*/g, '').trim();
        sections.detailed.push({
          number: match[1],
          title: cleanTitle,
          content: match[5].trim()
        });
      }
      
      // Pattern 2: If no matches, try line-by-line parsing
      if (sections.detailed.length === 0) {
        const lines = detailedText.split('\n');
        let currentSection = null;
        
        lines.forEach((line, index) => {
          const trimmed = line.trim();
          
          // Check if this line starts a new section
          // Handle: "1. **Subdomains:**" or "1. Subdomains:" or "1. Subdomains"
          // Match number, optional **, title, optional **, optional colon
          const sectionMatch = trimmed.match(/^(\d+)\.\s*(\*\*)?([^:\n]+?)(\*\*)?:?\s*$/);
          
          if (sectionMatch) {
            // Save previous section if exists
            if (currentSection) {
              sections.detailed.push(currentSection);
            }
            
            // Clean title: remove ** markers
            let cleanTitle = sectionMatch[3].trim().replace(/\*\*/g, '').trim();
            
            // Start new section
            currentSection = {
              number: sectionMatch[1],
              title: cleanTitle,
              content: ''
            };
          } else if (currentSection && trimmed) {
            // Add content to current section
            if (currentSection.content) {
              currentSection.content += '\n' + trimmed;
            } else {
              currentSection.content = trimmed;
            }
          }
        });
        
        // Don't forget the last section
        if (currentSection) {
          sections.detailed.push(currentSection);
        }
      }
      
      // Pattern 3: If still no matches, try even simpler pattern
      if (sections.detailed.length === 0) {
        // Split by numbered sections
        const simpleSections = detailedText.split(/(?=\d+\.\s+)/);
        simpleSections.forEach((section, idx) => {
          const trimmed = section.trim();
          if (trimmed) {
            // Match: "1. **Title:**" or "1. Title:" or "1. Title"
            const firstLineMatch = trimmed.match(/^(\d+)\.\s*(.+?)(?:\n|$)/);
            if (firstLineMatch) {
              // Clean title: remove ** markers and colon
              let title = firstLineMatch[2].replace(/\*\*/g, '').replace(/:\s*$/, '').trim();
              // Get content (everything after the first line)
              const content = trimmed.replace(/^\d+\.\s*[^\n]+:?\s*/, '').trim();
              sections.detailed.push({
                number: firstLineMatch[1],
                title: title,
                content: content
              });
            }
          }
        });
      }
    }

    // Extract Overall Risk Assessment
    const riskMatch = text.match(/Overall Risk Assessment:\s*([\s\S]*?)$/i);
    if (riskMatch) {
      const riskText = riskMatch[1].trim();
      // Extract risk level (first line) and description (rest)
      const riskLines = riskText.split('\n').map(l => l.trim()).filter(l => l);
      sections.riskLevel = riskLines[0] || '';
      sections.riskAssessment = riskText;
    }

    return sections;
  };

  const parsed = parseAnalysis(analysis.analysis);
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('Parsed analysis sections:', {
      hasSummary: !!parsed.summary,
      detailedCount: parsed.detailed.length,
      hasRiskAssessment: !!parsed.riskAssessment,
      riskLevel: parsed.riskLevel
    });
  }

  const getRiskColor = (risk) => {
    const riskLower = risk.toLowerCase();
    if (riskLower.includes('low')) return 'text-success';
    if (riskLower.includes('medium')) return 'text-warning';
    if (riskLower.includes('high')) return 'text-danger';
    return 'text-info';
  };

  const formatBulletPoints = (text) => {
    // Handle both * and - bullet points
    return text.split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.startsWith('-') || trimmed.startsWith('*');
      })
      .map(line => line.trim());
  };

  const formatContent = (content) => {
    // Split by bullet points and format
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        return { type: 'bullet', text: trimmed.replace(/^[*\-\s]+/, '') };
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
              {formatBulletPoints(parsed.summary).map((bullet, idx) => {
                // Remove bullet markers (* or -) and extra whitespace
                const cleanBullet = bullet.replace(/^[*\-\s]+/, '').trim();
                return (
                  <div key={idx} className="gemini-bullet-point">
                    <i className="fas fa-circle text-cyan me-2" style={{ fontSize: '0.5rem' }}></i>
                    <span className="text-white-50">{cleanBullet}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detailed Analysis Sections - Always show if analysis exists */}
        {(parsed.detailed.length > 0 || analysis.analysis) && (
          <div className="dashboard-section">
            <h6 className="dashboard-section-title">
              <i className="fas fa-list-alt me-2"></i>
              DETAILED ANALYSIS
            </h6>
            {parsed.detailed.length > 0 ? (
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
            ) : (
              // Fallback: Show raw detailed analysis if parsing failed
              <div className="gemini-detailed">
                <div className="text-white-50" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                  {(() => {
                    const detailedMatch = analysis.analysis.match(/Detailed Analysis:([\s\S]*?)(?=Overall Risk Assessment:|$)/i);
                    if (detailedMatch) {
                      return detailedMatch[1].trim();
                    }
                    return 'Detailed analysis is being processed...';
                  })()}
                </div>
              </div>
            )}
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
              {parsed.riskLevel && (
                <span className={`risk-badge risk-${parsed.riskLevel.toLowerCase()}`}>
                  {parsed.riskLevel}
                </span>
              )}
              <p className="text-white-50 mt-3 mb-0" style={{ lineHeight: '1.6' }}>
                {parsed.riskAssessment.split('\n').slice(1).join(' ').trim() || 
                 parsed.riskAssessment.split('\n').slice(1).join('\n').trim() ||
                 parsed.riskAssessment}
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
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const locationState = location.state || {};
      const scanId = locationState.scanId || localStorage.getItem('currentScanId');
      const scanDataFromState = locationState.scanData;
      const analysisFromState = locationState.analysis;

      if (domainFromState) {
        localStorage.setItem('currentDomain', domainFromState);
      }

      // Try to load scan data from state, localStorage, or API
      if (scanDataFromState) {
        // Use data passed from Loading component
        setData({ ...scanDataFromState, domain: domainFromState || scanDataFromState.domain });
      } else if (scanId) {
        // Try to fetch from API
        try {
          const scanResult = await getScan(scanId);
          setData({ ...scanResult.data, domain: domainFromState || scanResult.data.domain });
        } catch (error) {
          console.error('Failed to load scan data:', error);
          // Fallback to mock data
          const savedDomain = localStorage.getItem('currentDomain');
          setData({ ...scanData, domain: savedDomain || domainFromState || 'example.com' });
        }
      } else {
        // Fallback to saved data or mock
        const savedScanData = localStorage.getItem('scanData');
        if (savedScanData) {
          try {
            const parsed = JSON.parse(savedScanData);
            setData({ ...parsed, domain: domainFromState || parsed.domain });
          } catch (e) {
            const savedDomain = localStorage.getItem('currentDomain');
            setData({ ...scanData, domain: savedDomain || domainFromState || 'example.com' });
          }
        } else {
          const savedDomain = localStorage.getItem('currentDomain');
          if (!savedDomain && !domainFromState) {
            window.location.href = '/';
            return;
          }
          setData({ ...scanData, domain: savedDomain || domainFromState });
        }
      }

      // Load Gemini analysis
      if (analysisFromState) {
        // Use analysis passed from Loading component
        setGeminiAnalysis(analysisFromState);
      } else {
        const currentDomainForAnalysis = domainFromState || localStorage.getItem('currentDomain');
        
        // Try to load from localStorage first
        const savedAnalysis = localStorage.getItem(`geminiAnalysis_${currentDomainForAnalysis}`);
        if (savedAnalysis) {
          try {
            const parsed = JSON.parse(savedAnalysis);
            // Only use if it matches the current domain
            if (parsed.domain === currentDomainForAnalysis) {
              setGeminiAnalysis(parsed);
            } else if (scanId) {
              // Domain mismatch, try API
              try {
                const analysisResult = await getAnalysis(scanId);
                setGeminiAnalysis(analysisResult.data);
              } catch (apiError) {
                console.error('Failed to load analysis from API:', apiError);
                setGeminiAnalysis(null); // Don't show mock data for wrong domain
              }
            } else {
              setGeminiAnalysis(null); // Don't show mock data for wrong domain
            }
          } catch (e) {
            // If parsing fails, try API
            if (scanId) {
              try {
                const analysisResult = await getAnalysis(scanId);
                setGeminiAnalysis(analysisResult.data);
              } catch (apiError) {
                console.error('Failed to load analysis:', apiError);
                setGeminiAnalysis(null);
              }
            } else {
              setGeminiAnalysis(null);
            }
          }
        } else if (scanId) {
          // Try to fetch from API
          try {
            const analysisResult = await getAnalysis(scanId);
            setGeminiAnalysis(analysisResult.data);
          } catch (error) {
            console.error('Failed to load analysis:', error);
            setGeminiAnalysis(null); // Don't show mock data
          }
        } else {
          // No analysis available - don't show mock data
          setGeminiAnalysis(null);
        }
      }
    };

    loadData();
  }, [domainFromState, location.state]);

  // Function to manually trigger analysis generation
  const handleGenerateAnalysis = async (scanId) => {
    if (!scanId) {
      setAnalysisError('Scan ID is required to generate analysis');
      return;
    }

    setIsGeneratingAnalysis(true);
    setAnalysisError(null);

    try {
      const currentDomainForAnalysis = domainFromState || localStorage.getItem('currentDomain');
      
      // Call the analyze API
      // API returns: { success: true, scanId, domain, analysis }
      const analysisResult = await analyzeScan(scanId);
      
      // Format to match what GeminiAnalysisDisplay expects: { domain, scanId?, analysis: "text" }
      const formattedAnalysis = {
        domain: analysisResult.domain || currentDomainForAnalysis,
        scanId: analysisResult.scanId || scanId,
        analysis: analysisResult.analysis // This is the text string from Gemini
      };
      
      // Save to localStorage
      localStorage.setItem(`geminiAnalysis_${currentDomainForAnalysis}`, JSON.stringify(formattedAnalysis));
      
      // Update state
      setGeminiAnalysis(formattedAnalysis);
      setIsGeneratingAnalysis(false);
      setAnalysisError(null); // Clear any previous errors
    } catch (error) {
      console.error('Failed to generate analysis:', error);
      setAnalysisError(error.message || 'Failed to generate analysis. Please try again.');
      setIsGeneratingAnalysis(false);
    }
  };

  const currentDomain = domainFromState || localStorage.getItem('currentDomain') || data.domain;
  const scanId = location.state?.scanId || localStorage.getItem('currentScanId');

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
                  {/* A Records */}
                  {data.dns.A && data.dns.A.length > 0 && (
                    <div className="dns-group">
                      <div className="dns-label">A Records</div>
                      {data.dns.A.map((record, index) => {
                        // Handle both formats: string array or object array
                        const value = typeof record === 'string' ? record : record.value;
                        const ttl = typeof record === 'object' ? record.ttl : null;
                        return (
                          <div key={index} className="dns-record">
                            <span className="dns-value">{value}</span>
                            {ttl && <span className="dns-meta">TTL: {ttl}</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* AAAA Records */}
                  {data.dns.AAAA && data.dns.AAAA.length > 0 && (
                    <div className="dns-group">
                      <div className="dns-label">AAAA Records</div>
                      {data.dns.AAAA.map((record, index) => {
                        const value = typeof record === 'string' ? record : record.value;
                        return (
                          <div key={index} className="dns-record">
                            <span className="dns-value">{value}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* MX Records */}
                  {data.dns.MX && data.dns.MX.length > 0 && (
                    <div className="dns-group">
                      <div className="dns-label">MX Records</div>
                      {data.dns.MX.map((record, index) => {
                        // Handle both formats: string array or object array
                        const value = typeof record === 'string' ? record : record.value;
                        const priority = typeof record === 'object' ? record.priority : null;
                        return (
                          <div key={index} className="dns-record">
                            <span className="dns-value">{value}</span>
                            {priority !== null && <span className="dns-meta">Priority: {priority}</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* NS Records */}
                  {data.dns.NS && data.dns.NS.length > 0 && (
                    <div className="dns-group">
                      <div className="dns-label">NS Records</div>
                      {data.dns.NS.map((record, index) => {
                        const value = typeof record === 'string' ? record : record.value;
                        return (
                          <div key={index} className="dns-record">
                            <span className="dns-value">{value}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* TXT Records */}
                  {data.dns.TXT && data.dns.TXT.length > 0 && (
                    <div className="dns-group">
                      <div className="dns-label">TXT Records</div>
                      {data.dns.TXT.map((record, index) => {
                        const value = typeof record === 'string' ? record : record.value;
                        return (
                          <div key={index} className="dns-record">
                            <span className="dns-value">{value}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Security */}
              <div className="dashboard-section">
                <h6 className="dashboard-section-title">SECURITY</h6>
                {data.ssl && data.ssl[data.domain] && (
                  <div className="security-info">
                    <div className="security-item">
                      <span className="security-label">SSL: </span>
                      <span className={data.ssl[data.domain].valid ? 'text-success' : 'text-danger'}>
                        {data.ssl[data.domain].valid ? 'Valid' : 'Invalid'}
                      </span>
                    </div>
                    {data.ssl[data.domain].expiresAt && (
                      <div className="security-item">
                        <span className="security-label">Expires: </span>
                        <span className="text-white">{data.ssl[data.domain].expiresAt}</span>
                      </div>
                    )}
                  </div>
                )}
                {data.http && data.http[data.domain] && (
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
          <>
            <GeminiAnalysisDisplay 
              analysis={geminiAnalysis} 
              domain={currentDomain}
              onGenerateAnalysis={handleGenerateAnalysis}
              isGenerating={isGeneratingAnalysis}
              scanId={scanId}
            />
            {analysisError && (
              <div className="alert alert-danger mt-3" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {analysisError}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
