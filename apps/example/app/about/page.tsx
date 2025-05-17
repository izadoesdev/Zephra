import React from 'react';

/**
 * Example about page component
 */
export default function AboutPage() {
  return (
    <div>
      <h1>About Zephra</h1>
      <p>Zephra is an ultra-fast, minimalist full-stack framework designed for building modern web applications with exceptional performance and a delightful developer experience.</p>
      <h2>Core Tech Stack</h2>
      <ul>
        <li><strong>Runtime:</strong> Bun</li>
        <li><strong>API:</strong> ElysiaJS</li>
        <li><strong>Frontend:</strong> React (via Vite)</li>
        <li><strong>Routing:</strong> File-based (convention-based)</li>
      </ul>
      <p><a href="/">Back to Home</a></p>
    </div>
  );
} 