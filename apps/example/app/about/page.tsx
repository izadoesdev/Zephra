import React from 'react';

/**
 * Example about page component
 */
export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-10 border border-white/20 mt-10">
      <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">About Zephra</h1>
      <p className="mb-6 text-lg text-gray-200">Zephra is an ultra-fast, minimalist full-stack framework designed for building modern web applications with exceptional performance and a delightful developer experience.</p>
      <h2 className="text-2xl font-semibold mb-2 text-blue-300">Core Tech Stack</h2>
      <ul className="mb-6 space-y-2">
        <li><span className="font-semibold text-pink-400">Runtime:</span> Bun</li>
        <li><span className="font-semibold text-purple-400">API:</span> ElysiaJS</li>
        <li><span className="font-semibold text-blue-400">Frontend:</span> React (via Vite)</li>
        <li><span className="font-semibold text-yellow-400">Routing:</span> File-based (convention-based)</li>
      </ul>
      <a className="inline-block mt-4 px-4 py-2 rounded bg-gradient-to-r from-blue-500 to-pink-500 text-white font-semibold shadow hover:scale-105 transition-transform" href="/">Back to Home</a>
    </div>
  );
} 