import type React from 'react';

/**
 * Layout component specifically for the About section
 */
interface AboutLayoutProps {
  children: React.ReactNode;
}

export default function AboutLayout({ children }: AboutLayoutProps) {
  return (
    <div className="flex flex-col md:flex-row gap-12 max-w-6xl mx-auto mt-16 w-full px-4 md:px-8 p-4">
      <aside className="w-full md:w-64 bg-white/10 rounded-2xl shadow-lg p-8 mb-8 md:mb-0 border border-white/20 flex-shrink-0">
        <h3 className="text-lg font-bold mb-6 text-blue-300">About Section</h3>
        <ul className="space-y-3">
          <li>
            <a href="/about" className="block px-4 py-2 rounded-lg transition text-gray-200 hover:bg-blue-500/20 hover:text-blue-300 font-medium">Overview</a>
          </li>
          <li>
            <a href="/about/team" className="block px-4 py-2 rounded-lg transition text-gray-200 hover:bg-blue-500/20 hover:text-blue-300 font-medium">Team</a>
          </li>
          <li>
            <a href="/about/technology" className="block px-4 py-2 rounded-lg transition text-gray-200 hover:bg-blue-500/20 hover:text-blue-300 font-medium">Technology</a>
          </li>
        </ul>
      </aside>
      <section className="flex-1 min-w-0 py-2 md:py-4">{children}</section>
    </div>
  );
} 