import { useState } from 'react';

export default function HomePage() {
  const [count, setCount] = useState(0);

  function handleClick() {
    console.log('handleClick', count);
    setCount(count + 1);
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[60vh] w-full">
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/30 via-purple-900/20 to-pink-900/30 blur-2xl opacity-60 -z-10 animate-pulse" />
      <div className="max-w-xl w-full mx-auto bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-10 border border-white/20">
        <h1 className="text-5xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 drop-shadow-lg tracking-tight">Welcome to Zephra</h1>
        <p className="mb-8 text-lg text-gray-200 font-medium">The ultra-fast, minimalist full-stack framework</p>
        <ul className="space-y-3">
          <li><a className="block px-4 py-2 rounded bg-gradient-to-r from-blue-500 to-pink-500 text-white font-semibold shadow hover:scale-105 transition-transform" href="/about">About</a></li>
          <li><a className="block px-4 py-2 rounded bg-gradient-to-r from-blue-500 to-pink-500 text-white font-semibold shadow hover:scale-105 transition-transform" href="/posts">Posts (SSR+CSR Demo)</a></li>
          <li><a className="block px-4 py-2 rounded bg-gradient-to-r from-blue-500 to-pink-500 text-white font-semibold shadow hover:scale-105 transition-transform" href="/api/hello">API: Hello</a></li>
          <li><a className="block px-4 py-2 rounded bg-gradient-to-r from-blue-500 to-pink-500 text-white font-semibold shadow hover:scale-105 transition-transform" href="/api/items">API: Items</a></li>
          <li><a className="block px-4 py-2 rounded bg-gradient-to-r from-blue-500 to-pink-500 text-white font-semibold shadow hover:scale-105 transition-transform" href="/api/users/123">API: User 123</a></li>
          <li><a className="block px-4 py-2 rounded bg-gradient-to-r from-blue-500 to-pink-500 text-white font-semibold shadow hover:scale-105 transition-transform" href="/api/users/123/posts">API: User 123 Posts</a></li>
          <li><a className="block px-4 py-2 rounded bg-gradient-to-r from-blue-500 to-pink-500 text-white font-semibold shadow hover:scale-105 transition-transform" href="/api/posts">API: Posts CRUD</a></li>
        </ul>
        <h2 className="text-2xl font-semibold mb-2 text-pink-300">React Fast Refresh</h2>
        <p className="mb-6 text-lg text-gray-200 font-medium">
          React Fast Refresh is a feature that allows you to update your React components without reloading the page.
        </p>
        <button className="px-4 py-2 rounded bg-gradient-to-r from-blue-500 to-pink-500 text-white font-semibold shadow hover:scale-105 transition-transform" onClick={handleClick}>Click me {count}</button>
      </div>
    </div>
  );
} 