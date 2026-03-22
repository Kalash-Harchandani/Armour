import React from 'react';

const Footer = () => {
  return (
    <footer style={{
      padding: '1.5rem',
      marginTop: 'auto',
      borderTop: '1px solid rgba(0, 255, 255, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      textAlign: 'center',
      gap: '0.8rem',
      backgroundColor: 'transparent',
      color: 'rgba(255, 255, 255, 0.5)',
      fontSize: '0.85rem',
      fontFamily: 'monospace',
      position: 'relative',
      zIndex: 10
    }}>
      <div>
        Made by <span style={{ color: '#00ffff' }}>Kalash Harchandani</span>
      </div>
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <a 
          href="https://www.linkedin.com/in/kalash-kt20/" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            color: 'rgba(255, 255, 255, 0.5)',
            textDecoration: 'none',
            transition: 'color 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.target.style.color = '#00ffff'}
          onMouseOut={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.5)'}
        >
          LinkedIn
        </a>
        <a 
          href="https://github.com/Kalash-Harchandani/Armour" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            color: 'rgba(255, 255, 255, 0.5)',
            textDecoration: 'none',
            transition: 'color 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.target.style.color = '#00ffff'}
          onMouseOut={(e) => e.target.style.color = 'rgba(255, 255, 255, 0.5)'}
        >
          GitHub Repo
        </a>
      </div>
    </footer>
  );
};

export default Footer;
