import React from 'react';

/**
 * Technology page component
 */
export default function TechnologyPage() {
  return (
    <div>
      <h1>Our Technology Stack</h1>
      <p>Zephra is built on modern, cutting-edge technologies to deliver exceptional performance and developer experience.</p>
      
      <div className="tech-section">
        <h2>Core Technologies</h2>
        <div className="tech-grid">
          {CORE_TECHNOLOGIES.map(tech => (
            <div key={tech.name} className="tech-card">
              <h3>{tech.name}</h3>
              <div className="tech-description">{tech.description}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="tech-section">
        <h2>Framework Features</h2>
        <ul className="feature-list">
          {FRAMEWORK_FEATURES.map(feature => (
            <li key={feature.title} className="feature-item">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </li>
          ))}
        </ul>
      </div>
      
      <style>{`
        .tech-section {
          margin-bottom: 3rem;
        }
        
        .tech-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }
        
        .tech-card {
          background-color: white;
          border-radius: 0.5rem;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          border-top: 4px solid #3b82f6;
        }
        
        .tech-card h3 {
          margin-top: 0;
          color: #3b82f6;
        }
        
        .feature-list {
          list-style: none;
          padding: 0;
        }
        
        .feature-item {
          background-color: white;
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin-bottom: 1rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .feature-item h3 {
          margin-top: 0;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
}

// Sample technology data
const CORE_TECHNOLOGIES = [
  {
    name: 'Bun',
    description: 'A fast all-in-one JavaScript runtime, bundler, and package manager that powers the Zephra ecosystem.'
  },
  {
    name: 'Elysia.js',
    description: 'A high-performance TypeScript framework for building APIs with end-to-end type safety.'
  },
  {
    name: 'React',
    description: 'A JavaScript library for building user interfaces with a component-based architecture.'
  },
  {
    name: 'TypeScript',
    description: 'A strongly typed programming language that builds on JavaScript, giving better tooling at any scale.'
  }
];

const FRAMEWORK_FEATURES = [
  {
    title: 'File-based Routing',
    description: 'Intuitive routing based on your file system structure, making it easy to organize your application.'
  },
  {
    title: 'Type Safety',
    description: 'End-to-end type safety from your database to your UI with full TypeScript support.'
  },
  {
    title: 'Layout System',
    description: 'Nested layouts that enable code reuse and consistent UI across related routes.'
  },
  {
    title: 'API Integration',
    description: 'Seamless integration between your frontend and API routes, all in one codebase.'
  }
]; 