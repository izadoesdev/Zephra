import type React from 'react';

const bgStyle: React.CSSProperties = {
  width: '100vw',
  height: '100vh',
  overflow: 'hidden',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(120deg, #18181b 0%, #23272f 100%)',
  position: 'relative',
  fontFamily: 'Inter, system-ui, sans-serif',
};

const animatedBg: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  zIndex: 0,
  background: 'radial-gradient(circle at 60% 40%, #a78bfa33 0%, transparent 60%), radial-gradient(circle at 30% 70%, #60a5fa22 0%, transparent 70%), radial-gradient(circle at 80% 80%, #f472b633 0%, transparent 80%)',
  animation: 'zephra-bg-fade 8s ease-in-out infinite alternate',
};

const contentStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
  textAlign: 'center',
  color: '#fafafa',
  maxWidth: 480,
  width: '100%',
  padding: '2rem',
  borderRadius: 24,
  boxShadow: '0 8px 32px 0 #18181b44',
  background: 'rgba(24,24,27,0.85)',
  backdropFilter: 'blur(8px)',
};

const logoStyle: React.CSSProperties = {
  fontWeight: 900,
  fontSize: '2.5rem',
  background: 'linear-gradient(90deg, #60a5fa, #a78bfa, #f472b6)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  marginBottom: '1.5rem',
  letterSpacing: '-0.05em',
};

const codeStyle: React.CSSProperties = {
  fontSize: '6rem',
  fontWeight: 900,
  marginBottom: '1rem',
  color: '#f472b6',
  lineHeight: 1,
};

const titleStyle: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 700,
  marginBottom: '0.5rem',
};

const descStyle: React.CSSProperties = {
  fontSize: '1.15rem',
  color: '#a1a1aa',
  marginBottom: '2rem',
};

const linkStyle: React.CSSProperties = {
  color: '#60a5fa',
  textDecoration: 'underline',
  fontWeight: 600,
  transition: 'color 0.2s',
};

const footerStyle: React.CSSProperties = {
  fontSize: '1rem',
  color: '#52525b',
  marginTop: '2rem',
};

export default function NotFoundPage() {
  return (
    <div style={bgStyle}>
      <div style={animatedBg} />
      <div style={contentStyle}>
        <div style={logoStyle}>Zephra</div>
        <div style={codeStyle}>404</div>
        <h1 style={titleStyle}>Page Not Found</h1>
        <p style={descStyle}>
          Sorry, the page you are looking for does not exist or has been moved.<br />
          <a href="/" style={linkStyle}>Go Home</a>
        </p>
        <div style={footerStyle}>
          &copy; {new Date().getFullYear()} Zephra Framework
        </div>
      </div>
      <style>{`
        @keyframes zephra-bg-fade {
          0% { opacity: 0.8; }
          100% { opacity: 1; }
        }
        html, body { width: 100vw; height: 100vh; margin: 0; padding: 0; overflow: hidden; }
      `}</style>
    </div>
  );
} 