import React from 'react';

// Define types to match our API
type Post = {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
};

// Server-side fetch function - exported for testing/reuse
export async function fetchPosts(): Promise<Post[]> {
  try {
    // In SSR, we can directly call the store for speed 
    // but you could also fetch from your own API
    const response = await fetch('http://localhost:3000/api/posts');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

// Data-fetching wrapper (executed at module level)
let postsData: Post[] = [];

try {
  // This executes during module initialization, before rendering
  postsData = await fetchPosts();
} catch (error) {
  console.error('Failed to fetch posts during module initialization:', error);
}

// Synchronous component (no async/await)
export default function PostsPage() {
  // Use the pre-fetched data
  const posts = postsData;
  
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto py-10 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            Posts
          </h1>
          <p className="text-xl text-gray-300">
            This page demonstrates SSR + CSR (hydration) with a CRUD API.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            These posts are server-side rendered but will become interactive after hydration.
            Open the browser console and try: <code>fetch('/api/posts').then(r =&gt; r.json()).then(console.log)</code>
          </p>
        </div>
        
        {/* This will be enhanced with client interactivity on hydration */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <div key={post.id} className="bg-white/10 backdrop-blur-lg rounded-lg p-6 shadow-lg border border-white/10 hover:border-purple-500/50 transition-all hover:shadow-purple-500/20">
              <h2 className="text-xl font-bold mb-2 text-white">{post.title}</h2>
              <div className="text-gray-300 mb-4">{post.content}</div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">By {post.author}</span>
                <span className="text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
              
              {/* These buttons will be functional after hydration */}
              <div id="client-actions" className="mt-4 space-x-2 opacity-50" data-post-id={post.id}>
                <button type="button" className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Edit</button>
                <button type="button" className="px-3 py-1 bg-red-600 text-white rounded text-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 bg-black/30 rounded-lg p-6 border border-white/10">
          <h3 className="text-xl font-bold mb-4">Create New Post</h3>
          <div id="client-form" className="opacity-50">
            <div className="mb-4">
              <label htmlFor="new-title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
              <input type="text" id="new-title" className="w-full bg-white/10 border border-gray-600 rounded px-3 py-2 text-white" />
            </div>
            <div className="mb-4">
              <label htmlFor="new-content" className="block text-sm font-medium text-gray-300 mb-1">Content</label>
              <textarea id="new-content" className="w-full bg-white/10 border border-gray-600 rounded px-3 py-2 text-white" rows={3} />
            </div>
            <div className="mb-4">
              <label htmlFor="new-author" className="block text-sm font-medium text-gray-300 mb-1">Author</label>
              <input type="text" id="new-author" className="w-full bg-white/10 border border-gray-600 rounded px-3 py-2 text-white" />
            </div>
            <button type="button" id="submit-post" className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded shadow-lg hover:scale-105 transition-transform">Create Post</button>
          </div>
        </div>
        
        <div className="mt-10 text-center">
          <a href="/" className="inline-block px-5 py-3 rounded bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors">
            Back to Home
          </a>
        </div>
      </div>
      
      {/* Performance counter that will be enabled by client hydration */}
      <div id="performance-metrics" className="fixed bottom-0 left-0 right-0 bg-black/70 backdrop-blur-lg p-4 border-t border-white/10" style={{ display: 'none' }}>
        <div className="container mx-auto">
          <h3 className="text-lg font-semibold mb-2">API Performance Metrics</h3>
          <ul id="metrics-list" className="text-sm text-gray-300 space-y-1">
            <li>Waiting for client hydration...</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 