import type React from 'react';

/**
 * Layout component specifically for the About section
 */
interface AboutLayoutProps {
  children: React.ReactNode;
}

export default function AboutLayout({ children }: AboutLayoutProps) {
  return (
    <div className="about-section">
      <div className="about-sidebar">
        <h3>About Section</h3>
        <ul>
          <li><a href="/about">Overview</a></li>
          <li><a href="/about/team">Team</a></li>
          <li><a href="/about/technology">Technology</a></li>
        </ul> 
      </div>
      <div className="about-content">
        {children}
      </div>
      
      <style>{`
        .about-section {
          display: flex;
          gap: 2rem;
        }
        
        .about-sidebar {
          width: 200px;
          padding: 1rem;
          background-color: #f3f4f6;
          border-radius: 0.5rem;
        }
        
        .about-sidebar h3 {
          margin-top: 0;
          color: #4b5563;
        }
        
        .about-sidebar ul {
          list-style: none;
          padding: 0;
        }
        
        .about-sidebar li {
          margin-bottom: 0.5rem;
        }
        
        .about-sidebar a {
          color: #6b7280;
          text-decoration: none;
        }
        
        .about-sidebar a:hover {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        .about-content {
          flex: 1;
        }
      `}</style>
    </div>
  );
} 