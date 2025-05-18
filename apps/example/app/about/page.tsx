import React from 'react';

/**
 * Example about page component
 */
export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-10 border border-white/20 mt-10">
      <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
        About Zephra
      </h1>
      <p className="mb-6 text-lg text-gray-200">
        Zephra is a next-generation full-stack framework for building modern web apps with zero boilerplate and maximum performance. Powered by Bun, Elysia, and React, Zephra is designed for speed, simplicity, and developer happiness.
      </p>
      <h2 className="text-2xl font-semibold mb-2 text-blue-300">Core Features</h2>
      <ul className="mb-6 space-y-2 text-gray-100">
        <li><span className="font-semibold text-pink-400">Ultra-Fast:</span> Bun runtime, Elysia APIs, and React SSR for instant responses and reloads.</li>
        <li><span className="font-semibold text-purple-400">File-Based Routing:</span> Pages and APIs are just files and folders—nested, dynamic, and intuitive.</li>
        <li><span className="font-semibold text-blue-400">Type Safety:</span> TypeScript everywhere, from backend to frontend.</li>
        <li><span className="font-semibold text-yellow-400">Modern UI:</span> Tailwind CSS and shadcn/ui for beautiful, accessible interfaces.</li>
        <li><span className="font-semibold text-green-400">Zero Config:</span> Sensible defaults, instant startup, and hot reload.</li>
        <li><span className="font-semibold text-indigo-400">Built-in Diagnostics:</span> Route scanning, error logging, and more for easy debugging.</li>
      </ul>
      <h2 className="text-2xl font-semibold mb-2 text-pink-300">Technical Stack</h2>
      <ul className="mb-6 space-y-2 text-gray-100">
        <li><span className="font-semibold text-blue-400">Server:</span> Bun, Elysia, file-based API routing</li>
        <li><span className="font-semibold text-purple-400">Frontend:</span> React 19+, SSR, Tailwind CSS, shadcn/ui</li>
        <li><span className="font-semibold text-yellow-400">DX:</span> Hot reload, TypeScript strict, CLI tools</li>
      </ul>
      <a className="inline-block mt-4 px-4 py-2 rounded bg-gradient-to-r from-blue-500 to-pink-500 text-white font-semibold shadow hover:scale-105 transition-transform" href="/">
        Back to Home
      </a>
    </div>
  );
} 