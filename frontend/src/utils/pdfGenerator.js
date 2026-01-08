/**
 * PDF Generator Utility
 * Generates PDF reports for scan results
 */

import jsPDF from 'jspdf';

/**
 * Generate PDF report from scan data
 * @param {Object} scanData - The scan data object
 * @param {string} domain - The domain name
 */
export const generateScanPDF = (scanData, domain) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Helper function to add new page if needed
  const checkPageBreak = (requiredSpace = 20) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Helper function to add section title
  const addSectionTitle = (title, fontSize = 14) => {
    checkPageBreak(15);
    yPosition += 10;
    doc.setFontSize(fontSize);
    doc.setTextColor(0, 150, 200); // Cyan-like color (RGB values 0-255)
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, yPosition);
    yPosition += 8;
    doc.setTextColor(0, 0, 0); // Black color for text
    doc.setFont('helvetica', 'normal');
  };

  // Helper function to add text
  const addText = (text, fontSize = 10, isBold = false) => {
    checkPageBreak(10);
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(text, margin, yPosition);
    yPosition += fontSize / 2 + 3;
  };

  // Helper function to add list items
  const addListItem = (text, indent = 0) => {
    checkPageBreak(8);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('• ' + text, margin + indent, yPosition);
    yPosition += 6;
  };

  // Title Section
  doc.setFontSize(24);
  doc.setTextColor(0, 150, 200); // Cyan-like color
  doc.setFont('helvetica', 'bold');
  doc.text('ARMOUR', pageWidth / 2, 40, { align: 'center' });
  
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Domain Intelligence Report', pageWidth / 2, 55, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setTextColor(0, 150, 200);
  doc.setFont('helvetica', 'bold');
  doc.text(domain, pageWidth / 2, 70, { align: 'center' });
  
  // Add a line separator
  doc.setDrawColor(0, 150, 200);
  doc.setLineWidth(0.5);
  doc.line(margin, 80, pageWidth - margin, 80);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  const scanDate = new Date().toLocaleString();
  doc.text(`Generated: ${scanDate}`, pageWidth / 2, 90, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Status: ${scanData.status || 'Completed'}`, pageWidth / 2, 100, { align: 'center' });
  
  yPosition = 120;

  // Subdomains Section
  if (scanData.subdomains && scanData.subdomains.length > 0) {
    addSectionTitle('SUBDOMAINS', 12);
    scanData.subdomains.forEach((subdomain) => {
      addListItem(subdomain);
    });
    yPosition += 5;
  }

  // Ports Section
  if (scanData.ports && Object.keys(scanData.ports).length > 0) {
    addSectionTitle('OPEN PORTS', 12);
    const openPorts = Object.entries(scanData.ports)
      .filter(([port, isOpen]) => isOpen)
      .map(([port]) => port);
    
    if (openPorts.length > 0) {
      openPorts.forEach((port) => {
        addListItem(`Port ${port} - Open`);
      });
    } else {
      addText('No open ports detected', 10);
    }
    yPosition += 5;
  }

  // Technology Section
  if (scanData.tech && scanData.tech.length > 0) {
    addSectionTitle('TECHNOLOGY DETECTED', 12);
    scanData.tech.forEach((tech) => {
      addListItem(tech);
    });
    yPosition += 5;
  }

  // DNS Records Section
  if (scanData.dns) {
    addSectionTitle('DNS RECORDS', 12);
    
    // A Records
    if (scanData.dns.A && scanData.dns.A.length > 0) {
      addText('A Records:', 10, true);
      scanData.dns.A.forEach((record) => {
        const value = typeof record === 'string' ? record : record.value;
        const ttl = typeof record === 'object' ? record.ttl : null;
        const text = ttl ? `${value} (TTL: ${ttl})` : value;
        addListItem(text, 10);
      });
    }

    // AAAA Records
    if (scanData.dns.AAAA && scanData.dns.AAAA.length > 0) {
      addText('AAAA Records:', 10, true);
      scanData.dns.AAAA.forEach((record) => {
        const value = typeof record === 'string' ? record : record.value;
        addListItem(value, 10);
      });
    }

    // MX Records
    if (scanData.dns.MX && scanData.dns.MX.length > 0) {
      addText('MX Records:', 10, true);
      scanData.dns.MX.forEach((record) => {
        const value = typeof record === 'string' ? record : record.value;
        const priority = typeof record === 'object' ? record.priority : null;
        const text = priority !== null ? `${value} (Priority: ${priority})` : value;
        addListItem(text, 10);
      });
    }

    // NS Records
    if (scanData.dns.NS && scanData.dns.NS.length > 0) {
      addText('NS Records:', 10, true);
      scanData.dns.NS.forEach((record) => {
        const value = typeof record === 'string' ? record : record.value;
        addListItem(value, 10);
      });
    }

    // TXT Records
    if (scanData.dns.TXT && scanData.dns.TXT.length > 0) {
      addText('TXT Records:', 10, true);
      scanData.dns.TXT.forEach((record) => {
        const value = typeof record === 'string' ? record : record.value;
        addListItem(value, 10);
      });
    }
    yPosition += 5;
  }

  // Security Section
  addSectionTitle('SECURITY INFORMATION', 12);
  
  // SSL Information
  if (scanData.ssl && scanData.ssl[domain]) {
    const ssl = scanData.ssl[domain];
    addText('SSL Certificate:', 10, true);
    addListItem(`Status: ${ssl.valid ? 'Valid' : 'Invalid'}`, 10);
    if (ssl.expiresAt) {
      addListItem(`Expires: ${ssl.expiresAt}`, 10);
    }
  }

  // HTTP Information
  if (scanData.http && scanData.http[domain]) {
    const http = scanData.http[domain];
    addText('HTTP Response:', 10, true);
    addListItem(`Status: ${http.status}`, 10);
    if (http.title) {
      addListItem(`Page Title: ${http.title}`, 10);
    }
    if (http.server) {
      addListItem(`Server: ${http.server}`, 10);
    }
  }

  // Footer on each page
  const addFooter = () => {
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Page ${i} of ${pageCount} - Armour Domain Intelligence Report`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
  };

  addFooter();

  // Generate filename
  const filename = `armour_scan_${domain}_${new Date().toISOString().split('T')[0]}.pdf`;
  
  // Save PDF
  doc.save(filename);
};

