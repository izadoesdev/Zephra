import React from 'react';

/**
 * Technology page component
 */
export default function TechnologyPage() {
  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Our Technology Stack</h1>
      <p className="mb-8 text-lg text-gray-200">Zephra is built on modern, cutting-edge technologies to deliver exceptional performance and developer experience.</p>
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-blue-300">Core Technologies</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6">
          {CORE_TECHNOLOGIES.map(tech => (
            <div key={tech.name} className="bg-white/10 rounded-xl shadow-lg p-6 border-t-4 border-blue-400">
              <h3 className="text-xl font-semibold mb-2 text-blue-200">{tech.name}</h3>
              <div className="text-gray-200">{tech.description}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-semibold mb-4 text-pink-300">Framework Features</h2>
        <ul className="space-y-4">
          {FRAMEWORK_FEATURES.map(feature => (
            <li key={feature.title} className="bg-white/10 rounded-xl shadow p-5 border border-white/20">
              <h3 className="text-lg font-semibold mb-1 text-pink-200">{feature.title}</h3>
              <p className="text-gray-200">{feature.description}</p>
            </li>
          ))}
        </ul>
      </div>
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